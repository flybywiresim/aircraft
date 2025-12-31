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
  eoIsActive: Subscribable<boolean>;
  tmpyIsActive: Subscribable<boolean>;
  penaltyIsActive?: Subscribable<boolean>;
}

/*
 * Displays the title bar, with optional markers for lateral offsets, engine out and temporary flight plan
 */
export class ActivePageTitleBar extends DisplayComponent<ActivePageTitleBarProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly offsetText = this.props.offset.map((it) => (it ? `     OFFSET${this.props.offset.get()}` : ''));

  private readonly eoRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly tmpyRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly penaltyVisibility = (this.props.penaltyIsActive ?? Subject.create(false)).map((v) =>
    v ? 'visible' : 'hidden',
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.eoIsActive.sub((v) => {
        if (this.eoRef.getOrDefault()) {
          this.eoRef.instance.style.display = v ? 'block' : 'none';
        }
      }, true),
    );
    this.subs.push(
      this.props.tmpyIsActive.sub((v) => {
        if (this.tmpyRef.getOrDefault()) {
          this.tmpyRef.instance.style.display = v ? 'block' : 'none';
        }
      }, true),
    );

    this.subs.push(this.offsetText, this.penaltyVisibility);
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
        <div class="mfd-title-bar-eo-section">
          <span ref={this.eoRef} class="mfd-label mfd-title-bar-text label amber" style="display: none">
            EO
          </span>
        </div>
        <div class="mfd-title-bar-tmpy-section">
          <span ref={this.tmpyRef} class="mfd-label mfd-title-bar-text label yellow" style="display: none">
            TMPY
          </span>
        </div>
      </div>
    );
  }
}
