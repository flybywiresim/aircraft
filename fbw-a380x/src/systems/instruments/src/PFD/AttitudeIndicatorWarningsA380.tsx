import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject, SimVarPublisher, SimVarValueType, VNode } from '@microsoft/msfs-sdk';

import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import { PfdVisualAlertSimVars } from '@flybywiresim/pfd';

export interface PfdVisualAlertSimVarsA380 {
    pullUp: boolean,
    sinkrate: boolean,
    dontSink: boolean,
    tooLowGear: boolean,
    tooLowTerrain: boolean,
    tooLowFlaps: boolean,
    glideSlope: boolean,
}

export class PfdVisualAlertPublisherA380 extends SimVarPublisher<PfdVisualAlertSimVarsA380> {
    constructor(bus: EventBus) {
        super(new Map([
            ['pullUp', { name: 'L:A32NX_GPWS_PULL_UP', type: SimVarValueType.Bool }],
            ['sinkrate', { name: 'L:A32NX_GPWS_SINK_RATE', type: SimVarValueType.Bool }],
            ['dontSink', { name: 'L:A32NX_GPWS_DONT_SINK', type: SimVarValueType.Bool }],
            ['tooLowGear', { name: 'L:A32NX_GPWS_TOO_LOW_GEAR', type: SimVarValueType.Bool }],
            ['tooLowTerrain', { name: 'L:A32NX_GPWS_TOO_LOW_TERRAIN', type: SimVarValueType.Bool }],
            ['tooLowFlaps', { name: 'L:A32NX_GPWS_TOO_LOW_FLAPS', type: SimVarValueType.Bool }],
            ['glideSlope', { name: 'L:A32NX_GPWS_GLIDE_SLOPE', type: SimVarValueType.Bool }], // TODO which modes? ARINC?
        ]), bus);
    }
}

interface AttitudeIndicatorWarningsA380Props {
    bus: ArincEventBus;
    instrument: BaseInstrument;
}

export class AttitudeIndicatorWarningsA380 extends DisplayComponent<AttitudeIndicatorWarningsA380Props> {
    private warningGroupRef = FSComponent.createRef<SVGGElement>();

    private gpwsPullUpActive = ConsumerSubject.create(null, false);

    private gpwsSinkRateActive = ConsumerSubject.create(null, false);

    private gpwsDontSinkActive = ConsumerSubject.create(null, false);

    private gpwsTooLowGearActive = ConsumerSubject.create(null, false);

    private gpwsTooLowTerrainActive = ConsumerSubject.create(null, false);

    private gpwsTooLowFlapsActive = ConsumerSubject.create(null, false);

    private gpwsGlideSlopeActive = ConsumerSubject.create(null, false);

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PfdVisualAlertSimVarsA380 & PfdVisualAlertSimVars>();
        this.gpwsPullUpActive.setConsumer(sub.on('pullUp').whenChanged());
        this.gpwsSinkRateActive.setConsumer(sub.on('sinkrate').whenChanged());
        this.gpwsDontSinkActive.setConsumer(sub.on('dontSink').whenChanged());
        this.gpwsTooLowGearActive.setConsumer(sub.on('tooLowGear').whenChanged());
        this.gpwsTooLowTerrainActive.setConsumer(sub.on('tooLowTerrain').whenChanged());
        this.gpwsTooLowFlapsActive.setConsumer(sub.on('tooLowFlaps').whenChanged());
        this.gpwsGlideSlopeActive.setConsumer(sub.on('glideSlope').whenChanged());
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
