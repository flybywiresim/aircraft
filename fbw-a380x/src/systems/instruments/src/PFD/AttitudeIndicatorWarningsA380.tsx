import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject, SimVarPublisher, SimVarValueType, Subject, VNode } from '@microsoft/msfs-sdk';

import { ArincEventBus } from '@flybywiresim/fbw-sdk';

interface AttitudeIndicatorWarningsA380Props {
    bus: ArincEventBus;
    instrument: BaseInstrument;
}

export class AttitudeIndicatorWarningsA380 extends DisplayComponent<AttitudeIndicatorWarningsA380Props> {
    private readonly warningGroupRef = FSComponent.createRef<SVGGElement>();

    // FIXME no source yet
    private readonly gpwsPullUpActive = Subject.create(false);

    // FIXME no source yet
    private readonly gpwsSinkRateActive = Subject.create(false);

    // FIXME no source yet
    private readonly gpwsDontSinkActive = Subject.create(false);

    // FIXME no source yet
    private readonly gpwsTooLowGearActive = Subject.create(false);

    // FIXME no source yet
    private readonly gpwsTooLowTerrainActive = Subject.create(false);

    // FIXME no source yet
    private readonly gpwsTooLowFlapsActive = Subject.create(false);

    // FIXME no source yet
    private readonly gpwsGlideSlopeActive = Subject.create(false);

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <g id="WarningGroupA380" ref={this.warningGroupRef} style="display: block;">
                <text
                    x="69"
                    y="100"
                    class="FontLargest Red MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([pullUp]) => pullUp,
                            this.gpwsPullUpActive,
                        ).map((it) => (it ? 'block' : 'none')),
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
