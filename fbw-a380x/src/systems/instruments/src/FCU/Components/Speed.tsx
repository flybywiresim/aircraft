//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface SpeedProps {}

export class Speed extends DisplayComponent<SpeedProps> {
  render(): VNode | null {
    return (
      <div id="Speed">
        <svg width="100%" height="100%">
          <text id="MACH" class="Common Inactive" x="0%" y="20%">
            MACH
          </text>
          <text id="SPD" class="Common Active" x="47%" y="20%">
            SPD
          </text>
          <text id="Value" class="Common Value" x="5%" y="86%">
            ---
          </text>
          <text id="KNOTS" class="Common Inactive" x="79%" y="97%">
            KT
          </text>
        </svg>
      </div>
    );
  }
}
