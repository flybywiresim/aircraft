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
import { ActuatorIndication, ActuatorType, HydraulicPowerSource } from './ActuatorIndication';
import { SDSimvars } from '../../../SDSimvarPublisher';
import { MathUtils } from '@flybywiresim/fbw-sdk';

interface PitchTrimProps {
  x: number;
  y: number;
  onGround: Subscribable<boolean>;
  bus: EventBus;
}

export class PitchTrim extends DisplayComponent<PitchTrimProps> {
  private readonly positionInfoValid = Subject.create(true);

  private readonly thsPositionRadians = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`thsDeflection`).atFrequency(10),
    0,
  );

  private readonly thsPosition = this.thsPositionRadians.map(
    (thsPositionRadians) => thsPositionRadians * MathUtils.RADIANS_TO_DEGREES,
  );

  private readonly thsPositionSplit = this.thsPosition.map((thsPosition) =>
    Math.abs(thsPosition).toFixed(1).split('.'),
  );

  private readonly thsJam = Subject.create(false);

  private readonly hydGreenAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`greenPressureSwitch`),
    false,
  );

  private readonly hydYellowAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`yellowPressureSwitch`),
    false,
  );

  private readonly hydraulicAvailable = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.hydGreenAvailable,
    this.hydYellowAvailable,
  );

  private readonly pitchTrimValueClass = this.hydraulicAvailable.map((hydraulicAvailable) =>
    hydraulicAvailable ? 'Green F26' : 'Amber F26',
  );

  private readonly pitchTrimTitleClass = MappedSubject.create(
    ([hydGreenAvailable, hydYellowAvailable, thsJam]) =>
      (hydGreenAvailable || hydYellowAvailable) && !thsJam ? 'F22 MiddleAlign LS1 White' : 'F22 MiddleAlign LS1 Amber',
    this.hydGreenAvailable,
    this.hydYellowAvailable,
    this.thsJam,
  );

  render() {
    return (
      <g id="ths" transform={`translate(${this.props.x} ${this.props.y})`}>
        <path class="White SW4 LineRound" d="m0,0 v119 M-10,0 h20 M-10,118 h20 M-10,98 h20" />
        <path
          class={{
            SW2: true,
            LineRound: true,
            LineJoinRound: true,
            NoFill: true,
            Green: this.hydraulicAvailable,
            Amber: this.hydraulicAvailable.map(SubscribableMapFunctions.not()),
          }}
          d="m-5,98 l-21,-11 v23 l21,-11 z"
          transform={this.thsPosition.map((thsPosition) => `translate (0 ${-thsPosition * 10})`)}
        />

        <text x={57} y={-6} class={this.pitchTrimTitleClass}>
          PITCH
        </text>
        <text x={57} y={17} class={this.pitchTrimTitleClass}>
          TRIM
        </text>

        <g visibility={this.positionInfoValid.map((positionInfoValid) => (positionInfoValid ? 'visible' : 'hidden'))}>
          <text
            x={38}
            y={67}
            class={this.pitchTrimValueClass.map((pitchTrimValueClass) => pitchTrimValueClass + ' EndAlign')}
          >
            {this.thsPositionSplit.map((thsPositionSplit) => thsPositionSplit[0])}
          </text>
          <text x={37} y={67} class={this.pitchTrimValueClass}>
            .
          </text>
          <text x={55} y={67} class={this.pitchTrimValueClass}>
            {this.thsPositionSplit.map((thsPositionSplit) => thsPositionSplit[1])}
          </text>
          <text x={65} y={68} class="Cyan F26">
            °
          </text>
          <text
            x={82}
            y={68}
            visibility={this.thsPosition.map((thsPosition) => (Math.abs(thsPosition) > 0.05 ? 'visible' : 'hidden'))}
            class={this.pitchTrimValueClass}
          >
            {this.thsPosition.map((thsPosition) => (Math.sign(thsPosition) === 1 ? 'UP' : 'DN'))}
          </text>
        </g>

        <text
          x={26}
          y={68}
          visibility={this.positionInfoValid.map((positionInfoValid) => (!positionInfoValid ? 'visible' : 'hidden'))}
          class="Amber F26"
        >
          XX
        </text>

        <ActuatorIndication
          x={-63}
          y={24}
          type={ActuatorType.Conventional}
          powerSource={HydraulicPowerSource.Green}
          powerSourceAvailable={this.hydGreenAvailable}
        />
        <ActuatorIndication
          x={-63}
          y={66}
          type={ActuatorType.Conventional}
          powerSource={HydraulicPowerSource.Yellow}
          powerSourceAvailable={this.hydYellowAvailable}
        />
      </g>
    );
  }
}
