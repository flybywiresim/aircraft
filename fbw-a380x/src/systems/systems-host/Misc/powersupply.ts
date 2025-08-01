import {
  BackplanePublisher,
  EventBus,
  EventSubscriber,
  Publisher,
  SimVarDefinition,
  SimVarPublisher,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

// FIXME no need for the extra indirection of the second publisher.
// Just set types to SimVarValueType.Bool and the SimVarPublisher takes care of types

interface PowerSupplySimvars {
  msfsAcBus1: number;
  msfsAcBus2: number;
  msfsAcBus3: number;
  msfsAcBus4: number;
  msfsAcBusEss: number;
  msfsDcBus1: number;
  msfsDcBus2: number;
  msfsDcBusEss: number;
}

enum PowerSupplySimvarSources {
  acBus1 = 'L:A32NX_ELEC_AC_1_BUS_IS_POWERED',
  acBus2 = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
  acBus3 = 'L:A32NX_ELEC_AC_3_BUS_IS_POWERED',
  acBus4 = 'L:A32NX_ELEC_AC_4_BUS_IS_POWERED',
  acBusEss = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
  dcBus1 = 'L:A32NX_ELEC_DC_1_BUS_IS_POWERED',
  dcBus2 = 'L:A32NX_ELEC_DC_2_BUS_IS_POWERED',
  dcBusEss = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED',
}

export class PowerSupplySimvarPublisher extends SimVarPublisher<PowerSupplySimvars> {
  private static simvars = new Map<keyof PowerSupplySimvars, SimVarDefinition>([
    ['msfsAcBus1', { name: PowerSupplySimvarSources.acBus1, type: SimVarValueType.Number }],
    ['msfsAcBus2', { name: PowerSupplySimvarSources.acBus2, type: SimVarValueType.Number }],
    ['msfsAcBus3', { name: PowerSupplySimvarSources.acBus3, type: SimVarValueType.Number }],
    ['msfsAcBus4', { name: PowerSupplySimvarSources.acBus4, type: SimVarValueType.Number }],
    ['msfsAcBusEss', { name: PowerSupplySimvarSources.acBusEss, type: SimVarValueType.Number }],
    ['msfsDcBus1', { name: PowerSupplySimvarSources.dcBus1, type: SimVarValueType.Number }],
    ['msfsDcBus2', { name: PowerSupplySimvarSources.dcBus2, type: SimVarValueType.Number }],
    ['msfsDcBusEss', { name: PowerSupplySimvarSources.dcBusEss, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: EventBus) {
    super(PowerSupplySimvarPublisher.simvars, bus);
  }
}

export interface PowerSupplyBusTypes {
  acBus1: boolean;
  acBus2: boolean;
  acBus3: boolean;
  acBus4: boolean;
  acBusEss: boolean;
  dcBus1: boolean;
  dcBus2: boolean;
  dcBusEss: boolean;
}

export class PowerSupplyBusses implements BackplanePublisher {
  private simVarPublisher: PowerSupplySimvarPublisher = null;

  private subscriber: EventSubscriber<PowerSupplySimvars> = null;

  private publisher: Publisher<PowerSupplyBusTypes> = null;

  constructor(private readonly bus: EventBus) {
    this.simVarPublisher = new PowerSupplySimvarPublisher(this.bus);
  }

  private initialize(): void {
    this.publisher = this.bus.getPublisher<PowerSupplyBusTypes>();
    this.subscriber = this.bus.getSubscriber<PowerSupplySimvars>();

    this.subscriber
      .on('msfsAcBus1')
      .whenChanged()
      .handle((powered: number) => this.publisher.pub('acBus1', powered !== 0, false, false));
    this.subscriber
      .on('msfsAcBus2')
      .whenChanged()
      .handle((powered: number) => this.publisher.pub('acBus2', powered !== 0, false, false));
    this.subscriber
      .on('msfsAcBus3')
      .whenChanged()
      .handle((powered: number) => this.publisher.pub('acBus3', powered !== 0, false, false));
    this.subscriber
      .on('msfsAcBus4')
      .whenChanged()
      .handle((powered: number) => this.publisher.pub('acBus4', powered !== 0, false, false));
    this.subscriber
      .on('msfsAcBusEss')
      .whenChanged()
      .handle((powered: number) => this.publisher.pub('acBusEss', powered !== 0, false, false));
    this.subscriber
      .on('msfsDcBus1')
      .whenChanged()
      .handle((powered: number) => this.publisher.pub('dcBus1', powered !== 0, false, false));
    this.subscriber
      .on('msfsDcBus2')
      .whenChanged()
      .handle((powered: number) => this.publisher.pub('dcBus2', powered !== 0, false, false));
    this.subscriber
      .on('msfsDcBusEss')
      .whenChanged()
      .handle((powered: number) => this.publisher.pub('dcBusEss', powered !== 0, false, false));
  }

  public startPublish(): void {
    this.initialize();
    this.simVarPublisher.startPublish();
  }

  public onUpdate(): void {
    this.simVarPublisher.onUpdate();
  }
}
