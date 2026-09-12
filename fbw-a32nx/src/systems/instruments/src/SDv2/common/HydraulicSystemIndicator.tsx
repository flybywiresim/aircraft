//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { FSComponent, Subscribable } from '@microsoft/msfs-sdk';

import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { ComponentPositionProps } from './ComponentPositionProps';
import { SvgGroup } from './SvgGroup';

export type HydraulicSystem = 'B' | 'Y' | 'G';

interface HydraulicIndicatorProps extends ComponentPositionProps {
  system: HydraulicSystem;
  hydraulicsAvailable: Subscribable<boolean>;
}

export class HydraulicSystemIndicator extends DestroyableComponent<HydraulicIndicatorProps> {
  render() {
    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <rect x={0} y={0} class="Grey Fill" width="23" height="27" rx="0" />
        <text
          x={12}
          y={22}
          class={this.props.hydraulicsAvailable
            .map((avail) => (avail ? 'Green' : 'Amber'))
            .map((color) => `F22 ${color} Center`)}
        >
          {this.props.system}
        </text>
      </SvgGroup>
    );
  }
}
