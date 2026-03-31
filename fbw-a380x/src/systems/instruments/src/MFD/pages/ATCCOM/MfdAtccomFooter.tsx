// Copyright (c) 2025-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscription, Subject, VNode } from '@microsoft/msfs-sdk';
import { AtccomMfdPageProps } from 'instruments/src/MFD/MFD';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';

export class AtccomFooter extends DisplayComponent<AtccomMfdPageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  private readonly buttonRef = FSComponent.createRef<Button>();

  private readonly buttonText = Subject.create<VNode>(
    <span>
      CLEAR
      <br />
      INFO
    </span>,
  );

  private readonly messageRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly messageToBeCleared = Subject.create<boolean>(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.atcService) {
      this.subs.push(
        this.props.atcService.atcErrors.sub((_, __, ___, arr) => {
          const ind = arr.findIndex((el) => !el.cleared);

          if (ind > -1 && this.messageRef.getOrDefault()) {
            this.messageToBeCleared.set(true);
            this.messageRef.instance.textContent = arr[ind].messageText;

            if (arr[ind].backgroundColor === 'white') {
              this.messageRef.instance.style.backgroundColor = '#ffffff';
            } else if (arr[ind].backgroundColor === 'cyan') {
              this.messageRef.instance.style.backgroundColor = '#00ffff';
            } else if (arr[ind].backgroundColor === 'amber') {
              this.messageRef.instance.style.backgroundColor = '#e68000';
            }
          } else {
            this.messageToBeCleared.set(false);
            this.messageRef.instance.textContent = '';
            this.messageRef.instance.style.backgroundColor = 'none';
          }
        }, true),
      );
    }
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="mfd-footer">
        <Button
          ref={this.buttonRef}
          buttonStyle="width: 100px;"
          label={this.buttonText}
          onClick={() => {
            if (this.messageToBeCleared.get()) {
              this.props.atcService.clearLatestAtcErrorMessage();
            }
          }}
        />
        <div class="mfd-footer-message-area">
          <span ref={this.messageRef} />
        </div>
      </div>
    );
  }
}
