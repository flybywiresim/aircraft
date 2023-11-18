// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, VNode, MapSubject, Subscribable, Subscription } from '@microsoft/msfs-sdk';

import './ContextMenu.scss';

export interface ContextMenuProps {
    isVisible: Subscribable<boolean>,

    x: Subscribable<number>,

    y: Subscribable<number>,

    items: ContextMenuItemData[],
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

    render(): VNode | null {
        return (
            <div class="oanc-context-menu" style={this.style}>
                {this.props.items.map((it) => (
                    <ContextMenuItem name={it.name} disabled={it.disabled} onPressed={it.onPressed ?? (() => {})} />
                ))}
            </div>
        );
    }
}

export interface ContextMenuItemData {
    name: string,

    disabled?: boolean,

    onPressed?: () => void,
}

export interface ContextMenuItemProps {
    name: string,

    disabled: boolean,

    onPressed: () => void,
}

export class ContextMenuItem extends DisplayComponent<ContextMenuItemProps> {
    private readonly root = FSComponent.createRef<HTMLSpanElement>();

    onAfterRender() {
        this.root.instance.addEventListener('click', this.handlePressed);
    }

    private handlePressed = () => this.props.onPressed();

    render(): VNode | null {
        return (
            <span ref={this.root} class={{ 'oanc-context-menu-item': true, 'oanc-context-menu-item-disabled': this.props.disabled }}>{this.props.name}</span>
        );
    }
}
