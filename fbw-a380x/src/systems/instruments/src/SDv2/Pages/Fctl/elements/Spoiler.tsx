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
import { SDSimvars } from '../../../SDSimvarPublisher';

const SCALE_HEIGHT = -35;

export enum SpoilerSide {
  Left = 'left',
  Right = 'right',
}

interface SpoilerProps {
  x: number;
  y: number;
  side: SpoilerSide;
  position: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  onGround: Subscribable<boolean>;
  bus: EventBus;
}

/**
 *
 * @param deflection Spoiler deflection
 * @param maxDeflection Maximum spoiler deflection
 * @returns Y-Offset in px
 */
export function deflectionToYOffset(deflection: number, maxDeflection: number): number {
  const normalizedDeflection = deflection / maxDeflection;

  return normalizedDeflection * SCALE_HEIGHT;
}

export class Spoiler extends DisplayComponent<SpoilerProps> {
  private readonly deflectionInfoValid = Subject.create(true);

  private readonly spoilerDeflection = ConsumerSubject.create(
    this.props.bus
      .getSubscriber<SDSimvars>()
      .on(`${this.props.side}Spoiler${this.props.position}Deflection`)
      .atFrequency(10),
    0,
  );

  private readonly hydPowerAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`greenPressureSwitch`),
    false,
  );

  private readonly elecPowerAvailable = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`acEssPowered`),
    false,
  );

  // On ground, elec motors only active if G HYD system is pressurized
  private readonly powerAvail = MappedSubject.create(
    ([hydPowerAvailable, elecPowerAvailable, onGround]) =>
      onGround ? hydPowerAvailable : hydPowerAvailable || elecPowerAvailable,
    this.hydPowerAvailable,
    this.elecPowerAvailable,
    this.props.onGround,
  );

  private readonly maxDeflectionVisible = MappedSubject.create(
    ([powerAvail, deflectionInfoValid, onGround]) =>
      onGround && deflectionInfoValid && powerAvail && this.props.position >= 3,
    this.powerAvail,
    this.deflectionInfoValid,
    this.props.onGround,
  );

  render() {
    const maxDeflection = this.props.position >= 3 ? 50 : 35;

    let yOffset: number;
    if (this.props.position <= 2) {
      yOffset = 0;
    } else if (this.props.position <= 4) {
      yOffset = -4;
    } else if (this.props.position <= 6) {
      yOffset = -8;
    } else {
      yOffset = -12;
    }

    return (
      <g
        id={`spoiler-${this.props.side}-${this.props.position}`}
        transform={`translate(${this.props.x} ${this.props.y + yOffset})`}
      >
        <path class="Grey Fill" d="m0,0 v -35 h15 v35 z" />

        {/* The max deflection line needs to be at the 45° deflection position, as this is the maximum deflection for roll spoilers.
            The 2px offset is because of the line width, the deflection indication should reach the lower border of the line. */}
        <path
          class="Green SW2"
          visibility={this.maxDeflectionVisible.map((maxDeflectionVisible) =>
            maxDeflectionVisible ? 'inherit' : 'hidden',
          )}
          d={`m0,${deflectionToYOffset(45, maxDeflection) - 2} h 15`}
        />

        <path
          class={{ Fill: true, Green: this.powerAvail, Amber: this.powerAvail.map(SubscribableMapFunctions.not()) }}
          visibility={this.deflectionInfoValid.map((deflectionInfoValid) =>
            deflectionInfoValid ? 'inherit' : 'hidden',
          )}
          d={this.spoilerDeflection.map(
            (spoilerDeflection) => `m0,0 h15 v${deflectionToYOffset(spoilerDeflection * 50, maxDeflection)} h-16 z`,
          )}
        />

        <path
          class="Amber SW4 LineRound"
          visibility={this.powerAvail.map((spoilersFailed) => (!spoilersFailed ? 'inherit' : 'hidden'))}
          d="m1,-2 v-31 M14,-2 v-31"
        />

        <text
          x={-1}
          y={0}
          class="Amber F32"
          visibility={this.deflectionInfoValid.map((deflectionInfoValid) =>
            !deflectionInfoValid ? 'inherit' : 'hidden',
          )}
        >
          X
        </text>
      </g>
    );
  }
}
