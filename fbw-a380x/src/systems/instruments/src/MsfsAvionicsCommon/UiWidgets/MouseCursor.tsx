//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  SubscribableUtils,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

export enum MouseCursorColor {
  Yellow,
  Magenta,
}

interface MouseCursorProps extends ComponentProps {
  side: Subscribable<'CAPT' | 'FO'>;
  isDoubleScreenMfd?: boolean;
  visible?: Subject<boolean>;
  color?: Subscribable<MouseCursorColor> | MouseCursorColor;
}

export class MouseCursor extends DisplayComponent<MouseCursorProps> {
  private readonly subs: Subscription[] = [];

  private readonly divRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly color: Subscribable<MouseCursorColor> = SubscribableUtils.toSubscribable(
    this.props.color ?? MouseCursorColor.Yellow,
    true,
  );

  private readonly fillColor = this.color.map((c) => (c === MouseCursorColor.Magenta ? '#ff94ff' : '#ffff00'));

  private readonly rotation = this.props.side.map((side) => `rotate(${side === 'FO' ? 90 : 0} 40 40)`);

  private hideTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  updatePosition(x: number, y: number) {
    if (this.divRef.instance.style.display !== 'block') {
      this.divRef.instance.style.display = 'block';
    }

    const xOffset = this.props.side.get() === 'FO' && this.props.isDoubleScreenMfd ? x - 40 - 878 : x - 40;
    this.divRef.instance.style.left = `${xOffset}px`;
    this.divRef.instance.style.top = `${y - 40}px`;

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    this.hideTimer = setTimeout(() => this.hide(), 5000);
  }

  show() {
    this.divRef.instance.style.display = 'block';
    this.hideTimer = setTimeout(() => this.hide(), 5000);
  }

  hide() {
    this.divRef.instance.style.display = 'none';

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.visible) {
      this.subs.push(this.props.visible.sub((vis) => (vis ? this.show() : this.hide()), true));
    }

    this.subs.push(this.fillColor, this.rotation);
  }

  destroy(): void {
    for (const s of this.subs) {
      s.destroy();
    }
  }

  render(): VNode {
    return (
      <div ref={this.divRef} class="mfd-mouse-cursor">
        <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
          <g transform={this.rotation}>
            <polyline points="0,0 40,35 80,0" style={{ fill: 'none', stroke: this.fillColor, 'stroke-width': '3' }} />
            <line x1="40" y1="39" x2="40" y2="41" style={{ stroke: this.fillColor, 'stroke-width': '2' }} />
            <line x1="39" y1="40" x2="41" y2="40" style={{ stroke: this.fillColor, 'stroke-width': '2' }} />
            <polyline points="0,80 40,45 80,80" style={{ fill: 'none', stroke: this.fillColor, 'stroke-width': '3' }} />
          </g>
        </svg>
      </div>
    );
  }

  destroy(): void {
    for (const s of this.subs) {
      s.destroy();
    }

    super.destroy();
  }
}
