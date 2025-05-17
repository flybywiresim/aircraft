// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Register, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { ArmedLateralMode, ArmedVerticalMode, isArmed, LateralMode, VerticalMode } from '@shared/autopilot';

import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { LagFilter } from './HUDUtils';

function handleNavRadialError(radialError: number, lagFilter: LagFilter, deltaTime: number): Subject<string> {
  const deviation = lagFilter.step(radialError, deltaTime / 1000);
  const dots = deviation / 0.8;
  const str = Subject.create('');
  if (dots > 2) {
      str.set('none');
      return str;
  } else if (dots < -2) {
    str.set('none');
    return str;
  } else {
    str.set('block');
    return str;
  }
}

interface AttitudeIndicatorFixedUpperProps {
  bus: ArincEventBus;
}

export class AttitudeIndicatorFixedUpper extends DisplayComponent<AttitudeIndicatorFixedUpperProps> {
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private onGround = true;
  private sVisibility = Subject.create<String>('');
  private radioAlt = -1;
  private pitch: Arinc429WordData = Arinc429Register.empty();
  private roll = new Arinc429Word(0);

  private visibilitySub = Subject.create('hidden');

  private attInfoGroup = FSComponent.createRef<SVGGElement>();
  private rollProtSymbol = FSComponent.createRef<SVGGElement>();

  private rollProtLostSymbol = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars>();
    
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

    sub.on('radioAltitude1').whenChanged().handle((ra) => {
      this.radioAlt = ra;
    });

    sub.on('rollAr').handle((roll) => {
      this.roll = roll;
      if (!this.roll.isNormalOperation() || this.radioAlt < 50) {
        this.visibilitySub.set('hidden');
      } else {
        this.visibilitySub.set('visible');
      }
    });

    sub.on('pitchAr').handle((pitch) => {
      this.pitch = pitch;
      if (!this.pitch.isNormalOperation() || this.radioAlt < 50) {
        this.visibilitySub.set('hidden');
      } else {
        this.visibilitySub.set('visible');
      }
    });

    sub.on('fcdcDiscreteWord1').handle((fcdcWord1) => {
      const isNormalLawActive = fcdcWord1.bitValue(11) && !fcdcWord1.isFailureWarning();

      this.rollProtSymbol.instance.style.display = isNormalLawActive ? 'block' : 'none';

      this.rollProtLostSymbol.instance.style.display = !isNormalLawActive ? 'block' : 'none';
    });
  }

  render(): VNode {
    return (
      // visibility={this.visibilitySub}
      <g id="AttitudeUpperInfoGroup" ref={this.attInfoGroup} display={this.sVisibility} transform="scale(5 5) translate(59 -8)">
        <g id="RollProtGroup" ref={this.rollProtSymbol} style="display: none" class="ScaledStrokeThin Green">
          <path id="RollProtRight" d="m105.64 62.887 1.5716-0.8008m-1.5716-0.78293 1.5716-0.8008" />
          <path id="RollProtLeft" d="m32.064 61.303-1.5716-0.8008m1.5716 2.3845-1.5716-0.8008" />
        </g>
        <g id="RollProtLost" ref={this.rollProtLostSymbol} style="display: none" class="ScaledStrokeThin Amber">
          <path id="RollProtLostRight" d="m107.77 60.696-1.7808 1.7818m1.7808 0-1.7808-1.7818" />
          <path id="RollProtLostLeft" d="m30.043 62.478 1.7808-1.7818m-1.7808 0 1.7808 1.7818" />
        </g>
        <g class="ScaledStrokeThin Green">
          <path d="m98.45 51.5 5 -5" />
          <path d="m39.45 51.5 -5 -5" />
          <path d="m76.15 40 l .725 -4" />
          <path d="m83.2 41.9 l 1.3 -3.75" />
          <path d="m89.75 45 l 2 -3.5" />   
          <path d="m61.65 40 l -.725 -4" />
          <path d="m54.65 41.9 l -1.3 -3.75" />
          <path d="m48.15 45 l -2 -3.5" />
        </g>
        <path class="NormalStroke Green CornerRound" d="m68.906 38.650-2.5184-3.7000h5.0367l-2.5184 3.7000" />
      </g>
    );
  }
}

interface GridProps{
  bus: ArincEventBus;
  gapX: number;
  gapY: number;
}

export class Grid extends DisplayComponent<GridProps>{
  //1280 1024
  gapX=100;
  gapY=100;

  nx = Math.floor(1280 / this.gapX) ;
  ny = Math.floor(1024 / this.gapY) ;

  private buildGrid() {
    const result = { ticks: [] as SVGPathElement[]};

    
    for (let i = 0; i < this.nx; i++) {
        const posX = (1 + i) * this.nx;
            result.ticks.push(<path class="NormalStroke White" d="m 0 0 v1024" transform={`translate(${posX} 0)`} />);
    }
    for (let i = 0; i < this.ny; i++) {
        const posY = (1 + i) * this.ny;
            result.ticks.push(<path class="NormalStroke White" d="m 0 0 h1280" transform={`translate(0 ${posY} )`} />);
    }

    return result;
  }


  render(): VNode {
    return (
        <g id="Grid" style="block">
              {this.buildGrid() }
        </g>  
    );
  }

}

interface AttitudeIndicatorFixedCenterProps {
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number> 
  instrument: BaseInstrument;
}

export class AttitudeIndicatorFixedCenter extends DisplayComponent<AttitudeIndicatorFixedCenterProps> {
  private onRwy = false;
  private roll = new Arinc429Word(0);

  private pitch: Arinc429WordData = Arinc429Register.empty();

  private visibilitySub = Subject.create('hidden');

  private failureVis = Subject.create('hidden');

  private fdVisibilitySub = Subject.create('hidden');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values>();

    sub.on('rollAr').handle((r) => {
      this.roll = r;
      if (!this.roll.isNormalOperation()) {
        this.visibilitySub.set('display:none');
        this.failureVis.set('display:block');
        this.fdVisibilitySub.set('display:none');
      } else {
        this.visibilitySub.set('display:inline');
        this.failureVis.set('display:none');
        if (!this.props.isAttExcessive.get()) {
          this.fdVisibilitySub.set('display:inline');
        }
      }
    });

    sub.on('pitchAr').handle((p) => {
      this.pitch = p;

      if (!this.pitch.isNormalOperation()) {
        this.visibilitySub.set('display:none');
        this.failureVis.set('display:block');
        this.fdVisibilitySub.set('display:none');
      } else {
        this.visibilitySub.set('display:inline');
        this.failureVis.set('display:none');
        if (!this.props.isAttExcessive.get()) {
          this.fdVisibilitySub.set('display:inline');
        }
      }
    });

    this.props.isAttExcessive.sub((a) => {
      if (a) {
        this.fdVisibilitySub.set('display:none');
      } else if (this.roll.isNormalOperation() && this.pitch.isNormalOperation()) {
        this.fdVisibilitySub.set('display:inline');
      }
    });
  }

  render(): VNode {
    return (
      <>
        <text
          style={this.failureVis}
          id="AttFailText"
          class="Blink9Seconds FontLargest Green MiddleAlign"
          x="640"
          y="512"
        >
          ATT
        </text>
        <g id="AttitudeSymbolsGroup" transform="translate(0 0)" style={this.visibilitySub}>
          <FDYawBar bus={this.props.bus}  instrument={this.props.instrument}/>
          <AircraftReference bus={this.props.bus} instrument={this.props.instrument}/>
          <FlightPathVector 
          bus={this.props.bus} 
          isAttExcessive={this.props.isAttExcessive}
          filteredRadioAlt={this.props.filteredRadioAlt}
          />
        </g>
      </>
    );
  }
}

class AircraftReference extends DisplayComponent<{ bus: ArincEventBus, instrument: BaseInstrument }> {
  private onRwy = false;
  private declutterMode = 0;
  private flightPhase = 0;
  private onGround = true;
  private hasLoc = false;
  private visibilityAirSub = Subject.create('none');
  private visibilityGroundSub = Subject.create('none');
  private lateralMode = 0;

  private fdActive = false;
  private radioAltitude = new Arinc429Word(0);

  private pitch = 0;

  private isActive(): boolean {
    if (!this.fdActive || !( this.lateralMode === LateralMode.ROLL_OUT || this.lateralMode === LateralMode.RWY)) {
      return false;
    }
    return true;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

    sub.on('leftMainGearCompressed').whenChanged().handle((value) => {
      this.onGround = value;
    });
    sub.on('hasLoc').whenChanged().handle((hasLoc) => {
      this.hasLoc = hasLoc;
    });
    sub.on('navRadialError').whenChanged().handle((value)=>{
      if(this.onGround){
        if(this.hasLoc){
          if(this.isActive()){
            (Math.abs(value) < 2) ? this.visibilityGroundSub.set("block") : this.visibilityGroundSub.set("none"); 
          }
        }
      }
    });
    
    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((lm) => {
        this.lateralMode = lm;
        if(this.onGround){
          if (this.isActive()) {
            this.visibilityGroundSub.set("block"); 
            this.visibilityAirSub.set("none"); 
          }else{
            this.visibilityGroundSub.set("none"); 
            this.visibilityAirSub.set("none"); 
          }
        }else{
          this.visibilityGroundSub.set("none"); 
          (this.declutterMode == 2 ) ? this.visibilityAirSub.set("none") : this.visibilityAirSub.set("block"); 
        }
      });

    sub.on('declutterMode').whenChanged().handle((value) => {
      this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE','Number');
      this.declutterMode = value;    
      if(this.onGround){
        if (this.isActive()) {
          this.visibilityGroundSub.set("block"); 
          this.visibilityAirSub.set("none"); 
        }else{
          this.visibilityGroundSub.set("none"); 
          this.visibilityAirSub.set("none"); 
        }
      }else{
        this.visibilityGroundSub.set("none"); 
        (this.declutterMode == 2 ) ? this.visibilityAirSub.set("none") : this.visibilityAirSub.set("block"); 
      }
  }); 

    sub
      .on('pitchAr')
      .whenChanged()
      .handle((pitch) => {
        if (pitch.isNormalOperation()) {
          this.pitch = pitch.value;
        }
      });

    // sub.on('chosenRa').handle((ra) => {
    //   this.radioAltitude = ra;
    //   if (ra.value > 100) {
    //     this.visibilityAirSub.set('display:inline');
    //     this.visibilityGroundSub.set('display:none');
    //   } else {
    //     this.visibilityAirSub.set('display:none');
    //     this.visibilityGroundSub.set('display:inline');
    //   }
    // });

    sub
      .on('fd1Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 1) {
          this.fdActive = fd;
          if (this.isActive()) {
            this.visibilityGroundSub.set('block');
            this.visibilityAirSub.set('none');
          } else {
            this.visibilityGroundSub.set('none');
            this.visibilityAirSub.set('none');
          }


        }
      });

    sub
      .on('fd2Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 2) {
          this.fdActive = fd;
        if (this.isActive()) {
          this.visibilityGroundSub.set('block');
          this.visibilityAirSub.set('none');
        } else {
          this.visibilityGroundSub.set('none');
          this.visibilityAirSub.set('none');
        }
        }
      });


  }

  render(): VNode {
    return (
        <g id="AircraftReferences">
          <g id="AircraftReferenceInAir" 
            class="SmallStroke Green"
            display={this.visibilityAirSub}>
            <path d="m 600,336.52  v -7.38 h -41.63" />
            <path d="m 636.25,332.89 h 7.5 v -7.5 h -7.5 z" />
            <path d="m 680,336.52 v -7.38 h 41.63" />
          </g>
          <g id="AircraftReferenceOnGround" 
            class="SmallStroke Green" 
            display={this.visibilityGroundSub}>
            <path d="m 630,391.28 h 20 L 640,410 Z" />
          </g>
        </g>
    );
  }
}

class FDYawBar extends DisplayComponent<{ bus: ArincEventBus, instrument: BaseInstrument }> {
  private onGround = false;
  private sVisibility = Subject.create('none');
  private hasLoc = false;
  private lagFilter = new LagFilter(1.5);
  private deltaTime =  this.props.instrument.deltaTime;
  private lateralMode = 0;

  private fdYawCommand = 0;

  private fdActive = false;

  private yawRef = FSComponent.createRef<SVGPathElement>();

  private isActive(): boolean {
    if (!this.fdActive || !(this.lateralMode === LateralMode.ROLL_OUT || this.lateralMode === LateralMode.RWY)) {
      return false;
    }
    return true;
  }

  private setOffset() {
    const offset = -Math.max(Math.min(this.fdYawCommand, 45), -45) * 0.44;
    if (this.isActive()) {
      //this.yawRef.instance.style.visibility = 'visible';
      this.yawRef.instance.style.transform = `translate3d(${offset}px, 113px, 0px)`;
    }else{
      this.yawRef.instance.style.transform = `translate3d(0px, 113px, 0px)`;
    }

  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars>();

    sub.on('leftMainGearCompressed').whenChanged().handle((value) => {
      this.onGround = value;
    });

    sub.on('hasLoc').whenChanged().handle((hasLoc) => {
      this.hasLoc = hasLoc;
    });
    sub.on('navRadialError').whenChanged().handle((value)=>{
      if(this.onGround){
        if(this.hasLoc){
          this.setOffset();
          (Math.abs(value) < 2) ? this.sVisibility.set("inline") : this.sVisibility.set("none"); 
        }
      }
    });
    
    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((lm) => {
        this.lateralMode = lm;

        if (this.isActive()) {
          this.setOffset();
          this.sVisibility.set("block"); 

        } else {
          this.sVisibility.set("none"); 
        }
      });

      sub.on('fdYawCommand').handle((fy) => {
        this.fdYawCommand = fy;

        if (this.isActive()) {
          this.setOffset();
          this.sVisibility.set("block"); 
        } else {
          this.sVisibility.set("none"); 
        }
      });


    // FIXME, differentiate properly (without duplication)
    sub
      .on('fd1Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 1) {
          this.fdActive = fd;

          if (this.isActive()) {
            this.setOffset();
            this.sVisibility.set("block"); 
          } else {
            this.sVisibility.set("none"); 
          }
        }
      });

    sub
      .on('fd2Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 2) {
          this.fdActive = fd;

          if (this.isActive()) {
            this.setOffset();
            this.sVisibility.set("block"); 
          } else {
            this.sVisibility.set("none"); 
          }
        }
      });
  }

  render(): VNode {
    return (
      <g id="onGroundCenterlineDevIndicator"  display={this.sVisibility}>

        <path
          ref={this.yawRef}
          id="GroundYawSymbol"
          class="SmallStroke Green"
          d="m 640,299.5 -3,8.5 v 25 h 6 v -25 z"
        />
      </g>
    );
  }
}

class FlightDirector extends DisplayComponent<{ bus: ArincEventBus }> {
  private lateralMode = 0;

  private verticalMode = 0;

  private fdActive = false;

  private trkFpaActive = false;

  private fdBank = 0;

  private fdPitch = 0;

  private fdRef = FSComponent.createRef<SVGGElement>();

  private lateralRef1 = FSComponent.createRef<SVGPathElement>();

  private lateralRef2 = FSComponent.createRef<SVGPathElement>();

  private verticalRef1 = FSComponent.createRef<SVGPathElement>();

  private verticalRef2 = FSComponent.createRef<SVGPathElement>();

  private handleFdState() {
    const [toggled, showLateral, showVertical] = this.isActive();

    let FDRollOffset = 0;
    let FDPitchOffset = 0;

    if (toggled && showLateral) {
      const FDRollOrder = this.fdBank;
      FDRollOffset = Math.min(Math.max(FDRollOrder, -45), 45) * 0.44;

      this.lateralRef1.instance.setAttribute('visibility', 'visible');
      this.lateralRef1.instance.style.transform = `translate3d(${FDRollOffset}px, 0px, 0px)`;

      this.lateralRef2.instance.setAttribute('visibility', 'visible');
      this.lateralRef2.instance.style.transform = `translate3d(${FDRollOffset}px, 0px, 0px)`;
    } else {
      this.lateralRef1.instance.setAttribute('visibility', 'hidden');
      this.lateralRef2.instance.setAttribute('visibility', 'hidden');
    }

    if (toggled && showVertical) {
      const FDPitchOrder = this.fdPitch;
      FDPitchOffset = Math.min(Math.max(FDPitchOrder, -22.5), 22.5) * 0.89;

      this.verticalRef1.instance.setAttribute('visibility', 'visible');
      this.verticalRef1.instance.style.transform = `translate3d(0px, ${FDPitchOffset}px, 0px)`;

      this.verticalRef2.instance.setAttribute('visibility', 'visible');
      this.verticalRef2.instance.style.transform = `translate3d(0px, ${FDPitchOffset}px, 0px)`;
    } else {
      this.verticalRef1.instance.setAttribute('visibility', 'hidden');
      this.verticalRef2.instance.setAttribute('visibility', 'hidden');
    }
  }

  private isActive(): [boolean, boolean, boolean] {
    const toggled = this.fdActive && !this.trkFpaActive;

    const showLateralFD = this.lateralMode !== 0 && this.lateralMode !== 34 && this.lateralMode !== 40;
    const showVerticalFD = this.verticalMode !== 0 && this.verticalMode !== 34;

    return [toggled, showLateralFD, showVerticalFD];
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars>();

    sub
      .on('fd1Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 1) {
          this.fdActive = fd;

          if (this.isActive()[0]) {
            this.fdRef.instance.style.display = 'inline';
          } else {
            this.fdRef.instance.style.display = 'none';
          }
        }
      });

    sub
      .on('fd2Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 2) {
          this.fdActive = fd;

          if (this.isActive()[0]) {
            this.fdRef.instance.style.display = 'inline';
          } else {
            this.fdRef.instance.style.display = 'none';
          }
        }
      });

    sub
      .on('trkFpaActive')
      .whenChanged()
      .handle((tr) => {
        this.trkFpaActive = tr;

        if (this.isActive()[0]) {
          this.fdRef.instance.style.display = 'inline';
        } else {
          this.fdRef.instance.style.display = 'none';
        }
      });

    sub
      .on('fdBank')
      .withPrecision(2)
      .handle((fd) => {
        this.fdBank = fd;

        this.handleFdState();
      });
    sub
      .on('fdPitch')
      .withPrecision(2)
      .handle((fd) => {
        this.fdPitch = fd;

        this.handleFdState();
      });

    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((vm) => {
        this.lateralMode = vm;

        this.handleFdState();
      });

    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((lm) => {
        this.verticalMode = lm;

        this.handleFdState();
      });
  }

  render(): VNode | null {
    return (
      <g ref={this.fdRef} style="display: none">
        <g class="ThickOutline">
          <path ref={this.lateralRef1} d="m68.903 61.672v38.302" />

          <path ref={this.verticalRef1} d="m49.263 80.823h39.287" />
        </g>
        <g class="ThickStroke Green">
          <path ref={this.lateralRef2} id="FlightDirectorRoll" d="m68.903 61.672v38.302" />

          <path ref={this.verticalRef2} id="FlightDirectorPitch" d="m49.263 80.823h39.287" />
        </g>
      </g>
    );
  }
}

class SidestickIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private captPitchCommand = new Arinc429Word(0);

  private foPitchCommand = new Arinc429Word(0);

  private captRollCommand = new Arinc429Word(0);

  private foRollCommand = new Arinc429Word(0);

  private fcdc1DiscreteWord2 = new Arinc429Word(0);

  private fcdc2DiscreteWord2 = new Arinc429Word(0);

  private onGround = true;

  private crossHairRef = FSComponent.createRef<SVGPathElement>();

  private onGroundForVisibility = Subject.create('visible');

  private engOneRunning = false;

  private engTwoRunning = false;

  private handleSideStickIndication() {
    const oneEngineRunning = this.engOneRunning || this.engTwoRunning;

    const showIndicator =
      this.onGround &&
      oneEngineRunning &&
      !this.captPitchCommand.isFailureWarning() &&
      !this.captRollCommand.isFailureWarning() &&
      !this.foPitchCommand.isFailureWarning() &&
      !this.foRollCommand.isFailureWarning();

    const foStickDisabledFcdc1 = this.fcdc1DiscreteWord2.bitValueOr(29, false);
    const foStickDisabledFcdc2 = this.fcdc2DiscreteWord2.bitValueOr(29, false);
    const captStickDisabledFcdc1 = this.fcdc1DiscreteWord2.bitValueOr(28, false);
    const captStickDisabledFcdc2 = this.fcdc2DiscreteWord2.bitValueOr(28, false);
    const foStickDisabled = foStickDisabledFcdc1 || foStickDisabledFcdc2;
    const captStickDisabled = captStickDisabledFcdc1 || captStickDisabledFcdc2;

    const totalPitchCommand =
      Math.max(
        Math.min(
          (foStickDisabled ? 0 : this.foPitchCommand.value) + (captStickDisabled ? 0 : this.captPitchCommand.value),
          16,
        ),
        -16,
      ) * -1.43875;
    const totalRollCommand =
      Math.max(
        Math.min(
          (foStickDisabled ? 0 : this.foRollCommand.value) + (captStickDisabled ? 0 : this.captRollCommand.value),
          20,
        ),
        -20,
      ) * 1.478;

    if (!showIndicator) {
      this.onGroundForVisibility.set('hidden');
    } else {
      this.onGroundForVisibility.set('visible');
      this.crossHairRef.instance.style.transform = `translate3d(${totalRollCommand}px, ${totalPitchCommand}px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

    sub
      .on('noseGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.onGround = g;
        this.handleSideStickIndication();
      });

    sub
      .on('engOneRunning')
      .whenChanged()
      .handle((e) => {
        this.engOneRunning = e;
        this.handleSideStickIndication();
      });

    sub
      .on('engTwoRunning')
      .whenChanged()
      .handle((e) => {
        this.engTwoRunning = e;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdc1DiscreteWord2')
      .whenChanged()
      .handle((discreteWord2) => {
        this.fcdc1DiscreteWord2 = discreteWord2;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdc2DiscreteWord2')
      .whenChanged()
      .handle((discreteWord2) => {
        this.fcdc2DiscreteWord2 = discreteWord2;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdcCaptPitchCommand')
      .whenChanged()
      .handle((x) => {
        this.captPitchCommand = x;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdcFoPitchCommand')
      .whenChanged()
      .handle((x) => {
        this.foPitchCommand = x;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdcCaptRollCommand')
      .whenChanged()
      .handle((y) => {
        this.captRollCommand = y;
        this.handleSideStickIndication();
      });

    sub
      .on('fcdcFoRollCommand')
      .whenChanged()
      .handle((y) => {
        this.foRollCommand = y;
        this.handleSideStickIndication();
      });
  }

  render(): VNode {
    return (
      <g id="GroundCursorGroup" class="NormalStroke White" visibility={this.onGroundForVisibility}>
        <path
          id="GroundCursorBorders"
          d="m92.327 103.75h6.0441v-6.0476m-58.93 0v6.0476h6.0441m46.842-45.861h6.0441v6.0476m-58.93 0v-6.0476h6.0441"
        />
        <path
          ref={this.crossHairRef}
          id="GroundCursorCrosshair"
          d="m73.994 81.579h-4.3316v4.3341m-5.8426-4.3341h4.3316v4.3341m5.8426-5.846h-4.3316v-4.3341m-5.8426 4.3341h4.3316v-4.3341"
        />
      </g>
    );
  }
}
