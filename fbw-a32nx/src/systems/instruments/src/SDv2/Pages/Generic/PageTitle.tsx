// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { DisplayComponent, FSComponent } from '@microsoft/msfs-sdk';

export interface PageTitleProps {
  readonly x: number;
  readonly y: number;
}

export class PageTitle extends DisplayComponent<PageTitleProps> {
  render() {
    return (
      <text x={this.props.x} y={this.props.y} class="F36 White Underline">
        {this.props.children}
      </text>
    );
  }
}
