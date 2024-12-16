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
import { TriangleLeft } from 'instruments/src/MFD/pages/common/shapes';

export type ButtonMenuItem = {
  label: string;
  action(): void;
};

export interface RequestMenuButtonProps extends ComponentProps {
  label: string | Subscribable<VNode>;
  menuItems?: Subscribable<ButtonMenuItem[]>; // When defining menu items, idPrefix has to be set
  showArrow?: boolean;
  idPrefix?: string;
  disabled?: Subscribable<boolean>;
  selected?: Subscribable<boolean>; // Renders with lighter grey if selected (e.g. for segmented controls)
  buttonStyle?: string;
  onClick: () => void;
  scrollToMenuItem?: Subscribable<number>;
}

/*
 * Button for MFD pages. If menuItems is set, a dropdown menu will be displayed when button is clicked
 */
export class RequestMenuButton extends DisplayComponent<RequestMenuButtonProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private topRef = FSComponent.createRef<HTMLDivElement>();

  private buttonRef = FSComponent.createRef<HTMLSpanElement>();

  private dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

  private dropdownIsOpened = Subject.create(false);

  private menuOpensUpwards = Subject.create(false);

  private renderedMenuItems: ButtonMenuItem[] = [];

  private onClick() {
    if (!this.props.disabled?.get()) {
      this.props.onClick();
    }
  }

  private onClickHandler = this.onClick.bind(this);

  onDropdownMenuElementClick(val: ButtonMenuItem) {
    val.action();
    this.dropdownIsOpened.set(false);
  }

  private onDropdownMenuElementClickHandler = this.onDropdownMenuElementClick.bind(this);

  private scrollMenuTo(elementIndex: number) {
    // Assume 36px height for each menu item div
    this.dropdownMenuRef.instance.scrollTo({ behavior: 'instant', left: 0, top: elementIndex * 36 });
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.disabled === undefined) {
      this.props.disabled = Subject.create(false);
    }
    if (this.props.selected === undefined) {
      this.props.selected = Subject.create(false);
    }
    if (typeof this.props.label === 'string') {
      this.props.label = Subject.create(<span>{this.props.label}</span>);
    }
    if (this.props.menuItems && !this.props.idPrefix) {
      console.error('Button: menuItems set without idPrefix.');
    }
    if (this.props.idPrefix === undefined) {
      this.props.idPrefix = '';
    }
    if (this.props.showArrow === undefined) {
      this.props.showArrow = true;
    }
    this.buttonRef.instance.addEventListener('click', this.onClickHandler);

    this.subs.push(
      this.props.disabled.sub((val) => {
        if (val) {
          this.buttonRef.getOrDefault()?.classList.add('disabled');
        } else {
          this.buttonRef.getOrDefault()?.classList.remove('disabled');
        }
      }, true),
    );

    this.subs.push(
      this.props.selected.sub((val) => {
        if (val) {
          this.buttonRef.getOrDefault()?.classList.add('selected');
        } else {
          this.buttonRef.getOrDefault()?.classList.remove('selected');
        }
      }, true),
    );

    // Menu handling
    if (this.props.menuItems !== undefined) {
      this.subs.push(
        this.props.menuItems.sub((items) => {
          // Delete click handler, delete dropdownMenuRef children, render dropdownMenuRef children,
          this.renderedMenuItems?.forEach((val, i) => {
            document
              .getElementById(`${this.props.idPrefix}_${i}`)
              ?.removeEventListener('click', this.onDropdownMenuElementClickHandler.bind(this, val));
          });

          // Delete dropdownMenuRef's children
          while (this.dropdownMenuRef.instance.firstChild) {
            this.dropdownMenuRef.instance.removeChild(this.dropdownMenuRef.instance.firstChild);
          }

          this.renderedMenuItems = items;

          // Render dropdownMenuRef's children
          const itemNodes: VNode = (
            <div>
              {items?.map<VNode>(
                (el, idx) => (
                  <span id={`${this.props.idPrefix}_${idx}`} class="mfd-dropdown-menu-element">
                    {el.label}
                  </span>
                ),
                this,
              )}
            </div>
          );
          FSComponent.render(itemNodes, this.dropdownMenuRef.instance);

          // Add click event listener
          items?.forEach((val, i) => {
            document
              .getElementById(`${this.props.idPrefix}_${i}`)
              ?.addEventListener('click', this.onDropdownMenuElementClickHandler.bind(this, val));
          });

          // Check if menu would overflow vertically (i.e. leave screen at the bottom). If so, open menu upwards
          // Open menu for a split second to measure size
          this.dropdownMenuRef.instance.style.display = 'block';
          this.buttonRef.instance.classList.add('opened');

          // Check if menu leaves screen at the bottom, reposition if needed
          const boundingRect = this.dropdownMenuRef.instance.getBoundingClientRect();
          const overflowsVertically = boundingRect.top + boundingRect.height > 1024;
          this.menuOpensUpwards.set(overflowsVertically);

          if (overflowsVertically) {
            this.dropdownMenuRef.instance.style.top = `${Math.round(-boundingRect.height)}px`;
          } else {
            this.dropdownMenuRef.instance.style.top = '0';
          }

          // Offset dropdown menu to the left
          const buttonBoundingRect = this.buttonRef.instance.getBoundingClientRect();
          this.dropdownMenuRef.instance.style.right = `${Math.round(buttonBoundingRect.width)}px`;

          // Close again
          this.dropdownMenuRef.instance.style.display = 'none';
          this.buttonRef.instance.classList.remove('opened');
        }, true),
      );
    }

    this.subs.push(
      this.props.label?.sub((val) => {
        while (this.buttonRef.instance.firstChild) {
          this.buttonRef.instance.removeChild(this.buttonRef.instance.firstChild);
        }

        // If menuItems is defined, render as button with arrow on the right side
        if (this.props.menuItems !== undefined && this.props.showArrow) {
          const n: VNode = (
            <div class="mfd-fms-fpln-button-dropdown">
              <span class="mfd-fms-fpln-button-dropdown-arrow">
                <TriangleLeft color={this.props.disabled?.get() ? 'grey' : 'white'} />
              </span>
              <span class="mfd-atccom-request-button-dropdown-label">{val}</span>
            </div>
          );
          FSComponent.render(n, this.buttonRef.instance);
        } else {
          FSComponent.render(val, this.buttonRef.instance);
        }
      }, true),
    );

    // Close dropdown menu if clicked outside
    document.getElementById('MFD_CONTENT')?.addEventListener('click', this.onCloseDropdownHandler);

    this.buttonRef.instance.addEventListener('click', this.onButtonClickHandler);

    this.subs.push(
      this.dropdownIsOpened.sub((val) => {
        this.dropdownMenuRef.instance.style.display = val ? 'block' : 'none';

        if (val) {
          this.buttonRef.instance.classList.add('opened');
        } else {
          this.buttonRef.instance.classList.remove('opened');
        }

        if (this.props.scrollToMenuItem !== undefined) {
          this.scrollMenuTo(this.props.scrollToMenuItem.get());
        }
      }),
    );

    if (this.props.scrollToMenuItem !== undefined) {
      this.subs.push(
        this.props.scrollToMenuItem.sub((val) => {
          if (this.dropdownIsOpened.get()) {
            this.scrollMenuTo(val);
          }
        }),
      );
    }
  }

  private onCloseDropdown(e: MouseEvent) {
    if (!this.topRef.getOrDefault()?.contains(e.target as Node) && this.dropdownIsOpened.get()) {
      this.dropdownIsOpened.set(false);
    }
  }

  private onCloseDropdownHandler = this.onCloseDropdown.bind(this);

  private onButtonClick() {
    if (this.props.menuItems && this.props.menuItems.get().length > 0 && !this.props.disabled?.get()) {
      this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
    }
  }

  private onButtonClickHandler = this.onButtonClick.bind(this);

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    this.buttonRef.getOrDefault()?.removeEventListener('click', this.onClickHandler);
    document.getElementById('MFD_CONTENT')?.removeEventListener('click', this.onCloseDropdownHandler);
    this.buttonRef.getOrDefault()?.removeEventListener('click', this.onButtonClickHandler);

    super.destroy();
  }

  public render(): VNode {
    return (
      <div class="mfd-dropdown-container" ref={this.topRef}>
        <span
          ref={this.buttonRef}
          class="mfd-button"
          style={`${this.props.buttonStyle} ${this.props.menuItems && this.props.menuItems.get().length > 0 ? 'padding-right: 5px;' : ''}`}
        />
        <div
          ref={this.dropdownMenuRef}
          class="mfd-atccom-request-button-dropdown-menu"
          style={`display: ${this.dropdownIsOpened.get() ? 'block' : 'none'}`}
        />
      </div>
    );
  }
}
