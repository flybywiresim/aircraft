// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, EventBus, Subject, VNode } from '@microsoft/msfs-sdk';

import { OansControlEvents } from 'instruments/src/OANC';
import { Layer } from '../../MsfsAvionicsCommon/Layer';

export class BtvRunwayInfo extends DisplayComponent<{ bus: EventBus }> {
    private readonly runwayInfoString = Subject.create('');

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<OansControlEvents>();

        sub.on('oansRunwayInfo').whenChanged().handle((it) => {
            this.runwayInfoString.set(`${it.ident.padStart(5, '\xa0')}${it.length.toFixed(0).padStart(6, '\xa0')}M`);
        });
    }

    render(): VNode | null {
        return (
            <Layer x={2} y={58}>
                <text x={0} y={0} class="White FontSmallest">RWY</text>
                <text x={50} y={0} class="Green FontSmallest">{this.runwayInfoString}</text>
            </Layer>
        );
    }
}
