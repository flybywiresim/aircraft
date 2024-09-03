// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Arinc429WordData, MathUtils } from '@flybywiresim/fbw-sdk';
import { DisplayComponent, EventBus, FSComponent, MappedSubject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { Layer } from '../MsfsAvionicsCommon/Layer';

export interface ArcModeOverlayProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
  rotation: Subscribable<Arinc429WordData>;
  oansRange: Subscribable<number>;
  doClip: boolean;
  yOffset: number;
  airportWithinRange: Subscribable<boolean>;
  airportBearing: Subscribable<number>;
  airportIcao: Subscribable<string>;
}

export class ArcModeUnderlay extends DisplayComponent<ArcModeOverlayProps> {
  private readonly rotationValid = this.props.rotation.map((it) => it.isNormalOperation());

  private readonly rotationToAirport = MappedSubject.create(
    ([bearing, rot]) => MathUtils.diffAngle(rot.value, bearing).toFixed(2),
    this.props.airportBearing,
    this.props.rotation,
  );

  render(): VNode | null {
    return (
      <Layer x={384} y={384 - this.props.yOffset} visible={this.props.visible}>
        {/* C = 384,620 */}
        <g transform="rotateX(0deg)" class="shadow" stroke="black" stroke-linecap="round">
          <g clip-path={this.props.doClip ? 'url(#arc-mode-overlay-clip-4)' : ''}>
            <g
              transform={this.props.rotation.map(
                (rotation) => `rotate(${MathUtils.diffAngle(rotation.value, 60).toFixed(2)} 384 620)`,
              )}
            >
              <ArcModeOverlayHeadingRing isAvailable={this.rotationValid} />
            </g>
          </g>

          {/* R = 246 */}
          <path
            d="M138,620a246,246 0 1,0 492,0a246,246 0 1,0 -492,00"
            stroke-dasharray="10 6"
            clip-path="url(#arc-mode-overlay-clip-2)"
          />
        </g>

        {/* C = 384,620 */}
        <g transform="rotateX(0deg)" class="White" fill="none" stroke-width={2} stroke-linecap="round">
          <g clip-path={this.props.doClip ? 'url(#arc-mode-overlay-clip-4)' : ''}>
            <g
              transform={this.props.rotation.map(
                (rotation) => `rotate(${MathUtils.diffAngle(rotation.value, 60).toFixed(2)} 384 620)`,
              )}
            >
              <ArcModeOverlayHeadingRing isAvailable={this.rotationValid} />
            </g>
          </g>

          {/* R = 246 */}
          <path
            d="M138,620a246,246 0 1,0 492,0a246,246 0 1,0 -492,00"
            class={this.rotationValid.map((v) => (v ? 'White' : 'Red'))}
            stroke-dasharray="10 6"
            clip-path="url(#arc-mode-overlay-clip-2)"
          />
        </g>

        <g
          transform={this.rotationToAirport.map((it) => `translate(369 250) rotate(-90) rotate(${it} -370 0)`)}
          class="White"
          fill="none"
          stroke-width={3}
          stroke-linecap="round"
          visibility={this.props.airportWithinRange.map((it) => (it ? 'hidden' : 'inherit'))}
        >
          <path id="svg_5" d="m21,15l-17.33333,-13l60,0l31.66667,12l-31.66667,13l-60.33333,0l17.66667,-12z" />
          <g transform={this.rotationToAirport.map((it) => `translate(60 60) rotate(${-it + 90})`)}>
            <text text-anchor="middle" font-size={20}>
              {this.props.airportIcao}
            </text>
          </g>
        </g>
      </Layer>
    );
  }
}

class ArcModeOverlayHeadingRing extends DisplayComponent<{ isAvailable: Subscribable<boolean> }> {
  render(): VNode | null {
    return (
      <>
        {/* R = 492 */}
        <path d="M-108,620a492,492 0 1,0 984,0a492,492 0 1,0 -984,0" />

        <g visibility={this.props.isAvailable.map((v) => (v ? 'inherit' : 'hidden'))}>
          <g transform="rotate(-60 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              0
            </text>
          </g>
          <g transform="rotate(-55 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(-50 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              1
            </text>
          </g>
          <g transform="rotate(-45 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(-40 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              2
            </text>
          </g>
          <g transform="rotate(-35 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(-30 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              3
            </text>
          </g>
          <g transform="rotate(-25 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(-20 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              4
            </text>
          </g>
          <g transform="rotate(-15 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(-10 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              5
            </text>
          </g>
          <g transform="rotate(-5 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(0 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              6
            </text>
          </g>
          <g transform="rotate(5 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(10 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={95} text-anchor="middle" font-size={22}>
              7
            </text>
          </g>
          <g transform="rotate(15 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(20 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={95} text-anchor="middle" font-size={22}>
              8
            </text>
          </g>
          <g transform="rotate(25 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(30 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              9
            </text>
          </g>
          <g transform="rotate(35 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(40 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              10
            </text>
          </g>
          <g transform="rotate(45 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(50 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              11
            </text>
          </g>
          <g transform="rotate(55 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(60 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              12
            </text>
          </g>
          <g transform="rotate(65 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(70 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              13
            </text>
          </g>
          <g transform="rotate(75 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(80 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              14
            </text>
          </g>
          <g transform="rotate(85 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(90 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              15
            </text>
          </g>
          <g transform="rotate(95 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(100 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              16
            </text>
          </g>
          <g transform="rotate(105 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(110 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              17
            </text>
          </g>
          <g transform="rotate(115 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(120 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              18
            </text>
          </g>
          <g transform="rotate(125 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(130 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              19
            </text>
          </g>
          <g transform="rotate(135 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(140 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              20
            </text>
          </g>
          <g transform="rotate(145 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(150 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              21
            </text>
          </g>
          <g transform="rotate(155 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(160 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              22
            </text>
          </g>
          <g transform="rotate(165 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(170 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              23
            </text>
          </g>
          <g transform="rotate(175 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(180 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              24
            </text>
          </g>
          <g transform="rotate(185 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(190 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              25
            </text>
          </g>
          <g transform="rotate(195 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(200 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              26
            </text>
          </g>
          <g transform="rotate(205 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(210 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              27
            </text>
          </g>
          <g transform="rotate(215 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(220 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              28
            </text>
          </g>
          <g transform="rotate(225 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(230 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              29
            </text>
          </g>
          <g transform="rotate(235 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(240 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              30
            </text>
          </g>
          <g transform="rotate(245 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(250 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              31
            </text>
          </g>
          <g transform="rotate(255 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(260 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              32
            </text>
          </g>
          <g transform="rotate(265 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(270 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={34}>
              33
            </text>
          </g>
          <g transform="rotate(275 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(280 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              34
            </text>
          </g>
          <g transform="rotate(285 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
          <g transform="rotate(290 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} />

            <text x={384} y={91} text-anchor="middle" font-size={22}>
              35
            </text>
          </g>
          <g transform="rotate(295 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} />
          </g>
        </g>
      </>
    );
  }
}
