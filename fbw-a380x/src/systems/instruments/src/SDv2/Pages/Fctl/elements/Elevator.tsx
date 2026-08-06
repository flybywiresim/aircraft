import { DisplayComponent, EventBus, FSComponent, Subscribable } from '@microsoft/msfs-sdk';
import {
  ActuatorIndication,
  ActuatorType,
  ElecPowerSource,
  getFcdcBitForPowerSource,
  getFcdcBitForPowerSourceInfoAvail,
  HydraulicPowerSource,
} from './ActuatorIndication';
import { VerticalDeflectionIndication } from './VerticalDeflectionIndication';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

export enum ElevatorSide {
  Left = 'left',
  Right = 'right',
}

export enum ElevatorPosition {
  Inboard = 'inner',
  Outboard = 'outer',
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

  private readonly fcdcDiscreteWord12 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_12'));

  private readonly fcdcElevatorPosition = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_${this.props.side}_${this.props.position}_elevator_position_deg`),
  );

  private readonly deflectionInfoValid = this.fcdcElevatorPosition.map((word) => !word.isInvalid());

  private readonly hydPowerSource =
    this.props.side === ElevatorSide.Left ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow;

  private readonly elecPowerSource =
    (this.props.side === ElevatorSide.Left && this.props.position === ElevatorPosition.Outboard) ||
    (this.props.side === ElevatorSide.Right && this.props.position === ElevatorPosition.Inboard)
      ? ElecPowerSource.AcEha
      : ElecPowerSource.AcEss;

  private readonly powerSource1Avail = this.fcdcDiscreteWord12.map((word) =>
    word.bitValue(getFcdcBitForPowerSource(this.hydPowerSource)),
  );

  private readonly powerSource1InfoAvail = this.fcdcDiscreteWord12.map((word) =>
    word.bitValueOr(getFcdcBitForPowerSourceInfoAvail(this.hydPowerSource), false),
  );

  private readonly powerSource2Avail = this.fcdcDiscreteWord12.map((word) =>
    word.bitValue(getFcdcBitForPowerSource(this.elecPowerSource)),
  );

  private readonly powerSource2InfoAvail = this.fcdcDiscreteWord12.map((word) =>
    word.bitValueOr(getFcdcBitForPowerSourceInfoAvail(this.elecPowerSource), false),
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
          deflection={this.fcdcElevatorPosition.map((elevatorDeflection) => elevatorDeflection.value)}
          onGround={this.props.onGround}
        />

        <ActuatorIndication
          x={actuatorIndicationX}
          y={131}
          type={ActuatorType.Conventional}
          powerSource={this.hydPowerSource}
          powerSourceAvailable={this.powerSource1Avail}
          powerSourceInfoAvailable={this.powerSource1InfoAvail}
          actuatorFailed={this.actuator1Failed}
        />
        <ActuatorIndication
          x={actuatorIndicationX}
          y={161}
          type={ActuatorType.EHA}
          powerSource={this.elecPowerSource}
          powerSourceAvailable={this.powerSource2Avail}
          powerSourceInfoAvailable={this.powerSource2InfoAvail}
          actuatorFailed={this.actuator2Failed}
        />
      </g>
    );
  }
}
