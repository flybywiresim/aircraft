import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, Subject, Subscribable } from '@microsoft/msfs-sdk';
import { EbhaActuatorIndication, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { HORIZONTAL_MAX_DEFLECTION, HorizontalDeflectionIndication } from './HorizontalDeflectionIndicator';
import { SDSimvars } from '../../../SDSimvarPublisher';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

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
  private readonly sub = this.props.bus.getSubscriber<FcdcBusBaseEvents>();

  private readonly fcdcDiscreteWord6 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_6'));

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

  private readonly failHydBit1: number;

  private readonly failElecBit1: number;

  private readonly failHydBit2: number;

  private readonly failElecBit2: number;

  private readonly availBit1: number;

  private readonly availBit2: number;

  private readonly powerAvail = this.fcdcDiscreteWord6.map(
    (word) => word.bitValue(this.availBit1) || word.bitValue(this.availBit2),
  );

  private readonly actuator1Failed = this.fcdcDiscreteWord6.map((word) => word.bitValueOr(this.failHydBit1, false));

  private readonly actuator1ElecFailed = this.fcdcDiscreteWord6.map((word) =>
    word.bitValueOr(this.failElecBit1, false),
  );

  private readonly actuator2Failed = this.fcdcDiscreteWord6.map((word) => word.bitValueOr(this.failHydBit2, false));

  private readonly actuator2ElecFailed = this.fcdcDiscreteWord6.map((word) =>
    word.bitValueOr(this.failElecBit2, false),
  );

  constructor(props: RudderProps) {
    super(props);

    const availBit = this.props.position === RudderPosition.Upper ? 25 : 27;

    this.availBit1 = availBit;
    this.availBit2 = availBit + 1;

    const failBit = this.props.position === RudderPosition.Upper ? 11 : 15;

    this.failHydBit1 = failBit;
    this.failHydBit2 = failBit + 1;
    this.failElecBit1 = failBit + 2;
    this.failElecBit2 = failBit + 3;
  }

  render() {
    return (
      <g id={`rudder-${this.props.position}`} transform={`translate(${this.props.x} ${this.props.y})`}>
        <HorizontalDeflectionIndication
          powerAvail={this.powerAvail}
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
          hydPowerInfoAvailable={Subject.create(true)}
          elecPowerAvailable={this.elecAcEssAvailable}
          elecPowerInfoAvailable={Subject.create(true)}
          hydActuatorFailed={this.actuator1Failed}
          elecActuatorFailed={this.actuator1ElecFailed}
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
          hydPowerInfoAvailable={Subject.create(true)}
          elecPowerAvailable={
            this.props.position === RudderPosition.Upper ? this.elecAcEhaAvailable : this.elecAc1Available
          }
          elecPowerInfoAvailable={Subject.create(true)}
          hydActuatorFailed={this.actuator2Failed}
          elecActuatorFailed={this.actuator2ElecFailed}
        />
      </g>
    );
  }
}
