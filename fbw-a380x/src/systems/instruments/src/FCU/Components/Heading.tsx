//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface HeadingProps {}

export class Heading extends DisplayComponent<HeadingProps> {
  render(): VNode | null {
    return (
      <div id="Heading">
        <svg width="100%" height="100%">
          <text id="HDG" class="Common Active" x="13%" y="20%">
            HDG
          </text>
          <text id="TRK" class="Common Inactive" x="47%" y="20%">
            TRK
          </text>
          <text id="Value" class="Common Value" x="11%" y="86%">
            ---
          </text>
          <text id="DEGREES" class="Common Value" x="86%" y="86%">
            &#176;
          </text>
        </svg>
      </div>
    );
  }
}
