import { DisplayComponent, FSComponent, Subscription, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';

export class Footer extends DisplayComponent<AbstractMfdPageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  private readonly buttonRef = FSComponent.createRef<Button>();

  private readonly buttonText = Subject.create<VNode>(
    <span>
      MSG
      <br />
      LIST
    </span>,
  );

  private readonly line1Ref = FSComponent.createRef<SVGTextElement>();
  private readonly line2Ref = FSComponent.createRef<SVGTextElement>();

  private readonly messageToBeCleared = Subject.create<boolean>(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.fmcService.master) {
      this.subs.push(
        this.props.fmcService.master.fmsErrors.sub((_, __, ___, arr) => {
          const ind = arr.findIndex((el) => !el.cleared);

          if (ind > -1 && this.line1Ref.getOrDefault() && this.line2Ref.getOrDefault()) {
            this.messageToBeCleared.set(true);

            let lineFeed = arr[ind].messageText.search('\n');

            if(lineFeed == -1) {
              this.line1Ref.instance.textContent = arr[ind].messageText;

              this.line2Ref.instance.textContent = '';
              this.line2Ref.instance.style.display = 'none';
            } else {
              this.line1Ref.instance.textContent = arr[ind].messageText.slice(0, lineFeed);

              this.line2Ref.instance.textContent = arr[ind].messageText.slice(lineFeed + 1, arr[ind].messageText.length);
              this.line2Ref.instance.style.display = 'inherit';
            }

            if (arr[ind].backgroundColor === 'white') {
              this.line1Ref.instance.style.backgroundColor = '#ffffff';
              // According to references, single white lines are centered
              this.line1Ref.instance.style.marginBottom = '0px';
              this.line1Ref.instance.style.marginTop = '0px';
              this.line1Ref.instance.style.verticalAlign = 'middle';
              //this.line1Ref.instance.style.transform = 'translateY(18px)';
            } else if (arr[ind].backgroundColor === 'cyan') {
              this.line1Ref.instance.style.backgroundColor = '#00ffff';
            } else if (arr[ind].backgroundColor === 'amber') {
              this.line1Ref.instance.style.backgroundColor = '#e68000';
            }
            this.line2Ref.instance.style.backgroundColor = this.line1Ref.instance.style.backgroundColor;

            // According to references, amber lines or first lines are at the top of the footer
            if (arr[ind].backgroundColor === 'amber' || lineFeed != -1) {
              this.line1Ref.instance.style.marginBottom = '1px';
              this.line1Ref.instance.style.marginTop = '2px';
              this.line1Ref.instance.style.transform = 'translateY(0%)';
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
            this.line1Ref.instance.textContent = '';
            this.line1Ref.instance.style.backgroundColor = 'none';
            this.line2Ref.instance.textContent = this.line1Ref.instance.textContent;
            this.line2Ref.instance.style.backgroundColor = this.line1Ref.instance.style.backgroundColor;

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
              <div class="mfd-footer-message-area-line" ref={this.line1Ref} />
              <div class="mfd-footer-message-area-line" ref={this.line2Ref} />
        </div>
      </div>
    );
  }
}
