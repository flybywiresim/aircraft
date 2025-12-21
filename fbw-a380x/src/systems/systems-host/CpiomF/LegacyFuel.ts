// @ts-strict-ignore
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

import { FuelSystemEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FuelSystemPublisher';
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
  private static NUMBER_OF_TRIGGERS = 44;
  private static NUMBER_OF_JUNCTIONS = 17;
  private static NUMBER_OF_VALVES = 59;

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

  private readonly cgPercent = ConsumerSubject.create(this.sub.on('cg_percent_gw'), 0);
  private readonly aircraftWeightInLBS = ConsumerSubject.create(this.sub.on('total_weight'), 0);

  private readonly triggerStates = new Map<number, ConsumerSubject<boolean>>();

  private readonly junctionSettings = new Map<number, ConsumerSubject<number>>();

  private readonly throttler = new UpdateThrottler(250);

  private refuelInProgress = false;

  private hasInit = false;

  /* holds state for active trimtank transfers to feed tanks 1-4 */
  private readonly trimTransfersActiveForFeedTank = new Map([
    [1, false],
    [2, false],
    [3, false],
    [4, false],
  ]);

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
    const fuelWeight = SimVar.GetSimVarValue('L:A32NX_TOTAL_FUEL_QUANTITY', 'number');
    SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', fuelWeight);
    Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true).then(() => {
      this.checkEmptyTriggers();
      this.hasInit = true;
    });
  }

  private checkEmptyTriggers(): void {
    if (
      (this.leftInnerTankQty.get() < 0.1 && !this.triggerActive(11)) ||
      (this.leftInnerTankQty.get() >= 1 && this.triggerActive(11))
    ) {
      this.toggleTrigger(11);
    }

    if (
      (this.rightInnerTankQty.get() < 0.1 && !this.triggerActive(12)) ||
      (this.rightInnerTankQty.get() >= 1 && this.triggerActive(12))
    ) {
      this.toggleTrigger(12);
    }

    if (
      (this.leftMidTankQty.get() < 0.1 && !this.triggerActive(22)) ||
      (this.leftMidTankQty.get() >= 1 && this.triggerActive(22))
    ) {
      this.toggleTrigger(22);
    }

    if (
      (this.rightMidTankQty.get() < 0.1 && !this.triggerActive(23)) ||
      (this.rightMidTankQty.get() >= 1 && this.triggerActive(23))
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
      (this.trimTankQty.get() < 0.1 && !this.triggerActive(32)) ||
      (this.trimTankQty.get() >= 1 && this.triggerActive(32))
    ) {
      this.toggleTrigger(34);
      for (let i = 1; i < 5; i++) {
        this.trimTransfersActiveForFeedTank.set(i, false);
      }
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
        (this.feed1TankQty.get() < 6436 && !this.triggerActive(1)) ||
        (this.feed1TankQty.get() >= 6437 && this.triggerActive(1))
      ) {
        this.toggleTrigger(1);
      }
      if (
        (this.feed2TankQty.get() < 6857 && !this.triggerActive(2)) ||
        (this.feed2TankQty.get() >= 6858 && this.triggerActive(2))
      ) {
        this.toggleTrigger(2);
      }
      if (
        (this.feed3TankQty.get() < 6857 && !this.triggerActive(3)) ||
        (this.feed3TankQty.get() >= 6858 && this.triggerActive(3))
      ) {
        this.toggleTrigger(3);
      }
      if (
        (this.feed4TankQty.get() < 6436 && !this.triggerActive(4)) ||
        (this.feed4TankQty.get() >= 6437 && this.triggerActive(4))
      ) {
        this.toggleTrigger(4);
      }
      if (
        (Math.abs(this.feed1TankQty.get() - this.feed4TankQty.get()) < 2 &&
          !this.triggerActive(5) &&
          !this.triggerActiveAny(7, 10)) ||
        (Math.abs(this.feed1TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerActive(5))
      ) {
        this.toggleTrigger(5);
      }
      if (Math.abs(this.feed2TankQty.get() - this.feed3TankQty.get()) < 2 && !this.triggerActive(6)) {
        if (
          (this.triggerActive(13) && !this.triggerActiveAny(16, 17)) ||
          (!this.triggerActive(13) && !this.triggerActiveAny(8, 9))
        ) {
          this.toggleTrigger(6);
        }
      } else if (Math.abs(this.feed2TankQty.get() - this.feed3TankQty.get()) >= 3 && this.triggerActive(6)) {
        this.toggleTrigger(6);
      }
      if (
        (this.feed1TankQty.get() > 6765 && !this.triggerActive(7)) ||
        (this.feed1TankQty.get() <= 6764 && this.triggerActive(7))
      ) {
        this.toggleTrigger(7);
      }
      if (
        (this.feed2TankQty.get() > 7186 && !this.triggerActive(8)) ||
        (this.feed2TankQty.get() <= 7186 && this.triggerActive(8))
      ) {
        this.toggleTrigger(8);
      }
      if (
        (this.feed3TankQty.get() > 7186 && !this.triggerActive(9)) ||
        (this.feed3TankQty.get() <= 7186 && this.triggerActive(9))
      ) {
        this.toggleTrigger(9);
      }
      if (
        (this.feed4TankQty.get() > 6765 && !this.triggerActive(10)) ||
        (this.feed4TankQty.get() <= 6764 && this.triggerActive(10))
      ) {
        this.toggleTrigger(10);
      }
      if (
        (this.leftMidTankQty.get() < 1316 && !this.triggerActive(13)) ||
        (this.leftMidTankQty.get() >= 1317 && this.triggerActive(13))
      ) {
        this.toggleTrigger(13);
      }
      if (
        (this.feed2TankQty.get() < 6436 && !this.triggerActive(14)) ||
        (this.feed2TankQty.get() >= 6437 && this.triggerActive(14))
      ) {
        this.toggleTrigger(14);
      }
      if (
        (this.feed3TankQty.get() < 6436 && !this.triggerActive(15)) ||
        (this.feed3TankQty.get() >= 6437 && this.triggerActive(15))
      ) {
        this.toggleTrigger(15);
      }
      if (
        (this.feed2TankQty.get() > 6765 && !this.triggerActive(16)) ||
        (this.feed2TankQty.get() <= 6764 && this.triggerActive(16))
      ) {
        this.toggleTrigger(16);
      }
      if (
        (this.feed3TankQty.get() > 6765 && !this.triggerActive(17)) ||
        (this.feed3TankQty.get() <= 6764 && this.triggerActive(17))
      ) {
        this.toggleTrigger(17);
      }
      if (
        (this.feed1TankQty.get() < 6765 &&
          this.feed3TankQty.get() < 6765 &&
          Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) < 2 &&
          !this.triggerActive(18) &&
          this.triggerActive(13) &&
          !this.triggerActiveAny(7, 10) &&
          !this.triggerActive(17)) ||
        ((this.feed1TankQty.get() >= 6766 ||
          this.feed3TankQty.get() >= 6766 ||
          Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) >= 3) &&
          this.triggerActive(18))
      ) {
        this.toggleTrigger(18);
      }
      if (
        (this.feed1TankQty.get() < 6765 &&
          this.feed2TankQty.get() < 6765 &&
          Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) < 2 &&
          !this.triggerActive(19) &&
          this.triggerActive(13) &&
          !this.triggerActiveAny(7, 10) &&
          !this.triggerActive(16)) ||
        ((this.feed1TankQty.get() >= 6766 ||
          this.feed2TankQty.get() >= 6766 ||
          Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) >= 3) &&
          this.triggerActive(19))
      ) {
        this.toggleTrigger(19);
      }
      if (
        (this.feed2TankQty.get() < 6765 &&
          this.feed4TankQty.get() < 6765 &&
          Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) < 2 &&
          !this.triggerActive(20) &&
          this.triggerActive(13) &&
          !this.triggerActiveAny(7, 10) &&
          !this.triggerActive(16)) ||
        ((this.feed2TankQty.get() >= 6766 ||
          this.feed4TankQty.get() >= 6766 ||
          Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) >= 3) &&
          this.triggerActive(20))
      ) {
        this.toggleTrigger(20);
      }
      if (
        (this.feed3TankQty.get() < 6765 &&
          this.feed4TankQty.get() < 6765 &&
          Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) < 2 &&
          !this.triggerActive(21) &&
          this.triggerActive(13) &&
          !this.triggerActiveAny(7, 10) &&
          !this.triggerActive(17)) ||
        ((this.feed3TankQty.get() >= 6766 ||
          this.feed4TankQty.get() >= 6766 ||
          Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) >= 3) &&
          this.triggerActive(21))
      ) {
        this.toggleTrigger(21);
      }
      if (
        (this.feed1TankQty.get() < 1974 && !this.triggerActive(24)) ||
        (this.feed1TankQty.get() >= 1975 && this.triggerActive(24))
      ) {
        this.toggleTrigger(24);
        this.trimTransfersActiveForFeedTank.set(1, true);
      }
      if (
        (this.feed2TankQty.get() < 1974 && !this.triggerActive(25)) ||
        (this.feed2TankQty.get() >= 1975 && this.triggerActive(25))
      ) {
        this.toggleTrigger(25);
        this.trimTransfersActiveForFeedTank.set(2, true);
      }
      if (
        (this.feed3TankQty.get() < 1974 && !this.triggerActive(26)) ||
        (this.feed3TankQty.get() >= 1975 && this.triggerActive(26))
      ) {
        this.toggleTrigger(26);
        this.trimTransfersActiveForFeedTank.set(3, true);
      }
      if (
        (this.feed4TankQty.get() < 1974 && !this.triggerActive(27)) ||
        (this.feed4TankQty.get() >= 1975 && this.triggerActive(27))
      ) {
        this.toggleTrigger(27);
        this.trimTransfersActiveForFeedTank.set(4, true);
      }
      if (
        (Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) < 2 &&
          !this.triggerActive(28) &&
          this.TankLowestAndTrimTransferActive(1, 3)) ||
        (Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) >= 3 && this.triggerActive(28))
      ) {
        this.toggleTrigger(28);
      }
      if (
        (Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) < 2 &&
          !this.triggerActive(29) &&
          this.TankLowestAndTrimTransferActive(1, 2)) ||
        (Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) >= 3 && this.triggerActive(29))
      ) {
        this.toggleTrigger(29);
      }
      if (
        (Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) < 2 &&
          !this.triggerActive(30) &&
          this.TankLowestAndTrimTransferActive(2, 4)) ||
        (Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerActive(30))
      ) {
        this.toggleTrigger(30);
      }
      if (
        (Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) < 2 &&
          !this.triggerActive(31) &&
          this.TankLowestAndTrimTransferActive(3, 4)) ||
        (Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerActive(31))
      ) {
        this.toggleTrigger(31);
      }
      if (
        (Math.abs(this.feed1TankQty.get() - this.feed4TankQty.get()) < 2 &&
          !this.triggerActive(32) &&
          this.TankLowestAndTrimTransferActive(1, 4)) ||
        (Math.abs(this.feed1TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerActive(32))
      ) {
        this.toggleTrigger(32);
      }
      if (
        (Math.abs(this.feed2TankQty.get() - this.feed3TankQty.get()) < 2 &&
          !this.triggerActive(33) &&
          this.TankLowestAndTrimTransferActive(2, 3)) ||
        (Math.abs(this.feed2TankQty.get() - this.feed3TankQty.get()) >= 3 && this.triggerActive(33))
      ) {
        this.toggleTrigger(33);
      }
      if (
        (this.feed1TankQty.get() < 1316 && !this.triggerActive(35)) ||
        (this.feed1TankQty.get() >= 1317 && this.triggerActive(35))
      ) {
        this.toggleTrigger(35);
      }
      if (
        (this.feed2TankQty.get() < 1316 && !this.triggerActive(36)) ||
        (this.feed2TankQty.get() >= 1317 && this.triggerActive(36))
      ) {
        this.toggleTrigger(36);
      }
      if (
        (this.feed4TankQty.get() < 1316 && !this.triggerActive(37)) ||
        (this.feed4TankQty.get() >= 1317 && this.triggerActive(37))
      ) {
        this.toggleTrigger(37);
      }
      if (
        (this.feed3TankQty.get() < 1316 && !this.triggerActive(38)) ||
        (this.feed3TankQty.get() >= 1317 && this.triggerActive(38))
      ) {
        this.toggleTrigger(38);
      }
      if (
        (this.feed1TankQty.get() > 1481 && !this.triggerActive(39)) ||
        (this.feed1TankQty.get() <= 1480 && this.triggerActive(39))
      ) {
        this.toggleTrigger(39);
      }
      if (
        (this.feed2TankQty.get() > 1481 && !this.triggerActive(40)) ||
        (this.feed2TankQty.get() <= 1480 && this.triggerActive(40))
      ) {
        this.toggleTrigger(40);
      }
      if (
        (this.feed3TankQty.get() > 1481 && !this.triggerActive(41)) ||
        (this.feed3TankQty.get() <= 1480 && this.triggerActive(41))
      ) {
        this.toggleTrigger(41);
      }
      if (
        (this.feed4TankQty.get() > 1481 && !this.triggerActive(42)) ||
        (this.feed4TankQty.get() <= 1480 && this.triggerActive(42))
      ) {
        this.toggleTrigger(42);
      }
      if (
        (this.cgPercent.get() > cgTargetStart && !this.triggerActive(43)) ||
        (this.cgPercent.get() <= cgTargetStart - 0.1 && this.triggerActive(43))
      ) {
        this.toggleTrigger(43);
      }
      if (
        (this.cgPercent.get() < cgTargetStop && !this.triggerActive(44)) ||
        (this.cgPercent.get() >= cgTargetStop + 0.1 && this.triggerActive(44))
      ) {
        this.toggleTrigger(44);
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
   * Helper function for the equalize triggers regarding trim tank transfers
   *
   * Checks if at least one of the tanks provided have the lowest fuel quantity and if there is an active trim transfer happening to any of them
   * @param tank1 first tank to check
   * @param tank2 second tank to check
   * @returns if the condition is true or not
   */
  private TankLowestAndTrimTransferActive(tank1: number, tank2: number): boolean {
    const feedTankQuantities: readonly number[] = [
      this.feed1TankQty.get(),
      this.feed2TankQty.get(),
      this.feed3TankQty.get(),
      this.feed4TankQty.get(),
    ];

    const lowestQTY = Math.min(...feedTankQuantities);

    return (
      (feedTankQuantities[tank1] <= lowestQTY + 3 || feedTankQuantities[tank2] <= lowestQTY + 3) &&
      (this.trimTransfersActiveForFeedTank.get(tank1) || this.trimTransfersActiveForFeedTank.get(tank2))
    );
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

  private triggerActive(index: number): boolean {
    return this.triggerStates.get(index).get();
  }

  private triggerActiveAny(...indices: number[]): boolean {
    for (let i = 0, triggerIndex; (triggerIndex = indices[i]); i++) {
      if (this.triggerActive(triggerIndex)) {
        return true;
      }
    }
    return false;
  }
}
