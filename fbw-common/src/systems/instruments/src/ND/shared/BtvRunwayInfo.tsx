// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, EventBus, Subject, VNode, MappedSubject, ConsumerSubject } from '@microsoft/msfs-sdk';

import { FmsOansData } from 'instruments/src/OANC';
import { Layer } from '../../MsfsAvionicsCommon/Layer';

export class BtvRunwayInfo extends DisplayComponent<{ bus: EventBus }> {
    private readonly fmsRwyIdent = ConsumerSubject.create<string | null>(null, null);

    private readonly runwayIdent = ConsumerSubject.create<string | null>(null, null);

    private readonly runwayLength = ConsumerSubject.create<number | null>(null, null);

    private readonly exitIdent = ConsumerSubject.create<string | null>(null, null);

    private readonly exitDistance = ConsumerSubject.create<number | null>(null, null);

    private readonly runwayInfoString = MappedSubject.create(
        ([ident, length]) => ((ident && length) ? `${ident.substring(2).padStart(5, '\xa0')}${length.toFixed(0).padStart(6, '\xa0')}` : ''),
        this.runwayIdent,
        this.runwayLength,
    );

    private readonly runwayBearing = ConsumerSubject.create<number | null>(null, null);

    private readonly btvFmsDisagree = MappedSubject.create(
        ([btv, fms, exit]) => fms && btv && !exit && btv !== fms,
        this.runwayIdent,
        this.fmsRwyIdent,
        this.exitIdent,
    );

    private readonly exitInfoString = MappedSubject.create(
        ([ident, dist]) => ((ident && dist) ? `${ident.padStart(4, '\xa0')}${dist.toFixed(0).padStart(6, '\xa0')}` : ''),
        this.exitIdent,
        this.exitDistance,
    );

    private readonly rot = Subject.create<string | null>(null);

    private readonly turnaroundMaxRev = ConsumerSubject.create(null, 0);

    private readonly turnaroundIdleRev = ConsumerSubject.create(null, 0);

    private readonly turnaroundString = MappedSubject.create(
        ([idle, max]) => ((idle > 0 && max > 0) ? `${max.toFixed(0).padStart(3, '\xa0')}'/${idle.toFixed(0).padStart(3, '\xa0')}'` : ''),
        this.turnaroundIdleRev,
        this.turnaroundMaxRev,
    );

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<FmsOansData>();

        this.fmsRwyIdent.setConsumer(sub.on('fmsLandingRunway'));
        this.runwayIdent.setConsumer(sub.on('oansSelectedLandingRunway'));
        this.exitIdent.setConsumer(sub.on('oansSelectedExit'));
        this.exitDistance.setConsumer(sub.on('oansRequestedStoppingDistance'));
        this.runwayLength.setConsumer(sub.on('oansSelectedLandingRunwayLength'));
        this.runwayBearing.setConsumer(sub.on('oansSelectedLandingRunwayBearing'));

        sub.on('btvRot').whenChanged().handle((it) => {
            this.rot.set(it > 0 ? it.toFixed(0).padStart(4, '\xa0') : '');
        });

        this.turnaroundIdleRev.setConsumer(sub.on('btvTurnAroundIdleReverse'));
        this.turnaroundMaxRev.setConsumer(sub.on('btvTurnAroundMaxReverse'));
    }

    render(): VNode | null {
        return (
            <>
                <g visibility={this.runwayIdent.map((it) => (it ? 'visible' : 'hidden'))}>
                    <Layer x={2} y={54}>
                        <text x={0} y={0} class="White FontSmallest">RWY</text>
                        <text x={50} y={0} class="Green FontSmallest">{this.runwayInfoString}</text>
                        <text x={205} y={0} class="Cyan FontSmallest">M</text>
                        <text x={225} y={0} class="White FontSmallest">-</text>
                        <text x={245} y={0} class="Green FontSmallest">{this.runwayBearing.map((it) => it?.toFixed(0))}</text>
                        <text x={283} y={0} class="Cyan FontSmallest">°</text>
                    </Layer>
                </g>
                <g visibility={this.btvFmsDisagree.map((it) => (it ? 'visible' : 'hidden'))}>
                    <Layer x={2} y={82}>
                        <rect x={0} y={-20} width={280} height={21} />
                        <text x={0} y={0} class="Amber FontSmallest">BTV/FMS RWY DISAGREE</text>
                    </Layer>
                </g>
                <g visibility={MappedSubject.create(([rwy, exit]) => (rwy !== null && !exit ? 'visible' : 'hidden'), this.runwayIdent, this.exitIdent)}>
                    <Layer x={this.btvFmsDisagree.map(() => 2)} y={this.btvFmsDisagree.map((it) => (it ? 111 : 82))}>
                        <rect x={0} y={-20} width={266} height={21} />
                        <text x={0} y={0} class="White FontSmallest">FOR BTV:SELECT EXIT</text>
                    </Layer>
                </g>
                <g visibility={this.exitInfoString.map((it) => (it ? 'visible' : 'hidden'))}>
                    <Layer x={2} y={82}>
                        <rect x={0} y={-20} width={64} height={21} />
                        <text x={0} y={0} class="White FontSmallest">EXIT</text>
                        <rect x={64} y={-20} width={154} height={21} />
                        <text x={64} y={0} class="Green FontSmallest">{this.exitInfoString}</text>
                        <text x={205} y={0} class="Cyan FontSmallest">M</text>
                    </Layer>
                </g>
                <g visibility={MappedSubject.create(([exit, rot]) => (exit && rot ? 'visible' : 'hidden'), this.exitIdent, this.rot)}>
                    <Layer x={2} y={111}>
                        <rect x={0} y={-20} width={121} height={21} />
                        <text x={0} y={0} class="White FontSmallest">ROT</text>
                        <text x={50} y={0} class="Green FontSmallest">{this.rot}</text>
                        <text x={107} y={0} class="Cyan FontSmallest">s</text>
                    </Layer>
                </g>
                <g visibility={MappedSubject.create(([exit, ta]) => (exit && ta ? 'visible' : 'hidden'), this.exitIdent, this.turnaroundString)}>
                    <Layer x={2} y={140}>
                        <rect x={0} y={-20} width={276} height={21} />
                        <text x={0} y={0} class="White FontSmallest">TURNAROUND</text>
                        <text x={150} y={0} class="Green FontSmallest">{this.turnaroundString}</text>
                    </Layer>
                </g>
            </>
        );
    }
}