//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';

export interface SurvStatusButtonProps extends ComponentProps {
  label: string;
  active: Subscribable<boolean>;
  onClick?: () => void;
}

/*
 * Button for MFD pages. If menuItems is set, a dropdown menu will be displayed when button is clicked
 */
export class SurvStatusButton extends DisplayComponent<SurvStatusButtonProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly buttonRef = FSComponent.createRef<HTMLSpanElement>();

  private clickHandler(): void {
    if (this.props.onClick) {
      this.props.onClick();
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.buttonRef.instance.addEventListener('click', this.clickHandler.bind(this));
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    this.buttonRef.instance.removeEventListener('click', () => this.clickHandler.bind(this));

    super.destroy();
  }

  public render(): VNode {
    return (
      <div ref={this.buttonRef} class="mfd-surv-status-button">
        <div style="padding-left: 7px; padding-right: 7px; height: 50%; background-color: black; display: flex; flex-direction: column; justify-content: space-evenly;">
          <div class={{ 'mfd-surv-status-indicator': true, active: this.props.active }}></div>
          <div class={{ 'mfd-surv-status-indicator': true, active: this.props.active }}></div>
          <div class={{ 'mfd-surv-status-indicator': true, active: this.props.active }}></div>
        </div>
        <p class="mfd-surv-status-button-label">{this.props.label}</p>
      </div>
    );
  }
}
