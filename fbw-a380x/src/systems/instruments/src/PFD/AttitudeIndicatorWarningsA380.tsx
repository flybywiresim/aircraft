import { DisplayComponent, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';
import { Arinc429RegisterSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { TawsDataEvents } from '@flybywiresim/msfs-avionics-common';

interface AttitudeIndicatorWarningsA380Props {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

export class AttitudeIndicatorWarningsA380 extends DisplayComponent<AttitudeIndicatorWarningsA380Props> {
  private readonly warningGroupRef = FSComponent.createRef<SVGGElement>();

  private readonly gpwsWord1 = Arinc429RegisterSubject.createEmpty();

  private readonly gpwsPullUpActive = this.gpwsWord1.map((w) => w.bitValueOr(12, false));

  private readonly gpwsSinkRateActive = this.gpwsWord1.map((w) => w.bitValueOr(11, false));

  private readonly gpwsDontSinkActive = this.gpwsWord1.map((w) => w.bitValueOr(14, false));

  private readonly gpwsTooLowGearActive = this.gpwsWord1.map((w) => w.bitValueOr(15, false));

  private readonly gpwsTooLowTerrainActive = this.gpwsWord1.map((w) => w.bitValueOr(17, false));

  private readonly gpwsTooLowFlapsActive = this.gpwsWord1.map((w) => w.bitValueOr(16, false));

  private readonly gpwsGlideSlopeActive = this.gpwsWord1.map((w) => w.bitValueOr(18, false));

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<TawsDataEvents>();

    sub
      .on('egpws_alert_discrete_word_1_1')
      .whenChanged()
      .handle((v) => {
        this.gpwsWord1.setWord(v);
      });
  }

  render(): VNode {
    return (
      <g id="WarningGroupA380" ref={this.warningGroupRef} style="display: block;">
        <text
          x="69"
          y="100"
          class="FontLargest Red MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(([pullUp]) => pullUp, this.gpwsPullUpActive).map((it) =>
              it ? 'block' : 'none',
            ),
          }}
        >
          PULL UP
        </text>
        <text
          x="69"
          y="100"
          class="FontLargest Amber MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([sinkRate, pullUp]) => sinkRate && !pullUp,
              this.gpwsSinkRateActive,
              this.gpwsPullUpActive,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          SINK RATE
        </text>
        <text
          x="69"
          y="100"
          class="FontLargest Amber MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([dontSink, pullUp]) => dontSink && !pullUp,
              this.gpwsDontSinkActive,
              this.gpwsPullUpActive,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          DONT SINK
        </text>
        <text
          x="69"
          y="100"
          class="FontLargest Amber MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([tooLowGear, pullUp]) => tooLowGear && !pullUp,
              this.gpwsTooLowGearActive,
              this.gpwsPullUpActive,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          TOO LOW GEAR
        </text>
        <text
          x="69"
          y="100"
          class="FontLargest Amber MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([tooLowTerrain, pullUp]) => tooLowTerrain && !pullUp,
              this.gpwsTooLowTerrainActive,
              this.gpwsPullUpActive,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          TOO LOW TERRAIN
        </text>
        <text
          x="69"
          y="100"
          class="FontLargest Amber MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([tooLowFlaps, pullUp]) => tooLowFlaps && !pullUp,
              this.gpwsTooLowFlapsActive,
              this.gpwsPullUpActive,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          TOO LOW FLAPS
        </text>
        <text
          x="69"
          y="100"
          class="FontLargest Amber MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([glideSlope, pullUp]) => glideSlope && !pullUp,
              this.gpwsGlideSlopeActive,
              this.gpwsPullUpActive,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          GLIDE SLOPE
        </text>
      </g>
    );
  }
}
