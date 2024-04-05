import { DisplayComponent, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';

import { Arinc429Register, Arinc429RegisterSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { RopRowOansSimVars } from './RopRowOansPublisher';

interface AttitudeIndicatorWarningsProps {
    bus: ArincEventBus;
    instrument: BaseInstrument;
}

export class AttitudeIndicatorWarnings extends DisplayComponent<AttitudeIndicatorWarningsProps> {
    private warningGroupRef = FSComponent.createRef<SVGGElement>();

    private readonly rowRopWord1 = Arinc429RegisterSubject.createEmpty();

    private readonly oansWord1 = Arinc429RegisterSubject.createEmpty();

    private fwcFlightPhase = Subject.create(0);

    private maxReverseActive = Subject.create(false);

    private maxReverseMaxBrakingActive = Subject.create(false);

    private ifWetRwyTooShortActive = Subject.create(false);

    private rwyTooShortActive = Subject.create(false);

    private rwyAheadActive = Subject.create(false);

    // FIXME no source yet
    private stallWarning = Subject.create(false);

    private stallActive = MappedSubject.create(
        ([stall, fwcFlightPhase]) => stall && [5, 6, 7].includes(fwcFlightPhase),
        this.stallWarning,
        this.fwcFlightPhase,
    );

    // FIXME no source yet
    private stopRudderInputActive = Subject.create(false);

    // FIXME no source yet
    private windshearActive = Subject.create(false);

    // FIXME no source yet
    private wsAheadCaution = Subject.create(false);

    // FIXME no source yet
    private wsAheadWarning = Subject.create(false);

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<RopRowOansSimVars>();
        sub.on('rowRopWord1Raw').whenChanged().handle((raw) => {
            const ar = Arinc429Register.empty();
            ar.set(raw);

            if (ar.isNormalOperation()) {
                this.maxReverseActive.set(ar.bitValue(12));
                this.maxReverseMaxBrakingActive.set(ar.bitValue(13));
                this.ifWetRwyTooShortActive.set(ar.bitValue(14));
                this.rwyTooShortActive.set(ar.bitValue(15));
            } else {
                this.maxReverseActive.set(false);
                this.maxReverseMaxBrakingActive.set(false);
                this.ifWetRwyTooShortActive.set(false);
                this.rwyTooShortActive.set(false);
            }
        });

        sub.on('oansWord1Raw').whenChanged().handle((raw) => {
            const ar = Arinc429Register.empty();
            ar.set(raw);

            if (ar.isNormalOperation()) {
                this.rwyAheadActive.set(ar.bitValue(11));
            } else {
                this.rwyAheadActive.set(false);
            }
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
