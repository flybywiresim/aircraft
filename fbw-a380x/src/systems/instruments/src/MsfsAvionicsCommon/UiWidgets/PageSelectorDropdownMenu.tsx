//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { TriangleDown } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/shapes';

type PageSelectorMenuItem = {
  label: string;
  action(): void;
  disabled?: boolean;
  separatorBelow?: boolean;
};

interface PageSelectorDropdownMenuProps extends ComponentProps {
  label: string;
  menuItems: PageSelectorMenuItem[];
  isActive: Subscribable<boolean>;
  idPrefix: string;
  containerStyle?: string;
  labelStyle?: string;
  dropdownMenuStyle?: string;
}
export class PageSelectorDropdownMenu extends DisplayComponent<PageSelectorDropdownMenuProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly dropdownSelectorRef = FSComponent.createRef<HTMLDivElement>();

  private readonly dropdownSelectorLabelRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

  private readonly dropdownIsOpened = Subject.create(false);

  private onMenuItemClick(val: PageSelectorMenuItem) {
    if (!val.disabled) {
      val.action();
      this.dropdownIsOpened.set(false);
    }
  }

  private onClickedOutside = (e: MouseEvent) => {
    if (!this.topRef.getOrDefault()?.contains(e.target as Node) && this.dropdownIsOpened.get()) {
      this.dropdownIsOpened.set(false);
    }
  };

  private readonly onClickedOutsideHandler = this.onClickedOutside.bind(this);

  private onOpenCloseDropdown() {
    if (this.props.menuItems.length > 1) {
      this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
    } else if (this.props.menuItems.length === 1) {
      this.props.menuItems[0].action();
    }
  }

  private readonly onOpenCloseDropdownHandler = this.onOpenCloseDropdown.bind(this);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.menuItems.forEach((val, i) => {
      document
        .getElementById(`${this.props.idPrefix}_${i}`)
        ?.addEventListener('click', this.onMenuItemClick.bind(this, val));
    });

    // Close dropdown menu if clicked outside
    document.getElementById('MFD_CONTENT')?.addEventListener('click', this.onClickedOutsideHandler);

    this.dropdownSelectorRef.instance.addEventListener('click', this.onOpenCloseDropdownHandler);

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

    this.props.menuItems.forEach((val, i) => {
      document
        .getElementById(`${this.props.idPrefix}_${i}`)
        ?.removeEventListener('click', this.onMenuItemClick.bind(this, val));
    });
    document.getElementById('MFD_CONTENT')?.removeEventListener('click', this.onClickedOutsideHandler);
    this.dropdownSelectorRef.getOrDefault()?.removeEventListener('click', this.onOpenCloseDropdownHandler);

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="mfd-dropdown-container" ref={this.topRef} style={this.props.containerStyle ?? ''}>
        <div class="mfd-page-selector-outer" ref={this.dropdownSelectorRef}>
          <div class="mfd-page-selector-label-container">
            <span
              class="mfd-page-selector-label"
              ref={this.dropdownSelectorLabelRef}
              style={this.props.labelStyle ?? ''}
            >
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
          style={`display: ${this.dropdownIsOpened.get() ? 'block' : 'none'};${this.props.dropdownMenuStyle ?? ''}`}
        >
          {this.props.menuItems.map(
            (el, idx) => (
              <span
                id={`${this.props.idPrefix}_${idx}`}
                class={`mfd-dropdown-menu-element${el.disabled ? ' disabled' : ''}${el.separatorBelow ? ' separator' : ''}`}
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
