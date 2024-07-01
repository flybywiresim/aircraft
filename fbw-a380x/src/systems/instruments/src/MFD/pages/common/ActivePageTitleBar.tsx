import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface ActivePageTitleBarProps extends ComponentProps {
  activePage: Subscribable<string>;
  offset: Subscribable<string>;
  eoIsActive: Subscribable<boolean>;
  tmpyIsActive: Subscribable<boolean>;
}

/*
 * Displays the title bar, with optional markers for lateral offsets, engine out and temporary flight plan
 */
export class ActivePageTitleBar extends DisplayComponent<ActivePageTitleBarProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private offsetText = this.props.offset.map((it) => (it ? `     OFFSET${this.props.offset.get()}` : ''));

  private eoRef = FSComponent.createRef<HTMLSpanElement>();

  private tmpyRef = FSComponent.createRef<HTMLSpanElement>();

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
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="mfd-title-bar-container">
        <div class="mfd-title-bar-title">
          <span class="mfd-label mfd-title-bar-title-label">
            {this.props.activePage}
            {this.offsetText}
          </span>
        </div>
        <div class="mfd-title-bar-eo-section">
          <span ref={this.eoRef} class="mfd-label mfd-title-bar-eo-label" style="display: none">
            EO
          </span>
        </div>
        <div class="mfd-title-bar-tmpy-section">
          <span ref={this.tmpyRef} class="mfd-label mfd-title-bar-tmpy-label" style="display: none">
            TMPY
          </span>
        </div>
      </div>
    );
  }
}
