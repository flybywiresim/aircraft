//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface HeadingProps {}

export class Heading extends DisplayComponent<HeadingProps> {
  render(): VNode | null {
    return (
      <div id="Heading">
        <svg width="100%" height="100%">
          <text id="TRUE" class="Common Active " x="23%" y="20%">
            TRUE
          </text>
          <text id="HDG" class="Common Active" x="48%" y="20%">
            HDG
          </text>
          <text id="TRK" class="Common Inactive" x="68%" y="20%">
            TRK
          </text>
          <text id="Value" class="Common Value" x="47%" y="97%">
            ---
          </text>
          <text id="DEGREES" class="Common Value" x="89%" y="97%">
            &#176;
          </text>
        </svg>
      </div>
    );
  }
}
