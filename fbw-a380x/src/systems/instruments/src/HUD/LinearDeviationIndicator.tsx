import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { FmsVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { Arinc429Values } from 'instruments/src/PFD/shared/ArincValueProvider';
import { ONE_DEG, ALT_TAPE_XPOS, ALT_TAPE_YPOS, HudElems } from './HUDUtils';
type LinearDeviationIndicatorProps = {
  bus: EventBus;
};

export class LinearDeviationIndicator extends DisplayComponent<LinearDeviationIndicatorProps> {
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

  private linearDevRef = FSComponent.createRef<SVGGElement>();

  private altTape = '';

  // TODO: Use ARINC value for this
  private flightPathAltitude: Feet = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getSubscriber<Arinc429Values & FmsVars & HudElems>();
    this.linearDevRef.instance.style.transform = `translate3d(${ALT_TAPE_XPOS}px, ${ALT_TAPE_YPOS}px, 0px)`;

    sub.on('altTape').handle((v) => {
      this.altTape = v.get().toString();
      this.linearDevRef.instance.style.display = `${this.altTape}`;
    });
    sub.on('altitudeAr').handle((alt) => {
      if (!alt.isNormalOperation() || !this.shouldShowLinearDeviation) {
        this.upperLinearDeviationReadoutVisibility.set('hidden');
        this.lowerLinearDeviationReadoutVisibility.set('hidden');
        this.linearDeviationDotLowerHalfVisibility.set('hidden');
        this.linearDeviationDotUpperHalfVisibility.set('hidden');
        this.linearDeviationDotVisibility.set('hidden');

        return;
      }

      const deviation = alt.value - this.flightPathAltitude;
      const pixelOffset = this.pixelOffsetFromDeviation(Math.max(Math.min(deviation, 500), -500));

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

      if (deviation > 540) {
        this.lowerLinearDeviationReadoutVisibility.set('visible');
        this.linearDeviationDotLowerHalfVisibility.set('visible');

        this.upperLinearDeviationReadoutVisibility.set('hidden');
        this.linearDeviationDotUpperHalfVisibility.set('hidden');

        this.linearDeviationDotVisibility.set('hidden');
      } else if (deviation > -500 && deviation < 500) {
        this.lowerLinearDeviationReadoutVisibility.set('hidden');
        this.linearDeviationDotLowerHalfVisibility.set('hidden');

        this.upperLinearDeviationReadoutVisibility.set('hidden');
        this.linearDeviationDotUpperHalfVisibility.set('hidden');

        this.linearDeviationDotVisibility.set('visible');
      } else if (deviation < -540) {
        this.lowerLinearDeviationReadoutVisibility.set('hidden');
        this.linearDeviationDotLowerHalfVisibility.set('hidden');

        this.upperLinearDeviationReadoutVisibility.set('visible');
        this.linearDeviationDotUpperHalfVisibility.set('visible');

        this.linearDeviationDotVisibility.set('hidden');
      }
    });

    sub
      .on('linearDeviationActive')
      .whenChanged()
      .handle((isActive) => (this.shouldShowLinearDeviation = isActive));

    sub
      .on('verticalProfileLatched')
      .whenChanged()
      .handle((s) => this.latchSymbolVisibility.set(s ? 'visible' : 'hidden'));

    sub
      .on('targetAltitude')
      .atFrequency(1000 / 60)
      .handle((targetAltitude) => {
        this.flightPathAltitude = targetAltitude;
      });
  }

  render(): VNode {
    return (
      <g id="LinearDeviationIndicator" ref={this.linearDevRef}>
        <text visibility={this.upperLinearDeviationReadoutVisibility} x="493" y="186" class="FontSmallest Green">
          {this.upperLinearDeviationReadoutText}
        </text>
        <g id="LinearDeviationDot" transform={this.componentTransform}>
          <path
            id="EntireDot"
            visibility={this.linearDeviationDotVisibility}
            d="m534.881 362.37a6.777 6.78 0 1 0 -13.554 0 6.777 6.78 0 1 0 13.554 0z"
            class="Fill Green"
          />
          <path
            id="DotUpperHalf"
            visibility={this.linearDeviationDotUpperHalfVisibility}
            d="m521.336 362.37c0.003 -3.743 3.035 -6.777 6.777 -6.777 3.741 0 6.775 3.034 6.777 6.777h-6.777z"
            class="Fill Green"
          />
          <path
            id="DotLowerHalf"
            visibility={this.linearDeviationDotLowerHalfVisibility}
            d="m521.336 362.37c0.003 3.743 3.035 6.777 6.777 6.777 3.741 0 6.775 -3.034 6.777 -6.777h-6.777z"
            class="Fill Green"
          />
          <path visibility={this.latchSymbolVisibility} d="m106.743 70.235h-2.691v4.485h2.691 " class="Magenta" />
        </g>
        <text visibility={this.lowerLinearDeviationReadoutVisibility} x="493" y="556" class="FontSmallest Green">
          {this.lowerLinearDeviationReadoutText}
        </text>
      </g>
    );
  }

  private pixelOffsetFromDeviation(deviation: number) {
    return (deviation * 183) / 500;
  }
}
