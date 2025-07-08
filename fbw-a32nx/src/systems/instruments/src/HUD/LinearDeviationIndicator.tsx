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
import { HudElems, ALT_TAPE_YPOS, ALT_TAPE_XPOS, XWIND_TO_AIR_REF_OFFSET } from './HUDUtils';

let DisplayRange = 600;

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
      this.linearDevRef.instance.style.transform = `translate3d(${ALT_TAPE_XPOS}px, ${ALT_TAPE_YPOS + XWIND_TO_AIR_REF_OFFSET}px, 0px)`;
      this.upperLinearDevTextRef.instance.setAttribute('y', `74`);
      this.lowerLinearDevTextRef.instance.setAttribute('y', `91`);
    } else {
      DisplayRange = 600;
      this.linearDevRef.instance.style.transform = `translate3d(${ALT_TAPE_XPOS}px, ${ALT_TAPE_YPOS}px, 0px)`;
      this.upperLinearDevTextRef.instance.setAttribute('y', '42.5');
      this.lowerLinearDevTextRef.instance.setAttribute('y', '123');
    }
  }

  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & FmsVars & HEvent & HUDSimvars & HudElems>();
  private readonly altTape = ConsumerSubject.create(this.sub.on('altTape').whenChanged(), '');
  private readonly xwindAltTape = ConsumerSubject.create(this.sub.on('xWindAltTape').whenChanged(), '');
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);

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

        if (deviation > DisplayRange + 40) {
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
        } else if (deviation < -DisplayRange - 40) {
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
      <g id="LinearDeviationIndicator" transform="scale(4.25 4.25) ">
        <g ref={this.linearDevRef} display={this.isVisible}>
          <text
            visibility={this.upperLinearDeviationReadoutVisibility}
            x="108"
            y="42.5"
            ref={this.upperLinearDevTextRef}
            class="FontMediumSmaller  Green"
          >
            {this.upperLinearDeviationReadoutText}
          </text>
          <g id="LinearDeviationDot" transform={this.componentTransform}>
            <path
              id="EntireDot"
              visibility={this.linearDeviationDotVisibility}
              d="m119.26 80.796a1.511 1.5119 0 1 0-3.022 0 1.511 1.5119 0 1 0 3.022 0z"
              class="Fill Green"
            />
            <path
              id="DotUpperHalf"
              visibility={this.linearDeviationDotUpperHalfVisibility}
              d="m116.24 80.796c4.9e-4 -0.83466 0.67686-1.511 1.511-1.511 0.83418 0 1.5105 0.67635 1.511 1.511h-1.511z"
              class="Fill Green"
            />
            <path
              id="DotLowerHalf"
              visibility={this.linearDeviationDotLowerHalfVisibility}
              d="m116.24 80.796c4.9e-4 0.83465 0.67686 1.511 1.511 1.511 0.83418 0 1.5105-0.67636 1.511-1.511h-1.511z"
              class="Fill Green"
            />
            <path visibility={this.latchSymbolVisibility} d="m 119 78.3 h -3 v 5 h 3" class="Magenta" />
          </g>
          <text
            visibility={this.lowerLinearDeviationReadoutVisibility}
            x="108"
            y="123"
            ref={this.lowerLinearDevTextRef}
            class="FontMediumSmaller  Green"
          >
            {this.lowerLinearDeviationReadoutText}
          </text>
        </g>
      </g>
    );
  }

  private pixelOffsetFromDeviation(deviation: number) {
    return this.crosswindMode.get() ? (deviation * 8.5) / DisplayRange : (deviation * 40.5) / DisplayRange;
  }
}
