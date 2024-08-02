import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';

import { ConsumerSubject, DisplayComponent, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import { N1Limit } from './elements/ThrustRatingMode';
import { EWDMemo } from './elements/EWDMemo';
import { EngineGauge } from 'instruments/src/EWDv2/elements/EngineGauge';
import { Idle } from 'instruments/src/EWDv2/elements/Idle';
import { BleedSupply } from 'instruments/src/EWDv2/elements/BleedSupply';

export class EngineWarningDisplay extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly engineStateSubs: ConsumerSubject<number>[] = [
    ConsumerSubject.create(null, 0),
    ConsumerSubject.create(null, 0),
    ConsumerSubject.create(null, 0),
    ConsumerSubject.create(null, 0),
  ];

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

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<EwdSimvars>();

    this.engineStateSubs[0].setConsumer(sub.on('engine_state_1').whenChanged());
    this.engineStateSubs[1].setConsumer(sub.on('engine_state_2').whenChanged());
    this.engineStateSubs[2].setConsumer(sub.on('engine_state_3').whenChanged());
    this.engineStateSubs[3].setConsumer(sub.on('engine_state_4').whenChanged());

    this.engSelectorPosition.setConsumer(sub.on('eng_selector_position').whenChanged());
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
          <div style="display: flex; height: 375px; margin: 0px 8px 0px 8px;">
            <svg class="ewd-svg" version="1.1" viewBox="0 0 768 1024" xmlns="http://www.w3.org/2000/svg">
              <text x={20} y={30} class="Amber F26" visibility="hidden">
                A FLOOR
              </text>
              <N1Limit x={330} y={30} active={this.engineRunningOrIgnitionOn} bus={this.props.bus} />
              <BleedSupply bus={this.props.bus} x={750} y={30} />

              <EngineGauge
                bus={this.props.bus}
                x={93}
                y={126}
                engine={1}
                active={this.engineRunningOrIgnitionOn}
                n1Degraded={this.n1Degraded[0]}
              />
              <EngineGauge
                bus={this.props.bus}
                x={262}
                y={126}
                engine={2}
                active={this.engineRunningOrIgnitionOn}
                n1Degraded={this.n1Degraded[1]}
              />
              <EngineGauge
                bus={this.props.bus}
                x={497}
                y={126}
                engine={3}
                active={this.engineRunningOrIgnitionOn}
                n1Degraded={this.n1Degraded[2]}
              />
              <EngineGauge
                bus={this.props.bus}
                x={668}
                y={126}
                engine={4}
                active={this.engineRunningOrIgnitionOn}
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
                d={`m ${171} 228 l 24 -2`}
              />
              <path
                class={MappedSubject.create(
                  ([eng2N1Degraded, engineRunningOrIgnitionOn]) =>
                    eng2N1Degraded || !engineRunningOrIgnitionOn ? 'LightGreyLine Hide' : 'LightGreyLine Show',
                  this.n1Degraded[1],
                  this.engineRunningOrIgnitionOn,
                )}
                d={`m ${335} 216 l 20 -2`}
              />
              <path
                class={MappedSubject.create(
                  ([eng3N1Degraded, engineRunningOrIgnitionOn]) =>
                    eng3N1Degraded || !engineRunningOrIgnitionOn ? 'LightGreyLine Hide' : 'LightGreyLine Show',
                  this.n1Degraded[2],
                  this.engineRunningOrIgnitionOn,
                )}
                d={`m ${416} 216 l 20 2`}
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
                d={`m ${576} 226 l 24 2`}
              />

              {/* EGT */}

              <text x={384} y={316} class="White F26 Center">
                EGT
              </text>
              <text x={384} y={339} class="Cyan F20 Center">
                &deg;C
              </text>

              <path stroke="#8c8c8c" stroke-width={4} d="m 8 375 h 750" />
            </svg>
          </div>
          <div style="display: flex; height: 649px; margin: 0px 8px 0px 8px;">
            <svg class="ewd-svg" version="1.1" viewBox="0 0 768 1024" xmlns="http://www.w3.org/2000/svg">
              <EWDMemo bus={this.props.bus} />
            </svg>
          </div>
        </div>
      </CdsDisplayUnit>
    );
  }
}
