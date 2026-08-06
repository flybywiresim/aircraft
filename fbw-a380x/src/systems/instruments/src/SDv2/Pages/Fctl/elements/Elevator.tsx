import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, Subject, Subscribable } from '@microsoft/msfs-sdk';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { MIN_VERTICAL_DEFLECTION, VerticalDeflectionIndication } from './VerticalDeflectionIndication';
import { SDSimvars } from '../../../SDSimvarPublisher';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

export enum ElevatorSide {
  Left = 'left',
  Right = 'right',
}

export enum ElevatorPosition {
  Inboard = 'Inner',
  Outboard = 'Outer',
}

interface ElevatorProps {
  x: number;
  y: number;
  side: ElevatorSide;
  position: ElevatorPosition;
  onGround: Subscribable<boolean>;
  bus: EventBus;
}

export class Elevator extends DisplayComponent<ElevatorProps> {
  private readonly sub = this.props.bus.getSubscriber<FcdcBusBaseEvents>();

  private readonly fcdcDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_4'));

  private readonly fcdcDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_5'));

  private readonly deflectionInfoValid = Subject.create(true);

  private readonly elevatorDeflection = ConsumerSubject.create(
    this.props.bus
      .getSubscriber<SDSimvars>()
      .on(`${this.props.side}${this.props.position}ElevatorDeflection`)
      .atFrequency(10),
    0,
  );

  private readonly hydPowerSource =
    this.props.side === ElevatorSide.Left ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow;

  private readonly elecPowerSource =
    (this.props.side === ElevatorSide.Left && this.props.position === ElevatorPosition.Outboard) ||
    (this.props.side === ElevatorSide.Right && this.props.position === ElevatorPosition.Inboard)
      ? ElecPowerSource.AcEha
      : ElecPowerSource.AcEss;

  private readonly hydPowerAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`${this.hydPowerSource}PressureSwitch`),
    false,
  );

  private readonly elecPowerAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`${this.elecPowerSource}Powered`),
    false,
  );

  private readonly failAvailBit1: number;

  private readonly failAvailBit2: number;

  private readonly powerAvail = this.fcdcDiscreteWord5.map(
    (word) => word.bitValue(this.failAvailBit1) || word.bitValue(this.failAvailBit2),
  );

  private readonly actuator1Failed = this.fcdcDiscreteWord4.map((word) => word.bitValueOr(this.failAvailBit1, false));

  private readonly actuator2Failed = this.fcdcDiscreteWord4.map((word) => word.bitValueOr(this.failAvailBit2, false));

  constructor(props: ElevatorProps) {
    super(props);

    let failAvailBit = this.props.side === ElevatorSide.Left ? 11 : 17;
    if (this.props.position == ElevatorPosition.Outboard) {
      failAvailBit += 2;
    }

    this.failAvailBit1 = failAvailBit;
    this.failAvailBit2 = failAvailBit + 1;
  }

  render() {
    let actuatorIndicationX: number;
    if (
      (this.props.side === ElevatorSide.Left && this.props.position === ElevatorPosition.Outboard) ||
      (this.props.side === ElevatorSide.Right && this.props.position === ElevatorPosition.Inboard)
    ) {
      actuatorIndicationX = -13;
    } else {
      actuatorIndicationX = -2;
    }

    return (
      <g
        id={`elevator-${this.props.side}-${this.props.position}`}
        transform={`translate(${this.props.x} ${this.props.y})`}
      >
        <VerticalDeflectionIndication
          powerAvail={this.powerAvail}
          deflectionInfoValid={this.deflectionInfoValid}
          deflection={this.elevatorDeflection.map((elevatorDeflection) => elevatorDeflection * MIN_VERTICAL_DEFLECTION)}
          onGround={this.props.onGround}
        />

        <ActuatorIndication
          x={actuatorIndicationX}
          y={131}
          type={ActuatorType.Conventional}
          powerSource={this.hydPowerSource}
          powerSourceAvailable={this.hydPowerAvailable}
          powerSourceInfoAvailable={Subject.create(true)}
          actuatorFailed={this.actuator1Failed}
        />
        <ActuatorIndication
          x={actuatorIndicationX}
          y={161}
          type={ActuatorType.EHA}
          powerSource={this.elecPowerSource}
          powerSourceAvailable={this.elecPowerAvailable}
          powerSourceInfoAvailable={Subject.create(true)}
          actuatorFailed={this.actuator2Failed}
        />
      </g>
    );
  }
}
