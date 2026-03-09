import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import './style.scss';

interface ActivePageTitleBarProps extends ComponentProps {
  activePage: Subscribable<string>;
  offset: Subscribable<string>;
  eoIsActive?: Subscribable<boolean>;
  tmpyIsActive?: Subscribable<boolean>;
  /** Whether to display the PENALTY seciton on the title bar */
  penaltyIsActive?: Subscribable<boolean>;
  /** Whether this is an FMS subsystem page. If it is, title section for EO AND TMPY are visible */
  isFmsSubsystemPage?: boolean;
}

/*
 * Displays the title bar, with optional markers for lateral offsets, engine out and temporary flight plan
 */
export class ActivePageTitleBar extends DisplayComponent<ActivePageTitleBarProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly offsetText = this.props.offset.map((it) => (it ? `     OFFSET${this.props.offset.get()}` : ''));

  private readonly engineOutVisibility = (this.props.eoIsActive ?? Subject.create(false)).map((v) =>
    v && this.props.isFmsSubsystemPage ? 'visible' : 'hidden',
  );

  private readonly temporaryVisibility = (this.props.tmpyIsActive ?? Subject.create(false)).map((v) =>
    v && this.props.isFmsSubsystemPage ? 'visible' : 'hidden',
  );

  private readonly penaltyVisibility = (this.props.penaltyIsActive ?? Subject.create(false)).map((v) =>
    v && this.props.isFmsSubsystemPage ? 'visible' : 'hidden',
  );

  private readonly titleBarMargin = this.props.isFmsSubsystemPage ? '2px' : '0px'; // As the bars are still rendered, removing the margin removes the black bars.

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subs.push(this.offsetText, this.penaltyVisibility, this.engineOutVisibility, this.temporaryVisibility);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="mfd-title-bar-container">
        <div class="mfd-title-bar-title fr space-between">
          <span class="mfd-label mfd-title-bar-text">
            {this.props.activePage}
            {this.offsetText}
          </span>
          <span class="mfd-title-bar-text label white" style={{ visibility: this.penaltyVisibility }}>
            PENALTY
          </span>
        </div>
        <div class="mfd-title-bar-section eo" style={{ 'margin-left': this.titleBarMargin }}>
          <span class="mfd-label mfd-title-bar-text label amber" style={{ visibility: this.engineOutVisibility }}>
            EO
          </span>
        </div>
        <div class="mfd-title-bar-section tmpy" style={{ 'margin-left': this.titleBarMargin }}>
          <span class="mfd-label mfd-title-bar-text label yellow" style={{ visibility: this.temporaryVisibility }}>
            TMPY
          </span>
        </div>
      </div>
    );
  }
}
