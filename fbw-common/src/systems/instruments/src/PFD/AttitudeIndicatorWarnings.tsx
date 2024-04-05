import { DisplayComponent, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';

import { Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { RopRowOansSimVars } from './RopRowOansPublisher';

interface AttitudeIndicatorWarningsProps {
    bus: ArincEventBus;
    instrument: BaseInstrument;
}

export class AttitudeIndicatorWarnings extends DisplayComponent<AttitudeIndicatorWarningsProps> {
    private readonly warningGroupRef = FSComponent.createRef<SVGGElement>();

    private readonly fwcFlightPhase = Subject.create(0);

    private readonly maxReverseActive = Subject.create(false);

    private readonly maxReverseMaxBrakingActive = Subject.create(false);

    private readonly ifWetRwyTooShortActive = Subject.create(false);

    private readonly rwyTooShortActive = Subject.create(false);

    private readonly rwyAheadActive = Subject.create(false);

    // FIXME no source yet
    private readonly stallWarning = Subject.create(false);

    private readonly stallActive = MappedSubject.create(
        ([stall, fwcFlightPhase]) => stall && [5, 6, 7].includes(fwcFlightPhase),
        this.stallWarning,
        this.fwcFlightPhase,
    );

    // FIXME no source yet
    private readonly stopRudderInputActive = Subject.create(false);

    // FIXME no source yet
    private readonly windshearActive = Subject.create(false);

    // FIXME no source yet
    private readonly wsAheadCaution = Subject.create(false);

    // FIXME no source yet
    private readonly wsAheadWarning = Subject.create(false);

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<RopRowOansSimVars>();
        sub.on('rowRopWord1Raw').whenChanged().handle((raw) => {
            const ar = new Arinc429Word(raw);

            this.maxReverseActive.set(ar.getBitValueOr(12, false));
            this.maxReverseMaxBrakingActive.set(ar.getBitValueOr(13, false));
            this.ifWetRwyTooShortActive.set(ar.getBitValueOr(14, false));
            this.rwyTooShortActive.set(ar.getBitValueOr(15, false));
        });

        sub.on('oansWord1Raw').whenChanged().handle((raw) => {
            const ar = new Arinc429Word(raw);

            this.rwyAheadActive.set(ar.getBitValueOr(11, false));
        });
    }

    render(): VNode {
        return (
            <g id="WarningGroup" ref={this.warningGroupRef} style="display: block;">
                <text
                    x="69"
                    y="78"
                    class="FontLarge Red MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([maxReverse, maxRmB, wetTooShort, tooShort, stall]) => (maxReverse || maxRmB) && !wetTooShort && !tooShort && !stall,
                            this.maxReverseActive,
                            this.maxReverseMaxBrakingActive,
                            this.ifWetRwyTooShortActive,
                            this.rwyTooShortActive,
                            this.stallActive,
                        ).map((it) => (it ? 'block' : 'none')),
                    }}
                >
                    MAX REVERSE
                </text>
                <text
                    x="69"
                    y="70.25"
                    class="FontLarge Red MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([maxBraking, wetTooShort, tooShort, stall, stopRudder]) => maxBraking && !wetTooShort && !tooShort && !stall && !stopRudder,
                            this.maxReverseMaxBrakingActive,
                            this.ifWetRwyTooShortActive,
                            this.rwyTooShortActive,
                            this.stallActive,
                            this.stopRudderInputActive,
                        ).map((it) => (it ? 'block' : 'none')),
                    }}
                >
                    MAX BRAKING
                </text>
                <text
                    x="69"
                    y="70.25"
                    class="FontIntermediate Amber MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([ifWetTooShort, tooShort, stall]) => ifWetTooShort && !tooShort && !stall,
                            this.ifWetRwyTooShortActive,
                            this.rwyTooShortActive,
                            this.stallActive,
                        ).map((it) => (it ? 'block' : 'none')),
                    }}
                >
                    IF WET:RWY TOO SHORT
                </text>
                <text
                    x="69"
                    y="70.25"
                    class="FontIntermediate Red MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([rwyTooShort, stall]) => rwyTooShort && !stall,
                            this.rwyTooShortActive,
                            this.stallActive,
                        ).map((it) => (it ? 'block' : 'none')),
                    }}
                >
                    RWY TOO SHORT
                </text>
                <text
                    x="69"
                    y="70.25"
                    class="FontLargest Red MiddleAlign Blink9Seconds TextOutline"
                    style={{ display: this.stallActive.map((it) => (it ? 'block' : 'none')) }}
                >
                    STALL
                    {'\xa0\xa0\xa0'}
                    STALL
                </text>
                <text
                    x="69"
                    y="70.25"
                    class="FontIntermediate Red MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([stopRudder, wetTooShort, tooShort, stall]) => stopRudder && !wetTooShort && !tooShort && !stall,
                            this.stopRudderInputActive,
                            this.ifWetRwyTooShortActive,
                            this.rwyTooShortActive,
                            this.stallActive,
                        ).map((it) => (it ? 'block' : 'none')),
                    }}
                >
                    STOP RUDDER INPUT
                </text>
                <text
                    x="69"
                    y="70.25"
                    class="FontIntermediate Red MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([windshear, maxReverse, maxBraking]) => windshear && !maxReverse && !maxBraking,
                            this.windshearActive,
                            this.maxReverseActive,
                            this.maxReverseMaxBrakingActive,
                        ).map((it) => (it ? 'block' : 'none')),
                    }}
                >
                    WINDSHEAR
                </text>
                <text
                    x="69"
                    y="70.25"
                    class="FontIntermediate Amber MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([wsCaution, wsWarning, maxReverse, maxBraking, windshear, stall]) => wsCaution && !wsWarning && !maxReverse && !maxBraking && !windshear && !stall,
                            this.wsAheadCaution,
                            this.wsAheadWarning,
                            this.maxReverseActive,
                            this.maxReverseMaxBrakingActive,
                            this.windshearActive,
                            this.stallActive,
                        ).map((it) => (it ? 'block' : 'none')),
                    }}
                >
                    W/S AHEAD
                </text>
                <text
                    x="69"
                    y="70.25"
                    class="FontIntermediate Red MiddleAlign Blink9Seconds TextOutline"
                    style={{
                        display: MappedSubject.create(
                            ([wsAheadWarning, maxReverse, maxBraking, windshear, stall]) => wsAheadWarning && !maxReverse && !maxBraking && !windshear && !stall,
                            this.wsAheadWarning,
                            this.maxReverseActive,
                            this.maxReverseMaxBrakingActive,
                            this.windshearActive,
                            this.stallActive,
                        ).map((it) => (it ? 'block' : 'none')),
                    }}
                >
                    W/S AHEAD
                </text>
                <g style={{ display: this.rwyAheadActive.map((it) => (it ? 'block' : 'none')) }}>
                    <rect x="50" y="69" width="38" height="8" stroke="yellow" fill="black" />
                    <text
                        x="69"
                        y="75.5"
                        class="FontLarge Yellow MiddleAlign RwyAheadAnimation TextOutline"
                    >
                        RWY AHEAD
                    </text>
                </g>
            </g>
        );
    }
}
