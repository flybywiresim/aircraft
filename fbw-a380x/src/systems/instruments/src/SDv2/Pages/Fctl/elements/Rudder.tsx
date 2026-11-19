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
import { EbhaActuatorIndication, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { HORIZONTAL_MAX_DEFLECTION, HorizontalDeflectionIndication } from './HorizontalDeflectionIndicator';
import { SDSimvars } from '../../../SDSimvarPublisher';

export enum RudderPosition {
  Upper = 'upper',
  Lower = 'lower',
}

interface RudderProps {
  x: number;
  y: number;
  position: RudderPosition;
  onGround: Subscribable<boolean>;
  bus: EventBus;
}

export class Rudder extends DisplayComponent<RudderProps> {
  private readonly deflectionInfoValid = Subject.create(true);

  private readonly rudderDeflection = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`${this.props.position}RudderDeflection`).atFrequency(10),
    0,
  );

  private readonly hydGreenAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`greenPressureSwitch`),
    false,
  );

  private readonly hydYellowAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`yellowPressureSwitch`),
    false,
  );

  private readonly elecAc1Available = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`ac1Powered`),
    false,
  );

  private readonly elecAcEhaAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`acEhaPowered`),
    false,
  );

  private readonly elecAcEssAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`acEssPowered`),
    false,
  );

  private readonly powerSource1Avail = MappedSubject.create(
    ([elecAcEssAvailable, hydYellowAvailable, hydGreenAvailable]) =>
      this.props.position === RudderPosition.Upper
        ? elecAcEssAvailable || hydYellowAvailable
        : elecAcEssAvailable || hydGreenAvailable,
    this.elecAcEssAvailable,
    this.hydYellowAvailable,
    this.hydGreenAvailable,
  );

  private readonly powerSource2Avail = MappedSubject.create(
    ([elecAcEhaAvailable, elecAc1Available, hydYellowAvailable, hydGreenAvailable]) =>
      this.props.position === RudderPosition.Upper
        ? elecAcEhaAvailable || hydGreenAvailable
        : elecAc1Available || hydYellowAvailable,
    this.elecAcEhaAvailable,
    this.elecAc1Available,
    this.hydYellowAvailable,
    this.hydGreenAvailable,
  );

  private readonly powerSourceAvail = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.powerSource1Avail,
    this.powerSource2Avail,
  );

  render() {
    return (
      <g id={`rudder-${this.props.position}`} transform={`translate(${this.props.x} ${this.props.y})`}>
        <HorizontalDeflectionIndication
          powerAvail={this.powerSourceAvail}
          deflectionInfoValid={this.deflectionInfoValid}
          deflection={this.rudderDeflection.map((rudderDeflection) => rudderDeflection * HORIZONTAL_MAX_DEFLECTION)}
          position={this.props.position}
          onGround={this.props.onGround}
        />

        <EbhaActuatorIndication
          x={-60}
          y={this.props.position === RudderPosition.Upper ? -39 : -2}
          hydraulicPowerSource={
            this.props.position === RudderPosition.Upper ? HydraulicPowerSource.Yellow : HydraulicPowerSource.Green
          }
          elecPowerSource={ElecPowerSource.AcEss}
          hydPowerAvailable={
            this.props.position === RudderPosition.Upper ? this.hydYellowAvailable : this.hydGreenAvailable
          }
          elecPowerAvailable={this.elecAcEssAvailable}
        />
        <EbhaActuatorIndication
          x={-60}
          y={this.props.position === RudderPosition.Upper ? -8 : 30}
          hydraulicPowerSource={
            this.props.position === RudderPosition.Upper ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow
          }
          elecPowerSource={this.props.position === RudderPosition.Upper ? ElecPowerSource.AcEha : ElecPowerSource.Ac1}
          hydPowerAvailable={
            this.props.position === RudderPosition.Upper ? this.hydGreenAvailable : this.hydYellowAvailable
          }
          elecPowerAvailable={
            this.props.position === RudderPosition.Upper ? this.elecAcEhaAvailable : this.elecAc1Available
          }
        />
      </g>
    );
  }
}
