import { ConsumerSubject, DisplayComponent, EventBus, FSComponent } from '@microsoft/msfs-sdk';
import { ActuatorIndication, ActuatorType, ElecPowerSource, HydraulicPowerSource } from './ActuatorIndication';
import { SDSimvars } from '../../../SDSimvarPublisher';

interface SlatFlapActuatorIndicationProps {
  x: number;
  y: number;
  type: 'SLATS' | 'FLAPS';
  bus: EventBus;
}

export class SlatFlapActuatorIndication extends DisplayComponent<SlatFlapActuatorIndicationProps> {
  private readonly hydGreenAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`greenPressureSwitch`),
    false,
  );

  private readonly hydYellowAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`yellowPressureSwitch`),
    false,
  );

  private readonly elecAcEssAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`acEssPowered`),
    false,
  );

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
        />
        <ActuatorIndication
          x={53}
          y={17}
          type={ActuatorType.Conventional}
          powerSource={this.props.type === 'SLATS' ? HydraulicPowerSource.Green : HydraulicPowerSource.Yellow}
          powerSourceAvailable={this.props.type === 'SLATS' ? this.hydGreenAvailable : this.hydYellowAvailable}
        />
      </g>
    );
  }
}
