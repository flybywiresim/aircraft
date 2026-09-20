import { DisplayComponent, EventBus, FSComponent, Subscribable } from '@microsoft/msfs-sdk';
import { EbhaActuatorIndication, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { HorizontalDeflectionIndication } from './HorizontalDeflectionIndicator';
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

  private readonly fcdcDiscreteWord12 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_12'));

  private readonly fcdcRudderPosition = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_${this.props.position}_rudder_position_deg`),
  );

  private readonly deflectionInfoValid = this.fcdcRudderPosition.map((word) => !word.isInvalid());

  private readonly hydGreenAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(28));

  private readonly hydYellowAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(29));

  private readonly hydInfoAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValueOr(27, false));

  private readonly elecAc1Available = this.fcdcDiscreteWord12.map((word) => word.bitValue(25));

  private readonly elecAcEhaAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(26));

  private readonly elecAcEssAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(24));

  private readonly elecInfoAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValueOr(23, false));

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
          deflection={this.fcdcRudderPosition.map((rudderDeflection) => -rudderDeflection.value)}
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
          hydPowerInfoAvailable={this.hydInfoAvailable}
          elecPowerAvailable={this.elecAcEssAvailable}
          elecPowerInfoAvailable={this.elecInfoAvailable}
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
          hydPowerInfoAvailable={this.hydInfoAvailable}
          elecPowerAvailable={
            this.props.position === RudderPosition.Upper ? this.elecAcEhaAvailable : this.elecAc1Available
          }
          elecPowerInfoAvailable={this.elecInfoAvailable}
          hydActuatorFailed={this.actuator2Failed}
          elecActuatorFailed={this.actuator2ElecFailed}
        />
      </g>
    );
  }
}
