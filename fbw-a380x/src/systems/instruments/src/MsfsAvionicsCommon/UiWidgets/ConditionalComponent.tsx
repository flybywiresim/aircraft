//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';

interface ConditionalComponentProps extends ComponentProps {
  componentIfTrue: VNode;
  componentIfFalse: VNode;
  condition: Subscribable<boolean>;
  width?: number; // Fixed width in pixel. If not set, positioning might not be consistent
  height?: number; // Fixed height in pixels. If not set, positioning might not be consistent
  noStyle?: boolean; // If true, the component will not be styled (display: flex, justify-content: center, align-items: center)
}

/*
 * Renders components based on the prop's condition (either componentIfTrue or componentIfFalse is rendered)
 */
export class ConditionalComponent extends DisplayComponent<ConditionalComponentProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private containerRef = FSComponent.createRef<HTMLDivElement>();

  private trueComponentRef = FSComponent.createRef<HTMLDivElement>();

  private falseComponentRef = FSComponent.createRef<HTMLDivElement>();

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.condition.sub((v) => {
        this.trueComponentRef.instance.style.display = v ? 'block' : 'none';
        this.falseComponentRef.instance.style.display = v ? 'none' : 'block';
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div
        ref={this.containerRef}
        style={`${this.props.noStyle ? '' : 'display: flex; justify-content: center; align-items: center;'}
                ${this.props.width !== undefined ? ` width: ${this.props.width.toFixed(0)}px;` : ''}
                ${this.props.height !== undefined ? ` height: ${this.props.height.toFixed(0)}px;` : ''}`}
      >
        <div ref={this.trueComponentRef}>{this.props.componentIfTrue}</div>
        <div ref={this.falseComponentRef}>{this.props.componentIfFalse}</div>
      </div>
    );
  }
}
