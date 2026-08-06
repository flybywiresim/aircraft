import { DisplayComponent, EventBus, FSComponent, Subject } from '@microsoft/msfs-sdk';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

interface SlatFlapActuatorIndicationProps {
  x: number;
  y: number;
  type: 'SLATS' | 'FLAPS';
  bus: EventBus;
}

export class SlatFlapActuatorIndication extends DisplayComponent<SlatFlapActuatorIndicationProps> {
  private readonly sub = this.props.bus.getSubscriber<FcdcBusBaseEvents>();

  private readonly fcdcDiscreteWord12 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_12'));

  private readonly hydGreenAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(28));

  private readonly hydYellowAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(29));

  private readonly hydInfoAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValueOr(27, false));

  private readonly elecAcEssAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(24));

  private readonly elecInfoAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValueOr(23, false));

  render() {
    return (
      <g id={`${this.props.type}-actuators`} transform={`translate(${this.props.x} ${this.props.y})`}>
        <path class="White SW1 LineRound" d="m10,0 h -10 v 52 h98 v-52 h-10" />

        <text x={13} y={10} class="F23 White">
          {this.props.type}
        </text>

        <ActuatorIndication
          x={19}
          y={17}
          type={this.props.type === 'SLATS' ? ActuatorType.EHA : ActuatorType.Conventional}
          powerSource={this.props.type === 'SLATS' ? ElecPowerSource.AcEss : HydraulicPowerSource.Green}
          powerSourceAvailable={this.props.type === 'SLATS' ? this.elecAcEssAvailable : this.hydGreenAvailable}
          powerSourceInfoAvailable={this.props.type === 'SLATS' ? this.elecInfoAvailable : this.hydInfoAvailable}
          actuatorFailed={Subject.create(false)}
        />
        <ActuatorIndication
          x={53}
          y={17}
          type={ActuatorType.Conventional}
          powerSource={this.props.type === 'SLATS' ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow}
          powerSourceAvailable={this.props.type === 'SLATS' ? this.hydGreenAvailable : this.hydYellowAvailable}
          powerSourceInfoAvailable={this.hydInfoAvailable}
          actuatorFailed={Subject.create(false)}
        />
      </g>
    );
  }
}
