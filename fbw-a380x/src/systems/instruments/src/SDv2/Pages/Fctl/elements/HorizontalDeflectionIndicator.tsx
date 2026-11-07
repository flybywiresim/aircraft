import {
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subscribable,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { RudderPosition } from './Rudder';

const SCALE_LENGTH = 116;
const HORIZONTAL_MAX_DEFLECTION = 30;
const HORIZONTAL_MIN_DEFLECTION = -30;

interface HorizontalDeflectionIndicationProps {
  x?: number;
  y?: number;
  powerAvail: Subscribable<boolean>;
  deflectionInfoValid: Subscribable<boolean>;
  deflection: Subscribable<number>;
  maxDeflectionInfoValid: Subscribable<boolean>;
  maxDeflection: Subscribable<number>;
  position: RudderPosition;
  onGround: Subscribable<boolean>;
}

/**
 * @param deflection Surface deflection.
 * @returns Screen position in px.
 */
export function deflectionToXOffset(deflection: number): number {
  const normalizedDeflection =
    deflection > 0 ? deflection / HORIZONTAL_MAX_DEFLECTION : -deflection / HORIZONTAL_MIN_DEFLECTION;

  return (normalizedDeflection * SCALE_LENGTH) / 2;
}

export class HorizontalDeflectionIndication extends DisplayComponent<HorizontalDeflectionIndicationProps> {
  private readonly deflectionXValue = this.props.deflection.map((deflection) => deflectionToXOffset(deflection));

  private readonly maxDeflectionVisibility = MappedSubject.create(
    ([onGround, deflectionInfoValid, powerAvail]) =>
      onGround && deflectionInfoValid && powerAvail ? 'inherit' : 'hidden',
    this.props.onGround,
    this.props.deflectionInfoValid,
    this.props.powerAvail,
  );

  private rudderTravelLimOffset = this.props.maxDeflection.map((maxDeflection) => deflectionToXOffset(maxDeflection));

  private readonly rudderTravelLimVisibility = MappedSubject.create(
    ([deflectionInfoValid, powerAvail, maxDeflectionInfoValid]) =>
      deflectionInfoValid && powerAvail && maxDeflectionInfoValid ? 'inherit' : 'hidden',
    this.props.deflectionInfoValid,
    this.props.powerAvail,
    this.props.maxDeflectionInfoValid,
  );

  render() {
    return (
      <g transform={`translate(${this.props.x ?? 0} ${this.props.y ?? 0})`}>
        <path class="Grey Fill" d="m0,0 h 116 v15 h-116 z" />

        <path class="Green SW2" visibility={this.maxDeflectionVisibility} d="m-1,0 v 15 M117,0 v 15" />
        <path
          class="Green NoFill SW4 LineRound"
          visibility={this.rudderTravelLimVisibility}
          d={`M ${SCALE_LENGTH / 2},${this.props.position == RudderPosition.Lower ? 6 : 10} v ${this.props.position == RudderPosition.Lower ? 11 : -11} h 5`}
          transform={this.rudderTravelLimOffset.map((offset) => `translate(${offset} 0)`)}
        />
        <path
          class="Green NoFill SW4 LineRound"
          visibility={this.rudderTravelLimVisibility}
          d={`M ${SCALE_LENGTH / 2},${this.props.position == RudderPosition.Lower ? 6 : 10} v ${this.props.position == RudderPosition.Lower ? 11 : -11} h -5`}
          transform={this.rudderTravelLimOffset.map((offset) => `translate(${-offset} 0)`)}
        />

        <path
          class={{
            Fill: true,
            Green: this.props.powerAvail,
            Amber: this.props.powerAvail.map(SubscribableMapFunctions.not()),
          }}
          visibility={this.props.deflectionInfoValid.map((deflectionInfoValid) =>
            deflectionInfoValid ? 'inherit' : 'hidden',
          )}
          d={this.deflectionXValue.map((deflectionXValue) => `m58,0 v15 h${deflectionXValue} v-15 z`)}
        />
        {/* This is the small line in the middle of the scale, when the surface is neutral. */}
        <path
          class={{
            SW2: true,
            Green: this.props.powerAvail,
            Amber: this.props.powerAvail.map(SubscribableMapFunctions.not()),
          }}
          visibility={this.props.deflectionInfoValid.map((deflectionInfoValid) =>
            deflectionInfoValid ? 'inherit' : 'hidden',
          )}
          d="m58,0 v15"
        />

        <text
          x={49}
          y={19}
          class="Amber F28"
          visibility={this.props.deflectionInfoValid.map((deflectionInfoValid) =>
            !deflectionInfoValid ? 'inherit' : 'hidden',
          )}
        >
          X
        </text>
      </g>
    );
  }
}
