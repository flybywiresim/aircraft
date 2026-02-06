import { DisplayComponent, FSComponent, Subscription, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';

export class Footer extends DisplayComponent<AbstractMfdPageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  private readonly buttonRef = FSComponent.createRef<Button>();

  private readonly buttonText = Subject.create('MSG\nLIST');

  private readonly messageRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly messageToBeCleared = Subject.create<boolean>(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.fmcService.master) {
      this.subs.push(
        this.props.fmcService.master.fmsErrors.sub((_, __, ___, arr) => {
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
            this.buttonText.set('CLEAR\nINFO');
          } else {
            this.messageToBeCleared.set(false);
            this.messageRef.instance.textContent = '';
            this.messageRef.instance.style.backgroundColor = 'none';
            this.buttonText.set('MSG\nLIST');
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
              this.props.fmcService.master?.clearLatestFmsErrorMessage();
            } else {
              this.props.mfd.openMessageList();
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
