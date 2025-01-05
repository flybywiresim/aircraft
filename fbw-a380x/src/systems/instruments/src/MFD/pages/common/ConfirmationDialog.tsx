import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';
import { Button } from 'instruments/src/MFD/pages/common/Button';

interface ConfirmationDialogProps extends ComponentProps {
  visible: Subscribable<boolean>;
  cancelAction: () => void;
  confirmAction: () => void;
  contentContainerStyle?: string;
  amberLabel?: boolean;
}

/*
 * Popup dialog for actions needing confirmation (e.g. DERATED TO)
 */
export class ConfirmationDialog extends DisplayComponent<ConfirmationDialogProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private topRef = FSComponent.createRef<HTMLDivElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.visible.sub((val) => {
        if (this.topRef.getOrDefault()) {
          this.topRef.instance.style.display = val ? 'block' : 'none';
        }
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
      <div ref={this.topRef} style="position: relative;">
        <div class="mfd-dialog" style={`${this.props.contentContainerStyle ?? ''}`}>
          <div class="mfd-dialog-title">
            <span class={`mfd-label ${this.props.amberLabel ? 'amber' : ''}`}>{this.props.children}</span>
          </div>
          <div class="mfd-dialog-buttons">
            <Button label="CANCEL" onClick={() => this.props.cancelAction()} />
            <Button label="CONFIRM *" onClick={() => this.props.confirmAction()} buttonStyle="padding-right: 6px;" />
          </div>
        </div>
      </div>
    );
  }
}
