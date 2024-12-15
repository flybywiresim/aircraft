//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface VerticalSpeedProps {}

export class VerticalSpeed extends DisplayComponent<VerticalSpeedProps> {
  render(): VNode | null {
    return (
      <div id="VerticalSpeed">
        <svg width="100%" height="100%">
          <text id="FPA" class="Common Inactive" x="50%" y="20%" text-anchor="end">
            FPA
          </text>
          <text id="VS" class="Common Active" x="71%" y="20%" text-anchor="end">
            V/S
          </text>
          <text id="Value" class="Common Value" x="11%" y="97%">
            -----
          </text>
        </svg>
      </div>
    );
  }
}
