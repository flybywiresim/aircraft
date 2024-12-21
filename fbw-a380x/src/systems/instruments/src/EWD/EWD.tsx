import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';

import {
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import { N1Limit } from './elements/ThrustRatingMode';
import { EngineGauge } from 'instruments/src/EWD/elements/EngineGauge';
import { Idle } from 'instruments/src/EWD/elements/Idle';
import { BleedSupply } from 'instruments/src/EWD/elements/BleedSupply';
import { WdMemos } from 'instruments/src/EWD/elements/WdMemos';
import { WdLimitations } from 'instruments/src/EWD/elements/WdLimitations';
import { WdNormalChecklists } from 'instruments/src/EWD/elements/WdNormalChecklists';
import { FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { WdAbnormalSensedProcedures } from 'instruments/src/EWD/elements/WdAbnormalSensedProcedures';

export class EngineWarningDisplay extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly engineStateSubs: ConsumerSubject<number>[] = [
    ConsumerSubject.create(null, 0),
    ConsumerSubject.create(null, 0),
    ConsumerSubject.create(null, 0),
    ConsumerSubject.create(null, 0),
  ];

  private readonly reverserSubs: ConsumerSubject<boolean>[] = [
    ConsumerSubject.create(null, false),
    ConsumerSubject.create(null, false),
  ];

  private readonly reverserSelected = MappedSubject.create(SubscribableMapFunctions.or(), ...this.reverserSubs);

  private readonly engSelectorPosition = ConsumerSubject.create(null, 0);

  private readonly engineRunningOrIgnitionOn = MappedSubject.create(
    ([eng1, eng2, eng3, eng4, engSelectorPosition]) => {
      const isAnyEngineRunning = eng1 !== 0 || eng2 !== 0 || eng3 !== 0 || eng4 !== 0; // TODO Implement FADEC SimVars once available

      return !!(engSelectorPosition === 2 || isAnyEngineRunning);
    },
    ...this.engineStateSubs,
    this.engSelectorPosition,
  );

  private readonly n1Degraded = [
    Subject.create(false),
    Subject.create(false),
    Subject.create(false),
    Subject.create(false),
  ];

  private readonly normalChecklistsVisible = ConsumerSubject.create(null, false);

  private readonly abnormalSensedVisible = ConsumerSubject.create(null, false);

  // Todo: This logic should be handled by the FADEC
  private readonly engFirePb: ConsumerSubject<boolean>[] = [
    ConsumerSubject.create(null, false),
    ConsumerSubject.create(null, false),
    ConsumerSubject.create(null, false),
    ConsumerSubject.create(null, false),
  ];

  private readonly memosLimitationVisible = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.normalChecklistsVisible,
    this.abnormalSensedVisible,
  );

  private readonly abnormalDebugLine = ConsumerSubject.create(null, 0);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<EwdSimvars & FwsEwdEvents>();

    this.engineStateSubs[0].setConsumer(sub.on('engine_state_1').whenChanged());
    this.engineStateSubs[1].setConsumer(sub.on('engine_state_2').whenChanged());
    this.engineStateSubs[2].setConsumer(sub.on('engine_state_3').whenChanged());
    this.engineStateSubs[3].setConsumer(sub.on('engine_state_4').whenChanged());

    this.engFirePb[0].setConsumer(sub.on('engine_fire_pb_1'));
    this.engFirePb[1].setConsumer(sub.on('engine_fire_pb_2'));
    this.engFirePb[2].setConsumer(sub.on('engine_fire_pb_3'));
    this.engFirePb[3].setConsumer(sub.on('engine_fire_pb_4'));

    this.reverserSubs[0].setConsumer(sub.on('thrust_reverse_2').whenChanged());
    this.reverserSubs[1].setConsumer(sub.on('thrust_reverse_3').whenChanged());

    this.engSelectorPosition.setConsumer(sub.on('eng_selector_position').whenChanged());

    this.normalChecklistsVisible.setConsumer(sub.on('fws_show_normal_checklists').whenChanged());
    this.abnormalSensedVisible.setConsumer(sub.on('fws_show_abn_sensed').whenChanged());

    this.abnormalDebugLine.setConsumer(sub.on('abnormal_debug_line').whenChanged());
  }

  render(): VNode {
    return (
      <CdsDisplayUnit
        bus={this.props.bus}
        displayUnitId={DisplayUnitID.Ewd}
        test={Subject.create(-1)}
        failed={Subject.create(false)}
      >
        <div class="ewd-main">
          <div class="EngineDisplayArea">
            <svg class="ewd-svg" version="1.1" viewBox="0 0 768 375" xmlns="http://www.w3.org/2000/svg">
              <text x={20} y={30} class="Amber F26" visibility="hidden">
                A FLOOR
              </text>
              <N1Limit
                x={330}
                y={30}
                active={this.engineRunningOrIgnitionOn}
                hidden={this.reverserSelected}
                bus={this.props.bus}
              />
              <BleedSupply bus={this.props.bus} x={750} y={30} hidden={this.reverserSelected} />

              <EngineGauge
                bus={this.props.bus}
                x={93}
                y={126}
                engine={1}
                active={MappedSubject.create(
                  ([engineRunningOrIgnitionOn, engFirePb]) => engineRunningOrIgnitionOn && !engFirePb,
                  this.engineRunningOrIgnitionOn,
                  this.engFirePb[0],
                )}
                n1Degraded={this.n1Degraded[0]}
              />
              <EngineGauge
                bus={this.props.bus}
                x={262}
                y={126}
                engine={2}
                active={MappedSubject.create(
                  ([engineRunningOrIgnitionOn, engFirePb]) => engineRunningOrIgnitionOn && !engFirePb,
                  this.engineRunningOrIgnitionOn,
                  this.engFirePb[1],
                )}
                n1Degraded={this.n1Degraded[1]}
              />
              <EngineGauge
                bus={this.props.bus}
                x={497}
                y={126}
                engine={3}
                active={MappedSubject.create(
                  ([engineRunningOrIgnitionOn, engFirePb]) => engineRunningOrIgnitionOn && !engFirePb,
                  this.engineRunningOrIgnitionOn,
                  this.engFirePb[2],
                )}
                n1Degraded={this.n1Degraded[2]}
              />
              <EngineGauge
                bus={this.props.bus}
                x={668}
                y={126}
                engine={4}
                active={MappedSubject.create(
                  ([engineRunningOrIgnitionOn, engFirePb]) => engineRunningOrIgnitionOn && !engFirePb,
                  this.engineRunningOrIgnitionOn,
                  this.engFirePb[3],
                )}
                n1Degraded={this.n1Degraded[3]}
              />

              <Idle bus={this.props.bus} x={386} y={90} />
              <text x={386} y={121} class="White F26 Center">
                THR
              </text>
              <text x={386} y={142} class="Cyan F20 Center">
                %
              </text>

              {/* N1 */}

              <text x={386} y={220} class="White F26 Center">
                N1
              </text>
              <text x={386} y={243} class="Cyan F20 Center">
                %
              </text>

              <path
                class={MappedSubject.create(
                  ([eng1N1Degraded, eng2N1Degraded, engineRunningOrIgnitionOn]) =>
                    eng1N1Degraded || eng2N1Degraded || !engineRunningOrIgnitionOn
                      ? 'LightGreyLine Hide'
                      : 'LightGreyLine Show',
                  this.n1Degraded[0],
                  this.n1Degraded[1],
                  this.engineRunningOrIgnitionOn,
                )}
                d={'m 171 228 l 24 -2'}
              />
              <path
                class={MappedSubject.create(
                  ([eng2N1Degraded, engineRunningOrIgnitionOn]) =>
                    eng2N1Degraded || !engineRunningOrIgnitionOn ? 'LightGreyLine Hide' : 'LightGreyLine Show',
                  this.n1Degraded[1],
                  this.engineRunningOrIgnitionOn,
                )}
                d={'m 335 216 l 20 -2'}
              />
              <path
                class={MappedSubject.create(
                  ([eng3N1Degraded, engineRunningOrIgnitionOn]) =>
                    eng3N1Degraded || !engineRunningOrIgnitionOn ? 'LightGreyLine Hide' : 'LightGreyLine Show',
                  this.n1Degraded[2],
                  this.engineRunningOrIgnitionOn,
                )}
                d={'m 416 216 l 20 2'}
              />
              <path
                class={MappedSubject.create(
                  ([eng3N1Degraded, eng4N1Degraded, engineRunningOrIgnitionOn]) =>
                    eng3N1Degraded || eng4N1Degraded || !engineRunningOrIgnitionOn
                      ? 'LightGreyLine Hide'
                      : 'LightGreyLine Show',
                  this.n1Degraded[2],
                  this.n1Degraded[3],
                  this.engineRunningOrIgnitionOn,
                )}
                d={'m 576 226 l 24 2'}
              />

              {/* EGT */}

              <text x={384} y={316} class="White F26 Center">
                EGT
              </text>
              <text x={384} y={339} class="Cyan F20 Center">
                &deg;C
              </text>
            </svg>
          </div>
          <div class="WarningDisplayArea">
            <WdLimitations bus={this.props.bus} visible={this.memosLimitationVisible} />
            <WdMemos bus={this.props.bus} visible={this.memosLimitationVisible} />
            <WdNormalChecklists bus={this.props.bus} visible={this.normalChecklistsVisible} abnormal={false} />
            <WdAbnormalSensedProcedures bus={this.props.bus} visible={this.abnormalSensedVisible} abnormal={true} />
            <div class="StsArea" />
            {/* Reserved for STS */}
          </div>
        </div>
      </CdsDisplayUnit>
    );
  }
}
