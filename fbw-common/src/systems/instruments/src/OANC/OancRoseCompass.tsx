// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Arinc429WordData, MathUtils } from '@flybywiresim/fbw-sdk';
import { FSComponent, DisplayComponent, ComponentProps, Subscribable, VNode, EventBus } from '@microsoft/msfs-sdk';
import { Layer } from '../MsfsAvionicsCommon/Layer';

export interface RoseModeOverlayProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
  rotation: Subscribable<Arinc429WordData>;
  oansRange: Subscribable<number>;

  doClip: boolean;
}

export class RoseModeUnderlay extends DisplayComponent<RoseModeOverlayProps> {
  private readonly headingValid = this.props.rotation.map((it) => it.isNormalOperation());

  private readonly ringColor = this.headingValid.map((valid) => {
    if (valid) {
      return 'White';
    }

    return 'Red';
  });

  private readonly headingRingTransform = this.props.rotation.map((heading) => {
    if (heading.isNormalOperation()) {
      return `rotate(${MathUtils.diffAngle(heading.value, 0)} 384 384)`;
    }

    return 'rotate(0 384 384)';
  });

  render(): VNode | null {
    return (
      <Layer x={384} y={384} visible={this.props.visible}>
        <g transform="rotateX(0deg)" class="shadow" stroke="black" stroke-linecap="round">
          <g clip-path="url(#rose-mode-overlay-clip)">
            <g transform={this.headingRingTransform}>
              <RoseModeOverlayHeadingRing headingValid={this.headingValid} />
            </g>
          </g>

          {/* R = 125, middle range ring */}
          <path
            d="M 509 384 A 125 125 0 0 1 259 384 M 259 384 A 125 125 180 0 1 509 384"
            stroke-dasharray="10 6"
            stroke-dashoffset="-4.2"
          />
        </g>

        {/* C = 384,384 */}
        <g transform="rotateX(0deg)" stroke-width={2} fill="none" stroke-linecap="round">
          <g class={this.ringColor}>
            <g clip-path="url(#rose-mode-overlay-clip)">
              <g transform={this.headingRingTransform}>
                <RoseModeOverlayHeadingRing headingValid={this.headingValid} />
              </g>
            </g>

            {/* R = 125, middle range ring */}
            <path
              d="M 509 384 A 125 125 0 0 1 259 384 M 259 384 A 125 125 180 0 1 509 384"
              stroke-dasharray="10 6"
              stroke-dashoffset="-4.2"
            />
          </g>

          <rect
            x={212}
            y={538}
            width={this.props.oansRange.map((rng) => ((rng / 2).toString().length === 4 ? 55 : 41))}
            height={21}
            class="BackgroundFill"
          />
          <text x={212} y={556} class="Cyan" font-size={22}>
            {this.props.oansRange.map((range) => range / 2)}
          </text>
        </g>
      </Layer>
    );
  }
}

interface RoseModeOverlayHeadingRingProps extends ComponentProps {
  headingValid: Subscribable<boolean>;
}

export class RoseModeOverlayHeadingRing extends DisplayComponent<RoseModeOverlayHeadingRingProps> {
  render(): VNode | null {
    return (
      <>
        {/* R = 250 */}
        <circle cx={384} cy={384} r={250} />

        <g visibility={this.props.headingValid.map((valid) => (valid ? 'inherit' : 'hidden'))}>
          <g transform="rotate(0 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              0
            </text>
          </g>

          <g transform="rotate(5 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(10 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(15 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(20 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(25 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(30 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              3
            </text>
          </g>

          <g transform="rotate(35 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(40 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(45 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(50 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(55 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(60 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              6
            </text>
          </g>

          <g transform="rotate(65 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(70 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(75 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(80 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(85 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(90 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              9
            </text>
          </g>

          <g transform="rotate(95 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(100 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(105 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(110 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(115 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(120 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              12
            </text>
          </g>

          <g transform="rotate(125 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(130 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(135 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(140 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(145 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(150 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              15
            </text>
          </g>

          <g transform="rotate(155 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(160 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(165 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(170 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(175 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(180 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              18
            </text>
          </g>

          <g transform="rotate(185 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(190 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(195 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(200 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(205 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(210 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              21
            </text>
          </g>

          <g transform="rotate(215 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(220 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(225 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(230 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(235 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(240 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              24
            </text>
          </g>

          <g transform="rotate(245 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(250 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(255 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(260 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(265 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(270 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              27
            </text>
          </g>

          <g transform="rotate(275 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(280 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(285 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(290 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(295 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(300 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              30
            </text>
          </g>

          <g transform="rotate(305 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(310 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(315 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(320 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(325 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(330 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
            <text x={384} y={112} text-anchor="middle" font-size={26}>
              33
            </text>
          </g>

          <g transform="rotate(335 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(340 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(345 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>

          <g transform="rotate(350 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} />
          </g>

          <g transform="rotate(355 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} />
          </g>
        </g>
      </>
    );
  }
}
