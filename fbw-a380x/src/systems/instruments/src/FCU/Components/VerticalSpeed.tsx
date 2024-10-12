//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface VerticalSpeedProps {}

export class VerticalSpeed extends DisplayComponent<VerticalSpeedProps> {
  render(): VNode | null {
    return (
      <div id="VerticalSpeed">
        <svg width="100%" height="100%">
          <text id="VS" class="Common Active" x="68%" y="20%" text-anchor="end">
            V/S
          </text>
          <text id="FPA" class="Common Inactive" x="90%" y="20%" text-anchor="end">
            FPA
          </text>
          <text id="Value" class="Common Value" x="15%" y="86%">
            -----
          </text>
        </svg>
      </div>
    );
  }
}
