//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

interface ShapeProps extends ComponentProps {
  color?: string;
}

export class TriangleDown extends DisplayComponent<ShapeProps> {
  render(): VNode {
    return (
      <svg height="15" width="15">
        <polygon points="0,0 15,0 7.5,15" style={`fill: ${this.props.color ?? 'white'}`} />
      </svg>
    );
  }
}

export class TriangleUp extends DisplayComponent<ShapeProps> {
  render(): VNode {
    return (
      <svg height="15" width="15">
        <polygon points="7.5,0 15,15 0,15" style={`fill: ${this.props.color ?? 'white'}`} />
      </svg>
    );
  }
}

export class TriangleLeft extends DisplayComponent<ShapeProps> {
  render(): VNode {
    return (
      <svg height="15" width="15">
        <polygon points="0,7.5 15,15 15,0" style="fill:white" />
      </svg>
    );
  }
}
