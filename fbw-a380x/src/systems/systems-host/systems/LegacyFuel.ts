import { MathUtils, UpdateThrottler } from '@flybywiresim/fbw-sdk';
import {
  ConsumerSubject,
  EventBus,
  GameStateProvider,
  Instrument,
  KeyEventManager,
  Wait,
  WeightBalanceEvents,
} from '@microsoft/msfs-sdk';

import { FuelSystemEvents } from 'systems-host/systems/FuelSystemPublisher';
enum ValveState {
  Closed,
  Open,
}

/**
 * This is needed to initialize the desired fuel L:Var on load to sync with the fuel quantity as per the fuel state management per ATC ID
 * This is a temporary solution until all fuel state related ops are contained in the same module.
 *
 * It also now deals with managing the MSFS fuelsystem
 */

/* TODO: remove this file after proper FQMS is implemented in Rust */
export class LegacyFuel implements Instrument {
  private static NUMBER_OF_TRIGGERS = 42;
  private static NUMBER_OF_JUNCTIONS = 13;
  private static NUMBER_OF_VALVES = 60;

  /** These Valves are set to true in the FLT files so we dont want to set them to false.*/
  private static VALVES_TO_SKIP = [37, 40, 50, 51];

  private readonly sub = this.bus.getSubscriber<FuelSystemEvents & WeightBalanceEvents>();

  private keyEventManager?: KeyEventManager;

  private readonly feed1TankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_2'), 0);
  private readonly leftMidTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_3'), 0);
  private readonly leftInnerTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_4'), 0);
  private readonly feed2TankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_5'), 0);
  private readonly feed3TankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_6'), 0);
  private readonly rightInnerTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_7'), 0);
  private readonly rightMidTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_8'), 0);
  private readonly feed4TankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_9'), 0);
  private readonly trimTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_11'), 0);
  private readonly refuelStarted = ConsumerSubject.create(this.sub.on('fuel_refuel_started_by_user'), false);

  private readonly cgPercent = ConsumerSubject.create(this.sub.on('cg_percent'), 0);
  private readonly aircraftWeightInLBS = ConsumerSubject.create(this.sub.on('total_weight'), 0);

  private readonly triggerStates = new Map<number, ConsumerSubject<boolean>>();

  private readonly junctionSettings = new Map<number, ConsumerSubject<number>>();

  private readonly throttler = new UpdateThrottler(250);

  private refuelInProgress = false;

  private hasInit = false;

  constructor(
    private readonly bus: EventBus,
    private readonly sysHost: BaseInstrument,
  ) {
    KeyEventManager.getManager(bus).then((manager) => {
      this.keyEventManager = manager;
    });

    for (let index = 1; index <= LegacyFuel.NUMBER_OF_TRIGGERS; index++) {
      const element = ConsumerSubject.create(this.sub.on(`fuel_trigger_status_${index}`), false);
      this.triggerStates.set(index, element);
    }

    for (let index = 1; index <= LegacyFuel.NUMBER_OF_JUNCTIONS; index++) {
      const element = ConsumerSubject.create(this.sub.on(`fuel_junction_setting_${index}`), 1);
      this.junctionSettings.set(index, element);
    }
  }

  init() {
    const fuelWeight = SimVar.GetSimVarValue('FUEL TOTAL QUANTITY WEIGHT', 'kilograms');
    SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', fuelWeight);
    Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true).then(() => {
      this.checkEmptyTriggers();
      this.hasInit = true;
    });
  }

  private checkEmptyTriggers(): void {
    if (
      (this.leftInnerTankQty.get() < 0.1 && !this.triggerStates.get(11).get()) ||
      (this.leftInnerTankQty.get() >= 1 && this.triggerStates.get(11).get())
    ) {
      this.toggleTrigger(11);
    }

    if (
      (this.rightInnerTankQty.get() < 0.1 && !this.triggerStates.get(12).get()) ||
      (this.rightInnerTankQty.get() >= 1 && this.triggerStates.get(12).get())
    ) {
      this.toggleTrigger(12);
    }

    if (
      (this.leftMidTankQty.get() < 0.1 && !this.triggerStates.get(22).get()) ||
      (this.leftMidTankQty.get() >= 1 && this.triggerStates.get(22).get())
    ) {
      this.toggleTrigger(22);
    }

    if (
      (this.rightMidTankQty.get() < 0.1 && !this.triggerStates.get(23).get()) ||
      (this.rightMidTankQty.get() >= 1 && this.triggerStates.get(23).get())
    ) {
      this.toggleTrigger(23);
    }

    if (
      this.rightInnerTankQty.get() < 0.1 &&
      this.leftInnerTankQty.get() < 0.1 &&
      this.rightMidTankQty.get() < 0.1 &&
      this.leftMidTankQty.get() < 0.1
    ) {
      // both mid and inner tanks are empty

      this.setJunctionOption(10, 3);
    } else if (this.rightInnerTankQty.get() >= 0.1 || this.leftInnerTankQty.get() >= 0.1) {
      // inner tanks arent empty

      this.setJunctionOption(10, 1);
    } else {
      // mid tanks arent empty but inner tanks are

      this.setJunctionOption(10, 2);
    }

    if (
      (this.trimTankQty.get() < 0.1 && !this.triggerStates.get(32).get()) ||
      (this.trimTankQty.get() >= 1 && this.triggerStates.get(32).get())
    ) {
      this.toggleTrigger(32);
    }
  }

  public onUpdate(): void {
    const dt = this.sysHost.deltaTime;
    const totalDtSinceLastUpdate = this.throttler.canUpdate(dt);

    if (!this.hasInit) {
      return;
    }

    const onGround = SimVar.GetSimVarValue('SIM ON GROUND', 'bool');
    if (!this.refuelInProgress && this.refuelStarted.get()) {
      this.refuelInProgress = true;
      console.log('refuel start detected');

      for (let index = 1; index <= LegacyFuel.NUMBER_OF_TRIGGERS; index++) {
        if (this.triggerStates.get(index).get()) {
          this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_OFF', true, index);
        }
      }
      // starts at 5 since 1-4 are the engine valves controlled by the engine masters
      for (let index = 5; index <= LegacyFuel.NUMBER_OF_VALVES; index++) {
        if (!LegacyFuel.VALVES_TO_SKIP.includes(index)) {
          console.log(`closed valve ${index}`);
          this.setValve(index, ValveState.Closed);
        }
      }
    } else if (this.refuelInProgress && !this.refuelStarted.get()) {
      console.log('refuel end detected');
      this.refuelInProgress = false;
      this.checkEmptyTriggers();
    } else if (!onGround && totalDtSinceLastUpdate > 0) {
      this.checkEmptyTriggers();

      const cgTargetStart = this.calculateCGTarget(this.aircraftWeightInLBS.get() / 1000);
      const cgTargetStop = cgTargetStart - 1;

      if (
        (this.feed1TankQty.get() < 6436 && !this.triggerStates.get(1).get()) ||
        (this.feed1TankQty.get() >= 6437 && this.triggerStates.get(1).get())
      ) {
        this.toggleTrigger(1);
      }
      if (
        (this.feed2TankQty.get() < 6857 && !this.triggerStates.get(2).get()) ||
        (this.feed2TankQty.get() >= 6858 && this.triggerStates.get(2).get())
      ) {
        this.toggleTrigger(2);
      }
      if (
        (this.feed3TankQty.get() < 6857 && !this.triggerStates.get(3).get()) ||
        (this.feed3TankQty.get() >= 6858 && this.triggerStates.get(3).get())
      ) {
        this.toggleTrigger(3);
      }
      if (
        (this.feed4TankQty.get() < 6436 && !this.triggerStates.get(4).get()) ||
        (this.feed4TankQty.get() >= 6437 && this.triggerStates.get(4).get())
      ) {
        this.toggleTrigger(4);
      }
      if (
        (Math.abs(this.feed1TankQty.get() - this.feed4TankQty.get()) < 2 && !this.triggerStates.get(5).get()) ||
        (Math.abs(this.feed1TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerStates.get(5).get())
      ) {
        this.toggleTrigger(5);
      }
      if (
        (Math.abs(this.feed2TankQty.get() - this.feed3TankQty.get()) < 2 && !this.triggerStates.get(6).get()) ||
        (Math.abs(this.feed2TankQty.get() - this.feed3TankQty.get()) >= 3 && this.triggerStates.get(6).get())
      ) {
        this.toggleTrigger(6);
      }
      if (
        (this.feed1TankQty.get() > 6765 && !this.triggerStates.get(7).get()) ||
        (this.feed1TankQty.get() <= 6764 && this.triggerStates.get(7).get())
      ) {
        this.toggleTrigger(7);
      }
      if (
        (this.feed2TankQty.get() > 7186 && !this.triggerStates.get(8).get()) ||
        (this.feed2TankQty.get() <= 7186 && this.triggerStates.get(8).get())
      ) {
        this.toggleTrigger(8);
      }
      if (
        (this.feed3TankQty.get() > 7186 && !this.triggerStates.get(9).get()) ||
        (this.feed3TankQty.get() <= 7186 && this.triggerStates.get(9).get())
      ) {
        this.toggleTrigger(9);
      }
      if (
        (this.feed4TankQty.get() > 6765 && !this.triggerStates.get(10).get()) ||
        (this.feed4TankQty.get() <= 6764 && this.triggerStates.get(10).get())
      ) {
        this.toggleTrigger(10);
      }
      if (
        (this.leftMidTankQty.get() < 1316 && !this.triggerStates.get(13).get()) ||
        (this.leftMidTankQty.get() >= 1317 && this.triggerStates.get(13).get())
      ) {
        this.toggleTrigger(13);
      }
      if (
        (this.feed2TankQty.get() < 6436 && !this.triggerStates.get(14).get()) ||
        (this.feed2TankQty.get() >= 6437 && this.triggerStates.get(14).get())
      ) {
        this.toggleTrigger(14);
      }
      if (
        (this.feed3TankQty.get() < 6436 && !this.triggerStates.get(15).get()) ||
        (this.feed3TankQty.get() >= 6437 && this.triggerStates.get(15).get())
      ) {
        this.toggleTrigger(15);
      }
      if (
        (this.feed2TankQty.get() > 6765 && !this.triggerStates.get(16).get()) ||
        (this.feed2TankQty.get() <= 6764 && this.triggerStates.get(16).get())
      ) {
        this.toggleTrigger(16);
      }
      if (
        (this.feed3TankQty.get() > 6765 && !this.triggerStates.get(17).get()) ||
        (this.feed3TankQty.get() <= 6764 && this.triggerStates.get(17).get())
      ) {
        this.toggleTrigger(17);
      }
      if (
        (this.feed1TankQty.get() < 6765 &&
          this.feed3TankQty.get() < 6765 &&
          Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) < 2 &&
          !this.triggerStates.get(18).get()) ||
        ((this.feed1TankQty.get() >= 6766 ||
          this.feed3TankQty.get() >= 6766 ||
          Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) >= 3) &&
          this.triggerStates.get(18).get())
      ) {
        this.toggleTrigger(18);
      }
      if (
        (this.feed1TankQty.get() < 6765 &&
          this.feed2TankQty.get() < 6765 &&
          Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) < 2 &&
          !this.triggerStates.get(19).get()) ||
        ((this.feed1TankQty.get() >= 6766 ||
          this.feed2TankQty.get() >= 6766 ||
          Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) >= 3) &&
          this.triggerStates.get(19).get())
      ) {
        this.toggleTrigger(19);
      }
      if (
        (this.feed2TankQty.get() < 6765 &&
          this.feed4TankQty.get() < 6765 &&
          Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) < 2 &&
          !this.triggerStates.get(20).get()) ||
        ((this.feed2TankQty.get() >= 6766 ||
          this.feed4TankQty.get() >= 6766 ||
          Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) >= 3) &&
          this.triggerStates.get(20).get())
      ) {
        this.toggleTrigger(20);
      }
      if (
        (this.feed3TankQty.get() < 6765 &&
          this.feed4TankQty.get() < 6765 &&
          Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) < 2 &&
          !this.triggerStates.get(21).get()) ||
        ((this.feed3TankQty.get() >= 6766 ||
          this.feed4TankQty.get() >= 6766 ||
          Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) >= 3) &&
          this.triggerStates.get(21).get())
      ) {
        this.toggleTrigger(21);
      }
      if (
        (this.feed1TankQty.get() < 1974 && !this.triggerStates.get(24).get()) ||
        (this.feed1TankQty.get() >= 1975 && this.triggerStates.get(24).get())
      ) {
        this.toggleTrigger(24);
      }
      if (
        (this.feed2TankQty.get() < 1974 && !this.triggerStates.get(25).get()) ||
        (this.feed2TankQty.get() >= 1975 && this.triggerStates.get(25).get())
      ) {
        this.toggleTrigger(25);
      }
      if (
        (this.feed3TankQty.get() < 1974 && !this.triggerStates.get(26).get()) ||
        (this.feed3TankQty.get() >= 1975 && this.triggerStates.get(26).get())
      ) {
        this.toggleTrigger(26);
      }
      if (
        (this.feed4TankQty.get() < 1974 && !this.triggerStates.get(27).get()) ||
        (this.feed4TankQty.get() >= 1975 && this.triggerStates.get(27).get())
      ) {
        this.toggleTrigger(27);
      }
      if (
        (Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) < 2 && !this.triggerStates.get(28).get()) ||
        (Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) >= 3 && this.triggerStates.get(28).get())
      ) {
        this.toggleTrigger(28);
      }
      if (
        (Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) < 2 && !this.triggerStates.get(29).get()) ||
        (Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) >= 3 && this.triggerStates.get(29).get())
      ) {
        this.toggleTrigger(29);
      }
      if (
        (Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) < 2 && !this.triggerStates.get(30).get()) ||
        (Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerStates.get(30).get())
      ) {
        this.toggleTrigger(30);
      }
      if (
        (Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) < 2 && !this.triggerStates.get(31).get()) ||
        (Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerStates.get(31).get())
      ) {
        this.toggleTrigger(31);
      }
      if (
        (this.feed1TankQty.get() < 1316 && !this.triggerStates.get(33).get()) ||
        (this.feed1TankQty.get() >= 1317 && this.triggerStates.get(33).get())
      ) {
        this.toggleTrigger(33);
      }
      if (
        (this.feed2TankQty.get() < 1316 && !this.triggerStates.get(34).get()) ||
        (this.feed2TankQty.get() >= 1317 && this.triggerStates.get(34).get())
      ) {
        this.toggleTrigger(34);
      }
      if (
        (this.feed4TankQty.get() < 1316 && !this.triggerStates.get(35).get()) ||
        (this.feed4TankQty.get() >= 1317 && this.triggerStates.get(35).get())
      ) {
        this.toggleTrigger(35);
      }
      if (
        (this.feed3TankQty.get() < 1316 && !this.triggerStates.get(36).get()) ||
        (this.feed3TankQty.get() >= 1317 && this.triggerStates.get(36).get())
      ) {
        this.toggleTrigger(36);
      }
      if (
        (this.feed1TankQty.get() > 1481 && !this.triggerStates.get(37).get()) ||
        (this.feed1TankQty.get() <= 1480 && this.triggerStates.get(37).get())
      ) {
        this.toggleTrigger(37);
      }
      if (
        (this.feed2TankQty.get() > 1481 && !this.triggerStates.get(38).get()) ||
        (this.feed2TankQty.get() <= 1480 && this.triggerStates.get(38).get())
      ) {
        this.toggleTrigger(38);
      }
      if (
        (this.feed3TankQty.get() > 1481 && !this.triggerStates.get(39).get()) ||
        (this.feed3TankQty.get() <= 1480 && this.triggerStates.get(39).get())
      ) {
        this.toggleTrigger(39);
      }
      if (
        (this.feed4TankQty.get() > 1481 && !this.triggerStates.get(40).get()) ||
        (this.feed4TankQty.get() <= 1480 && this.triggerStates.get(40).get())
      ) {
        this.toggleTrigger(40);
      }
      if (
        (this.cgPercent.get() > cgTargetStart && !this.triggerStates.get(41).get()) ||
        (this.cgPercent.get() <= cgTargetStart - 0.1 && this.triggerStates.get(41).get())
      ) {
        this.toggleTrigger(41);
      }
      if (
        (this.cgPercent.get() < cgTargetStop && !this.triggerStates.get(42).get()) ||
        (this.cgPercent.get() >= cgTargetStop + 0.1 && this.triggerStates.get(42).get())
      ) {
        this.toggleTrigger(42);
      }
    }
  }
  private toggleTrigger(index: number): void {
    if (this.keyEventManager) {
      this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, index);
    }
  }

  private setJunctionOption(index: number, option: number): void {
    if (this.junctionSettings.get(index).get() !== option && this.keyEventManager) {
      this.keyEventManager.triggerKey('FUELSYSTEM_JUNCTION_SET', true, index, option);
    }
  }

  private setValve(index: number, state: ValveState): void {
    this.keyEventManager.triggerKey('FUELSYSTEM_VALVE_SET', true, index, state);
  }
  /**
   * Calculates the CG Target based on aircraft total weight in kLBS
   * @param weight aircraft weight in kLBS
   * @returns target CG in % rounded to 2 decimals
   */
  private calculateCGTarget(weight: number): number {
    //coefficients determined using regression on FCOM diagram
    const target =
      1.52792360195336e-14 * Math.pow(weight, 5) -
      7.7447769532209e-11 * Math.pow(weight, 4) +
      1.57545973208929e-7 * Math.pow(weight, 3) -
      0.000162820304673144 * Math.pow(weight, 2) +
      0.0884071656630996 * weight +
      20.6522282591408;
    return MathUtils.round(target, 0.01);
  }
}
