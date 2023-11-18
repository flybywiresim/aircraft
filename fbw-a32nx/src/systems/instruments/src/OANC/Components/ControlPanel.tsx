// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, VNode, Subscribable, Subscription, MapSubject } from '@microsoft/msfs-sdk';

import './ControlPanel.scss';

export interface ControlPanelProps {
    isVisible: Subscribable<boolean>,
}

export class ControlPanel extends DisplayComponent<ControlPanelProps> {
    private readonly subscriptions: Subscription[] = [];

    private readonly style = MapSubject.create<string, string>();

    onAfterRender() {
        this.subscriptions.push(
            this.props.isVisible.sub((it) => this.style.setValue('visibility', it ? 'visible' : 'hidden'), true),
        );
    }

    render(): VNode | null {
        return (
            <div class="oanc-control-panel" style={this.style}>
                bruh
            </div>
        );
    }
}
