import {
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { ActuatorIndication, ActuatorType, HydraulicPowerSource } from './ActuatorIndication';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';

interface PitchTrimProps {
  x: number;
  y: number;
  onGround: Subscribable<boolean>;
  bus: EventBus;
}

export class PitchTrim extends DisplayComponent<PitchTrimProps> {
  private readonly sub = this.props.bus.getSubscriber<FcdcBusBaseEvents>();

  private readonly fcdcDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_4'));

  private readonly fcdcDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_5'));

  private readonly fcdcDiscreteWord12 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_12'));

  private readonly fcdcThsDeflection = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_ths_position_deg'));

  private readonly deflectionInfoValid = this.fcdcThsDeflection.map((word) => !word.isInvalid());

  private readonly thsPositionSplit = this.fcdcThsDeflection.map((thsPosition) =>
    Math.abs(-thsPosition.value).toFixed(1).split('.'),
  );

  private readonly thsJam = Subject.create(false);

  private readonly hydGreenAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(28));

  private readonly hydYellowAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValue(29));

  private readonly hydInfoAvailable = this.fcdcDiscreteWord12.map((word) => word.bitValueOr(27, false));

  private readonly failAvailBit1: number;

  private readonly failAvailBit2: number;

  private readonly powerAvail = this.fcdcDiscreteWord5.map(
    (word) => word.bitValue(this.failAvailBit1) || word.bitValue(this.failAvailBit2),
  );

  private readonly actuator1Failed = this.fcdcDiscreteWord4.map((word) => word.bitValueOr(this.failAvailBit1, false));

  private readonly actuator2Failed = this.fcdcDiscreteWord4.map((word) => word.bitValueOr(this.failAvailBit2, false));

  private readonly pitchTrimValueClass = this.powerAvail.map((hydraulicAvailable) =>
    hydraulicAvailable ? 'Green F26' : 'Amber F26',
  );

  private readonly pitchTrimTitleClass = MappedSubject.create(
    ([powerAvail, thsJam]) => (powerAvail && !thsJam ? 'F22 MiddleAlign LS1 White' : 'F22 MiddleAlign LS1 Amber'),
    this.powerAvail,
    this.thsJam,
  );

  constructor(props: PitchTrimProps) {
    super(props);

    const failAvailBit = 25;

    this.failAvailBit1 = failAvailBit;
    this.failAvailBit2 = failAvailBit + 1;
  }

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
            Green: this.powerAvail,
            Amber: this.powerAvail.map(SubscribableMapFunctions.not()),
            Hide: this.deflectionInfoValid.map(SubscribableMapFunctions.not()),
          }}
          d="m-5,98 l-21,-11 v23 l21,-11 z"
          transform={this.fcdcThsDeflection.map((thsPosition) => `translate (0 ${thsPosition.value * 10})`)}
        />

        <text x={57} y={-6} class={this.pitchTrimTitleClass}>
          PITCH
        </text>
        <text x={57} y={17} class={this.pitchTrimTitleClass}>
          TRIM
        </text>

        <g visibility={this.deflectionInfoValid.map((positionInfoValid) => (positionInfoValid ? 'visible' : 'hidden'))}>
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
            visibility={this.fcdcThsDeflection.map((thsPosition) =>
              Math.abs(thsPosition.value) > 0.05 ? 'inherit' : 'hidden',
            )}
            class={this.pitchTrimValueClass}
          >
            {this.fcdcThsDeflection.map((thsPosition) => (Math.sign(-thsPosition.value) === 1 ? 'UP' : 'DN'))}
          </text>
        </g>

        <text
          x={26}
          y={68}
          visibility={this.deflectionInfoValid.map((positionInfoValid) => (!positionInfoValid ? 'visible' : 'hidden'))}
          class="Amber F28"
        >
          XX
        </text>

        <ActuatorIndication
          x={-63}
          y={24}
          type={ActuatorType.Conventional}
          powerSource={HydraulicPowerSource.Green}
          powerSourceAvailable={this.hydGreenAvailable}
          powerSourceInfoAvailable={this.hydInfoAvailable}
          actuatorFailed={this.actuator1Failed}
        />
        <ActuatorIndication
          x={-63}
          y={66}
          type={ActuatorType.Conventional}
          powerSource={HydraulicPowerSource.Yellow}
          powerSourceAvailable={this.hydYellowAvailable}
          powerSourceInfoAvailable={this.hydInfoAvailable}
          actuatorFailed={this.actuator2Failed}
        />
      </g>
    );
  }
}
