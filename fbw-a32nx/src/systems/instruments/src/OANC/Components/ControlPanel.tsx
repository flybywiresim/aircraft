// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, VNode, Subscribable, Subscription, MapSubject, Subject } from '@microsoft/msfs-sdk';

import './ControlPanel.scss';

export interface ControlPanelProps {
    isVisible: Subscribable<boolean>,
}

export class ControlPanel extends DisplayComponent<ControlPanelProps> {
    private readonly subscriptions: Subscription[] = [];

    private readonly style = MapSubject.create<string, string>();

    private readonly activeTabIndex = Subject.create<1 | 2 | 3>(2);

    onAfterRender() {
        this.subscriptions.push(
            this.props.isVisible.sub((it) => this.style.setValue('visibility', it ? 'visible' : 'hidden'), true),
        );
    }

    render(): VNode | null {
        return (
            <div class="oanc-control-panel-container" style={this.style}>
                <div class="oanc-control-panel-tabs" data-active-tab-index={this.activeTabIndex}>
                    <div class="oanc-control-panel-tabs-dummy" />
                    <ControlPanelTabButton
                        text="MAP DATA"
                        isSelected={this.activeTabIndex.map((it) => it === 1)}
                        onSelected={() => this.activeTabIndex.set(1)}
                    />
                    <ControlPanelTabButton
                        text="ARPT SEL"
                        isSelected={this.activeTabIndex.map((it) => it === 2)}
                        onSelected={() => this.activeTabIndex.set(2)}
                    />
                    <ControlPanelTabButton
                        text="STATUS"
                        isSelected={this.activeTabIndex.map((it) => it === 3)}
                        onSelected={() => this.activeTabIndex.set(3)}
                    />
                </div>

                <div class="oanc-control-panel">
                    bruh
                </div>
            </div>
        );
    }
}

interface ControlPanelTabButtonProps {
    text: string,

    isSelected: Subscribable<boolean>,

    onSelected: () => void,
}

class ControlPanelTabButton extends DisplayComponent<ControlPanelTabButtonProps> {
    private readonly root = FSComponent.createRef<HTMLDivElement>();

    onAfterRender(node: VNode) {
        this.root.instance.addEventListener('click', this.props.onSelected);
    }

    render(): VNode | null {
        return (
            <div
                ref={this.root}
                class={{
                    'oanc-control-panel-tab-button': true,
                    'oanc-control-panel-tab-button-selected': this.props.isSelected,
                }}
            >
                {this.props.text}
            </div>
        );
    }
}
