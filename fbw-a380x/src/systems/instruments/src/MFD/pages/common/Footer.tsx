// Copyright (c) 2024-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { FSComponent, Subscription, Subject, VNode, LifecycleComponent } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from '../../MFD';
import { Button } from '../../../MsfsAvionicsCommon/UiWidgets/Button';

export class Footer extends LifecycleComponent<AbstractMfdPageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  private readonly buttonRef = FSComponent.createRef<Button>();

  private readonly buttonText = Subject.create('MSG\nLIST');

  private readonly messageText = Subject.create('');

  private readonly messageBackgroundColor = Subject.create('none');

  private readonly messageStyle = this.messageBackgroundColor
    .map((color) => `background-color: ${color};`)
    .withLifecycle(this.defaultLifecycle);

  private readonly messageToBeCleared = Subject.create<boolean>(false);

  private readonly msgListDisabled = Subject.create<boolean>(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.fmcService.master) {
      this.subs.push(
        this.props.fmcService.master.fmsErrors.sub((_, __, ___, arr) => {
          const ind = arr.findIndex((el) => !el.cleared);
          if (ind > -1) {
            this.messageToBeCleared.set(true);
            this.messageText.set(arr[ind].messageText);
            if (arr[ind].backgroundColor === 'white') {
              this.messageBackgroundColor.set('#ffffff');
            } else if (arr[ind].backgroundColor === 'cyan') {
              this.messageBackgroundColor.set('#00ffff');
            } else if (arr[ind].backgroundColor === 'amber') {
              this.messageBackgroundColor.set('#e68000');
            }
            this.buttonText.set('CLEAR\nINFO');
            this.msgListDisabled.set(false);
          } else {
            this.messageToBeCleared.set(false);
            this.messageText.set('');
            this.messageBackgroundColor.set('none');
            this.buttonText.set('MSG\nLIST');
            this.msgListDisabled.set(arr.length === 0);
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
          label={<span style="white-space: pre">{this.buttonText}</span>}
          onClick={() => {
            if (this.messageToBeCleared.get()) {
              this.props.fmcService.master.clearLatestFmsErrorMessage();
            } else {
              this.props.mfd.openMessageList();
            }
          }}
          disabled={this.msgListDisabled}
        />
        <div class="mfd-footer-message-area">
          <span style={this.messageStyle}>{this.messageText}</span>
        </div>
      </div>
    );
  }
}
