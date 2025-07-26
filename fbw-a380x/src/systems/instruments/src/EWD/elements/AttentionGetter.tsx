// Copyright (c) 2024-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { DisplayComponent, EventBus, FSComponent, MappedSubject, Subscribable } from '@microsoft/msfs-sdk';

interface AttentionGetterProps {
  bus: EventBus;
  x: number;
  y: number;
  engine: number;
  active: Subscribable<boolean>;
  normal: Subscribable<boolean>;
  abnormal: Subscribable<boolean>;
}

export class AttentionGetter extends DisplayComponent<AttentionGetterProps> {
  private readonly visible = MappedSubject.create(
    ([active, normal, abnormal]) => active && (normal || abnormal),
    this.props.active,
    this.props.normal,
    this.props.abnormal,
  );

  render() {
    return (
      <g
        id={`attention-getter-${this.props.engine}`}
        visibility={this.visible.map((it) => (it ? 'inherit' : 'hidden'))}
      >
        <path
          class={{
            WhiteLine: this.props.normal,
            AmberLine: this.props.abnormal,
          }}
          d={`m ${this.props.x - 74} ${this.props.y - 13} l 0,-72 l 162,0 l 0,72`}
        />
        <path
          class={{
            WhiteLine: this.props.normal,
            AmberLine: this.props.abnormal,
          }}
          d={`m ${this.props.x - 74} ${this.props.y + 168} l 0,72 l 162,0 l 0,-72`}
        />
      </g>
    );
  }
}
