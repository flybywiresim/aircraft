import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

export interface SurvStatusItemProps extends ComponentProps {
  label: string;
  active: boolean;
  failed: Subscribable<boolean>;
  sys: string;
  style?: string;
  onChanged?(val: boolean): void;
}

/*
 * Button for MFD pages. If menuItems is set, a dropdown menu will be displayed when button is clicked
 */
export class SurvStatusItem extends DisplayComponent<SurvStatusItemProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
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
        {this.props.label} {this.props.active ? this.props.sys : 'OFF'}
      </div>
    );
  }
}
