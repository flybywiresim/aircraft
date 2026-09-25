//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { DisplayComponent, FSComponent, MappedSubject, Subscribable, SubscribableUtils } from '@microsoft/msfs-sdk';

interface SvgGroupProps {
  x: Subscribable<number> | number;
  y: Subscribable<number> | number;
  rotation?: Subscribable<number | string>;
}

export class SvgGroup extends DisplayComponent<SvgGroupProps> {
  private readonly transformString = MappedSubject.create(
    ([x, y, rotation]) => `translate(${x},${y}) rotate(${rotation ?? 0})`,
    SubscribableUtils.toSubscribable(this.props.x, true),
    SubscribableUtils.toSubscribable(this.props.y, true),
    SubscribableUtils.toSubscribable(this.props.rotation, true),
  );

  render() {
    return <g transform={this.transformString}>{this.props.children}</g>;
  }
}
