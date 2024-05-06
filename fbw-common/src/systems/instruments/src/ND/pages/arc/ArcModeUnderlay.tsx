// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';

import { MathUtils } from '@flybywiresim/fbw-sdk';

import { GenericFcuEvents } from '../../types/GenericFcuEvents';
import { GenericTcasEvents } from '../../types/GenericTcasEvents';

export interface ArcModeOverlayProps<T extends number> {
  bus: EventBus;
  rangeValues: T[];
  ringAvailable: Subscribable<boolean>;
  ringRotation: Subscribable<number>;
}

export class ArcModeUnderlay<T extends number> extends DisplayComponent<ArcModeOverlayProps<T>> {
  private readonly rangeValue = Subject.create<number>(10);

  private readonly tcasMode = Subject.create<number>(0);

  private readonly circleSmallestRangeRef = FSComponent.createRef<SVGGElement>();

  private readonly dashedSmallestRangeRef = FSComponent.createRef<SVGGElement>();

  private readonly dashedSmallRangeRef = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericFcuEvents & GenericTcasEvents>();

    sub
      .on('ndRangeSetting')
      .whenChanged()
      .handle((value) => {
        this.rangeValue.set(this.props.rangeValues[value]);

        this.handleRingVisibilities();
      });

    sub
      .on('tcasMode')
      .whenChanged()
      .handle((value) => {
        this.tcasMode.set(value);

        this.handleRingVisibilities();
      });
  }

  private handleRingVisibilities() {
    this.circleSmallestRangeRef.instance.style.visibility =
      this.tcasMode.get() === 0 || this.rangeValue.get() > 10 ? '' : 'hidden';
    this.dashedSmallestRangeRef.instance.style.visibility =
      this.tcasMode.get() > 0 && this.rangeValue.get() === 10 ? '' : 'hidden';
    this.dashedSmallRangeRef.instance.style.visibility =
      this.tcasMode.get() > 0 && this.rangeValue.get() === 20 ? '' : 'hidden';
  }

  render(): VNode | null {
    return (
      <>
        <defs>
          <clipPath id="arc-mode-map-clip">
            <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312" />
          </clipPath>
          <clipPath id="arc-mode-wx-terr-clip">
            <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L0,625 L0,312" />
          </clipPath>
          <clipPath id="arc-mode-tcas-clip">
            <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312" />
          </clipPath>
          <clipPath id="arc-mode-overlay-clip-4">
            <path d="m 6 0 h 756 v 768 h -756 z" />
          </clipPath>
          <clipPath id="arc-mode-overlay-clip-3">
            <path d="m 0 564 l 384 145 l 384 -145 v -564 h -768 z" />
          </clipPath>
          <clipPath id="arc-mode-overlay-clip-2">
            <path d="m 0 532 l 384 155 l 384 -146 v -512 h -768 z" />
          </clipPath>
          <clipPath id="arc-mode-overlay-clip-1">
            <path d="m 0 519 l 384 145 l 384 -86 v -580 h -768 z" />
          </clipPath>
        </defs>

        {/* C = 384,620 */}
        <g transform="rotateX(0deg)" stroke="white" stroke-width={2} fill="none">
          <g clip-path="url(#arc-mode-overlay-clip-4)">
            <g
              transform={this.props.ringRotation.map(
                (rotation) => `rotate(${MathUtils.diffAngle(rotation, 60).toFixed(2)} 384 620)`,
              )}
            >
              <ArcModeOverlayHeadingRing isAvailable={this.props.ringAvailable} />
            </g>
          </g>

          {/* R = 369 */}
          <path
            d="M15,620a369,369 0 1,0 738,0a369,369 0 1,0 -738,0"
            class={this.props.ringAvailable.map((v) => (v ? 'White' : 'Red'))}
            stroke-dasharray="15 10.5"
            stroke-dashoffset="15"
            clip-path="url(#arc-mode-overlay-clip-3)"
          />
          <text x={58} y={482} class="Cyan FontSmallest">
            {this.rangeValue.map((value) => (value / 4) * 3)}
          </text>
          <text x={709} y={482} class="Cyan FontSmallest EndAlign">
            {this.rangeValue.map((value) => (value / 4) * 3)}
          </text>

          {/* R = 246 */}
          <path
            d="M138,620a246,246 0 1,0 492,0a246,246 0 1,0 -492,00"
            class={this.props.ringAvailable.map((v) => (v ? 'White' : 'Red'))}
            stroke-dasharray="15 10"
            stroke-dashoffset="-6"
            clip-path="url(#arc-mode-overlay-clip-2)"
          />
          <text x={175} y={528} class="Cyan FontSmallest">
            {this.rangeValue.map((value) => (value / 4) * 2)}
          </text>
          <text x={592} y={528} class="Cyan FontSmallest EndAlign">
            {this.rangeValue.map((value) => (value / 4) * 2)}
          </text>

          {/* R = 123 */}
          <g ref={this.circleSmallestRangeRef}>
            <path
              d="M261,620a123,123 0 1,0 246,0a123,123 0 1,0 -246,00"
              class={this.props.ringAvailable.map((v) => (v ? 'White' : 'Red'))}
              stroke-dasharray="15 10"
              stroke-dashoffset="-4.2"
              clip-path="url(#arc-mode-overlay-clip-1)"
            />
          </g>

          <g ref={this.dashedSmallestRangeRef}>
            <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} class="White rounded" transform="rotate(-60 384 620)" />
            <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} class="White rounded" transform="rotate(-30 384 620)" />
            <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} class="White rounded" transform="rotate(0 384 620)" />
            <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} class="White rounded" transform="rotate(30 384 620)" />
            <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} class="White rounded" transform="rotate(60 384 620)" />
          </g>

          {/* R = 62 */}
          <g ref={this.dashedSmallRangeRef}>
            <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} class="White rounded" transform="rotate(-60 384 620)" />
            <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} class="White rounded" transform="rotate(-30 384 620)" />
            <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} class="White rounded" transform="rotate(0 384 620)" />
            <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} class="White rounded" transform="rotate(30 384 620)" />
            <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} class="White rounded" transform="rotate(60 384 620)" />
          </g>
        </g>
      </>
    );
  }
}

class ArcModeOverlayHeadingRing extends DisplayComponent<{ isAvailable: Subscribable<boolean> }> {
  render(): VNode | null {
    return (
      <>
        {/* R = 492 */}
        <path
          d="M-108,620a492,492 0 1,0 984,0a492,492 0 1,0 -984,0"
          stroke-width={2}
          class={this.props.isAvailable.map((v) => (v ? 'White' : 'Red'))}
        />

        <g visibility={this.props.isAvailable.map((v) => (v ? 'visible' : 'hidden'))}>
          <g transform="rotate(-60 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              0
            </text>
          </g>
          <g transform="rotate(-55 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(-50 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              1
            </text>
          </g>
          <g transform="rotate(-45 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(-40 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              2
            </text>
          </g>
          <g transform="rotate(-35 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(-30 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              3
            </text>
          </g>
          <g transform="rotate(-25 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(-20 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              4
            </text>
          </g>
          <g transform="rotate(-15 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(-10 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              5
            </text>
          </g>
          <g transform="rotate(-5 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(0 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              6
            </text>
          </g>
          <g transform="rotate(5 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(10 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={95} text-anchor="middle" font-size={22} fill="white" stroke="none">
              7
            </text>
          </g>
          <g transform="rotate(15 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(20 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={95} text-anchor="middle" font-size={22} fill="white" stroke="none">
              8
            </text>
          </g>
          <g transform="rotate(25 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(30 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              9
            </text>
          </g>
          <g transform="rotate(35 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(40 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              10
            </text>
          </g>
          <g transform="rotate(45 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(50 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              11
            </text>
          </g>
          <g transform="rotate(55 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(60 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              12
            </text>
          </g>
          <g transform="rotate(65 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(70 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              13
            </text>
          </g>
          <g transform="rotate(75 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(80 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              14
            </text>
          </g>
          <g transform="rotate(85 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(90 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              15
            </text>
          </g>
          <g transform="rotate(95 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(100 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              16
            </text>
          </g>
          <g transform="rotate(105 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(110 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              17
            </text>
          </g>
          <g transform="rotate(115 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(120 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              18
            </text>
          </g>
          <g transform="rotate(125 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(130 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              19
            </text>
          </g>
          <g transform="rotate(135 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(140 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              20
            </text>
          </g>
          <g transform="rotate(145 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(150 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              21
            </text>
          </g>
          <g transform="rotate(155 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(160 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              22
            </text>
          </g>
          <g transform="rotate(165 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(170 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              23
            </text>
          </g>
          <g transform="rotate(175 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(180 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              24
            </text>
          </g>
          <g transform="rotate(185 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(190 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              25
            </text>
          </g>
          <g transform="rotate(195 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(200 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              26
            </text>
          </g>
          <g transform="rotate(205 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(210 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              27
            </text>
          </g>
          <g transform="rotate(215 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(220 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              28
            </text>
          </g>
          <g transform="rotate(225 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(230 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              29
            </text>
          </g>
          <g transform="rotate(235 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(240 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              30
            </text>
          </g>
          <g transform="rotate(245 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(250 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              31
            </text>
          </g>
          <g transform="rotate(255 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(260 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              32
            </text>
          </g>
          <g transform="rotate(265 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(270 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={34} fill="white" stroke="none">
              33
            </text>
          </g>
          <g transform="rotate(275 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(280 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              34
            </text>
          </g>
          <g transform="rotate(285 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
          <g transform="rotate(290 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} stroke-width={2} />

            <text x={384} y={91} text-anchor="middle" font-size={22} fill="white" stroke="none">
              35
            </text>
          </g>
          <g transform="rotate(295 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} stroke-width={2} />
          </g>
        </g>
      </>
    );
  }
}
