//  Copyright (c) 2024-2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subscribable,
  SubscribableSet,
  ToggleableClassNameRecord,
  VNode,
} from '@microsoft/msfs-sdk';

interface ShapeProps extends ComponentProps {
  class?: string | Subscribable<string> | SubscribableSet<string> | ToggleableClassNameRecord;
  color?: string | Subscribable<string>;
}

export class TriangleDown extends DisplayComponent<ShapeProps> {
  render(): VNode {
    return (
      <svg class={this.props.class} height="15" width="15">
        <polygon points="0,0 15,0 7.5,15" style={{ fill: this.props.color ?? 'white' }} />
      </svg>
    );
  }
}

export class TriangleUp extends DisplayComponent<ShapeProps> {
  render(): VNode {
    return (
      <svg class={this.props.class} height="15" width="15">
        <polygon points="7.5,0 15,15 0,15" style={{ fill: this.props.color ?? 'white' }} />
      </svg>
    );
  }
}
