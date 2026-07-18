// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { FSComponent, LifecycleComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';

import { Arinc429RegisterSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { RopRowOansSimVars, FwcDataEvents, TawsDataEvents } from '../MsfsAvionicsCommon/providers';

interface AttitudeIndicatorWarningsProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

export class AttitudeIndicatorWarnings extends LifecycleComponent<AttitudeIndicatorWarningsProps> {
  //FIXME: Allow split logic per aircraft.
  private readonly warningGroupRef = FSComponent.createRef<SVGGElement>();
  private readonly maxBrakingRequested = Subject.create(false);

  private readonly ifWetRwyTooShortActive = Subject.create(false);

  private readonly rwyTooShortActive = Subject.create(false);

  private readonly rwyAheadActive = Subject.create(false);

  private readonly rowRopWord1 = Arinc429RegisterSubject.createEmpty();

  private readonly oansWord1 = Arinc429RegisterSubject.createEmpty();

  private readonly fwcWord126 = Arinc429RegisterSubject.createEmpty();

  private readonly gpwsWord2 = Arinc429RegisterSubject.createEmpty();

  // stall warning = stall bit && !on ground bit
  private readonly stallActive = this.fwcWord126.map((v) => v.bitValueOr(17, false) && !v.bitValue(28));

  // FIXME no source yet
  private readonly stopRudderInputActive = Subject.create(false);

  private readonly windshearActive = this.gpwsWord2.map((w) => w.bitValueOr(15, false));

  // FIXME no source yet
  private readonly wsAheadCaution = Subject.create(false);

  // FIXME no source yet
  private readonly wsAheadWarning = Subject.create(false);

  // FIXME: We should recieve the condition as from  dmc/cds so we can split it per aircraft
  private readonly maxReverseActive = MappedSubject.create(
    ([maxRmB, wetTooShort, tooShort, stall]) => maxRmB && !wetTooShort && !tooShort && !stall,
    this.maxBrakingRequested,
    this.ifWetRwyTooShortActive,
    this.rwyTooShortActive,
    this.stallActive,
  ).withLifecycle(this.defaultLifecycle);

  private readonly maxBrakingActive = MappedSubject.create(
    ([maxBraking, wetTooShort, tooShort, stall, stopRudder]) =>
      maxBraking && !wetTooShort && !tooShort && !stall && !stopRudder,
    this.maxBrakingRequested,
    this.ifWetRwyTooShortActive,
    this.rwyTooShortActive,
    this.stallActive,
    this.stopRudderInputActive,
  ).withLifecycle(this.defaultLifecycle);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FwcDataEvents & RopRowOansSimVars & TawsDataEvents>();

    sub
      .on('rowRopWord1Raw')
      .whenChanged()
      .handle((raw) => {
        this.rowRopWord1.setWord(raw);
        const rowRopWord1 = this.rowRopWord1.get();
        this.maxBrakingRequested.set(rowRopWord1.bitValueOr(11, false));
        this.ifWetRwyTooShortActive.set(rowRopWord1.bitValueOr(14, false));
        this.rwyTooShortActive.set(rowRopWord1.bitValueOr(15, false));
      });

    sub
      .on('oansWord1Raw')
      .whenChanged()
      .handle((raw) => {
        this.oansWord1.setWord(raw);
        this.rwyAheadActive.set(this.oansWord1.get().bitValueOr(11, false));
      });

    sub
      .on('fwc_discrete_word_126_1')
      .whenChanged()
      .handle((v) => {
        this.fwcWord126.setWord(v);
      });

    sub
      .on('egpws_alert_discrete_word_2_1')
      .whenChanged()
      .handle((v) => {
        this.gpwsWord2.setWord(v);
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
            display: this.maxReverseActive.map((it) => (it ? 'block' : 'none')).withLifecycle(this.defaultLifecycle),
          }}
        >
          MAX REVERSE
        </text>
        <text
          x="69"
          y="70.25"
          class="FontLarge Red MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: this.maxBrakingActive.map((it) => (it ? 'block' : 'none')).withLifecycle(this.defaultLifecycle),
          }}
        >
          MAX BRAKING
        </text>
        <text
          x="69"
          y="70.25"
          class="FontMediumSmaller Amber MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([ifWetTooShort, tooShort, stall]) => ifWetTooShort && !tooShort && !stall,
              this.ifWetRwyTooShortActive,
              this.rwyTooShortActive,
              this.stallActive,
            )
              .map((it) => (it ? 'block' : 'none'))
              .withLifecycle(this.defaultLifecycle),
          }}
        >
          IF WET:RWY TOO SHORT
        </text>
        <text
          x="69"
          y="70.25"
          class="FontLarge Red MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([rwyTooShort, stall]) => rwyTooShort && !stall,
              this.rwyTooShortActive,
              this.stallActive,
            )
              .map((it) => (it ? 'block' : 'none'))
              .withLifecycle(this.defaultLifecycle),
          }}
        >
          RWY TOO SHORT
        </text>
        <text
          x="69"
          y="78"
          class="FontLarge Red MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: this.stallActive.map((it) => (it ? 'block' : 'none')).withLifecycle(this.defaultLifecycle),
          }}
        >
          STALL
          {'\xa0\xa0\xa0'}
          STALL
        </text>
        <text
          x="69"
          y="70.25"
          class="FontLarge Red MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([stopRudder, wetTooShort, tooShort, stall]) => stopRudder && !wetTooShort && !tooShort && !stall,
              this.stopRudderInputActive,
              this.ifWetRwyTooShortActive,
              this.rwyTooShortActive,
              this.stallActive,
            )
              .map((it) => (it ? 'block' : 'none'))
              .withLifecycle(this.defaultLifecycle),
          }}
        >
          STOP RUDDER INPUT
        </text>
        <text
          x="69"
          y="78"
          class="FontLarge Red MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([windshear, maxReverse, maxBraking]) => windshear && !maxReverse && !maxBraking,
              this.windshearActive,
              this.maxReverseActive,
              this.maxBrakingActive,
            )
              .map((it) => (it ? 'block' : 'none'))
              .withLifecycle(this.defaultLifecycle),
          }}
        >
          WINDSHEAR
        </text>
        <text
          x="69"
          y="78"
          class="FontLarge Amber MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([wsCaution, wsWarning, maxReverse, maxBraking, windshear, stall]) =>
                wsCaution && !wsWarning && !maxReverse && !maxBraking && !windshear && !stall,
              this.wsAheadCaution,
              this.wsAheadWarning,
              this.maxReverseActive,
              this.maxBrakingActive,
              this.windshearActive,
              this.stallActive,
            )
              .map((it) => (it ? 'block' : 'none'))
              .withLifecycle(this.defaultLifecycle),
          }}
        >
          W/S AHEAD
        </text>
        <text
          x="69"
          y="78"
          class="FontLarge Red MiddleAlign Blink9Seconds TextOutline"
          style={{
            display: MappedSubject.create(
              ([wsAheadWarning, maxReverse, maxBraking, windshear, stall]) =>
                wsAheadWarning && !maxReverse && !maxBraking && !windshear && !stall,
              this.wsAheadWarning,
              this.maxReverseActive,
              this.maxBrakingActive,
              this.windshearActive,
              this.stallActive,
            )
              .map((it) => (it ? 'block' : 'none'))
              .withLifecycle(this.defaultLifecycle),
          }}
        >
          W/S AHEAD
        </text>
        <g
          style={{
            display: this.rwyAheadActive.map((it) => (it ? 'block' : 'none')).withLifecycle(this.defaultLifecycle),
          }}
        >
          <rect x="50" y="69" width="38" height="8" stroke="yellow" fill="black" />
          <text x="69" y="75.5" class="FontLarge Yellow MiddleAlign RwyAheadAnimation TextOutline">
            RWY AHEAD
          </text>
        </g>
      </g>
    );
  }
}
