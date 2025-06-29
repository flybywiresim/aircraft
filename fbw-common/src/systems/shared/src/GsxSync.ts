// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DebounceTimer,
  EventBus,
  GameStateProvider,
  Instrument,
  SimVarValueType,
  Wait,
} from '@microsoft/msfs-sdk';
import { GroundSupportEvents, GsxSimVarEvents, MsfsFlightModelEvents, NXDataStore } from '@flybywiresim/fbw-sdk';

export enum GsxStates {
  FALSE = 0,
  DISCONNECTED = 0,
  TRUE = 1,
  CONNECTED = 1,
}

export enum GsxServiceStates {
  CALLABLE = 1, //service can be called
  UNVAILABLE = 2, //service is not available
  BYPASSED = 3, //service has been bypassed
  REQUESTED = 4, //service has been requested
  ACTIVE = 5, //service is being performed
  COMPLETED = 6, //service has been completed
}

enum RefuelRate {
  REAL = 0,
  FAST = 1,
  INSTANT = 2,
}

enum SyncServices {
  FUEL = 'GSX_FUEL_SYNC',
  PAYLOAD = 'GSX_PAYLOAD_SYNC',
  POWER = 'GSX_POWER_SYNC',
}

enum DoorTarget {
  CLOSED = 0,
  OPEN = 1,
}

enum PowerAction {
  NOOP = -1,
  DISCONNECT = 0,
  CONNECT = 1,
}

const DELAY_CARGO_CLOSE = 60000;
const DELAY_REFUEL_RESTART = 2000;
const DELAY_RATE_RESTORE = DELAY_REFUEL_RESTART + 1000;
const DELAY_FUEL_START = 500;
const DEFUEL_DIFF_TARGET_A320 = 125;
const DEFUEL_DIFF_TARGET_A380 = 250;

abstract class GsxSync implements Instrument {
  protected readonly sub = this.bus.getSubscriber<GroundSupportEvents & GsxSimVarEvents & MsfsFlightModelEvents>();
  protected readonly extPowerAvailStates = new Map<number, ConsumerSubject<boolean>>();
  protected readonly couatlStarted = ConsumerSubject.create(null, 0);
  protected readonly stateJetway = ConsumerSubject.create(null, 1);
  protected readonly stateBoard = ConsumerSubject.create(null, 1);
  protected readonly stateDeparture = ConsumerSubject.create(null, 1);
  protected readonly stateGpu = ConsumerSubject.create(null, 1);
  protected isRefuelActive = false;
  protected isDefuel = false;
  protected readonly fuelTimer = new DebounceTimer();
  protected readonly rateTimer = new DebounceTimer();
  protected desiredFuel = 0;
  protected readonly fuelHose = ConsumerSubject.create(null, 0);
  protected readonly refuelStartedByUser = ConsumerSubject.create(null, false);
  protected initialIngameFrame = false;

  constructor(
    protected readonly bus: EventBus,
    protected readonly numberOfGPUs: number,
    protected readonly DEFUEL_DIFF_TARGET: number,
  ) {}

  public init(): void {
    Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true).then(() => {
      this.initSubscriptions();
      this.initialIngameFrame = true;
    });
  }

  protected initSubscriptions(): void {
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      const element = ConsumerSubject.create(this.sub.on(`ext_pwr_avail_${index}`), false);
      this.extPowerAvailStates.set(index, element);
    }
    this.couatlStarted.setConsumer(this.sub.on('gsx_couatl_started'));
    this.couatlStarted.sub(this.onCouatlStarted.bind(this));
    this.stateJetway.setConsumer(this.sub.on('gsx_jetway_state'));
    this.stateBoard.setConsumer(this.sub.on('gsx_boarding_state'));
    this.stateDeparture.setConsumer(this.sub.on('gsx_departure_state'));
    this.stateGpu.setConsumer(this.sub.on('gsx_gpu_state'));
    this.fuelHose.setConsumer(this.sub.on('gsx_fuelhose_connected'));
    this.refuelStartedByUser.setConsumer(this.sub.on('a32nx_refuel_started_by_user'));

    this.fuelHose.sub(this.onFuelHoseConnected.bind(this));
    this.refuelStartedByUser.sub(this.onRefuelStartedByUser.bind(this));

    this.stateJetway.sub(this.evaluateGsxPowerSource.bind(this));
    this.stateGpu.sub(this.evaluateGsxPowerSource.bind(this));
    this.stateDeparture.sub(this.evaluateGsxPowerSource.bind(this));
  }

  public onUpdate(): void {
    if (this.initialIngameFrame) {
      this.onCouatlStarted(SimVar.GetSimVarValueFast('L:FSDT_GSX_COUATL_STARTED', SimVarValueType.Number));
      this.initialIngameFrame = false;
    }
  }

  protected isSyncEnabled(service: SyncServices): boolean {
    return NXDataStore.get(service, '0') === '1';
  }

  protected setRefuelStartedState(state: boolean): void {
    SimVar.SetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', SimVarValueType.Bool, state);
  }

  protected getRefuelRate(): RefuelRate {
    return SimVar.GetSimVarValueFast('L:A32NX_EFB_REFUEL_RATE_SETTING', SimVarValueType.Number);
  }

  protected setRefuelRate(refuelRate: RefuelRate): void {
    SimVar.SetSimVarValue('L:A32NX_EFB_REFUEL_RATE_SETTING', SimVarValueType.Number, refuelRate);
  }

  protected onCouatlStarted(state: number): void {
    if (state === GsxStates.TRUE) {
      //gsx-ism: we don't want gsx progressive fuel when the aircraft progressively refuels
      SimVar.SetSimVarValue('L:FSDT_GSX_SET_PROGRESS_REFUEL', SimVarValueType.Number, -1);
    }
  }

  protected abstract getFob(): number;

  protected needsDefuel(): boolean {
    return this.getFob() + this.DEFUEL_DIFF_TARGET >= this.desiredFuel;
  }

  protected abstract getDesiredFuel(): number;

  protected abstract setDesiredFuel(desiredFuel: number): void;

  protected onFuelHoseConnected(hose: number): void {
    if (!this.isSyncEnabled(SyncServices.FUEL)) {
      return;
    }

    //start De/Refuel when Hose is connected
    if (hose === GsxStates.CONNECTED && !this.refuelStartedByUser.get() && !this.isRefuelActive) {
      this.desiredFuel = this.getDesiredFuel();
      this.isDefuel = this.needsDefuel();

      //need an Fuel Increase later, so target is lowered for desired >= FOB Cases
      if (this.isDefuel) {
        if (this.desiredFuel >= this.DEFUEL_DIFF_TARGET) {
          this.setDesiredFuel(this.desiredFuel - this.DEFUEL_DIFF_TARGET);
        } else {
          this.setDesiredFuel(0);
        }
      }
      this.isRefuelActive = true;
      this.fuelTimer.schedule(() => {
        this.setRefuelStartedState(true);
      }, DELAY_FUEL_START);
    }

    //something bad happend, hose disconnected while still refueling - cleanup
    if (hose === GsxStates.DISCONNECTED && (this.refuelStartedByUser.get() || this.isRefuelActive)) {
      if (this.isDefuel) {
        this.setDesiredFuel(this.desiredFuel);
      }

      this.isDefuel = false;
      this.desiredFuel = 0;
      this.isRefuelActive = false;
    }
  }

  protected onRefuelStartedByUser(refuel: boolean): void {
    if (!this.isSyncEnabled(SyncServices.FUEL)) {
      return;
    }

    //defuel has finished - instant refuel to desired to get the truck triggered to leave
    if (!refuel && this.fuelHose.get() === GsxStates.CONNECTED && this.isDefuel) {
      this.setDesiredFuel(this.desiredFuel);
      const refuelRate = this.getRefuelRate();
      this.setRefuelRate(RefuelRate.INSTANT);

      this.fuelTimer.schedule(() => {
        this.setRefuelStartedState(true);
        this.isDefuel = false;
        this.desiredFuel = 0;
      }, DELAY_REFUEL_RESTART);

      this.rateTimer.schedule(() => {
        this.setRefuelRate(refuelRate);
      }, DELAY_RATE_RESTORE);
    }

    if (!refuel) {
      this.isRefuelActive = false;
    }
  }

  protected evaluateGsxPowerSource(): void {
    if (!this.isSyncEnabled(SyncServices.POWER)) {
      return;
    }

    const extAvail = this.isExtPowerAvail();
    const jetwayState = this.stateJetway.get();
    const gpuState = this.stateGpu.get();
    const boardState = this.stateBoard.get();
    const departureState = this.stateDeparture.get();
    let action = PowerAction.NOOP;

    // external is available (as of internal State) - check if disconnect is needed
    if (extAvail) {
      // pushback was requested (when boarding not running)
      if (
        boardState !== GsxServiceStates.REQUESTED &&
        boardState !== GsxServiceStates.ACTIVE &&
        departureState >= GsxServiceStates.REQUESTED
      ) {
        action = PowerAction.DISCONNECT;
        // pushback is active (in it wasn't catched before)
      } else if (departureState === GsxServiceStates.ACTIVE) {
        action = PowerAction.DISCONNECT;
        // jetway and gpu both not connected
      } else if (
        jetwayState >= GsxServiceStates.CALLABLE &&
        jetwayState <= GsxServiceStates.REQUESTED &&
        gpuState !== GsxServiceStates.ACTIVE
      ) {
        action = PowerAction.DISCONNECT;
      }
      // external is not available - check if connect is needed
    } else if (
      //jetway or gpu connected
      (jetwayState === GsxServiceStates.ACTIVE || gpuState === GsxServiceStates.ACTIVE) &&
      departureState < GsxServiceStates.REQUESTED
    ) {
      action = PowerAction.CONNECT;
    }

    if (action == PowerAction.CONNECT) {
      this.setExtPower(true);
    } else if (action == PowerAction.DISCONNECT) {
      this.setExtPower(false);
    }
  }

  protected isExtPowerAvail(): boolean {
    let state = false;
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      state ||= this.extPowerAvailStates.get(index).get();
    }
    return state;
  }

  protected abstract setOvhdPushBtn(index: number, state: boolean): void;

  protected setExtPower(connect: boolean): void {
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      SimVar.SetSimVarValue(`L:A32NX_EXT_PWR_AVAIL:${index}`, SimVarValueType.Bool, connect);
      if (!connect) {
        this.setOvhdPushBtn(index, connect);
      }
    }
  }
}

export class GsxSyncA32NX extends GsxSync {
  constructor(bus: EventBus) {
    super(bus, 1, DEFUEL_DIFF_TARGET_A320);
  }

  protected getFob(): number {
    return SimVar.GetSimVarValueFast('A:FUEL TOTAL QUANTITY WEIGHT', 'kilograms');
  }

  protected getDesiredFuel(): number {
    return SimVar.GetSimVarValueFast('L:A32NX_FUEL_LEFT_MAIN_DESIRED', SimVarValueType.Number);
  }

  protected setDesiredFuel(desiredFuel: number): void {
    SimVar.SetSimVarValue('L:A32NX_FUEL_LEFT_MAIN_DESIRED', SimVarValueType.Number, desiredFuel);
    SimVar.SetSimVarValue('L:A32NX_FUEL_RIGHT_MAIN_DESIRED', SimVarValueType.Number, desiredFuel);
  }

  protected setOvhdPushBtn(index: number, state: boolean): void {
    if (index === 1) {
      SimVar.SetSimVarValue(`L:A32NX_OVHD_ELEC_EXT_PWR_PB_IS_ON`, SimVarValueType.Bool, state);
    }
  }
}

export class GsxSyncA380X extends GsxSync {
  protected readonly toggleCargo1 = ConsumerSubject.create(null, 0);
  protected readonly toggleCargo2 = ConsumerSubject.create(null, 0);
  protected readonly stateDeboard = ConsumerSubject.create(null, 1);
  protected readonly cargoPercentBoard = ConsumerSubject.create(null, 0);
  protected readonly cargoPercentDeboard = ConsumerSubject.create(null, 0);
  protected readonly cargoTimer = new DebounceTimer();
  protected readonly cargoDoorTarget = ConsumerSubject.create(null, 0);

  constructor(bus: EventBus) {
    super(bus, 4, DEFUEL_DIFF_TARGET_A380);
  }

  protected initSubscriptions(): void {
    super.initSubscriptions();
    this.toggleCargo1.setConsumer(this.sub.on('gsx_aircraft_cargo_1_toggle'));
    this.toggleCargo2.setConsumer(this.sub.on('gsx_aircraft_cargo_2_toggle'));
    this.stateDeboard.setConsumer(this.sub.on('gsx_deboarding_state'));
    this.cargoPercentBoard.setConsumer(this.sub.on('gsx_boarding_cargo_percent'));
    this.cargoPercentDeboard.setConsumer(this.sub.on('gsx_deboarding_cargo_percent'));
    this.cargoDoorTarget.setConsumer(this.sub.on('msfs_interactive_point_goal_16'));

    this.toggleCargo1.sub(this.onToggleCargo.bind(this));
    this.toggleCargo2.sub(this.onToggleCargo.bind(this));
    this.stateBoard.sub(this.onBoardingCompleted.bind(this));
    this.stateDeboard.sub(this.onBoardingCompleted.bind(this));
    this.cargoPercentBoard.sub(this.onCargoBoardCompleted.bind(this));
    this.cargoPercentDeboard.sub(this.onCargoDeboardCompleted.bind(this));
    this.stateDeparture.sub(this.onPushbackActive.bind(this));
  }

  protected getFob(): number {
    return SimVar.GetSimVarValueFast('A:FUEL TOTAL QUANTITY WEIGHT', 'kilograms');
  }

  protected getDesiredFuel(): number {
    return SimVar.GetSimVarValueFast('L:A32NX_FUEL_DESIRED', 'kilograms');
  }

  protected setDesiredFuel(desiredFuel: number): void {
    SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', desiredFuel);
  }

  protected setOvhdPushBtn(index: number, state: boolean): void {
    SimVar.SetSimVarValue(`L:A32NX_OVHD_ELEC_EXT_PWR_${index}_PB_IS_ON`, SimVarValueType.Bool, state);
  }

  protected isCargoOpen(): boolean {
    return this.cargoDoorTarget.get() !== DoorTarget.CLOSED;
  }

  protected setCargoDoor(goal: number, index: number = 16): void {
    SimVar.SetSimVarValue(`A:INTERACTIVE POINT GOAL:${index}`, SimVarValueType.PercentOver100, goal);
  }

  protected onToggleCargo(toggle: number) {
    //received first toggle from gsx - only used for opening the doors
    if (toggle !== GsxStates.FALSE && !this.isCargoOpen()) {
      this.setCargoDoor(DoorTarget.OPEN);
    }
  }

  protected onCargoBoardCompleted(percent: number): void {
    this.startCargoTimer(percent, DELAY_CARGO_CLOSE);
  }

  protected onCargoDeboardCompleted(percent: number): void {
    this.startCargoTimer(percent, DELAY_CARGO_CLOSE / 2);
  }

  protected startCargoTimer(percent: number, delay: number): void {
    //close doors with a certain delay, after (un)loading was completed (==100%)
    if (percent === 100 && !this.cargoTimer.isPending() && this.isCargoOpen()) {
      this.fuelTimer.schedule(() => {
        this.setCargoDoor(DoorTarget.CLOSED);
      }, delay);
    }
  }

  protected onBoardingCompleted(state: number): void {
    //just to be safe, check again when boarding was completed
    if (state === GsxServiceStates.COMPLETED && this.isCargoOpen()) {
      this.setCargoDoor(DoorTarget.CLOSED);
    }
  }

  protected onPushbackActive(pushState: number): void {
    //just to be safe, check again when pushback is active - maybe something bad happened on boarding
    if (
      this.isCargoOpen() &&
      (pushState === GsxServiceStates.ACTIVE ||
        (pushState === GsxServiceStates.REQUESTED && this.stateBoard.get() !== GsxServiceStates.ACTIVE))
    ) {
      this.setCargoDoor(DoorTarget.CLOSED);
    }
  }
}
