import { ConsumerSubject, EventBus, Instrument, KeyEventManager, WeightBalanceEvents } from '@microsoft/msfs-sdk';
import { FuelSystemEvents } from 'systems-host/systems/FuelSystemPublisher';

/**
 * This is needed to initialize the desired fuel L:Var on load to sync with the fuel quantity as per the fuel state management per ATC ID
 * This is a temporary solution until all fuel state related ops are contained in the same module.
 */

/* TODO: remove this file after proper FQMS is implemented in Rust */
export class LegacyFuel implements Instrument {
  private readonly sub = this.bus.getSubscriber<FuelSystemEvents & WeightBalanceEvents>();

  private keyEventManager?: KeyEventManager;

  private readonly leftOuterTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_1'), 0);
  private readonly feed1TankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_2'), 0);
  private readonly leftMidTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_3'), 0);
  private readonly leftInnerTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_4'), 0);
  private readonly feed2TankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_5'), 0);
  private readonly feed3TankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_6'), 0);
  private readonly rightInnerTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_7'), 0);
  private readonly rightMidTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_8'), 0);
  private readonly feed4TankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_9'), 0);
  private readonly rightOuterTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_10'), 0);
  private readonly trimTankQty = ConsumerSubject.create(this.sub.on('fuel_tank_quantity_11'), 0);

  private readonly cgPercent = ConsumerSubject.create(this.sub.on('cg_percent'), 0);

  private readonly triggerStates = new Map<number, ConsumerSubject<boolean>>();

  constructor(private readonly bus: EventBus) {
    KeyEventManager.getManager(bus).then((manager) => {
      this.keyEventManager = manager;
    });

    for (let index = 1; index < 43; index++) {
      const element = ConsumerSubject.create(this.sub.on(`fuel_trigger_status_${index}`), false);
      this.triggerStates.set(index, element);
    }
  }

  init() {
    const fuelWeight = SimVar.GetSimVarValue('FUEL TOTAL QUANTITY WEIGHT', 'kilograms');
    SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', fuelWeight);
  }

  public onUpdate(): void {
    const onGround = SimVar.GetSimVarValue('SIM ON GROUND', 'bool');

    if (!onGround) {
      if (
        (this.feed1TankQty.get() < 6436 && !this.triggerStates.get(1).get()) ||
        (this.feed1TankQty.get() >= 6437 && this.triggerStates.get(1).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 1);
      }

      if (
        (this.feed2TankQty.get() < 6857 && !this.triggerStates.get(2).get()) ||
        (this.feed2TankQty.get() >= 6858 && this.triggerStates.get(2).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 2);
      }

      if (
        (this.feed3TankQty.get() < 6857 && !this.triggerStates.get(3).get()) ||
        (this.feed3TankQty.get() >= 6858 && this.triggerStates.get(3).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 3);
      }

      if (
        (this.feed4TankQty.get() < 6436 && !this.triggerStates.get(4).get()) ||
        (this.feed4TankQty.get() >= 6437 && this.triggerStates.get(4).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 4);
      }

      if (
        (Math.abs(this.feed1TankQty.get() - this.feed4TankQty.get()) < 2 && !this.triggerStates.get(5).get()) ||
        (Math.abs(this.feed1TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerStates.get(5).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 5);
      }

      if (
        (Math.abs(this.feed2TankQty.get() - this.feed3TankQty.get()) < 2 && !this.triggerStates.get(6).get()) ||
        (Math.abs(this.feed2TankQty.get() - this.feed3TankQty.get()) >= 3 && this.triggerStates.get(6).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 6);
      }

      if (
        (this.feed1TankQty.get() > 6765 && !this.triggerStates.get(7).get()) ||
        (this.feed1TankQty.get() <= 6764 && this.triggerStates.get(7).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 7);
      }

      if (
        (this.feed2TankQty.get() > 7186 && !this.triggerStates.get(8).get()) ||
        (this.feed2TankQty.get() <= 7186 && this.triggerStates.get(8).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 8);
      }

      if (
        (this.feed3TankQty.get() > 7186 && !this.triggerStates.get(9).get()) ||
        (this.feed3TankQty.get() <= 7186 && this.triggerStates.get(9).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 9);
      }

      if (
        (this.feed4TankQty.get() > 6765 && !this.triggerStates.get(10).get()) ||
        (this.feed4TankQty.get() <= 6764 && this.triggerStates.get(10).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 10);
      }

      if (
        (this.leftInnerTankQty.get() < 0.1 && !this.triggerStates.get(11).get()) ||
        (this.leftInnerTankQty.get() >= 1 && this.triggerStates.get(11).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 11);
      }

      if (
        (this.rightInnerTankQty.get() < 0.1 && !this.triggerStates.get(12).get()) ||
        (this.rightInnerTankQty.get() >= 1 && this.triggerStates.get(12).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 12);
      }

      if (
        (this.leftMidTankQty.get() < 1316 && !this.triggerStates.get(13).get()) ||
        (this.rightInnerTankQty.get() >= 1317 && this.triggerStates.get(13).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 13);
      }

      if (
        (this.feed2TankQty.get() < 6436 && !this.triggerStates.get(14).get()) ||
        (this.feed2TankQty.get() >= 6437 && this.triggerStates.get(14).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 14);
      }

      if (
        (this.feed3TankQty.get() < 6436 && !this.triggerStates.get(15).get()) ||
        (this.feed3TankQty.get() >= 6437 && this.triggerStates.get(15).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 15);
      }

      if (
        (this.feed2TankQty.get() > 6765 && !this.triggerStates.get(16).get()) ||
        (this.feed2TankQty.get() <= 6764 && this.triggerStates.get(16).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 16);
      }

      if (
        (this.feed3TankQty.get() > 6765 && !this.triggerStates.get(17).get()) ||
        (this.feed3TankQty.get() <= 6764 && this.triggerStates.get(17).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 17);
      }

      if (
        (Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) < 2 && !this.triggerStates.get(18).get()) ||
        (Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) >= 3 && this.triggerStates.get(18).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 18);
      }

      if (
        (Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) < 2 && !this.triggerStates.get(19).get()) ||
        (Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) >= 3 && this.triggerStates.get(19).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 19);
      }

      if (
        (Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) < 2 && !this.triggerStates.get(20).get()) ||
        (Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerStates.get(20).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 20);
      }

      if (
        (Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) < 2 && !this.triggerStates.get(21).get()) ||
        (Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerStates.get(21).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 21);
      }

      if (
        (this.leftMidTankQty.get() < 0.1 && !this.triggerStates.get(22).get()) ||
        (this.leftMidTankQty.get() >= 1 && this.triggerStates.get(22).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 22);
      }

      if (
        (this.rightMidTankQty.get() < 0.1 && !this.triggerStates.get(23).get()) ||
        (this.rightMidTankQty.get() >= 1 && this.triggerStates.get(23).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 23);
      }

      if (
        (this.feed1TankQty.get() < 1974 && !this.triggerStates.get(24).get()) ||
        (this.feed1TankQty.get() >= 1975 && this.triggerStates.get(24).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 24);
      }

      if (
        (this.feed2TankQty.get() < 1974 && !this.triggerStates.get(25).get()) ||
        (this.feed2TankQty.get() >= 1975 && this.triggerStates.get(25).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 25);
      }

      if (
        (this.feed3TankQty.get() < 1974 && !this.triggerStates.get(26).get()) ||
        (this.feed3TankQty.get() >= 1975 && this.triggerStates.get(26).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 26);
      }

      if (
        (this.feed4TankQty.get() < 1974 && !this.triggerStates.get(27).get()) ||
        (this.feed4TankQty.get() >= 1975 && this.triggerStates.get(27).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 27);
      }

      if (
        (Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) < 2 && !this.triggerStates.get(28).get()) ||
        (Math.abs(this.feed1TankQty.get() - this.feed3TankQty.get()) >= 3 && this.triggerStates.get(28).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 28);
      }

      if (
        (Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) < 2 && !this.triggerStates.get(29).get()) ||
        (Math.abs(this.feed1TankQty.get() - this.feed2TankQty.get()) >= 3 && this.triggerStates.get(29).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 29);
      }

      if (
        (Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) < 2 && !this.triggerStates.get(30).get()) ||
        (Math.abs(this.feed2TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerStates.get(30).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 30);
      }

      if (
        (Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) < 2 && !this.triggerStates.get(31).get()) ||
        (Math.abs(this.feed3TankQty.get() - this.feed4TankQty.get()) >= 3 && this.triggerStates.get(31).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 31);
      }

      if (
        (this.trimTankQty.get() < 0.1 && !this.triggerStates.get(32).get()) ||
        (this.trimTankQty.get() >= 1 && this.triggerStates.get(32).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 32);
      }

      if (
        (this.feed1TankQty.get() < 1316 && !this.triggerStates.get(33).get()) ||
        (this.feed1TankQty.get() >= 1317 && this.triggerStates.get(33).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 33);
      }

      if (
        (this.feed2TankQty.get() < 1316 && !this.triggerStates.get(34).get()) ||
        (this.feed2TankQty.get() >= 1317 && this.triggerStates.get(34).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 34);
      }

      if (
        (this.feed4TankQty.get() < 1316 && !this.triggerStates.get(35).get()) ||
        (this.feed4TankQty.get() >= 1317 && this.triggerStates.get(35).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 35);
      }

      if (
        (this.feed3TankQty.get() < 1316 && !this.triggerStates.get(36).get()) ||
        (this.feed3TankQty.get() >= 1317 && this.triggerStates.get(36).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 36);
      }

      if (
        (this.feed1TankQty.get() > 1481 && !this.triggerStates.get(37).get()) ||
        (this.feed1TankQty.get() <= 1480 && this.triggerStates.get(37).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 37);
      }

      if (
        (this.feed2TankQty.get() > 1481 && !this.triggerStates.get(38).get()) ||
        (this.feed2TankQty.get() <= 1480 && this.triggerStates.get(38).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 38);
      }

      if (
        (this.feed3TankQty.get() > 1481 && !this.triggerStates.get(39).get()) ||
        (this.feed3TankQty.get() <= 1480 && this.triggerStates.get(39).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 39);
      }

      if (
        (this.feed4TankQty.get() > 1481 && !this.triggerStates.get(40).get()) ||
        (this.feed4TankQty.get() <= 1480 && this.triggerStates.get(40).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 40);
      }

      if (
        (this.cgPercent.get() > 0.415 && !this.triggerStates.get(41).get()) ||
        (this.cgPercent.get() <= 0.414 && this.triggerStates.get(41).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 41);
      }

      if (
        (this.cgPercent.get() < 0.405 && !this.triggerStates.get(42).get()) ||
        (this.cgPercent.get() >= 0.406 && this.triggerStates.get(42).get())
      ) {
        this.keyEventManager.triggerKey('FUELSYSTEM_TRIGGER_TOGGLE', true, 42);
      }
    }
  }
}
