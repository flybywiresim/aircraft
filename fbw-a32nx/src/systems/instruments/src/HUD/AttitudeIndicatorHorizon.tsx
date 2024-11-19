// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
  HEvent,
  NodeReference,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import {
  ArincEventBus,
  Arinc429Word,
  Arinc429WordData,
  Arinc429ConsumerSubject,
} from '@flybywiresim/fbw-sdk';

import { SyntheticRunway } from 'instruments/src/HUD/SyntheticRunway';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import {
  calculateHorizonOffsetFromPitch,
  LagFilter,
  getSmallestAngle,
} from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HorizontalTape } from './HorizontalTape';
import { getDisplayIndex } from './HUD';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator';

const DisplayRange = 35;
const DistanceSpacing = 182.86;
const ValueSpacing = 5;

interface LSPath {
  roll: Arinc429WordData;
  pitch: Arinc429WordData;
  fpa: Arinc429WordData;
  da: Arinc429WordData;
}

// FIXME check HDG/TRACK mode is engaged? yOffset?
class HeadingBug extends DisplayComponent<{
  bus: ArincEventBus;
  isCaptainSide: boolean;
  yOffset: Subscribable<number>;
}> {
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private sVisibility = Subject.create<String>('');
  private sGndHeadingBugVisibility = Subject.create('block');
  private sAirHeadingBugVisibility = Subject.create('none');


  private isActive = false;

  private selectedHeading = Subject.create(0);

  private heading = Arinc429ConsumerSubject.create(null);

  private attitude = Arinc429ConsumerSubject.create(null);

  private fdActive = ConsumerSubject.create(null, true);

  private horizonHeadingBug = FSComponent.createRef<SVGGElement>();

  private readonly visibilitySub = MappedSubject.create(
    ([heading, attitude, fdActive, selectedHeading]) => {
      const headingDelta = getSmallestAngle(selectedHeading, heading.value);
      const inRange = Math.abs(headingDelta) <= DisplayRange / 2;
      return !fdActive && attitude.isNormalOperation() && heading.isNormalOperation() && inRange;
    },
    this.heading,
    this.attitude,
    this.fdActive,
    this.selectedHeading,
  );

  private readonly headingBugSubject = MappedSubject.create(
    ([heading, selectedHeading, yOffset, visible]) => {
      if (visible) {
        const headingDelta = getSmallestAngle(selectedHeading, heading.value);

        const offset = (headingDelta * DistanceSpacing) / ValueSpacing;

        return `transform: translate3d(${offset}px, 0px, 0px)`;
      }
      return '';
    },
    this.heading,
    this.selectedHeading,
    this.props.yOffset,
    this.visibilitySub,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<DmcLogicEvents & HUDSimvars & Arinc429Values>();

    this.heading.setConsumer(sub.on('heading').withArinc429Precision(2));

    sub.on('fwcFlightPhase').whenChanged().handle((fp) => {
      this.declutterMode = SimVar.GetSimVarValue('L:A32NX_HUD_DECLUTTER_MODE','Number');
      this.flightPhase = fp;
      //onGround
      if(this.flightPhase <= 2 || this.flightPhase >= 9){
          this.sVisibility.set("block"); 
      }
      //inFlight
      if(this.flightPhase > 2 && this.flightPhase <= 8){
          (this.declutterMode == 2 ) ? this.sVisibility.set("none") : this.sVisibility.set("block"); 
      }
  });
  
  sub.on('declutterMode').whenChanged().handle((value) => { 
      (value > 0 ) ? this.sVisibility.set("none") : this.sVisibility.set("block"); 
  }); 
    sub
      .on('selectedHeading')
      .whenChanged()
      .handle((s) => {
        this.selectedHeading.set(s);
      });

    this.attitude.setConsumer(sub.on('pitchAr'));
    this.fdActive.setConsumer(sub.on(this.props.isCaptainSide ? 'fd1Active' : 'fd2Active').whenChanged());

    sub.on('fwcFlightPhase').whenChanged().handle((fp) => {
      this.flightPhase = fp;
      if(fp < 5 || fp >= 9){
        this.sGndHeadingBugVisibility.set('block');
        this.sAirHeadingBugVisibility.set('none');
      }
      if(fp > 4 && fp < 9){
        this.sAirHeadingBugVisibility.set('block');
        this.sGndHeadingBugVisibility.set('none');
      }
    });
      
  }

  render(): VNode {
    return (
      <g
        ref={this.horizonHeadingBug}
        id="HorizonHeadingBug"
        style={this.headingBugSubject}
        display={this.sVisibility}
      >
        
        <path id="gndHorizonHeadingBug" class="ThickStroke" d="m 630,490 h 20 l -10,21z" display={this.sGndHeadingBugVisibility}/>
        <path id="airHorizonHeadingBug" class="ThickStroke Green" d="m 640,500  l 0 24" display={this.sAirHeadingBugVisibility} />
      </g>
    );
  }
}

interface HorizonProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;

}

export class Horizon extends DisplayComponent<HorizonProps> {

  private pitchGroupRef = FSComponent.createRef<SVGGElement>();

  private rollGroupRef = FSComponent.createRef<SVGGElement>();
  
  private pitchProtActiveVisibility = Subject.create('visible');

  private pitchProtLostVisibility = Subject.create('hidden');

  private yOffset = Subject.create(0);

  private headingFailed = Subject.create(true);



  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const apfd = this.props.bus.getArincSubscriber<Arinc429Values & DmcLogicEvents & HUDSimvars & ClockEvents & HEvent>();

  


    apfd.on('heading').handle((h) => {
      this.headingFailed.set(!h.isNormalOperation());
  });


    apfd
      .on('pitchAr')
      .withArinc429Precision(3)
      .handle((pitch) => {
        if (pitch.isNormalOperation()) {
          this.pitchGroupRef.instance.style.display = 'block';

          this.pitchGroupRef.instance.style.transform = `translate3d(0px, ${calculateHorizonOffsetFromPitch(pitch.value) - 182.857}px, 0px)`;
        } else {
          this.pitchGroupRef.instance.style.display = 'none';
        }
        const yOffset = Math.max(Math.min(calculateHorizonOffsetFromPitch(pitch.value), 31.563), -31.563);
        this.yOffset.set(yOffset);

      });

    apfd
      .on('rollAr')
      .withArinc429Precision(2)
      .handle((roll) => {
        if (roll.isNormalOperation()) {
          this.rollGroupRef.instance.style.display = 'block';

          this.rollGroupRef.instance.setAttribute('transform', `rotate(${-roll.value} 640 329.143)`);
        } else {
          this.rollGroupRef.instance.style.display = 'none';
        }
      });





    apfd.on('fcdcDiscreteWord1').handle((fcdcWord1) => {
      const isNormalLawActive = fcdcWord1.bitValue(11) && !fcdcWord1.isFailureWarning();

      this.pitchProtActiveVisibility.set(isNormalLawActive ? 'visible' : 'hidden');
      this.pitchProtLostVisibility.set(!isNormalLawActive ? 'visible' : 'hidden');
    });
  }



  render(): VNode {
    return (
      
      <g id="RollGroup" ref={this.rollGroupRef} style="display:none">


        <g id="PitchGroup" ref={this.pitchGroupRef} class="ScaledStroke Green">

          <TailstrikeIndicator bus={this.props.bus} />


          <HeadingBug bus={this.props.bus} isCaptainSide={getDisplayIndex() === 1} yOffset={this.yOffset} />
          <PitchScale bus={this.props.bus} filteredRadioAlt={this.props.filteredRadioAlt} isAttExcessive={this.props.isAttExcessive}   />

          {/* horizon */}
          <path id="HorizonLine" d="m -100 512 h 1480" class="SmallStroke Green" />

   

          <HorizontalTape
            type="headingTape"
            bus={this.props.bus}
            displayRange={DisplayRange}
            valueSpacing={ValueSpacing}
            distanceSpacing={DistanceSpacing}
            yOffset={Subject.create(0)}
          />
              <HeadingOfftape bus={this.props.bus} failed={this.headingFailed} />

        </g>


        <SideslipIndicator bus={this.props.bus} instrument={this.props.instrument} />

        {/* <RadioAltAndDH
          bus={this.props.bus}
          filteredRadioAltitude={this.props.filteredRadioAlt}
          attExcessive={this.props.isAttExcessive}
        /> */}
      </g>
    );
  }
}




class TailstrikeIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private tailStrike = FSComponent.createRef<SVGPathElement>();

  private tailStrikeConditions = {
    altitude: new Arinc429Word(0),
    speed: 0,
    pitch: 0,
    flightPhase: 0,
    GAtimer: 0,
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents>();

    sub.on('chosenRa').handle((ra) => {
      this.tailStrikeConditions.altitude = ra;
    });

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.tailStrikeConditions.flightPhase = fp;
        if (fp === 6) {
          this.tailStrikeConditions.GAtimer = 1;
        }
      });

    sub
      .on('speedAr')
      .whenChanged()
      .handle((speed) => {
        this.tailStrikeConditions.speed = speed.value;
      });

    sub
      .on('pitchAr')
      .whenChanged()
      .handle((pitch) => {
        if (pitch.isNormalOperation()) {
          if (pitch.value > 10.7) {
            this.tailStrike.instance.classList.add('BlinkInfinite');
          } else {
            this.tailStrike.instance.classList.remove('BlinkInfinite');
          }
        }
      });

    sub.on('realTime').atFrequency(1).handle(this.hideShow.bind(this));
  }

  private hideShow(_time: number) {
    if (this.tailStrikeConditions.GAtimer !== 0) {
      this.tailStrikeConditions.GAtimer += 1;
      if (this.tailStrikeConditions.GAtimer >= 5) {
        this.tailStrikeConditions.GAtimer = 0;
        this.tailStrike.instance.style.display = 'none';
      }
    }
    if (this.tailStrikeConditions.altitude.value > 400 || this.tailStrikeConditions.speed < 50) {
      this.tailStrike.instance.style.display = 'none';
    } else if (this.tailStrikeConditions.flightPhase === 5) {
      this.tailStrike.instance.style.display = 'inline';
    }
  }

  render(): VNode {
    // FIXME: What is the tailstrike pitch limit with compressed main landing gear for A320? Assume 11.7 degrees now.
    // FIXME: further fine tune.
    return (
      <path
        ref={this.tailStrike}
        id="TailstrikeWarning"
        d="m 650.4,62.08 h 8.09 L 640,84.11 621.51,62.08 h 8.09 l 10.4,12.39 z"
        class="ScaledStroke Green"
      />
    );
  }
}

// FIXME move to FPV


interface SideslipIndicatorProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

class SideslipIndicator extends DisplayComponent<SideslipIndicatorProps> {  
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private sVisibility = Subject.create<String>('');
  private latAccFilter = new LagFilter(0.5);

  private estimatedBetaFilter = new LagFilter(2);

  private betaTargetFilter = new LagFilter(2);

  private classNameSub = Subject.create('Yellow');

  private filteredLatAccSub = Subject.create(0);

  private rollTriangle = FSComponent.createRef<SVGPathElement>();

  private slideSlip = FSComponent.createRef<SVGPathElement>();

  private siFailFlag = FSComponent.createRef<SVGPathElement>();

  private onGround = true;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;

  private roll = new Arinc429Word(0);

  private beta = new Arinc429Word(0);

  private betaTarget = new Arinc429Word(0);

  private latAcc = new Arinc429Word(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & ClockEvents>();

   
    sub.on('declutterMode').whenChanged().handle((value) => {
        this.declutterMode = value;
        if(this.onGround){
          this.sVisibility.set("none");
        }else{
          (this.declutterMode == 2) ? this.sVisibility.set("none") : this.sVisibility.set("block");
        }
    }); 
  
    sub.on('leftMainGearCompressed').whenChanged().handle((value) => {
      this.onGround = value;
      if(this.onGround){
        this.sVisibility.set("none");
      }else{
        (this.declutterMode == 2) ? this.sVisibility.set("none") : this.sVisibility.set("block");
      }
    })

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((og) => {
        this.leftMainGearCompressed = og;
        this.onGround = this.rightMainGearCompressed || og;
        this.determineSlideSlip();
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((og) => {
        this.rightMainGearCompressed = og;
        this.onGround = this.leftMainGearCompressed || og;
        this.determineSlideSlip();
      });

    sub
      .on('rollAr')
      .withArinc429Precision(2)
      .handle((roll) => {
        this.roll = roll;
        this.determineSlideSlip();
      });

    sub
      .on('estimatedBeta')
      .withArinc429Precision(2)
      .handle((beta) => {
        this.beta = beta;
        this.determineSlideSlip();
      });

    sub
      .on('betaTarget')
      .withArinc429Precision(2)
      .handle((betaTarget) => {
        this.betaTarget = betaTarget;
        this.determineSlideSlip();
      });

    sub
      .on('latAcc')
      .withArinc429Precision(2)
      .handle((latAcc) => {
        this.latAcc = latAcc;
      });

    sub.on('realTime').handle(() => {
      this.filteredLatAccSub.set(
        this.latAccFilter.step(this.latAcc.valueOr(0), this.props.instrument.deltaTime / 1000),
      );
    });

    this.filteredLatAccSub.sub(() => {
      this.determineSlideSlip();
    });
  }

  private determineSlideSlip() {
    const multiplier = 100;
    let offset = 0;

    let betaTargetActive = false;

    if (
      (this.onGround && this.latAcc.isFailureWarning()) ||
      (!this.onGround && this.latAcc.isFailureWarning() && this.beta.isFailureWarning())
    ) {
      this.slideSlip.instance.style.visibility = 'hidden';
      this.siFailFlag.instance.style.display = 'block';
    } else {
      this.slideSlip.instance.style.visibility = 'visible';
      this.siFailFlag.instance.style.display = 'none';
    }

    if (
      !this.onGround &&
      !this.beta.isFailureWarning() &&
      !(this.betaTarget.isFailureWarning() || this.betaTarget.isNoComputedData())
    ) {
      offset = Math.max(Math.min(this.beta.value - this.betaTarget.value, 15), -15);
      betaTargetActive = true;
    } else if (!this.onGround && !this.beta.isFailureWarning()) {
      offset = Math.max(Math.min(this.beta.value, 15), -15);
    } else {
      const latAcc = this.filteredLatAccSub.get();
      const accInG = Math.min(0.3, Math.max(-0.3, latAcc));
      offset = Math.round(((-accInG * 15) / 0.3) * multiplier) / multiplier;
    }

    this.classNameSub.set(betaTargetActive ? 'Green Fill' : 'Green');
    this.slideSlip.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
  }

  render(): VNode {
    return (
      <g id="RollTriangleGroup" ref={this.rollTriangle} display={this.sVisibility} class="SmallStroke Green CornerRound">
        <path d="M 640.18,154.11 l -10,21.89 h 20z" />
        <path
          id="SideSlipIndicator"
          ref={this.slideSlip}
          class={this.classNameSub}
          d="m 629,177.85 -8,16.15 38,0.07 -8,-16.22z"
        />
        <text
          id="SIFailText"
          ref={this.siFailFlag}
          x="633.99"
          y="189.97"
          class="FontSmall Green Blink9Seconds EndAlign"
        >
          SI
        </text>
      </g>
    );
  }
}

class PitchScale extends DisplayComponent<{ 
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
} >   {
  private fmgcFlightPhase = -1;
  private forcedFma = false;
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private sVisibility = Subject.create<String>('');
  private sVisibilityDeclutterMode2 = Subject.create<String>('');
  private sVisibilitySwitch = Subject.create<String>('');


  private readonly lsVisible = ConsumerSubject.create(null, false);
  private readonly lsHidden = this.lsVisible.map(SubscribableMapFunctions.not());
  private needsUpdate = false;

  private threeDegLine = FSComponent.createRef<SVGGElement>();
  private data: LSPath = {
    roll: new Arinc429Word(0),
    pitch: new Arinc429Word(0),
    fpa: new Arinc429Word(0),
    da: new Arinc429Word(0),
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getArincSubscriber<Arinc429Values & DmcLogicEvents & HUDSimvars & ClockEvents & HEvent>();

    sub.on('fmgcFlightPhase').whenChanged().handle((fp) => {
      this.declutterMode = SimVar.GetSimVarValue('L:A32NX_HUD_DECLUTTER_MODE','Number');
      this.fmgcFlightPhase = fp;
      //force fma during climb and descent
      if(fp == 1 || fp == 2 || fp == 4){
        this.forcedFma = true;
        if(this.declutterMode == 2 ){
          this.sVisibility.set("block");
          this.sVisibilityDeclutterMode2.set("block");
        }else{
          this.sVisibility.set("block");
          this.sVisibilityDeclutterMode2.set("block");
        } 
      }else{
        this.forcedFma = false;
      }

    })

    sub.on('fwcFlightPhase').whenChanged().handle((fp) => {
      this.declutterMode = SimVar.GetSimVarValue('L:A32NX_HUD_DECLUTTER_MODE','Number');
      this.flightPhase = fp;
      //onGround
      if(this.flightPhase <= 2 || this.flightPhase >= 9){
          if(this.declutterMode == 2 ){
            this.sVisibility.set("none");
            this.sVisibilityDeclutterMode2.set("none");
          }
          if(this.declutterMode < 2 ){
          this.sVisibility.set("block");
          this.sVisibilityDeclutterMode2.set("block");
          }
      }
      //inFlight
      if(this.flightPhase > 2 && this.flightPhase <= 9 ){
        if(this.forcedFma){
          if(this.declutterMode == 2 ){
            this.sVisibility.set("block");
            this.sVisibilityDeclutterMode2.set("block");
          }else{
            this.sVisibility.set("block");
            this.sVisibilityDeclutterMode2.set("block");
          }   
        }else{
          if(this.declutterMode == 2 ){
            this.sVisibility.set("none");
            this.sVisibilityDeclutterMode2.set("block");
          }else{
            this.sVisibility.set("block");
            this.sVisibilityDeclutterMode2.set("block");
          }   
        }
      }

    })
    
    sub.on('declutterMode').whenChanged().handle((value) => {
      this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE','Number');
      this.declutterMode = value;
      if(this.forcedFma){
          this.sVisibility.set("block");
          this.sVisibilityDeclutterMode2.set("block");
      } else{
        if(this.declutterMode == 2 ){
          this.sVisibility.set("none");
          this.sVisibilityDeclutterMode2.set("block");
        }else{
          this.sVisibility.set("block");
          this.sVisibilityDeclutterMode2.set("block");
        }    
      }  
    }); 


    sub.on('hEvent').handle((eventName) => {
      if (eventName === `A320_Neo_PFD_BTN_LS_${getDisplayIndex()}`) {
          SimVar.SetSimVarValue(`L:BTN_LS_${getDisplayIndex()}_FILTER_ACTIVE`, 'Bool', !this.lsVisible.get());
      }
    });
    this.lsVisible.setConsumer(sub.on(getDisplayIndex() === 1 ? 'ls1Button' : 'ls2Button'));


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
              // this.threeDegRef.instance.classList.remove('HiddenElement');
              this.MoveThreeDegreeMark();
          } else {
              // this.threeDegRef.instance.classList.add('HiddenElement');
          }
      }
    });
  }




  private MoveThreeDegreeMark() {
    const daLimConv = this.data.da.value * DistanceSpacing / ValueSpacing;
    const pitchSubFpaConv = (calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value));
    const rollCos = Math.cos(this.data.roll.value * Math.PI / 180);
    const rollSin = Math.sin(-this.data.roll.value * Math.PI / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;
    this.threeDegLine.instance.style.transform = `translate3d(${xOffset}px, 0px, 0px)`;
}
  render(): VNode {
    const result = [] as SVGTextElement[];

  


    for (let i = 1; i < 7; i++) {
      result.push(<path d={`M 518.26,${512 - i * 182.857} h -71.1 v 11`} display={this.sVisibility}/>);
      result.push(<path d={`M 761.74,${512 - i * 182.857} h 71.1 v 11`} display={this.sVisibility} />);
    }

    for (let i = 1; i < 5; i++) {
      // negative pitch, right dotted lines
      (i == 1) ? this.sVisibilitySwitch = this.sVisibilityDeclutterMode2 : this.sVisibilitySwitch = this.sVisibility; 
      result.push(
        <path class="ScaledStroke" d={`m 761.74,${512 + i * 182.857} h 12`} display={this.sVisibilitySwitch} />,
        <path class="ScaledStroke" d={`m 781.44,${512 + i * 182.857} h 12`} display={this.sVisibilitySwitch} />,
        <path class="ScaledStroke" d={`m 801.14,${512 + i * 182.857} h 12`} display={this.sVisibilitySwitch} />,
        <path class="ScaledStroke" d={`m 820.84,${512 + i * 182.857} h 12 v -11 `} display={this.sVisibilitySwitch} />,
      );
      // negative pitch, left dotted lines
      result.push(
        <path class="ScaledStroke" d={`m 518.26,${512 + i * 182.857} h -12`} display={this.sVisibilitySwitch} />,
        <path class="ScaledStroke" d={`m 498.56,${512 + i * 182.857} h -12`} display={this.sVisibilitySwitch} />,
        <path class="ScaledStroke" d={`m 478.86,${512 + i * 182.857} h -12`} display={this.sVisibilitySwitch} />,
        <path class="ScaledStroke" d={`m 459.16,${512 + i * 182.857} h -12 v -11`} display={this.sVisibilitySwitch} />,
      );
    }

      // //3° line
      // class={{ HiddenElement: this.props.lsVisible }}
        result.push(
          // threeDegRef={this.props.threeDegRef} 

          <g id="ThreeDegreeLine" ref={this.threeDegLine} class={{ HiddenElement: this.lsHidden }} display={this.sVisibilityDeclutterMode2} >
            <path d={`M 565,${512 + (3/5) * 182.857} h -80 `} />
            <path d={`M 713,${512 + (3/5) * 182.857} h 80 `} />
          </g>
        )
        

    for (let i = -4; i < 7; i++) {
      if (i === 0) {
        continue;
      }
      (i == -1) ? this.sVisibilitySwitch = this.sVisibilityDeclutterMode2 : this.sVisibilitySwitch = this.sVisibility; 

      const value: number = i * 5;
      const str: string = value.toString();
      result.push(
        <text class="FontSmall Green Fill EndAlign" x="445" y={512 - i * 182.857 + 8.35} display={this.sVisibilitySwitch}>
          {str}
        </text>,
      );
      result.push(
        <text class="FontSmall Green Fill StartAlign" x="835" y={512 - i * 182.857 + 8.35} display={this.sVisibilitySwitch}>
          {str}
        </text>,
      );
    }

    return <g class="ScaledStroke" >
      {result}

      </g>;
  }
}
