import { FSComponent, DisplayComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';

export interface PlanModeUnderlayProps {
  mapRange: Subscribable<number>;
}

export class PlanModeUnderlay extends DisplayComponent<PlanModeUnderlayProps> {
  render(): VNode | null {
    return (
      <>
        <defs>
          <clipPath id="plan-mode-map-clip">
            <polygon points="45,112 140,112 280,56 488,56 628,112 723,112 723,720 114,720 114,633 45,633" />
          </clipPath>
        </defs>

        <g stroke-width={3} clip-path="url(#plan-mode-map-clip)">
          <circle cx={384} cy={384} r={250} class="White" />

          <path d="M259,384a125,125 0 1,0 250,0a125,125 0 1,0 -250,0" stroke-dasharray="14 13" class="White" />

          <text x={310} y={474} class="Cyan" font-size={22}>
            {this.props.mapRange.map((range) => range / 2)}
          </text>
          <text x={212} y={556} class="Cyan" font-size={22}>
            {this.props.mapRange.map((range) => range / 1)}
          </text>

          <text x={384} y={170} class="White" font-size={25} text-anchor="middle" alignment-baseline="central">
            N
          </text>
          <path d="M384,141.5 L390,151 L378,151 L384,141.5" fill="white" stroke="none" />

          <text x={598} y={384} class="White" font-size={25} text-anchor="middle" alignment-baseline="central">
            E
          </text>
          <path d="M626.2,384 L617,390 L617,378 L626.5,384" fill="white" stroke="none" />

          <text x={384} y={598} class="White" font-size={25} text-anchor="middle" alignment-baseline="central">
            S
          </text>
          <path d="M384,626.5 L390,617 L378,617 L384,626.5" fill="white" stroke="none" />

          <text x={170} y={384} class="White" font-size={25} text-anchor="middle" alignment-baseline="central">
            W
          </text>
          <path d="M141.5,384 L151,390 L151,378 L141.5,384" fill="white" stroke="none" />
        </g>
      </>
    );
  }
}
