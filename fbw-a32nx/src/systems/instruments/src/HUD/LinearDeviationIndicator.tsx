import {
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  VNode,
  HEvent,
  ConsumerSubject,
  MappedSubject,
  Subscription,
} from '@microsoft/msfs-sdk';
import { FmsVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { Arinc429Values } from 'instruments/src/HUD/shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { HudElems, ALT_TAPE_YPOS, ALT_TAPE_XPOS, FIVE_DEG } from './HUDUtils';

let DisplayRange = 500;

type LinearDeviationIndicatorProps = {
  bus: EventBus;
};

export class LinearDeviationIndicator extends DisplayComponent<LinearDeviationIndicatorProps> {
  private readonly subscriptions: Subscription[] = [];
  private linearDevRef = FSComponent.createRef<SVGGElement>();

  private shouldShowLinearDeviation = false;

  private componentTransform = Subject.create('');

  private upperLinearDeviationReadoutText = Subject.create('00');

  private upperLinearDeviationReadoutVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private lowerLinearDeviationReadoutText = Subject.create('00');

  private lowerLinearDeviationReadoutVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private linearDeviationDotVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private linearDeviationDotUpperHalfVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private linearDeviationDotLowerHalfVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private latchSymbolVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private upperLinearDevTextRef = FSComponent.createRef<SVGTextElement>();

  private lowerLinearDevTextRef = FSComponent.createRef<SVGTextElement>();
  // TODO: Use ARINC value for this
  private flightPathAltitude: Feet = 0;

  private setPos() {
    if (this.crosswindMode.get()) {
      DisplayRange = 100;
      this.linearDevRef.instance.style.transform = `translate3d(${ALT_TAPE_XPOS}px, ${ALT_TAPE_YPOS - FIVE_DEG}px, 0px)`;
      this.upperLinearDevTextRef.instance.setAttribute('y', `315`);
      this.lowerLinearDevTextRef.instance.setAttribute('y', `390`);
    } else {
      DisplayRange = 500;
      this.linearDevRef.instance.style.transform = `translate3d(${ALT_TAPE_XPOS}px, ${ALT_TAPE_YPOS}px, 0px)`;
      this.upperLinearDevTextRef.instance.setAttribute('y', '175');
      this.lowerLinearDevTextRef.instance.setAttribute('y', '525');
    }
  }

  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & FmsVars & HEvent & HUDSimvars & HudElems>();
  private readonly altTape = ConsumerSubject.create(this.sub.on('altTape').whenChanged(), '');
  private readonly xwindAltTape = ConsumerSubject.create(this.sub.on('xWindAltTape').whenChanged(), '');
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);
  private c = 0;
  private readonly isVisible = MappedSubject.create(
    ([altTape, xwindAltTape]) => {
      if (altTape === 'block' || xwindAltTape === 'block') {
        return 'block';
      } else {
        return 'none';
      }
    },
    this.altTape,
    this.xwindAltTape,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.altTape, this.xwindAltTape);

    this.subscriptions.push(
      this.crosswindMode.sub(() => {
        this.setPos();
      }, true),
    );

    this.subscriptions.push(
      this.sub.on('altitudeAr').handle((alt) => {
        if (!alt.isNormalOperation() || !this.shouldShowLinearDeviation) {
          this.upperLinearDeviationReadoutVisibility.set('hidden');
          this.lowerLinearDeviationReadoutVisibility.set('hidden');
          this.linearDeviationDotLowerHalfVisibility.set('hidden');
          this.linearDeviationDotUpperHalfVisibility.set('hidden');
          this.linearDeviationDotVisibility.set('hidden');

          return;
        }

        const deviation = alt.value - this.flightPathAltitude;
        const pixelOffset = this.pixelOffsetFromDeviation(Math.max(Math.min(deviation, DisplayRange), -DisplayRange));

        this.componentTransform.set(`translate(0 ${pixelOffset})`);

        const linearDeviationReadoutText = Math.min(99, Math.round(Math.abs(deviation) / 100))
          .toFixed(0)
          .padStart(2, '0');

        if (this.upperLinearDeviationReadoutVisibility.get() === 'visible') {
          this.upperLinearDeviationReadoutText.set(linearDeviationReadoutText);
        }

        if (this.lowerLinearDeviationReadoutVisibility.get() === 'visible') {
          this.lowerLinearDeviationReadoutText.set(linearDeviationReadoutText);
        }

        if (deviation > DisplayRange + 6) {
          this.lowerLinearDeviationReadoutVisibility.set('visible');
          this.linearDeviationDotLowerHalfVisibility.set('visible');

          this.upperLinearDeviationReadoutVisibility.set('hidden');
          this.linearDeviationDotUpperHalfVisibility.set('hidden');

          this.linearDeviationDotVisibility.set('hidden');
        } else if (deviation > -DisplayRange && deviation < DisplayRange) {
          this.lowerLinearDeviationReadoutVisibility.set('hidden');
          this.linearDeviationDotLowerHalfVisibility.set('hidden');

          this.upperLinearDeviationReadoutVisibility.set('hidden');
          this.linearDeviationDotUpperHalfVisibility.set('hidden');

          this.linearDeviationDotVisibility.set('visible');
        } else if (deviation < -DisplayRange - 6) {
          this.lowerLinearDeviationReadoutVisibility.set('hidden');
          this.linearDeviationDotLowerHalfVisibility.set('hidden');

          this.upperLinearDeviationReadoutVisibility.set('visible');
          this.linearDeviationDotUpperHalfVisibility.set('visible');

          this.linearDeviationDotVisibility.set('hidden');
        }
      }),
    );

    this.subscriptions.push(
      this.sub
        .on('linearDeviationActive')
        .whenChanged()
        .handle((isActive) => (this.shouldShowLinearDeviation = isActive)),
    );

    this.subscriptions.push(
      this.sub
        .on('verticalProfileLatched')
        .whenChanged()
        .handle((s) => this.latchSymbolVisibility.set(s ? 'visible' : 'hidden')),
    );

    this.subscriptions.push(
      this.sub
        .on('targetAltitude')
        .atFrequency(1000 / 60)
        .handle((targetAltitude) => {
          this.flightPathAltitude = targetAltitude;
        }),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g id="LinearDeviationIndicator" transform="translate(425 128)">
        <g ref={this.linearDevRef} display={this.isVisible}>
          <text
            visibility={this.upperLinearDeviationReadoutVisibility}
            x="470"
            y="42.5"
            ref={this.upperLinearDevTextRef}
            class="FontSmall Green"
          >
            {this.upperLinearDeviationReadoutText}
          </text>
          <g id="LinearDeviationDot" transform={this.componentTransform}>
            <path
              id="EntireDot"
              visibility={this.linearDeviationDotVisibility}
              d="m506.855 343.383a6.422 6.426 0 1 0 -12.843 0 6.422 6.426 0 1 0 12.843 0z"
              class="Fill Green"
            />
            <path
              id="DotUpperHalf"
              visibility={this.linearDeviationDotUpperHalfVisibility}
              d="m494.02 343.383c0 -3.547 2.877 -6.422 6.422 -6.422 3.545 0 6.42 2.874 6.422 6.422h-6.422z"
              class="Fill Green"
            />
            <path
              id="DotLowerHalf"
              visibility={this.linearDeviationDotLowerHalfVisibility}
              d="m494.02 343.383c0 3.547 2.877 6.422 6.422 6.422 3.545 0 6.42 -2.875 6.422 -6.422h-6.422z"
              class="Fill Green"
            />
            <path visibility={this.latchSymbolVisibility} d="m505.75 332.775h-12.75v21.25h12.75" class="Magenta" />
          </g>
          <text
            visibility={this.lowerLinearDeviationReadoutVisibility}
            x="470"
            y="123"
            ref={this.lowerLinearDevTextRef}
            class="FontSmall  Green"
          >
            {this.lowerLinearDeviationReadoutText}
          </text>
        </g>
      </g>
    );
  }

  private pixelOffsetFromDeviation(deviation: number) {
    const L = this.crosswindMode.get() ? 36 : 175;
    return (deviation * L) / DisplayRange;
  }
}
