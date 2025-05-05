//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';

export interface SurvStatusItemProps extends ComponentProps {
  label: string;
  active: Subscribable<boolean>;
  failed: Subscribable<boolean>;
  sys: string;
  style?: string;
  onChanged?(val: boolean): void;
}

export class SurvStatusItem extends DisplayComponent<SurvStatusItemProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly label = this.props.active.map((active) => `${this.props.label} ${active ? this.props.sys : 'OFF'}`);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(this.label);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  public render(): VNode {
    return (
      <div
        style={this.props.style}
        class={{
          'mfd-surv-status-item': true,
          active: this.props.active,
          failed: this.props.failed,
        }}
      >
        {this.label}
      </div>
    );
  }
}
