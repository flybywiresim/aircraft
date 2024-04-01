import { ConsumerSubject, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import { BrakingWarningsSimVars } from 'instruments/src/PFD/shared/BrakingWarningsPublisher';
// import { Arinc429Values } from './shared/ArincValueProvider';

interface AttitudeIndicatorWarningsProps {
    bus: ArincEventBus;
    instrument: BaseInstrument;
}

export class AttitudeIndicatorWarnings extends DisplayComponent<AttitudeIndicatorWarningsProps> {
    private warningGroupRef = FSComponent.createRef<SVGGElement>();

    private maxReverseSubject = ConsumerSubject.create(null, false);

    private maxReverseMaxBrakingSubject = ConsumerSubject.create(null, false);

    private ifWetRwyTooShortSubject = ConsumerSubject.create(null, false);

    private rwyTooShortSubject = ConsumerSubject.create(null, false);

    private rwyAheadSubject = ConsumerSubject.create(null, false);

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<BrakingWarningsSimVars>();
        this.maxReverseSubject.setConsumer(sub.on('autobrakeRopActive').whenChanged());
        this.maxReverseMaxBrakingSubject.setConsumer(sub.on('manualBrakingRopActive').whenChanged());
        this.ifWetRwyTooShortSubject.setConsumer(sub.on('rowIfWetRwyTooShort').whenChanged());
        this.rwyTooShortSubject.setConsumer(sub.on('rowRwyTooShort').whenChanged());
        this.rwyAheadSubject.setConsumer(sub.on('oansRwyAhead').whenChanged());
    }

    render(): VNode {
        return (
            <g id="WarningGroup" ref={this.warningGroupRef} style="display: block;">
                <text
                    x="69"
                    y="71.7"
                    class="FontLargest Red MiddleAlign Blink9Seconds TextOutline"
                    style={{ display: this.maxReverseSubject.map((it) => (it ? 'block' : 'none')) }}
                >
                    MAX REVERSE
                </text>
                <text
                    x="69"
                    y="71.7"
                    class="FontLargest Red MiddleAlign Blink9Seconds TextOutline"
                    style={{ display: this.maxReverseMaxBrakingSubject.map((it) => (it ? 'block' : 'none')) }}
                >
                    MAX BRAKING
                </text>
                <text
                    x="69"
                    y="79"
                    class="FontLargest Red MiddleAlign Blink9Seconds TextOutline"
                    style={{ display: this.maxReverseMaxBrakingSubject.map((it) => (it ? 'block' : 'none')) }}
                >
                    MAX REVERSE
                </text>
                <text
                    x="69"
                    y="71.7"
                    class="FontIntermediate Amber MiddleAlign Blink9Seconds TextOutline"
                    style={{ display: this.ifWetRwyTooShortSubject.map((it) => (it ? 'block' : 'none')) }}
                >
                    IF WET:RWY TOO SHORT
                </text>
                <text
                    x="69"
                    y="71.7"
                    class="FontLargest Red MiddleAlign Blink9Seconds TextOutline"
                    style={{ display: this.rwyTooShortSubject.map((it) => (it ? 'block' : 'none')) }}
                >
                    RWY TOO SHORT
                </text>
                <g style={{ display: this.rwyAheadSubject.map((it) => (it ? 'block' : 'none')) }}>
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
