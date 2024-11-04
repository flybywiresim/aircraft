import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { FmsVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { Arinc429Values } from 'instruments/src/PFD/shared/ArincValueProvider';

type LinearDeviationIndicatorProps = {
  bus: EventBus;
};

export class LinearDeviationIndicator extends DisplayComponent<LinearDeviationIndicatorProps> {
  private shouldShowLinearDeviation = false;

  private componentTransform = Subject.create('');

  private linearDeviationDotVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private linearDeviationDotUpperHalfVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private linearDeviationDotLowerHalfVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  // TODO: Use ARINC value for this
  private flightPathAltitude: Feet = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FmsVars>();

    sub.on('altitudeAr').handle((alt) => {
      if (!alt.isNormalOperation() || !this.shouldShowLinearDeviation) {
        this.linearDeviationDotLowerHalfVisibility.set('hidden');
        this.linearDeviationDotUpperHalfVisibility.set('hidden');
        this.linearDeviationDotVisibility.set('hidden');

        return;
      }

      const deviation = alt.value - this.flightPathAltitude;
      const pixelOffset = this.pixelOffsetFromDeviation(Math.max(Math.min(deviation, 500), -500));

      this.componentTransform.set(`translate(0 ${pixelOffset})`);

      if (deviation > 540) {
        this.linearDeviationDotLowerHalfVisibility.set('visible');
        this.linearDeviationDotUpperHalfVisibility.set('hidden');
        this.linearDeviationDotVisibility.set('hidden');
      } else if (deviation > -500 && deviation < 500) {
        this.linearDeviationDotLowerHalfVisibility.set('hidden');
        this.linearDeviationDotUpperHalfVisibility.set('hidden');
        this.linearDeviationDotVisibility.set('visible');
      } else if (deviation < -540) {
        this.linearDeviationDotLowerHalfVisibility.set('hidden');
        this.linearDeviationDotUpperHalfVisibility.set('visible');
        this.linearDeviationDotVisibility.set('hidden');
      }
    });

    sub
      .on('linearDeviationActive')
      .whenChanged()
      .handle((isActive) => (this.shouldShowLinearDeviation = isActive));

    sub
      .on('targetAltitude')
      .atFrequency(1000 / 60)
      .handle((targetAltitude) => {
        this.flightPathAltitude = targetAltitude;
      });
  }

  render(): VNode {
    return (
      <g id="LinearDeviationIndicator">
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
        </g>
      </g>
    );
  }

  private pixelOffsetFromDeviation(deviation: number) {
    return (deviation * 40.5) / 500;
  }
}
