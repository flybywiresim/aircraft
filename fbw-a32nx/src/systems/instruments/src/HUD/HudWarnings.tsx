// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  VNode,
  Subscription,
} from '@microsoft/msfs-sdk';
import { Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { HudElems, HudMode } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';

interface HudWarningsProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

export class HudWarnings extends DisplayComponent<HudWarningsProps> {
  private readonly subscriptions: Subscription[] = [];
  private readonly warningGroupRef = FSComponent.createRef<SVGGElement>();
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems & Arinc429Values>();
  private readonly roll = ConsumerSubject.create(this.sub.on('rollAr').whenChanged(), new Arinc429Word(0));
  private readonly vStallWarn = ConsumerSubject.create(this.sub.on('vStallWarn').whenChanged(), new Arinc429Word(0));
  private readonly airSpeed = ConsumerSubject.create(this.sub.on('speedAr').whenChanged(), new Arinc429Word(0));
  private readonly hudmode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 1);
  private readonly fcdc1DiscreteWord1 = ConsumerSubject.create(
    this.sub.on('fcdc1DiscreteWord1').whenChanged(),
    new Arinc429Word(0),
  );
  private readonly fcdc2DiscreteWord1 = ConsumerSubject.create(
    this.sub.on('fcdc2DiscreteWord1').whenChanged(),
    new Arinc429Word(0),
  );

  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);
  private readonly autoBrakeMode = ConsumerSubject.create(this.sub.on('autoBrakeMode').whenChanged(), 0);
  private readonly brakePedalInputLeft = ConsumerSubject.create(this.sub.on('brakePedalInputLeft').whenChanged(), 0);
  private readonly brakePedalInputRight = ConsumerSubject.create(this.sub.on('brakePedalInputRight').whenChanged(), 0);
  private readonly throttle2Position = ConsumerSubject.create(this.sub.on('throttle2Position').whenChanged(), 0);
  private readonly throttle1Position = ConsumerSubject.create(this.sub.on('throttle1Position').whenChanged(), 0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(
      this.roll,
      this.vStallWarn,
      this.airSpeed,
      this.hudmode,
      this.fcdc1DiscreteWord1,
      this.fcdc2DiscreteWord1,
      this.hudMode,
      this.autoBrakeMode,
      this.brakePedalInputLeft,
      this.brakePedalInputRight,
      this.throttle2Position,
      this.throttle1Position,
    );
  }

  //   The following precedence of messages is implemented right now (first line is most important message):
  //
  //   BANK BANK
  //   STALL STALL
  //   MAX REVERSE
  //   MAX BRAKING
  //

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g id="HudWarningGroup" ref={this.warningGroupRef} style="display: block;">
        <text
          x="640"
          y="551"
          class="FontLarge  Green MiddleAlign"
          style={{
            display: MappedSubject.create(([roll]) => {
              return Math.abs(roll.value) > 65;
            }, this.roll).map((it) => (it ? 'block' : 'none')),
          }}
        >
          BANK BANK
        </text>
        <text
          x="640"
          y="624"
          class="FontLarge  Green MiddleAlign"
          style={{
            display: MappedSubject.create(
              ([vStallWarn, airSpeed, fcdc1DiscreteWord1, fcdc2DiscreteWord1, hudmode]) => {
                const normalLawActive =
                  fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false);
                if (hudmode === 0) {
                  if (
                    (airSpeed.value - vStallWarn.value < 0 ||
                      vStallWarn.isFailureWarning() ||
                      vStallWarn.isNoComputedData()) &&
                    !normalLawActive // is stall  warn only  with normal law ?
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                } else {
                  return false;
                }
              },
              this.vStallWarn,
              this.airSpeed,
              this.fcdc1DiscreteWord1,
              this.fcdc2DiscreteWord1,
              this.hudmode,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          STALL STALL
        </text>

        <text
          x="640"
          y="550"
          class="FontLarge  Green MiddleAlign"
          style={{
            display: MappedSubject.create(
              ([throttle1Position, throttle2Position]) => {
                return throttle1Position < 0.1 && throttle2Position < 0.1;
              },
              this.throttle1Position,
              this.throttle2Position,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          MAX REVERSE
        </text>

        <text
          x="640"
          y="520"
          class="FontLarge  Green MiddleAlign"
          style={{
            display: MappedSubject.create(
              ([brakePedalInputLeft, brakePedalInputRight, autoBrakeMode, hudMode]) => {
                return (
                  brakePedalInputLeft > 90 &&
                  brakePedalInputRight > 90 &&
                  autoBrakeMode === 0 &&
                  hudMode === HudMode.ROLLOUT_OR_RTO
                );
              },
              this.brakePedalInputLeft,
              this.brakePedalInputRight,
              this.autoBrakeMode,
              this.hudMode,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          MAX BRAKING
        </text>
      </g>
    );
  }
}
