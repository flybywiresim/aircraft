import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { MIN_VERTICAL_DEFLECTION, VerticalDeflectionIndication } from './VerticalDeflectionIndication';
import { SDSimvars } from '../../../SDSimvarPublisher';

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

  private readonly powerAvail = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.hydPowerAvailable,
    this.elecPowerAvailable,
  );

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
        />
        <ActuatorIndication
          x={actuatorIndicationX}
          y={161}
          type={ActuatorType.EHA}
          powerSource={this.elecPowerSource}
          powerSourceAvailable={this.elecPowerAvailable}
        />
      </g>
    );
  }
}
