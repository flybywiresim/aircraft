// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, NodeReference, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { ArmedLateralMode, ArmedVerticalMode, isArmed, LateralMode, VerticalMode } from '@shared/autopilot';

import { SimplaneValues } from 'instruments/src/HUD/shared/SimplaneValueProvider';
import { getDisplayIndex } from './HUD';
import { calculateHorizonOffsetFromPitch } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';

const DistanceSpacing = 1024 / 28 * 5;
const ValueSpacing = 5;

interface FlightPathVectorData {
    roll: Arinc429WordData;
    pitch: Arinc429WordData;
    fpa: Arinc429WordData;
    da: Arinc429WordData;
}

export class FlightPathVector extends DisplayComponent<{ bus: ArincEventBus }> {
    private bird = FSComponent.createRef<SVGGElement>();

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
                if (daAndFpaValid) {
                    this.bird.instance.classList.remove('HiddenElement');
                    this.moveBird();
                } else {
                    this.bird.instance.classList.add('HiddenElement');
                }
            }
        });
    }

    private moveBird() {
        const daLimConv = this.data.da.value * DistanceSpacing / ValueSpacing;
        const pitchSubFpaConv = (calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value));
        const rollCos = Math.cos(this.data.roll.value * Math.PI / 180);
        const rollSin = Math.sin(-this.data.roll.value * Math.PI / 180);

        const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
        const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

        this.bird.instance.style.transform = `translate3d(${xOffset}px, ${yOffset - 182.86}px, 0px)`;
    }

    render(): VNode {
        return (
            <>
                <g ref={this.bird} id="bird">
                    <g>
                        <circle
                            class="NormalStroke Green"
                            cx="640"
                            cy="512"
                            r="16"
                        />
                        <path
                            class="NormalStroke Green"
                            d="m 590,512 h 34"

                        />
                        <path
                            class="NormalStroke Green"
                            d="m 656,512 h 34"

                        />
                        <path
                            class="NormalStroke Green"
                            d="M 640,496 V 484"

                        />
                    </g>
                    <TotalFlightPathAngle bus={this.props.bus} />
                    <FlightPathDirector bus={this.props.bus} />
                    <SelectedFlightPathAngle bus={this.props.bus} />
                    <DeltaSpeed bus={this.props.bus} />
                </g>
            </>
        );
    }
}

// FIXME the same logic with the speed trend tape. Need confirmation.

export class TotalFlightPathAngle extends DisplayComponent<{ bus: ArincEventBus }> {
    private refElement = FSComponent.createRef<SVGGElement>();

    private vCTrend = new Arinc429Word(0);

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<Arinc429Values>();

        sub.on('vCTrend').withArinc429Precision(2).handle((word) => {
            this.vCTrend = word;

            if (this.vCTrend.isNormalOperation()) {
                this.refElement.instance.style.visibility = 'visible';
                const offset = -this.vCTrend.value * 28 / 5;
                this.refElement.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
            } else {
                this.refElement.instance.style.visibility = 'hidden';
            }
        });
    }

    render(): VNode | null {
        return (
            <g id="TotalFlightPathAngle" ref={this.refElement}>
                <path class="NormalStroke Green" d="m 574,500 12,12 -12,12" />
                <path class="NormalStroke Green" d="m 706,500 -12,12 12,12" />
            </g>
        );
    }
}

interface FlightPathDirectorData {
    roll: Arinc429WordData;
    pitch: Arinc429WordData;
    fpa: Arinc429WordData;
    da: Arinc429WordData;
    activeVerticalMode: number;
    activeLateralMode: number;
    fdRoll: number;
    fdPitch: number;
    fdActive: boolean;
}

export class FlightPathDirector extends DisplayComponent<{bus: ArincEventBus}> {
    private data: FlightPathDirectorData = {
        roll: new Arinc429Word(0),
        pitch: new Arinc429Word(0),
        fpa: new Arinc429Word(0),
        da: new Arinc429Word(0),
        fdPitch: 0,
        fdRoll: 0,
        fdActive: true,
        activeLateralMode: 0,
        activeVerticalMode: 0,
    }

    private isTrkFpaActive = false;

    private needsUpdate = false;

    private isVisible = false;

    private birdPath = FSComponent.createRef<SVGGElement>();

    // private birdPathWings = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents>();

        sub.on('fd1Active').whenChanged().handle((fd) => {
            if (getDisplayIndex() === 1) {
                this.data.fdActive = fd;
                this.needsUpdate = true;
            }
        });

        sub.on('fd2Active').whenChanged().handle((fd) => {
            if (getDisplayIndex() === 2) {
                this.data.fdActive = fd;
                this.needsUpdate = true;
            }
        });
        sub.on('trkFpaActive').whenChanged().handle((a) => {
            this.isTrkFpaActive = a;
            this.needsUpdate = true;
        });

        sub.on('fpa').handle((fpa) => {
            this.data.fpa = fpa;
            this.needsUpdate = true;
        });

        sub.on('da').handle((da) => {
            this.data.da = da;
            this.needsUpdate = true;
        });

        sub.on('activeVerticalMode').whenChanged().handle((vm) => {
            this.data.activeLateralMode = vm;
            this.needsUpdate = true;
        });

        sub.on('activeLateralMode').whenChanged().handle((lm) => {
            this.data.activeLateralMode = lm;
            this.needsUpdate = true;
        });

        sub.on('fdPitch').handle((fdp) => {
            this.data.fdPitch = fdp;
            this.needsUpdate = true;
        });

        sub.on('fdBank').handle((fdr) => {
            this.data.fdRoll = fdr;
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
            this.handlePath();
            if (this.needsUpdate && this.isVisible) {
                this.moveBird();
            }
        });
    }

    private handlePath() {
        const daAndFpaValid = this.data.fpa.isNormalOperation() && this.data.da.isNormalOperation();
        if (!this.data.fdActive || !daAndFpaValid) {
            this.birdPath.instance.style.visibility = 'hidden';
            this.isVisible = false;
        } else {
            this.birdPath.instance.style.visibility = 'visible';
            this.isVisible = true;
        }
    }

    private moveBird() {
        if (this.data.fdActive && this.isTrkFpaActive) {
            const FDRollOrder = this.data.fdRoll;
            // FIXME assume that the FPD reaches the wing of the bird when roll order is +-45
            const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 10), -10) * 3.4;
            const FDPitchOrder = this.data.fdPitch;
            const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder, 5), -5) * DistanceSpacing / ValueSpacing;

            const rollCos = Math.cos(this.data.roll.value * Math.PI / 180);
            const rollSin = Math.sin(-this.data.roll.value * Math.PI / 180);

            const xOffset = -FDPitchOrderLim * rollSin + FDRollOrderLim * rollCos;
            const yOffset = FDPitchOrderLim * rollCos + FDRollOrderLim * rollSin;

            this.birdPath.instance.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0px)`;
        }
        this.needsUpdate = false;
    }

    render(): VNode {
        return (

            <g ref={this.birdPath}>
                <circle
                    class="NormalStroke Green"
                    cx="640"
                    cy="512"
                    r="10"
                />
            </g>

        );
    }
}

export class SelectedFlightPathAngle extends DisplayComponent<{ bus: ArincEventBus }> {
    private refElement = FSComponent.createRef<SVGGElement>();

    private vCTrend = new Arinc429Word(0);

    private text = '';

    private fdActive = false;

    private isTrkFpaActive = false;

    private needsUpdate = false;

    private selectedFpa = 0;

    private selectFpaChanged = false;

    private activeVerticalMode = VerticalMode.NONE;

    private armedVerticalMode = VerticalMode.NONE;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & ClockEvents>();

        sub.on('fd1Active').whenChanged().handle((fd) => {
            if (getDisplayIndex() === 1) {
                this.fdActive = fd;
                this.needsUpdate = true;
            }
        });

        sub.on('fd2Active').whenChanged().handle((fd) => {
            if (getDisplayIndex() === 2) {
                this.fdActive = fd;
                this.needsUpdate = true;
            }
        });

        sub.on('trkFpaActive').whenChanged().handle((a) => {
            this.isTrkFpaActive = a;
            this.needsUpdate = true;
        });

        sub.on('activeVerticalMode').whenChanged().handle((vm) => {
            this.activeVerticalMode = vm;
            this.needsUpdate = true;
        });

        sub.on('selectedFpa').whenChanged().handle((a) => {
            this.selectedFpa = a;
            if (this.activeVerticalMode === VerticalMode.FPA) {
                this.selectFpaChanged = true;
            }
            const offset = -this.selectedFpa * 1024 / 28;
            this.refElement.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
            this.needsUpdate = true;
        });

        sub.on('fmaVerticalArmed').whenChanged().handle((vm) => {
            this.armedVerticalMode = vm;
            this.needsUpdate = true;
        });

        sub.on('realTime').handle((_t) => {
            if (this.needsUpdate) {
                this.needsUpdate = false;

                if (this.isTrkFpaActive && this.fdActive && this.selectFpaChanged) {
                    this.selectFpaChanged = false;
                    this.refElement.instance.style.visibility = 'visible';
                    this.refElement.instance.classList.remove('Apear5s');
                    this.refElement.instance.classList.add('Apear5s');
                } else if (this.isTrkFpaActive && this.fdActive && this.armedVerticalMode === VerticalMode.FPA) {
                    this.refElement.instance.classList.remove('Apear5s');
                    this.refElement.instance.style.visibility = 'visible';
                } else {
                    this.refElement.instance.style.visibility = 'hidden';
                }
            }
        });
    }

    render(): VNode | null {
        return (
            <g id="SelectedFlightPathAngle" ref={this.refElement}>
                <circle class="NormalStroke Green" cx="640" cy="512" r="5" />
                <text class="FontLarge StartAlign Green" x="518" y="682">{this.text}</text>
            </g>
        );
    }
}

interface SpeedStateInfo {
    speed: Arinc429WordData,
    selectedTargetSpeed: number,
    managedTargetSpeed: number,
    holdValue: number,
    isSelectedSpeed: boolean,
    isMach: boolean,
}

class DeltaSpeed extends DisplayComponent <{ bus: ArincEventBus }> {
    private speedRefs : NodeReference<SVGElement>[] = [];

    private needsUpdate = true;

    private speedState: SpeedStateInfo = {
        speed: new Arinc429Word(0),
        selectedTargetSpeed: 100,
        managedTargetSpeed: 100,
        holdValue: 100,
        isSelectedSpeed: false,
        isMach: false,
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.needsUpdate = true;

        const sub = this.props.bus.getArincSubscriber<HUDSimvars & SimplaneValues & ClockEvents & Arinc429Values>();

        sub.on('isSelectedSpeed').whenChanged().handle((s) => {
            this.speedState.isSelectedSpeed = s;
            this.needsUpdate = true;
        });

        sub.on('speedAr').withArinc429Precision(2).handle((s) => {
            this.speedState.speed = s;
            this.needsUpdate = true;
        });

        sub.on('holdValue').whenChanged().handle((s) => {
            this.speedState.holdValue = s;
            this.needsUpdate = true;
        });

        sub.on('machActive').whenChanged().handle((s) => {
            this.speedState.isMach = s;
            this.needsUpdate = true;
        });

        sub.on('targetSpeedManaged').whenChanged().handle((s) => {
            this.speedState.managedTargetSpeed = s;
            this.needsUpdate = true;
        });

        sub.on('realTime').handle(this.onFrameUpdate.bind(this));
    }

    private setVisible(refNum: number[]) {
        for (let i = 0; i < 6; i++) {
            if (refNum.includes(i)) {
                this.speedRefs[i].instance.style.visibility = 'visible';
            } else {
                this.speedRefs[i].instance.style.visibility = 'hidden';
            }
        }
    }

    private onFrameUpdate(_realTime: number): void {
        if (this.needsUpdate === true) {
            this.needsUpdate = false;

            if (this.speedState.isSelectedSpeed) {
                if (this.speedState.isMach) {
                    const holdValue = this.speedState.holdValue;
                    this.speedState.selectedTargetSpeed = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', holdValue === null ? undefined : holdValue);
                } else {
                    this.speedState.selectedTargetSpeed = this.speedState.holdValue;
                }
            }

            const deltaSpeed = this.speedState.speed.value - (this.speedState.isSelectedSpeed ? this.speedState.selectedTargetSpeed : this.speedState.managedTargetSpeed);
            const sign = Math.sign(deltaSpeed);

            if (Math.abs(deltaSpeed) < 1) {
                this.setVisible([0]);
            } else if (Math.abs(deltaSpeed) < 10) {
                this.speedRefs[1].instance.setAttribute('d', `m 595,512 v ${-deltaSpeed * 4.6} h 12 v ${deltaSpeed * 4.6}`);
                this.speedRefs[2].instance.setAttribute('d', `m 601,512 v ${-deltaSpeed * 4.6}`);
                this.setVisible([1, 2]);
            } else if (Math.abs(deltaSpeed) < 20) {
                this.speedRefs[1].instance.setAttribute('d', `m 595,512 v ${-deltaSpeed * 4.6} h 12 v ${deltaSpeed * 4.6}`);
                this.speedRefs[2].instance.setAttribute('d', `m 601,512 v ${-sign * 46}`);
                this.speedRefs[3].instance.style.transform = `translate3d(0px, ${-sign * 46}px, 0px)`;
                this.speedRefs[4].instance.setAttribute('d', `m 601,${512 - sign * 46} v ${-sign * (Math.abs(deltaSpeed) - 10) * 4.6}`);
                this.setVisible([1, 2, 3, 4]);
            } else {
                this.speedRefs[5].instance.style.transform = `translate3d(0px, ${-sign * 46}px, 0px)`;
                this.setVisible([5]);
            }
        }
    }

    render(): VNode {
        for (let i = 0; i < 6; i++) {
            this.speedRefs.push(FSComponent.createRef<SVGPathElement>());
        }
        return (
            <>
                <path ref={this.speedRefs[0]} class="NormalStroke CornerRound Green" d="m 595,507.4 h 12 v 9.2 h -12 z" style="visibility:hidden" />
                <path ref={this.speedRefs[1]} class="NormalStroke CornerRound Green" style="visibility:hidden" />
                <path ref={this.speedRefs[2]} class="NormalStroke CornerRound Green" style="visibility:hidden" />
                <path ref={this.speedRefs[3]} class="NormalStroke CornerRound Green" d="m 595,512 h 12" style="visibility:hidden" />
                <path ref={this.speedRefs[4]} class="NormalStroke CornerRound Green" style="visibility:hidden" />
                <g ref={this.speedRefs[5]} class="NormalStroke CornerRound Green" style="visibility:hidden">
                    <path d="m 595,466 v 92" />
                    <path d="m 601,466 v 92" />
                    <path d="m 607,466 v 92" />
                </g>
            </>
        );
    }
}
