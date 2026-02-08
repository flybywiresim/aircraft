import { ConsumerSubject, DisplayComponent, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';
import { Arinc429ConsumerSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { HudElems, HudMode } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { FcdcValueProvider } from './shared/FcdcValueProvider';

interface HudWarningsProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
  fcdcData: FcdcValueProvider;
}

export class HudWarnings extends DisplayComponent<HudWarningsProps> {
  private readonly warningGroupRef = FSComponent.createRef<SVGGElement>();
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems & Arinc429Values & FcdcValueProvider>();
  private readonly roll = Arinc429ConsumerSubject.create(this.sub.on('rollAr').whenChanged());
  private readonly vStallWarn = Arinc429ConsumerSubject.create(this.sub.on('vStallWarn').whenChanged());
  private readonly airSpeed = Arinc429ConsumerSubject.create(this.sub.on('speedAr').whenChanged());
  private readonly hudmode = ConsumerSubject.create(this.sub.on('hudMode').whenChanged(), 1);

  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);
  private readonly autoBrakeMode = ConsumerSubject.create(this.sub.on('autoBrakeMode').whenChanged(), 0);
  private readonly brakePedalInputLeft = ConsumerSubject.create(this.sub.on('brakePedalInputLeft').whenChanged(), 0);
  private readonly brakePedalInputRight = ConsumerSubject.create(this.sub.on('brakePedalInputRight').whenChanged(), 0);
  private readonly throttle2Position = ConsumerSubject.create(this.sub.on('throttle2Position').whenChanged(), 0);
  private readonly throttle3Position = ConsumerSubject.create(this.sub.on('throttle3Position').whenChanged(), 0);
  private readonly isNormalLawActive = this.props.fcdcData.fcdcDiscreteWord1.map(
    (dw) => dw.bitValue(11) && !dw.isFailureWarning(),
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  //   The following precedence of messages is implemented right now (first line is most important message):
  //
  //   BANK BANK
  //   STALL STALL  // already in AttitudeIndicatorWarnings , remove
  //   MAX REVERSE
  //   MAX BRAKING
  //

  render(): VNode {
    return (
      <g id="HudWarningGroup" ref={this.warningGroupRef} style="display: block;">
        <text
          x="640"
          y="596"
          class="FontLarge Green MiddleAlign"
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
          y="669"
          class="FontLarge Green MiddleAlign"
          style={{
            display: MappedSubject.create(
              ([vStallWarn, airSpeed, isNormalLawActive, hudmode]) => {
                if (hudmode === 0) {
                  if (
                    (airSpeed.value - vStallWarn.value < 0 ||
                      vStallWarn.isFailureWarning() ||
                      vStallWarn.isNoComputedData()) &&
                    !isNormalLawActive // is stall  warn only  with normal law ?
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
              this.isNormalLawActive,
              this.hudmode,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          STALL STALL
        </text>

        <text
          x="640"
          y="595"
          class="FontLarge Green MiddleAlign"
          style={{
            display: MappedSubject.create(
              ([throttle3Position, throttle2Position]) => {
                return throttle3Position < 0.1 && throttle2Position < 0.1;
              },
              this.throttle2Position,
              this.throttle3Position,
            ).map((it) => (it ? 'block' : 'none')),
          }}
        >
          MAX REVERSE
        </text>

        <text
          x="640"
          y="565"
          class="FontLarge Green MiddleAlign"
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
