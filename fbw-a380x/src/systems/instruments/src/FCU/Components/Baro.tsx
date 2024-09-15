//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface BaroProps {}

export class Baro extends DisplayComponent<BaroProps> {
  render(): VNode | null {
    return (
      <div id="SmallScreen">
        <div id="Selected">
          <svg width="100%" height="100%">
            <text id="QNH" class="Common Active BaroValue" x="5%" y="26%">QNH</text>
            <text id="QFE" class="Common Inactive BaroValue" x="40%" y="26%">QFE</text>
            <text id="Value" class="Common Value BaroValue" x="4%" y="86%">00.00</text>
          </svg>
        </div>
        <div id="Standard">
          <svg width="100%" height="100%">
            <text id="PreSelBaroValue" class="Common Active BaroValue" x="100%" y="26%" text-anchor="end">1013</text>
            <text class="Common Value BaroValue" x="4%" y="86%">Std</text>
          </svg>
        </div>
      </div>
    );
  }
}
