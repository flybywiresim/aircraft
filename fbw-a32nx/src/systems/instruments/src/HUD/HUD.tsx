// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, ComponentProps, DisplayComponent, FSComponent, Subject, VNode,  
    SubscribableMapFunctions,
    MappedSubject,
    Subscribable,
    ConsumerSubject,ConsumerValue, EventBus,
    HEvent, } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Register, Arinc429Word, Arinc429WordData, FailuresConsumer } from '@flybywiresim/fbw-sdk';

import { A320Failure } from '@failures';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { LagFilter } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import './style.scss';
import { AltitudeIndicator, AltitudeIndicatorOfftape } from './AltitudeIndicator';
import { AttitudeIndicatorFixedCenter, AttitudeIndicatorFixedUpper } from './AttitudeIndicatorFixed';
import { FMA } from './FMA';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator';
import { Horizon } from './AttitudeIndicatorHorizon';
import { LandingSystem } from './LandingSystemIndicator';
import { LinearDeviationIndicator } from './LinearDeviationIndicator';
import { AirspeedIndicator, AirspeedIndicatorOfftape, MachNumber } from './SpeedIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { WindIndicator } from '../../../../../../fbw-common/src/systems/instruments/src/ND/shared/WindIndicator';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';


import { GenericAdirsEvents } from '../../../../../../fbw-common/src/systems/instruments/src/ND/types/GenericAdirsEvents';
import { Layer } from '../MsfsAvionicsCommon/Layer';
// L:A32NX_FWC_FLIGHT_PHASE                         L:A32NX_FMGC_FLIGHT_PHASE
// | 0      |                  |                 |       0    |   Preflight
// | 1      | ELEC PWR         | taxi            |       0    |                
// | 2      | ENG 1 STARTED    | taxi            |       0    |                       
// | 3      | 1ST ENG TO PWR   | takeoff         |       1    |   Takeoff
// | 4      | 80 kt            | takeoff         |       1    |                           
// | 5      | LIFTOFF          | clb             |       1    |                  
// | 6      | 1500ft (in clb)  |                 |       2    |   TO pwr to clmb  .Climb
// | 7      | 800 ft (in desc) |                 |       3    |   Cruise
// | 8      | TOUCHDOWN        | rollout         |       4    |   Descent   
// | 9      | 80 kt            | taxi            |       5    |   Approach  (at IAF reached)
// | 10     | 2nd ENG SHUTDOWN |                 |       6    |   Go Around       taxi
// | &gt; 1 | 5 MIN AFTER      |                 |       7    |   Done  (auto brk off or 30kts)


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
    private flightPhase = -1;
    private declutterMode = 0;
    private xwndMode = false;
    private sSpdXwndModeOn = Subject.create<String>('');
    private sSpdXwndModeOff = Subject.create<String>('');
    private sAltXwndModeOn = Subject.create<String>('');
    private sAltXwndModeOff = Subject.create<String>('');
    private windIndicator = Subject.create<String>('');
    private altTapeMaskFill = "BackgroundFill";
    private lgRightCompressed = false;
    private groundSpeed = 0;
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
        
        sub.on('fwcFlightPhase').whenChanged().handle((fp) => {
            this.xwndMode = SimVar.GetSimVarValue('L:A32NX_HUD_CROSSWIND_MODE','Bool');
            this.declutterMode = SimVar.GetSimVarValue('L:A32NX_HUD_DECLUTTER_MODE','Number');
            this.flightPhase = fp;
            //preflight / taxi
            if(this.flightPhase <= 2 ){
                if(this.declutterMode == 2 ){
                    this.sAltXwndModeOn.set("none");
                    this.sAltXwndModeOff.set("none");
                    this.sSpdXwndModeOn.set("none");
                    this.sSpdXwndModeOff.set("none");
                } 
                if(this.declutterMode < 2 ) {
                    this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                    this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block") ; 
                    this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                    this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
                }  
            }
            //takeoff
            if(this.flightPhase >= 3 && this.flightPhase <= 5){
                this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none");
                this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block");
                this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
            }  
            //clb crz des
            if( this.flightPhase == 6 || this.flightPhase == 7){
                if(this.declutterMode == 2 ){
                    this.sAltXwndModeOn.set("none") ;
                    this.sAltXwndModeOff.set("none");
                    this.sSpdXwndModeOn.set("none");
                    this.sSpdXwndModeOff.set("none");
                }  
                if(this.declutterMode < 2 ) {
                    this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none");
                    this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block");     
                    this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none");
                    this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block");
                }   
            }
            //touchdown rollout
            if( this.flightPhase == 8) {
                this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none");
                this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block");
            } 
            //taxi
            if( this.flightPhase >= 9){    
                if(this.declutterMode == 2 ) {
                    this.sSpdXwndModeOn.set("none");
                    this.sSpdXwndModeOff.set("none");
                } 
                if(this.declutterMode < 2 ){
                    this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none");
                    this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
                }
            }

            (this.declutterMode == 2 ) ?  this.windIndicator.set("none") : this.windIndicator.set("block"); 

            console.log("flighphase: " + this.flightPhase );
        });

        // remove alt tape on rollout
        sub.on('leftMainGearCompressed').whenChanged().handle((value) => {
            this.lgRightCompressed = value;
            console.log('HlgleftComp: '+ this.lgRightCompressed);
            if(this.lgRightCompressed == true){
                if(this.flightPhase >= 7){
                    this.sAltXwndModeOn.set("none");
                    this.sAltXwndModeOff.set("none");
                    this.altTapeMaskFill = "noFill";
                    console.log('HlgleftComp2: ' + this.lgRightCompressed);
                }
            }
        });

        
        sub.on('declutterMode').whenChanged().handle((value) => {
            this.xwndMode = SimVar.GetSimVarValue('L:A32NX_HUD_CROSSWIND_MODE','Bool');
            this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE','Number');
            this.declutterMode = value;
            //preflight / taxi
            if(this.flightPhase <= 2 ){
                if(this.declutterMode == 2 ){
                    this.sAltXwndModeOn.set("none");
                    this.sAltXwndModeOff.set("none");
                    this.sSpdXwndModeOn.set("none");
                    this.sSpdXwndModeOff.set("none");
                } 
                if(this.declutterMode < 2 ) {
                    this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                    this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block") ; 
                    this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                    this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
                }  
            }
            //takeoff
            if(this.flightPhase >= 3 && this.flightPhase <= 5){
                this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none");
                this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block");
                this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
            }  
            (this.declutterMode == 2 ) ?  this.windIndicator.set("none") : this.windIndicator.set("block");
            //clb crz des
            if( this.flightPhase == 6 || this.flightPhase == 7){
                if(this.declutterMode == 2 ){
                    this.sAltXwndModeOn.set("none") ;
                    this.sAltXwndModeOff.set("none");
                    this.sSpdXwndModeOn.set("none");
                    this.sSpdXwndModeOff.set("none");
                }  
                if(this.declutterMode < 2 ) {
                    this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none");
                    this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block");     
                    this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none");
                    this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block");
                }   
            }
            //touchdown rollout
            if( this.flightPhase == 8) {
                this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none");
                this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block");
            } 
            //taxi
            if( this.flightPhase >= 9){    
                (this.declutterMode == 2 ) ? this.sSpdXwndModeOn.set("none") :  this.sSpdXwndModeOff.set("none");
                (this.declutterMode < 2 ) ? this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none") : this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
            }  
            (this.declutterMode == 2 ) ?  this.windIndicator.set("none") : this.windIndicator.set("block");
            console.log("decVal: " + this.declutterMode );
        }); 
          
        sub.on('crosswindMode').whenChanged().handle((value) => {
            this.declutterMode = SimVar.GetSimVarValue('L:A32NX_HUD_DECLUTTER_MODE','Number');
            this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE','Number');
            this.xwndMode = value;
            //preflight / taxi
            if(this.flightPhase <= 2 ){
                if(this.declutterMode == 2 ){
                    this.sAltXwndModeOn.set("none");
                    this.sAltXwndModeOff.set("none");
                    this.sSpdXwndModeOn.set("none");
                    this.sSpdXwndModeOff.set("none");
                } 
                if(this.declutterMode < 2 ) {
                    this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                    this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block") ; 
                    this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                    this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
                }  
            }
            //takeoff
            if(this.flightPhase >= 3 && this.flightPhase <= 5){
                this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none");
                this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block");
                this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none") ;
                this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
            }  
            (this.declutterMode == 2 ) ?  this.windIndicator.set("none") : this.windIndicator.set("block");
            //clb crz des
            if( this.flightPhase == 6 || this.flightPhase == 7){
                if(this.declutterMode == 2 ){
                    this.sAltXwndModeOn.set("none") ;
                    this.sAltXwndModeOff.set("none");
                    this.sSpdXwndModeOn.set("none");
                    this.sSpdXwndModeOff.set("none");
                }  
                if(this.declutterMode < 2 ) {
                    this.sAltXwndModeOn.set(this.xwndMode ? "block" : "none");
                    this.sAltXwndModeOff.set(this.xwndMode ? "none" : "block");     
                    this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none");
                    this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block");
                }   
            }
            //touchdown rollout
            if( this.flightPhase == 8) {
                this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none");
                this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block");
            } 
            //taxi
            if( this.flightPhase >= 9){    
                (this.declutterMode == 2 ) ? this.sSpdXwndModeOn.set("none") :  this.sSpdXwndModeOff.set("none");
                (this.declutterMode < 2 ) ? this.sSpdXwndModeOn.set(this.xwndMode ? "block" : "none") : this.sSpdXwndModeOff.set(this.xwndMode ? "none" : "block") ;
            }  
            (this.declutterMode == 2 ) ?  this.windIndicator.set("none") : this.windIndicator.set("block");
            console.log("xwindVal: " + this.xwndMode);
        });
          
        sub.on('speed').whenChanged().handle((value) => {
            
            this.groundSpeed = value;
            if(this.groundSpeed < 30){
                console.log('speed < 30: ' + this.lgRightCompressed);
                this.altTapeMaskFill = "BackgroundFill";
            }
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
                        <g id="AltTapeMask" display={this.sAltXwndModeOff}>
                            <path id="AltitudeTapeMask" class="BlackFill" d="m1045 322 h 114 v 365 h-114z" ></path>
                        </g>
                        <g id="SpdTapeMask" display={this.sSpdXwndModeOff}>
                            <path id="SpeedTapeMask" class="BlackFill" d="m70 322 h 98 v 365 h-98z"></path>

                        </g>
                        {/* <path id="AltTapeMask" class="BlackFill" d="m1059 274 h 98 v 364 h-98z"></path>
                        <path id="SpeedTapeMask" class="BlackFill" d="m70 274 h 98 v 364 h-98z"></path> */}
                    </g>

                    <g id="WindIndicator" class="Wind" transform="translate(250 200) " display={this.windIndicator} >
                        <WindIndicator bus={this.props.bus} />
                    </g>


                    <AttitudeIndicatorFixedCenter 
                    bus={this.props.bus} 
                    isAttExcessive={this.isAttExcessive}
                    filteredRadioAlt={this.filteredRadioAltitude} />

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
                        display={this.sSpdXwndModeOff}
                        d="M 60 0 H 208 V 1024 H 60 Z  M 61 323 v 364 h 146 v -364 z" 
                        // d="M 60 0 H 208 V 1024 H 60 Z  M 61 274 v 364 h 146 v -364 z" 
                        />
                        <path
                        id="Mask3"
                        class={this.altTapeMaskFill}
                        display={this.sAltXwndModeOff}
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
