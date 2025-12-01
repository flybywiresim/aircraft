// Copyright (c) 2024-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';

import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
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
import { FwsEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPublisher';
import { WdAbnormalSensedProcedures } from 'instruments/src/EWD/elements/WdAbnormalSensedProcedures';
import { WdAbnormalNonSensedProcedures } from 'instruments/src/EWD/elements/WdAbnormalNonSensed';

export class EngineWarningDisplay extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars & FwsEvents>();

  private readonly availChecker = new FwsEwdAvailabilityChecker(this.props.bus);

  private readonly engineStateSubs: ConsumerSubject<number>[] = [
    ConsumerSubject.create(this.sub.on('engine_state_1'), 0),
    ConsumerSubject.create(this.sub.on('engine_state_2'), 0),
    ConsumerSubject.create(this.sub.on('engine_state_3'), 0),
    ConsumerSubject.create(this.sub.on('engine_state_4'), 0),
  ];

  private readonly reverserSubs: ConsumerSubject<boolean>[] = [
    ConsumerSubject.create(this.sub.on('thrust_reverse_2'), false),
    ConsumerSubject.create(this.sub.on('thrust_reverse_3'), false),
  ];

  private readonly reverserSelected = MappedSubject.create(SubscribableMapFunctions.or(), ...this.reverserSubs);

  private readonly engSelectorPosition = ConsumerSubject.create(this.sub.on('eng_selector_position'), 0);

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

  private readonly normalChecklistsVisible = ConsumerSubject.create(this.sub.on('fws_show_normal_checklists'), false);

  private readonly abnormalSensedVisible = ConsumerSubject.create(this.sub.on('fws_show_abn_sensed'), false);

  private readonly abnormalNonSensedVisible = ConsumerSubject.create(this.sub.on('fws_show_abn_non_sensed'), false);

  private readonly enginesNormalAttentionGettingBox = ConsumerSubject.create(
    this.sub.on('fws_normal_attention_getter_eng'),
    [],
  );

  private readonly enginesAbnormalParametersAttentionGettingBox = ConsumerSubject.create(
    this.sub.on('fws_abnormal_primary_engine_parameters_attention_getter'),
    [],
  );

  // Todo: This logic should be handled by the FADEC
  private readonly engFirePb: ConsumerSubject<boolean>[] = [
    ConsumerSubject.create(this.sub.on('engine_fire_pb_1'), false),
    ConsumerSubject.create(this.sub.on('engine_fire_pb_2'), false),
    ConsumerSubject.create(this.sub.on('engine_fire_pb_3'), false),
    ConsumerSubject.create(this.sub.on('engine_fire_pb_4'), false),
  ];

  private readonly memosLimitationVisible = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.normalChecklistsVisible,
    this.abnormalSensedVisible,
    this.abnormalNonSensedVisible,
    this.availChecker.fwsFailed,
  );

  private readonly failurePendingIndicationRequested = ConsumerSubject.create(
    this.sub.on('fws_show_failure_pending'),
    false,
  );

  private readonly stsIndicationRequested = ConsumerSubject.create(this.sub.on('fws_show_sts_indication'), false);
  private readonly advIndicationRequested = ConsumerSubject.create(this.sub.on('fws_show_adv_indication'), false);

  private readonly deferredProcedures = ConsumerSubject.create(this.sub.on('fws_deferred_procedures'), []);
  private readonly stsIndicationLabel = MappedSubject.create(
    ([sts, deferred]) => (sts && deferred.length > 0 ? 'STS & DEFRD PROC' : 'STS'),
    this.stsIndicationRequested,
    this.deferredProcedures,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
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
                engineNormalAttentionGettingBox={this.enginesNormalAttentionGettingBox.map((v) => v[0])}
                engineAbnormalAttentionGettingBox={this.enginesAbnormalParametersAttentionGettingBox.map((v) => v[0])}
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
                engineNormalAttentionGettingBox={this.enginesNormalAttentionGettingBox.map((v) => v[1])}
                engineAbnormalAttentionGettingBox={this.enginesAbnormalParametersAttentionGettingBox.map((v) => v[1])}
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
                engineNormalAttentionGettingBox={this.enginesNormalAttentionGettingBox.map((v) => v[2])}
                engineAbnormalAttentionGettingBox={this.enginesAbnormalParametersAttentionGettingBox.map((v) => v[2])}
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
                engineNormalAttentionGettingBox={this.enginesNormalAttentionGettingBox.map((v) => v[3])}
                engineAbnormalAttentionGettingBox={this.enginesAbnormalParametersAttentionGettingBox.map((v) => v[3])}
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
            <WdNormalChecklists
              bus={this.props.bus}
              visible={MappedSubject.create(
                ([visible, avail]) => visible && avail,
                this.normalChecklistsVisible,
                this.availChecker.fwsAvail,
              )}
              abnormal={false}
            />
            <WdAbnormalSensedProcedures
              bus={this.props.bus}
              visible={MappedSubject.create(
                ([visible, fail]) => visible || fail,
                this.abnormalSensedVisible,
                this.availChecker.fwsFailed,
              )}
              abnormal={true}
              fwsAvail={this.availChecker.fwsAvail}
            />
            <WdAbnormalNonSensedProcedures
              bus={this.props.bus}
              visible={MappedSubject.create(
                ([visible, avail]) => visible && avail,
                this.abnormalNonSensedVisible,
                this.availChecker.fwsAvail,
              )}
              abnormal={true}
            />
            <div class="StsArea">
              <div
                class="FailurePendingBox"
                style={{
                  visibility: MappedSubject.create(
                    SubscribableMapFunctions.and(),
                    this.failurePendingIndicationRequested,
                    this.availChecker.fwsAvail,
                  ).map((s) => (s ? 'visible' : 'hidden')),
                }}
              >
                FAILURE PENDING
              </div>
              <div
                class="StsBox"
                style={{
                  visibility: MappedSubject.create(
                    SubscribableMapFunctions.and(),
                    this.stsIndicationRequested,
                    this.availChecker.fwsAvail,
                  ).map((s) => (s ? 'visible' : 'hidden')),
                }}
              >
                {this.stsIndicationLabel}
              </div>
              <div
                class="AdvBox"
                style={{
                  visibility: MappedSubject.create(
                    SubscribableMapFunctions.and(),
                    this.advIndicationRequested,
                    this.availChecker.fwsAvail,
                  ).map((s) => (s ? 'visible' : 'hidden')),
                }}
              >
                ADV
              </div>
            </div>
          </div>
        </div>
      </CdsDisplayUnit>
    );
  }
}

class FwsEwdAvailabilityChecker {
  constructor(private bus: EventBus) {}

  private readonly sub = this.bus.getSubscriber<EwdSimvars>();

  private readonly fws1IsHealthy = ConsumerSubject.create(this.sub.on('fws1_is_healthy'), true);
  private readonly fws2IsHealthy = ConsumerSubject.create(this.sub.on('fws2_is_healthy'), true);

  private readonly afdx_3_3_reachable = ConsumerSubject.create(this.sub.on('afdx_3_3_reachable'), true);
  private readonly afdx_13_13_reachable = ConsumerSubject.create(this.sub.on('afdx_13_13_reachable'), true);
  private readonly afdx_4_3_reachable = ConsumerSubject.create(this.sub.on('afdx_4_3_reachable'), true);
  private readonly afdx_14_13_reachable = ConsumerSubject.create(this.sub.on('afdx_14_13_reachable'), true);

  public readonly fwsAvail = MappedSubject.create(
    ([healthy1, healthy2, r_3_3, r_13_13, r_4_3, r_14_13]) =>
      (healthy1 && (r_3_3 || r_13_13)) || (healthy2 && (r_4_3 || r_14_13)),
    this.fws1IsHealthy,
    this.fws2IsHealthy,
    this.afdx_3_3_reachable,
    this.afdx_13_13_reachable,
    this.afdx_4_3_reachable,
    this.afdx_14_13_reachable,
  );

  public readonly fwsFailed = this.fwsAvail.map((it) => !it);
}
