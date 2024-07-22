import { DisplayComponent, FSComponent, Subscription, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Button } from 'instruments/src/MFD/pages/common/Button';

export class Footer extends DisplayComponent<AbstractMfdPageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected subs = [] as Subscription[];

  private buttonRef = FSComponent.createRef<Button>();

  private buttonText = Subject.create<VNode>(
    <span>
      MSG
      <br />
      LIST
    </span>,
  );

  private messageRef = FSComponent.createRef<HTMLSpanElement>();

  private messageToBeCleared = Subject.create<boolean>(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.fmcService.master) {
      this.subs.push(
        this.props.fmcService.master.fmsErrors.sub((index, type, item, arr) => {
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
            this.buttonText.set(
              <span>
                CLEAR
                <br />
                INFO
              </span>,
            );
          } else {
            this.messageToBeCleared.set(false);
            this.messageRef.instance.textContent = '';
            this.messageRef.instance.style.backgroundColor = 'none';
            this.buttonText.set(
              <span>
                MSG
                <br />
                LIST
              </span>,
            );
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
