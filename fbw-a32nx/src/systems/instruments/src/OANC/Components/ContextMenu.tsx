// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  VNode,
  MapSubject,
  Subscribable,
  Subscription,
  SubscribableUtils,
} from '@microsoft/msfs-sdk';

import './ContextMenu.scss';
import { ContextMenuItemData } from '@flybywiresim/oanc';

export interface ContextMenuProps {
  isVisible: Subscribable<boolean>;

  x: Subscribable<number>;

  y: Subscribable<number>;

  items: ContextMenuItemData[];

  closeMenu: () => void;
}

export class ContextMenu extends DisplayComponent<ContextMenuProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly style = MapSubject.create<string, string>();

  onAfterRender() {
    this.subscriptions.push(
      this.props.isVisible.sub((it) => this.style.setValue('visibility', it ? 'visible' : 'hidden'), true),
      this.props.x.sub((it) => this.style.setValue('left', `${it.toFixed(0)}px`), true),
      this.props.y.sub((it) => this.style.setValue('top', `${it.toFixed(0)}px`), true),
    );
  }

  private readonly handleItemPressed = (item: ContextMenuItemData) => {
    item.onPressed?.();

    this.props.closeMenu();
  };

  render(): VNode | null {
    return (
      <div class="oanc-context-menu" style={this.style}>
        {this.props.items.map((it) => (
          <ContextMenuItem
            name={it.name}
            disabled={SubscribableUtils.toSubscribable(it.disabled, true)}
            onPressed={() => this.handleItemPressed(it)}
          />
        ))}
      </div>
    );
  }
}

export interface ContextMenuItemProps {
  name: string;

  disabled: Subscribable<boolean>;

  onPressed: () => void;
}

export class ContextMenuItem extends DisplayComponent<ContextMenuItemProps> {
  private readonly root = FSComponent.createRef<HTMLSpanElement>();

  onAfterRender() {
    this.root.instance.addEventListener('click', this.handlePressed);
  }

  private handlePressed = () => this.props.onPressed();

  render(): VNode | null {
    return (
      <span
        ref={this.root}
        class={{ 'oanc-context-menu-item': true, 'oanc-context-menu-item-disabled': this.props.disabled }}
      >
        {this.props.name}
      </span>
    );
  }
}
