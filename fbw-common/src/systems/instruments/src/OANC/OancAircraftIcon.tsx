// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  DisplayComponent,
  FSComponent,
  MappedSubject,
  MappedSubscribable,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

export interface OancAircraftIconProps {
  isVisible: Subscribable<boolean>;
  x: Subscribable<number>;
  y: Subscribable<number>;
  rotation: Subscribable<number>;
}

export class OancAircraftIcon extends DisplayComponent<OancAircraftIconProps> {
  private svgRef = FSComponent.createRef<SVGSVGElement>();

  private readonly subscriptions: (Subscription | MappedSubscribable<any>)[] = [];

  onAfterRender() {
    this.subscriptions.push(
      this.props.isVisible.sub((isVisible) => {
        this.svgRef.instance.style.visibility = isVisible ? 'visible' : 'hidden';
      }, true),
      MappedSubject.create(this.props.x, this.props.y, this.props.rotation).sub(([x, y, rotation]) => {
        this.svgRef.instance.style.transform = `translate(${x - 45}px, ${y - 39.625}px) rotate(${rotation}deg)`;
      }),
    );
  }

  destroy() {
    for (const subscription of this.subscriptions) {
      subscription.destroy();
    }
  }

  render(): VNode | null {
    return (
      <svg
        ref={this.svgRef}
        class="oanc-svg"
        viewBox="0 0 90 70.25"
        style="position: absolute; width: 90px; height: 79.25px;"
      >
        <path
          class="oanc-airplane-shadow"
          stroke-width={8}
          stroke-linecap="round"
          d="M 4 29.5 H 86 m -41 -29.5 v 70.25 m -11.5 -9.75 h 23.5"
        />
        <path
          class="oanc-airplane"
          stroke-width={5}
          stroke-linecap="round"
          d="M 4 29.5 H 86 m -41 -29.5 v 70.25 m -11.5 -9.75 h 23.5"
        />
      </svg>
    );
  }
}
