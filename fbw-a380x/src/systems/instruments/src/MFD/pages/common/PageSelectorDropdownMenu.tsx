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
import { TriangleDown } from 'instruments/src/MFD/pages/common/shapes';

type PageSelectorMenuItem = {
  label: string;
  action(): void;
  disabled?: boolean;
};

interface PageSelectorDropdownMenuProps extends ComponentProps {
  label: string;
  menuItems: PageSelectorMenuItem[];
  isActive: Subscribable<boolean>;
  idPrefix: string;
  containerStyle?: string;
}
export class PageSelectorDropdownMenu extends DisplayComponent<PageSelectorDropdownMenuProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private topRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownSelectorRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownSelectorLabelRef = FSComponent.createRef<HTMLSpanElement>();

  private dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownIsOpened = Subject.create(false);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.menuItems.forEach((val, i) => {
      document.getElementById(`${this.props.idPrefix}_${i}`)?.addEventListener('click', () => {
        if (!val.disabled) {
          val.action();
          this.dropdownIsOpened.set(false);
        }
      });
    });

    // Close dropdown menu if clicked outside
    document.getElementById('MFD_CONTENT')?.addEventListener('click', (e) => {
      if (!this.topRef.getOrDefault()?.contains(e.target as Node) && this.dropdownIsOpened.get()) {
        this.dropdownIsOpened.set(false);
      }
    });

    this.dropdownSelectorRef.instance.addEventListener('click', () => {
      if (this.props.menuItems.length > 1) {
        this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
      } else if (this.props.menuItems.length === 1) {
        this.props.menuItems[0].action();
      }
    });

    this.subs.push(
      this.dropdownIsOpened.sub((val) => {
        this.dropdownMenuRef.instance.style.display = val ? 'block' : 'none';
        this.dropdownSelectorLabelRef.instance.classList.toggle('opened');
      }),
    );

    this.subs.push(
      this.props.isActive.sub((val) => this.dropdownSelectorLabelRef.instance.classList.toggle('active', val), true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="mfd-dropdown-container" ref={this.topRef} style={this.props.containerStyle}>
        <div class="mfd-page-selector-outer" ref={this.dropdownSelectorRef}>
          <div class="mfd-page-selector-label-container">
            <span class="mfd-page-selector-label" ref={this.dropdownSelectorLabelRef}>
              {this.props.label}
            </span>
          </div>
          <div class="mfd-page-selector-label-triangle">
            {this.props.menuItems.length > 1 && (
              <span>
                <TriangleDown />
              </span>
            )}
          </div>
        </div>
        <div
          ref={this.dropdownMenuRef}
          class="mfd-dropdown-menu"
          style={`display: ${this.dropdownIsOpened.get() ? 'block' : 'none'}`}
        >
          {this.props.menuItems.map(
            (el, idx) => (
              <span
                id={`${this.props.idPrefix}_${idx}`}
                class={`mfd-dropdown-menu-element${el.disabled ? ' disabled' : ''}`}
              >
                {el.label}
              </span>
            ),
            this,
          )}
        </div>
      </div>
    );
  }
}
