import {
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subscribable,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

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
  private readonly sub = this.props.bus.getSubscriber<FcdcBusBaseEvents>();

  private readonly fcdcDiscreteWord8 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_8'));

  private readonly fcdcSpoilerPosition = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_${this.props.side}_spoiler_${this.props.position}_position_deg`),
  );

  private readonly deflectionInfoValid = this.fcdcSpoilerPosition.map((word) => !word.isInvalid());

  private readonly availBit: number;

  private readonly powerAvail = this.fcdcDiscreteWord8.map((word) => word.bitValue(this.availBit));

  private readonly powerNotAvailLinesVisible = MappedSubject.create(
    ([powerAvail, deflectionInfoValid]) => deflectionInfoValid && !powerAvail,
    this.powerAvail,
    this.deflectionInfoValid,
  );

  private readonly maxDeflectionVisible = MappedSubject.create(
    ([powerAvail, deflectionInfoValid, onGround]) =>
      onGround && deflectionInfoValid && powerAvail && this.props.position >= 3,
    this.powerAvail,
    this.deflectionInfoValid,
    this.props.onGround,
  );

  constructor(props: SpoilerProps) {
    super(props);

    if (this.props.position < 4) {
      this.availBit = 11 + (this.props.position - 1);
    } else if (this.props.position > 6) {
      this.availBit = 14 + (this.props.position - 7);
    } else {
      // Spoilers 4,5 and 6 are PRIM-controlled and can be active on left and right side individually
      this.availBit = (this.props.side === SpoilerSide.Left ? 16 : 19) + (this.props.position - 4);
    }
  }

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
          d={this.fcdcSpoilerPosition.map(
            (spoilerDeflection) => `m0,0 h15 v${deflectionToYOffset(-spoilerDeflection.value, maxDeflection)} h-16 z`,
          )}
        />

        <path
          class="Amber SW4 LineRound"
          visibility={this.powerNotAvailLinesVisible.map((powerNotAvailLinesVisible) =>
            powerNotAvailLinesVisible ? 'inherit' : 'hidden',
          )}
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
