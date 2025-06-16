import { ConsumerSubject, DisplayComponent, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { HudElems, HudMode } from './HUDUtils';

interface HudWarningsProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

export class HudWarnings extends DisplayComponent<HudWarningsProps> {
  private readonly warningGroupRef = FSComponent.createRef<SVGGElement>();
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), Subject.create(0));
  private readonly autoBrakeMode = ConsumerSubject.create(this.sub.on('autoBrakeMode').whenChanged(), 0);
  private readonly brakePedalInputLeft = ConsumerSubject.create(this.sub.on('brakePedalInputLeft').whenChanged(), 0);
  private readonly brakePedalInputRight = ConsumerSubject.create(this.sub.on('brakePedalInputRight').whenChanged(), 0);
  private readonly throttle2Position = ConsumerSubject.create(this.sub.on('throttle2Position').whenChanged(), 0);
  private readonly throttle3Position = ConsumerSubject.create(this.sub.on('throttle3Position').whenChanged(), 0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    // sub
    //   .on('egpws_alert_discrete_word_1_1')
    //   .whenChanged()
    //   .handle((v) => {
    //     this.gpwsWord1.setWord(v);
    //   });
  }

  /** The following precedence of messages is implemented right now (first line is most important message):
   * MAX REVERSE
   * MAX BRAKING
   */

  render(): VNode {
    return (
      <g id="HudWarningGroup" ref={this.warningGroupRef} style="display: block;">
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
                  hudMode.get() === HudMode.ROLLOUT_OR_RTO
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
