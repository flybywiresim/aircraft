//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface AltitudeProps {}

export class Altitude extends DisplayComponent<AltitudeProps> {
  render(): VNode | null {
    return (
      <div id="Altitude">
        <svg width="125%" height="100%">
          <text id="ALT" class="Common Active" x="31%" y="20%">ALT</text>
          <text id="Value" class="Common Value" x="4%" y="86%">-----</text>
        </svg>
      </div>
    );
  }
}
