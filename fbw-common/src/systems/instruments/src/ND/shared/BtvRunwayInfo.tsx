// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, EventBus, Subject, VNode, MappedSubject } from '@microsoft/msfs-sdk';

import { FmsOansData } from 'instruments/src/OANC';
import { Layer } from '../../MsfsAvionicsCommon/Layer';

export class BtvRunwayInfo extends DisplayComponent<{ bus: EventBus }> {
    private runwayIdent = Subject.create<string>('');

    private runwayLength = Subject.create<number>(0);

    private readonly runwayInfoString = MappedSubject.create(
        ([ident, length]) => `${ident.padStart(5, '\xa0')}${length.toFixed(0).padStart(6, '\xa0')}`,
        this.runwayIdent,
        this.runwayLength,
    );

    private readonly exitInfoString = Subject.create<string | null>('');

    private readonly rot = Subject.create<string | null>(null);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<FmsOansData>();

        sub.on('fmsLandingRunway').whenChanged().handle((it) => this.runwayIdent.set(it.substring(2)));
        sub.on('fmsLandingRunwayLength').whenChanged().handle((it) => this.runwayLength.set(it));

        sub.on('oansRequestedStoppingDistance').whenChanged().handle((it) => {
            this.exitInfoString.set(it ? `${'N/A'.padStart(4, '\xa0')}${it.toFixed(0).padStart(6, '\xa0')}` : null);
        });

        sub.on('btvRot').whenChanged().handle((it) => {
            this.rot.set(it ? it.toFixed(0).padStart(4, '\xa0') : null);
        });
    }

    render(): VNode | null {
        return (
            <>
                <Layer x={2} y={54}>
                    <text x={0} y={0} class="White FontSmallest">RWY</text>
                    <text x={50} y={0} class="Green FontSmallest">{this.runwayInfoString}</text>
                    <text x={205} y={0} class="Cyan FontSmallest">M</text>
                </Layer>
                <g visibility={this.exitInfoString.map((it) => (it ? 'visible' : 'hidden'))}>
                    <Layer x={2} y={82}>
                        <rect x={64} y={-20} width={154} height={21} />
                        <text x={0} y={0} class="White FontSmallest">EXIT</text>
                        <text x={64} y={0} class="Green FontSmallest">{this.exitInfoString}</text>
                        <text x={205} y={0} class="Cyan FontSmallest">M</text>
                    </Layer>
                </g>
                <g visibility={this.rot.map((it) => (it ? 'visible' : 'hidden'))}>
                    <Layer x={2} y={111}>
                        <rect x={50} y={-20} width={70} height={21} />
                        <text x={0} y={0} class="White FontSmallest">ROT</text>
                        <text x={50} y={0} class="Green FontSmallest">{this.rot}</text>
                        <text x={107} y={0} class="Cyan FontSmallest">s</text>
                    </Layer>
                </g>
            </>
        );
    }
}
