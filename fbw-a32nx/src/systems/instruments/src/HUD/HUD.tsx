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

//           finalGnd=
//            TO pwr+                                                                                                                
//           | onGnd |  xwnd | dec0 | dec1 | dec2 |
//           | 0 | 1 | 0 | 1 |      |      |      |
//           |---|---|---|---|------|------|------|
//           finalGnd 1 xwnd on dec != 2
//     xSpd  | 1 | 1 | 0 | 1 |   1  |   0  |   0  |    108
//     xSpd  | 1 | 1 | 0 | 1 |   0  |   1  |   0  |    106
//           finalGnd 1 xwnd on dec == 2
//     xSpd  | 1 | 1 | 0 | 1 |   0  |   0  |   1  |    105

//           finalGnd 1 xwnd off dec != 2
//     spd   | 1 | 1 | 1 | 0 |   1  |   0  |   0  |    116                    
//     spd   | 1 | 1 | 1 | 0 |   0  |   1  |   0  |    114  
//           finalGnd 1 xwnd off dec == 2
//     spd   | 1 | 1 | 1 | 0 |   0  |   0  |   1  |    113           

//           finalGnd 0 xwnd on dec != 2
//    xAlt   | 1 | 0 | 0 | 1 |   1  |   0  |   0  |    76     
//    xAlt   | 1 | 0 | 0 | 1 |   0  |   1  |   0  |    74   
//           finalGnd 0 xwnd on dec == 2
//    xAlt   | 1 | 0 | 0 | 1 |   0  |   0  |   1  |    73     

//           finalGnd 0 xwnd off dec != 2
//    alt    | 1 | 0 | 1 | 0 |   1  |   0  |   0  |    84                    
//    alt    | 1 | 0 | 1 | 0 |   0  |   1  |   0  |    82    
//           finalGnd 0 xwnd off dec == 2
//    alt    | 1 | 0 | 1 | 0 |   0  |   0  |   1  |    81     


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
    private bitMask = 0;
    private onPower = false;
    private finalGnd = false;
    private onGround = true;
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

    private getBitMask(gnd: boolean, xwndMode: boolean, decclutterMode: number ) : void{
        const nArr = [];
        let n = -1;
        nArr[0] = 1;
        (gnd) ? nArr[1] = 1 : nArr[1] = 0;
        (xwndMode) ? nArr[2] = 0 : nArr[2] = 1;
        (xwndMode) ? nArr[3] = 1 : nArr[3] = 0;
        (decclutterMode == 0) ? nArr[4] = 1 : nArr[4] = 0;
        (decclutterMode == 1) ? nArr[5] = 1 : nArr[5] = 0;
        (decclutterMode == 2) ? nArr[6] = 1 : nArr[6] = 0;
        this.bitMask = nArr[0]*64 + nArr[1]*32 + nArr[2]*16 + nArr[3]*8 + nArr[4]*4 + nArr[5]*2 + nArr[6]*1;


          //----------
        //finalGnd 1 xwnd on  dec != 2     
        if(this.bitMask == 108 || this.bitMask == 106) {
            this.sAltXwndModeOn.set('block');
            this.sAltXwndModeOff.set('none');
            this.sSpdXwndModeOn.set('block');
            this.sSpdXwndModeOff.set('none');
            this.altTapeMaskFill = "noFill";
            this.windIndicator.set('block');
        }
        //finalGnd 1 xwnd on  dec == 2          
        if(this.bitMask == 105 ) {
            this.sAltXwndModeOn.set('block');
            this.sAltXwndModeOff.set('none');
            this.sSpdXwndModeOn.set('block');
            this.sSpdXwndModeOff.set('none');
            this.altTapeMaskFill = "noFill";
            this.windIndicator.set('block');
        }   

          //----------
        //finalGnd 1 xwnd off  dec != 2     
        if(this.bitMask == 116 || this.bitMask == 114) {
            this.sAltXwndModeOn.set('none');
            this.sAltXwndModeOff.set('block');
            this.sSpdXwndModeOn.set('none');
            this.sSpdXwndModeOff.set('block');
            this.altTapeMaskFill = "BackgroundFill";
            this.windIndicator.set('block');
        }
        //finalGnd 1 xwnd off  dec == 2          
        if(this.bitMask == 113 ) {
            this.sAltXwndModeOn.set('none');
            this.sAltXwndModeOff.set('block');
            this.sSpdXwndModeOn.set('none');
            this.sSpdXwndModeOff.set('block');
            this.altTapeMaskFill = "BackgroundFill";
            this.windIndicator.set('block');
        }     

        
        //----------
        //finalGnd 0 xwnd on  dec != 2     
        if(this.bitMask == 74 || this.bitMask == 76) {
            this.sAltXwndModeOn.set('none');
            this.sAltXwndModeOff.set('none');
            this.sSpdXwndModeOn.set('block');
            this.sSpdXwndModeOff.set('none'); 
            this.altTapeMaskFill = "noFill";
            this.windIndicator.set('block');
        }
        //finalGnd 0 xwnd on  dec == 2          
        if(this.bitMask == 73 ) {
            this.sAltXwndModeOn.set('none');
            this.sAltXwndModeOff.set('none');
            this.sSpdXwndModeOn.set('none');
            this.sSpdXwndModeOff.set('none');  
            this.altTapeMaskFill = "noFill";
            this.windIndicator.set('none');
        }

        //----------
        //finalGnd 0 xwnd off dec !=2       
        if(this.bitMask == 82 || this.bitMask == 84) {
            this.sAltXwndModeOn.set('none');
            this.sAltXwndModeOff.set('none');
            this.sSpdXwndModeOn.set('none');
            this.sSpdXwndModeOff.set('block');  
            this.altTapeMaskFill = "noFill";
            this.windIndicator.set('block');
        }
        //finalGnd 0 xwnd off dec ==2       
        if(this.bitMask == 81) {
            this.sAltXwndModeOn.set('none');
            this.sAltXwndModeOff.set('none');
            this.sSpdXwndModeOn.set('none');
            this.sSpdXwndModeOff.set('none');           
            this.altTapeMaskFill = "noFill";
            this.windIndicator.set('none');
        }
        console.log(
            " bitMask: " + this.bitMask +
            " onGround: " + this.onGround +
            " onPower: " + this.onPower +
            " finalGnd: " + this.finalGnd +
            " declutterMode: " + this.declutterMode +
            " xwndMode: " + this.xwndMode 
        )
    }
    
    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        
        const isCaptainSide = getDisplayIndex() === 1;
        
        this.failuresConsumer.register(isCaptainSide ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay);
        
        const sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents & DmcLogicEvents & HUDSimvars & HEvent>();

        sub.on('fmgcFlightPhase').whenChanged().handle((fp) => {
            console.log("fmgc flighphase: " + fp );
           
        })
        

        sub.on('fwcFlightPhase').whenChanged().handle((value) => {
        this.flightPhase = value;
            (this.flightPhase >= 3 && this.flightPhase < 9) ? this.onPower = true : this.onPower = false;
            (this.onGround == true && this.onPower == true) ? this.finalGnd = true : this.finalGnd = false;
            this.getBitMask(this.finalGnd, this.xwndMode, this.declutterMode);

        })
        sub.on('leftMainGearCompressed').whenChanged().handle((value) => {
            this.onGround = value;
            (this.onGround == true && this.onPower == true) ? this.finalGnd = true : this.finalGnd = false;
            this.getBitMask(this.finalGnd, this.xwndMode, this.declutterMode);
        })
        sub.on('declutterMode').whenChanged().handle((value) => {
            this.declutterMode = value;
            this.getBitMask(this.finalGnd, this.xwndMode, this.declutterMode);
        
        })
        sub.on('crosswindMode').whenChanged().handle((value) => {
            this.xwndMode = value;
            this.getBitMask(this.finalGnd, this.xwndMode, this.declutterMode);
        
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
