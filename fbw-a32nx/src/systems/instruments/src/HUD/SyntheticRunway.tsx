// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, Subscribable, VNode, NodeReference } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData, GenericDataListenerSync, LegType, RunwaySurface, TurnDirection, VorType, EfisOption, EfisNdMode, NdSymbol, NdSymbolTypeFlags, HUDSyntheticRunway } from '@flybywiresim/fbw-sdk';

import { getDisplayIndex } from './HUD';
import { calculateHorizonOffsetFromPitch, getSmallestAngle } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars, HUDSymbolData } from './shared/HUDSimvarPublisher';

export class SyntheticRunway extends DisplayComponent<{bus: ArincEventBus}> {
    private data : HUDSyntheticRunway;

    private alt : number;

    private lat : number;

    private long: number;

    private heading : number;

    private rollGroupRef = FSComponent.createRef<SVGGElement>();

    private pathRefs: NodeReference<SVGTextElement>[] = [];

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HUDSymbolData>();

        sub.on('realTime').atFrequency(16).handle((_t) => {
            this.alt = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
            this.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
            this.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
            this.updateSyntheticRunway();
        });

        sub.on('symbol').handle((data: HUDSyntheticRunway) => {
            this.data = data;
        });

        sub.on('trueHeading').handle((heading) => {
            if (heading.isNormalOperation) {
                this.heading = heading.value;
            }
        });
    }

    updateSyntheticRunway() {
        if (this.data && this.data.cornerCoordinates.length === 4) {
            this.rollGroupRef.instance.style.display = 'block';
            for (let i = 0; i < 4; i++) {
                this.pathRefs[i].instance.setAttribute('d', this.drawPath(this.data.cornerCoordinates[i], this.data.cornerCoordinates[(i + 1) % 4]));
            }
        } else {
            this.rollGroupRef.instance.style.display = 'none';
        }
    }

    drawPath(p1: LatLongAlt, p2:LatLongAlt) {
        const deltaDeg1 = this.calcDeltaDegrees(p1);
        const deltaDeg2 = this.calcDeltaDegrees(p2);
        const vis1 = this.inView(deltaDeg1);
        const vis2 = this.inView(deltaDeg2);
        if (vis1 && vis2) {
            return `M${deltaDeg1[0] * 1280 / 35 + 640},${-deltaDeg1[1] * 1024 / 28 + 512}
            L${deltaDeg2[0] * 1280 / 35 + 640},${-deltaDeg2[1] * 1024 / 28 + 512}`;
        } if (vis1 && !vis2) {
            const deltaDegNew = this.calcDeltaDegrees(this.getInViewPoint(p1, p2));
            return `M${deltaDeg1[0] * 1280 / 35 + 640},${-deltaDeg1[1] * 1024 / 28 + 512}
            L${deltaDegNew[0] * 1280 / 35 + 640},${-deltaDegNew[1] * 1024 / 28 + 512}`;
        } if (!vis1 && vis2) {
            const deltaDegNew = this.calcDeltaDegrees(this.getInViewPoint(p2, p1));
            return `M${deltaDeg2[0] * 1280 / 35 + 640},${-deltaDeg2[1] * 1024 / 28 + 512}
            L${deltaDegNew[0] * 1280 / 35 + 640},${-deltaDegNew[1] * 1024 / 28 + 512}`;
        }
        return '';
    }

    getInViewPoint(p1: LatLongAlt, p2:LatLongAlt) {
        let alpha = 0.5;
        let bestP = p1;
        for (let i = 0; i < 5; i++) {
            const newP = new LatLongAlt(alpha * p1.lat + (1 - alpha) * p2.lat, alpha * p1.long + (1 - alpha) * p2.long, alpha * p1.alt + (1 - alpha) * p2.alt);
            if (this.inView(this.calcDeltaDegrees(newP))) {
                alpha -= 1 / 2 ** (i + 2);
                bestP = newP;
            } else {
                alpha += 1 / 2 ** (i + 2);
            }
        }
        return bestP;
    }

    calcDeltaDegrees(p:LatLongAlt) {
        const dist = Avionics.Utils.computeGreatCircleDistance({ lat: this.lat, long: this.long }, p); // in nautical miles
        const heading = Avionics.Utils.computeGreatCircleHeading({ lat: this.lat, long: this.long }, p); // in degrees
        const deltaHeading = getSmallestAngle(heading, this.heading);
        const deltaPitch = Math.atan((p.alt - this.alt) * 0.3048 / (dist * 1852)) / Math.PI * 180;
        return [deltaHeading, deltaPitch]; // in degrees
    }

    inView(delta: number[]) {
        return Math.abs(delta[0]) <= 25 && Math.abs(delta[1]) <= 28;
    }

    render(): VNode {
        const res : SVGPathElement[] = [];
        for (let i = 0; i < 4; i++) {
            const pathRef = FSComponent.createRef<SVGTextElement>();
            res.push(<path class="NormalStroke Green" ref={pathRef} d="" />);
            this.pathRefs.push(pathRef);
        }
        return (
            <g id="SyntheticRunway" ref={this.rollGroupRef} style="display:none">
                {res}
            </g>
        );
    }
}
