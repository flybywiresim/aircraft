// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';

import { calculateHorizonOffsetFromPitch } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';

const DistanceSpacing = 147;
const ValueSpacing = 5;

interface FlightPathVectorData {
    roll: Arinc429WordData;
    pitch: Arinc429WordData;
    fpa: Arinc429WordData;
    da: Arinc429WordData;
}

export class FlightPathVector extends DisplayComponent<{ bus: ArincEventBus }> {
    private bird = FSComponent.createRef<SVGGElement>();

    private fpvFlag = FSComponent.createRef<SVGGElement>();

    private isTrkFpaActive = false;

    private data: FlightPathVectorData = {
        roll: new Arinc429Word(0),
        pitch: new Arinc429Word(0),
        fpa: new Arinc429Word(0),
        da: new Arinc429Word(0),
    }

    private needsUpdate = false;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents>();

        sub.on('trkFpaActive').whenChanged().handle((a) => {
            this.isTrkFpaActive = a;
            if (this.isTrkFpaActive) {
                this.moveBird();
                this.bird.instance.classList.remove('HiddenElement');
            } else {
                this.bird.instance.classList.add('HiddenElement');
            }
        });

        sub.on('fpa').handle((fpa) => {
            this.data.fpa = fpa;
            this.needsUpdate = true;
        });

        sub.on('da').handle((da) => {
            this.data.da = da;
            this.needsUpdate = true;
        });

        sub.on('rollAr').handle((r) => {
            this.data.roll = r;
            this.needsUpdate = true;
        });

        sub.on('pitchAr').handle((p) => {
            this.data.pitch = p;
            this.needsUpdate = true;
        });

        sub.on('realTime').handle((_t) => {
            if (this.needsUpdate) {
                this.needsUpdate = false;

                const daAndFpaValid = this.data.fpa.isNormalOperation() && this.data.da.isNormalOperation();
                if (this.isTrkFpaActive && daAndFpaValid) {
                    this.fpvFlag.instance.style.visibility = 'hidden';
                    this.bird.instance.classList.remove('HiddenElement');
                    this.moveBird();
                } else if (this.isTrkFpaActive && this.data.pitch.isNormalOperation() && this.data.roll.isNormalOperation()) {
                    this.fpvFlag.instance.style.visibility = 'visible';
                    this.bird.instance.classList.add('HiddenElement');
                }
            }
        });
    }

    private moveBird() {
        const daLimConv = Math.max(Math.min(this.data.da.value, 26), -26) * DistanceSpacing / ValueSpacing;
        const pitchSubFpaConv = (calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value));
        const rollCos = Math.cos(this.data.roll.value * Math.PI / 180);
        const rollSin = Math.sin(-this.data.roll.value * Math.PI / 180);

        const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
        const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

        this.bird.instance.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0px)`;
    }

    render(): VNode {
        return (
            <>
                <g ref={this.bird} id="bird">
                    <svg x="461.875" y="218.7" width="100.25" height="36" version="1.1" viewBox="0 0 100.25 36" xmlns="http://www.w3.org/2000/svg">
                        <g>
                            <circle
                                class="NormalStroke Green"
                                cx="50.25"
                                cy="23.25"
                                r="12.5"
                            />
                            <path
                                class="NormalStroke Green"
                                d="m 0.25,23.25 c 0.21875,0 37.25,0 37.25,0"

                            />
                            <path
                                class="NormalStroke Green"
                                d="m 62.75,23.25 c 0.21875,0 37.25,0 37.25,0"

                            />
                            <path
                                class="NormalStroke Green"
                                d="M 50,10.5 V 0.25"

                            />
                        </g>
                    </svg>
                </g>
                <text ref={this.fpvFlag} style="visibility:hidden" id="FPVFlag" x="62.987099" y="89.42025" class="Blink9Seconds FontLargest Red EndAlign">FPV</text>
            </>
        );
    }
}
