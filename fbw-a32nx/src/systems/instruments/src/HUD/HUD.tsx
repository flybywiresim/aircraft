// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, ComponentProps, DisplayComponent, FSComponent, Subject, VNode,
    Subscribable,
    HEvent, } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Register, Arinc429Word, Arinc429WordData, FailuresConsumer } from '@flybywiresim/fbw-sdk';

import { A320Failure } from '@failures';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import './style.scss';
import { AltitudeIndicator, AltitudeIndicatorOfftape } from './AltitudeIndicator';
import { AttitudeIndicatorFixedCenter, AttitudeIndicatorFixedUpper } from './AttitudeIndicatorFixed';
import { FMA } from './FMA';
import { Horizon } from './AttitudeIndicatorHorizon';
import { LandingSystem } from './LandingSystemIndicator';
import { LinearDeviationIndicator } from './LinearDeviationIndicator';
import { AirspeedIndicator, AirspeedIndicatorOfftape, MachNumber } from './SpeedIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { WindIndicator } from '../../../../../../fbw-common/src/systems/instruments/src/ND/shared/WindIndicator';
import { AutoThrustMode, VerticalMode } from '@shared/autopilot';
import { HudElemsVis, LagFilter, getBitMask } from './HUDUtils';


export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a32nx-hud')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

interface HUDProps extends ComponentProps {
    bus: ArincEventBus;
    //flightPhase: FmgcFlightPhase;
    instrument: BaseInstrument;
}

export class HUDComponent extends DisplayComponent<HUDProps> {
    private elems : HudElemsVis = {
        xWindAltTape    : Subject.create<String>(''),
        altTape         : Subject.create<String>(''),
        xWindSpdTape    : Subject.create<String>(''),
        spdTapeOrForcedOnLand         : Subject.create<String>(''),
        altTapeMaskFill : Subject.create<String>(''),
        windIndicator   : Subject.create<String>(''), 
      };
    
      private setElems() {
        this.elems.altTape         .set(getBitMask(this.onToPower, this.onGround, this.crosswindMode, this.declutterMode).altTape );
        this.elems.altTapeMaskFill .set(getBitMask(this.onToPower, this.onGround, this.crosswindMode, this.declutterMode).altTapeMaskFill);
        this.elems.spdTapeOrForcedOnLand         .set(getBitMask(this.onToPower, this.onGround, this.crosswindMode, this.declutterMode).spdTapeOrForcedOnLand);
        this.elems.windIndicator   .set(getBitMask(this.onToPower, this.onGround, this.crosswindMode, this.declutterMode).windIndicator);
        this.elems.xWindAltTape    .set(getBitMask(this.onToPower, this.onGround, this.crosswindMode, this.declutterMode).xWindAltTape);
        this.elems.xWindSpdTape    .set(getBitMask(this.onToPower, this.onGround, this.crosswindMode, this.declutterMode).xWindSpdTape); 
      }
    private onLanding = false;
    private groundSpeed = 0;
    private onRollout = false;
    private onDecel = false;
    private landSpeed = false;
    private flightPhase = -1;
    private declutterMode = 0;
    private bitMask = 0;
    private athMode = 0;
    private onToPower = false;
    private onGround = true;
    private crosswindMode = false;
    private lgRightCompressed = false;
    private headingFailed = Subject.create(true);

    private displayBrightness = Subject.create(0);

    private displayFailed = Subject.create(false);

    private displayPowered = Subject.create(false);

    private isAttExcessive = Subject.create(false);

    private pitch: Arinc429WordData = Arinc429Register.empty();

    private roll = new Arinc429Word(0);

    private ownRadioAltitude = new Arinc429Word(0);

    private filteredRadioAltitude = Subject.create(0);

    private radioAltitudeFilter = new LagFilter(5);

    private failuresConsumer;

    constructor(props: HUDProps) {
        super(props);
        this.failuresConsumer = new FailuresConsumer('A32NX');

    }

    
    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        
        const isCaptainSide = getDisplayIndex() === 1;
        
        this.failuresConsumer.register(isCaptainSide ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay);
        
        const sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents & DmcLogicEvents & HUDSimvars & HEvent>();

        sub.on('fmgcFlightPhase').whenChanged().handle((fp) => {
            console.log("fmgc flighphase: " + fp );
           
        })
        
        sub.on('activeVerticalMode').whenChanged().handle((value)=>{
            (value == VerticalMode.ROLL_OUT) ? this.onRollout = true : this.onRollout = false;
            if(this.onGround && this.landSpeed && (this.onDecel || this.onRollout)){
                this.onLanding = true;
            }else{
                this.onLanding = false;
            }
        })

        sub.on('autoBrakeDecel').whenChanged().handle((value)=>{
            this.onDecel = value;
                        if(this.onGround && this.landSpeed && (this.onDecel || this.onRollout)){
                this.onLanding = true;
            }else{
                this.onLanding = false;
            }
        })

        sub.on('groundSpeed').whenChanged().handle((value)=>{
            this.groundSpeed = value;
            (this.groundSpeed > 30) ? this.landSpeed = true : this.landSpeed = false;
            if(this.onGround && this.landSpeed && (this.onDecel || this.onRollout)){
                this.onLanding = true;
            }else{
                this.onLanding = false;
            }
        })
        sub.on('leftMainGearCompressed').whenChanged().handle((value) => {
            this.onGround = value;

            if(this.onGround && this.landSpeed && (this.onDecel || this.onRollout)){
                this.onLanding = true;
            }else{
                this.onLanding = false;
            }

            this.setElems();
        })

        sub.on('AThrMode').whenChanged().handle((value)=>{
            this.athMode = value;
            (this.athMode == AutoThrustMode.MAN_FLEX || 
                this.athMode == AutoThrustMode.MAN_TOGA || 
                this.athMode == AutoThrustMode.TOGA_LK
            ) ? this.onToPower = true : this.onToPower = false;
            this.setElems();
        })

        sub.on('declutterMode').whenChanged().handle((value) => {
            this.declutterMode = value;
            this.setElems();
        
        })
        sub.on('crosswindMode').whenChanged().handle((value) => {
            this.crosswindMode = value;
            this.setElems();
        
        })
    

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.displayBrightness.set(value);
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.displayPowered.set(value);
        });

        sub.on('heading').handle((h) => {
            this.headingFailed.set(!h.isNormalOperation());
        });

        sub.on('rollAr').handle((r) => {
            this.roll = r;
        });

        sub.on('pitchAr').handle((p) => {
            this.pitch = p;
        });

        sub.on('realTime').atFrequency(1).handle((_t) => {
            this.failuresConsumer.update();
            this.displayFailed.set(this.failuresConsumer.isActive(isCaptainSide ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay));
            if (!this.isAttExcessive.get() && ((this.pitch.isNormalOperation()
            && (this.pitch.value > 25 || this.pitch.value < -13)) || (this.roll.isNormalOperation() && Math.abs(this.roll.value) > 45))) {
                this.isAttExcessive.set(true);
            } else if (this.isAttExcessive.get() && this.pitch.isNormalOperation() && this.pitch.value < 22 && this.pitch.value > -10
            && this.roll.isNormalOperation() && Math.abs(this.roll.value) < 40) {
                this.isAttExcessive.set(false);
            }
        });

        sub.on('chosenRa').handle((ra) => {
            this.ownRadioAltitude = ra;
            const filteredRadioAltitude = this.radioAltitudeFilter.step(this.ownRadioAltitude.value, this.props.instrument.deltaTime / 1000);
            this.filteredRadioAltitude.set(filteredRadioAltitude);
        });
    }

    render(): VNode {
        return (
            <DisplayUnit
                failed={this.displayFailed}
                bus={this.props.bus}
                powered={this.displayPowered}
                brightness={this.displayBrightness}
                normDmc={getDisplayIndex()}
            >
                <svg class="hud-svg" version="1.1" viewBox="0 0 1280 1024" xmlns="http://www.w3.org/2000/svg">
                    <Horizon
                        bus={this.props.bus}
                        instrument={this.props.instrument}
                        isAttExcessive={this.isAttExcessive}
                        filteredRadioAlt={this.filteredRadioAltitude}
                    />
                       

                    <path id="PitchScaleMask"  class= "BackgroundFill"  
                        d="m 0 0 h 1280 v 1024 h -1280 Z M 1 125 h 1278 v 800 h -1278 Z"/> 

                    <g id="TapesMasks" >
                        <g id="AltTapeMask" display={this.elems.altTape}>
                            <path id="AltitudeTapeMask" class="BlackFill" d="m1045 322 h 114 v 365 h-114z" ></path>
                        </g>
                        <g id="SpdTapeMask" display={this.elems.spdTapeOrForcedOnLand}>
                            <path id="SpeedTapeMask" class="BlackFill" d="m70 322 h 98 v 365 h-98z"></path>

                        </g>
                    </g> 

                    <g id="WindIndicator" class="Wind" transform="translate(250 200) " display={this.elems.windIndicator} >
                        <WindIndicator bus={this.props.bus} />
                    </g>


                    <AttitudeIndicatorFixedCenter 
                    bus={this.props.bus} 
                    isAttExcessive={this.isAttExcessive}
                    filteredRadioAlt={this.filteredRadioAltitude}
                    instrument={this.props.instrument} />

                    <AltitudeIndicator bus={this.props.bus} />
                    <AirspeedIndicator
                        bus={this.props.bus}
                        instrument={this.props.instrument}
                    /> 

                    {/* mask2 speedtape draw limits | mask3 altTape draw limits */}
                    <g id="TapesMasks2" >
                        <path
                        id="Mask2"
                        class="BackgroundFill"
                        display={this.elems.spdTapeOrForcedOnLand}
                        d="M 60 0 H 208 V 1024 H 60 Z  M 61 323 v 364 h 146 v -364 z" 
                        // d="M 60 0 H 208 V 1024 H 60 Z  M 61 274 v 364 h 146 v -364 z" 
                        />
                        <path
                        id="Mask3"
                        class={this.elems.altTapeMaskFill.get().toString()}
                        display={this.elems.altTape}
                        d="M 1038 250 h 122 V 720 H 1038 Z  M 1039 323 v 364 h 120 v -364 z" 
                        // d="M 1038 250 h 122 V 700 H 1038 Z  M 1039 274 v 364 h 120 v -364 z" 
                        />
                    </g>
                    
                     <AirspeedIndicatorOfftape bus={this.props.bus} /> 
                    <LandingSystem bus={this.props.bus} instrument={this.props.instrument} />
                    <AttitudeIndicatorFixedUpper bus={this.props.bus} />
                    <VerticalSpeedIndicator bus={this.props.bus} instrument={this.props.instrument} filteredRadioAltitude={this.filteredRadioAltitude} />
                    {/* <HeadingOfftape bus={this.props.bus} failed={this.headingFailed} /> */}
                    <AltitudeIndicatorOfftape bus={this.props.bus} filteredRadioAltitude={this.filteredRadioAltitude} />
                    <LinearDeviationIndicator bus={this.props.bus} />

                    <MachNumber bus={this.props.bus} />
                    <FMA bus={this.props.bus} isAttExcessive={this.isAttExcessive} />
                </svg>
            </DisplayUnit>
        );
    }




}
