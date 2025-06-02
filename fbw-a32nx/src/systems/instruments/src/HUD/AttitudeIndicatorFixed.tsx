// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, Subscribable, SvgPathStream, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Register, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { ArmedLateralMode, ArmedVerticalMode, isArmed, LateralMode, VerticalMode } from '@shared/autopilot';
import { FgBus } from 'instruments/src/HUD/shared/FgBusProvider';
import { FcuBus } from 'instruments/src/HUD/shared/FcuBusProvider';

import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';
import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { LagFilter } from './HUDUtils';
import { FlightPathDirector } from './FlightPathDirector';

const DistanceSpacing = (1024 / 28) * 5; //182.857
const ValueSpacing = 5;

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

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars>();

    sub
      .on(isCaptainSide ? 'declutterModeL' : 'declutterModeR')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        if (this.onGround) {
          this.sVisibility.set('none');
        } else {
          this.declutterMode == 2 ? this.sVisibility.set('none') : this.sVisibility.set('block');
        }
      });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        this.onGround = value;
        if (this.onGround) {
          this.sVisibility.set('none');
        } else {
          this.declutterMode == 2 ? this.sVisibility.set('none') : this.sVisibility.set('block');
        }
      });

    sub
      .on('radioAltitude1')
      .whenChanged()
      .handle((ra) => {
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
      <g
        id="AttitudeUpperInfoGroup"
        ref={this.attInfoGroup}
        display={this.sVisibility}
        transform="scale(5 5) translate(59 -8)"
      >
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

interface GridProps {
  bus: ArincEventBus;
  gapX: number;
  gapY: number;
}

export class Grid extends DisplayComponent<GridProps> {
  //1280 1024
  gapX = 100;
  gapY = 100;

  nx = Math.floor(1280 / this.gapX);
  ny = Math.floor(1024 / this.gapY);

  private buildGrid() {
    const result = { ticks: [] as SVGPathElement[] };

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
        {this.buildGrid()}
      </g>
    );
  }
}

interface AttitudeIndicatorFixedCenterProps {
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
  instrument: BaseInstrument;
}

export class AttitudeIndicatorFixedCenter extends DisplayComponent<AttitudeIndicatorFixedCenterProps> {
  private onRwy = false;
  private roll = new Arinc429Word(0);

  private pitch: Arinc429WordData = Arinc429Register.empty();

  private visibilitySub = Subject.create('hidden');

  private failureVis = Subject.create('hidden');

  private readonly attFlagVisible = Subject.create(false);

  private fdVisibilitySub = Subject.create('hidden');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values>();

    sub
      .on('rollAr')
      .whenChanged()
      .handle((r) => {
        this.roll = r;
        if (!this.roll.isNormalOperation()) {
          this.visibilitySub.set('display:none');
          this.failureVis.set('display:block');
          this.attFlagVisible.set(true);
          this.fdVisibilitySub.set('display:none');
        } else {
          this.visibilitySub.set('display:inline');
          this.failureVis.set('display:none');
          this.attFlagVisible.set(true);
          if (!this.props.isAttExcessive.get()) {
            this.fdVisibilitySub.set('display:inline');
          }
        }
      });

    sub
      .on('pitchAr')
      .whenChanged()
      .handle((p) => {
        this.pitch = p;

        if (!this.pitch.isNormalOperation()) {
          this.visibilitySub.set('display:none');
          this.failureVis.set('display:block');
          this.attFlagVisible.set(true);
          this.fdVisibilitySub.set('display:none');
        } else {
          this.visibilitySub.set('display:inline');
          this.failureVis.set('display:none');
          this.attFlagVisible.set(true);
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
        <g id="AttitudeSymbolsGroup" style={this.visibilitySub}>
          <g style={this.fdVisibilitySub}>
            <FDYawBar bus={this.props.bus} />
          </g>

          <AircraftReference bus={this.props.bus} instrument={this.props.instrument} />
          <FlightPathVector
            bus={this.props.bus}
            isAttExcessive={this.props.isAttExcessive}
            filteredRadioAlt={this.props.filteredRadioAlt}
          />
          <FlightPathDirector bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />

          <TailstrikeIndicator bus={this.props.bus} />
        </g>
      </>
    );
  }
}

interface DeclutterIndicatorProps {
  bus: ArincEventBus;
}

export class DeclutterIndicator extends DisplayComponent<DeclutterIndicatorProps> {
  private declutterMode;

  private textSub = Subject.create('');

  private declutterModeRef = FSComponent.createRef<SVGPathElement>();

  private handleFdState() {
    let text: string;
    if (this.declutterMode == 0) {
      text = 'N';
      this.declutterModeRef.instance.style.visibility = 'visible';
    } else if (this.declutterMode == 1) {
      text = 'D';
      this.declutterModeRef.instance.style.visibility = 'visible';
    } else if (this.declutterMode == 2) {
      this.declutterModeRef.instance.style.visibility = 'hidden';

      text = '';
    }
    this.textSub.set(text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getSubscriber<HUDSimvars>();
    sub.on(isCaptainSide ? 'declutterModeL' : 'declutterModeR').handle((m) => {
      this.declutterMode = m;
      this.handleFdState();
    });
  }

  render(): VNode {
    return (
      <g ref={this.declutterModeRef} id="DeclutterModeIndicator">
        <text class="FontMedium  MiddleAlign Green" x="1000" y="900">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class FDYawBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private fdEngaged = false;

  private fcuEisDiscreteWord2 = new Arinc429Word(0);

  private fdYawCommand = new Arinc429Word(0);

  private yawGroupRef = FSComponent.createRef<SVGGElement>();
  private yawRef = FSComponent.createRef<SVGPathElement>();
  private yawAcftRef = FSComponent.createRef<SVGPathElement>();
  private yawGroupVerticalOffset = 0;
  private pitch = 0;
  private lmgc = true;
  private rmgc = true;
  private handleFdState() {
    const fdOff = this.fcuEisDiscreteWord2.bitValueOr(23, false);
    const showFd = this.fdEngaged && !fdOff;

    const showYaw =
      this.lmgc &&
      this.rmgc &&
      showFd &&
      !(this.fdYawCommand.isFailureWarning() || this.fdYawCommand.isNoComputedData());

    if (showYaw) {
      const offset = -Math.max(Math.min(this.fdYawCommand.value * 3, 120), -120);
      this.yawGroupVerticalOffset = (DistanceSpacing / ValueSpacing) * (this.pitch - 1.15);
      this.yawGroupRef.instance.style.visibility = 'visible';
      this.yawRef.instance.style.transform = `translate3d(${offset}px, ${this.yawGroupVerticalOffset}px, 0px)`;
      this.yawAcftRef.instance.style.transform = `translate3d(0px, ${this.yawGroupVerticalOffset}px, 0px)`;
    } else {
      this.yawGroupRef.instance.style.visibility = 'hidden';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & FgBus & FcuBus>();

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((v) => {
        this.lmgc = v;
      });
    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((v) => {
        this.rmgc = v;
      });

    sub.on('yawFdCommand').handle((fy) => {
      this.fdYawCommand = fy;

      this.handleFdState();
    });

    sub
      .on('fdEngaged')
      .whenChanged()
      .handle((fd) => {
        this.fdEngaged = fd;

        this.handleFdState();
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((tr) => {
        this.fcuEisDiscreteWord2 = tr;

        this.handleFdState();
      });
    sub.on('pitchAr').handle((p) => {
      this.pitch = p.value;
      this.handleFdState();
    });
  }

  render(): VNode {
    return (
      <g ref={this.yawGroupRef}>
        <path ref={this.yawRef} id="GroundYawSymbol" class="SmallStroke Green" d="M 640 420 l 3 4 v 30 h -6 v -30 z" />
        <path
          ref={this.yawAcftRef}
          id="AircraftReferenceOnGround"
          class="SmallStroke Green"
          d="m 630, 405 h 20 L 640,420 Z"
        />
      </g>
    );
  }
}

class AircraftReference extends DisplayComponent<{ bus: ArincEventBus; instrument: BaseInstrument }> {
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
    if (!this.fdActive || !(this.lateralMode === LateralMode.ROLL_OUT || this.lateralMode === LateralMode.RWY)) {
      return false;
    }
    return true;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        this.onGround = value;
      });
    sub
      .on('hasLoc')
      .whenChanged()
      .handle((hasLoc) => {
        this.hasLoc = hasLoc;
      });
    sub
      .on('navRadialError')
      .whenChanged()
      .handle((value) => {
        if (this.onGround) {
          if (this.hasLoc) {
            if (this.isActive()) {
              Math.abs(value) < 2 ? this.visibilityGroundSub.set('block') : this.visibilityGroundSub.set('none');
            }
          }
        }
      });

    sub
      .on('fmgc1RollFdCommandRaw')
      .whenChanged()
      .handle((lm) => {
        this.lateralMode = lm;
        if (this.onGround) {
          if (this.isActive()) {
            this.visibilityGroundSub.set('block');
            this.visibilityAirSub.set('none');
          } else {
            this.visibilityGroundSub.set('none');
            this.visibilityAirSub.set('none');
          }
        } else {
          this.visibilityGroundSub.set('none');
          this.declutterMode == 2 ? this.visibilityAirSub.set('none') : this.visibilityAirSub.set('block');
        }
      });

    sub
      .on(isCaptainSide ? 'declutterModeL' : 'declutterModeR')
      .whenChanged()
      .handle((value) => {
        this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Number');
        this.declutterMode = value;
        if (this.onGround) {
          if (this.isActive()) {
            this.visibilityGroundSub.set('block');
            this.visibilityAirSub.set('none');
          } else {
            this.visibilityGroundSub.set('none');
            this.visibilityAirSub.set('none');
          }
        } else {
          this.visibilityGroundSub.set('none');
          this.declutterMode == 2 ? this.visibilityAirSub.set('none') : this.visibilityAirSub.set('block');
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
  }

  render(): VNode {
    return (
      <g id="AircraftReferences">
        <g id="AircraftReferenceInAir" class="SmallStroke Green" display={this.visibilityAirSub}>
          <path d="m 625,335  v -6 h -30" />
          <path d="m 637,332 h 6 v -6 h -6 z" />
          <path d="m 655, 335 v -6 h 30" />
        </g>
        {/* <g ref={this.gndRef} id="AircraftReferenceOnGround" class="SmallStroke Green">
          <path d="m 630, 405 h 20 L 640,420 Z" />
        </g> */}
      </g>
    );
  }
}

class FlightDirector extends DisplayComponent<{ bus: ArincEventBus }> {
  private fdEngaged = false;

  private fcuEisDiscreteWord2 = new Arinc429Word(0);

  private fcuDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord5 = new Arinc429Word(0);

  private fdRollCommand = new Arinc429Word(0);

  private fdPitchCommand = new Arinc429Word(0);

  private fdYawCommand = new Arinc429Word(0);

  private leftMainGearCompressed = false;

  private rightMainGearCompressed = false;

  private lateralRef1 = FSComponent.createRef<SVGPathElement>();

  private lateralRef2 = FSComponent.createRef<SVGPathElement>();

  private verticalRef1 = FSComponent.createRef<SVGPathElement>();

  private verticalRef2 = FSComponent.createRef<SVGPathElement>();

  private readonly fdFlagVisibleSub = Subject.create(false);

  private readonly lateralShouldFlash = Subject.create(false);

  private readonly longitudinalShouldFlash = Subject.create(false);

  private readonly lateralVisible = Subject.create(false);

  private readonly longitudinalVisible = Subject.create(false);

  private handleFdState() {
    const fdOff = this.fcuEisDiscreteWord2.bitValueOr(23, false);
    const showFd = this.fdEngaged && !fdOff;

    const trkFpaActive = this.fcuDiscreteWord1.bitValueOr(25, false);

    const showRoll = showFd && !(this.fdRollCommand.isFailureWarning() || this.fdRollCommand.isNoComputedData());

    if (showRoll) {
      const FDRollOffset = Math.min(Math.max(this.fdRollCommand.value, -45), 45) * 15 + 640;

      this.lateralVisible.set(true);
      this.lateralRef1.instance.style.transform = `translate3d(${FDRollOffset}px, 0px, 0px)`;

      this.lateralRef2.instance.style.transform = `translate3d(${FDRollOffset}px, 0px, 0px)`;
    } else {
      this.lateralVisible.set(false);
    }

    const showPitch = showFd && !(this.fdPitchCommand.isFailureWarning() || this.fdPitchCommand.isNoComputedData());

    if (showPitch) {
      const FDPitchOffset = Math.min(Math.max(this.fdPitchCommand.value, -22.5), 22.5) * 15 + 512;

      this.longitudinalVisible.set(true);
      this.verticalRef1.instance.style.transform = `translate3d(0px, ${FDPitchOffset}px, 0px)`;

      this.verticalRef2.instance.style.transform = `translate3d(0px, ${FDPitchOffset}px, 0px)`;
    } else {
      this.longitudinalVisible.set(false);
    }

    const onGround = this.leftMainGearCompressed || this.rightMainGearCompressed;
    if (
      !fdOff &&
      (!this.fdEngaged ||
        this.fdRollCommand.isFailureWarning() ||
        this.fdPitchCommand.isFailureWarning() ||
        (this.fdYawCommand.isFailureWarning() && onGround))
    ) {
      this.fdFlagVisibleSub.set(true);
    } else {
      this.fdFlagVisibleSub.set(false);
    }
  }

  private handleFdBarsFlashing() {
    const fdRollBarFlashing = this.fmgcDiscreteWord2.bitValueOr(28, false);
    const fdPitchBarFlashing = this.fmgcDiscreteWord5.bitValueOr(24, false);

    this.lateralShouldFlash.set(fdRollBarFlashing);
    this.longitudinalShouldFlash.set(fdPitchBarFlashing);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars & FgBus & FcuBus>();

    sub
      .on('fdEngaged')
      .whenChanged()
      .handle((fd) => {
        this.fdEngaged = fd;

        this.handleFdState();
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((tr) => {
        this.fcuEisDiscreteWord2 = tr;

        this.handleFdState();
      });

    sub
      .on('fcuDiscreteWord1')
      .whenChanged()
      .handle((tr) => {
        this.fcuDiscreteWord1 = tr;

        this.handleFdState();
      });

    sub
      .on('fmgcDiscreteWord2')
      .whenChanged()
      .handle((tr) => {
        this.fmgcDiscreteWord2 = tr;

        this.handleFdBarsFlashing();
      });

    sub
      .on('fmgcDiscreteWord5')
      .whenChanged()
      .handle((tr) => {
        this.fmgcDiscreteWord5 = tr;

        this.handleFdBarsFlashing();
      });

    sub
      .on('rollFdCommand')
      .withArinc429Precision(2)
      .handle((fd) => {
        this.fdRollCommand = fd;

        this.handleFdState();
      });

    sub
      .on('pitchFdCommand')
      .withArinc429Precision(2)
      .handle((fd) => {
        this.fdPitchCommand = fd;

        this.handleFdState();
      });

    sub
      .on('yawFdCommand')
      .withArinc429Precision(2)
      .handle((fd) => {
        this.fdYawCommand = fd;

        this.handleFdState();
      });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftMainGearCompressed = g;
        this.handleFdState();
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.rightMainGearCompressed = g;
        this.handleFdState();
      });
  }

  render(): VNode | null {
    return (
      <g>
        {/* These are split up in this order to prevent the shadow of one FD bar to go above the other green FD bar */}
        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.lateralVisible}
          flashing={this.lateralShouldFlash}
        >
          <path ref={this.lateralRef1} class="ThickOutline" d="m68.903 61.672v38.302" />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.longitudinalVisible}
          flashing={this.longitudinalShouldFlash}
        >
          <path ref={this.verticalRef1} class="ThickOutline" d="m49.263 80.823h39.287" />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.lateralVisible}
          flashing={this.lateralShouldFlash}
        >
          <path ref={this.lateralRef2} class="ThickStroke Green" id="FlightDirectorRoll" d="m68.903 61.672v38.302" />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.longitudinalVisible}
          flashing={this.longitudinalShouldFlash}
        >
          <path ref={this.verticalRef2} class="ThickStroke Green" id="FlightDirectorPitch" d="m49.263 80.823h39.287" />
        </FlashOneHertz>

        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.fdFlagVisibleSub}>
          <text id="FDFlag" x="52.702862" y="56.065434" class="FontLargest EndAlign Red">
            FD
          </text>
        </FlashOneHertz>
      </g>
    );
  }
}

class TailstrikeIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private pl = FSComponent.createRef<SVGGElement>();
  private ref1 = FSComponent.createRef<SVGPathElement>();
  private ref2 = FSComponent.createRef<SVGPathElement>();
  private deb = FSComponent.createRef<SVGPathElement>();
  private onGround = true;
  private leftGear = true;
  private rightGear = true;
  private pitch = 0;
  private tailStrikePitchLimit = 11.7;
  private ref = 0;
  static ONEDEG = 36.514;
  private lim = 330 + this.tailStrikePitchLimit * TailstrikeIndicator.ONEDEG;
  private tailStrikeConditions = {
    altitude: new Arinc429Word(0),
    speed: 0,
    pitch: 0,
    flightPhase: 0,
    GAtimer: 0,
  };
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

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
        this.checkOnGround();
      });

    sub.on('pitchAr').handle((pitch) => {
      if (pitch.isNormalOperation()) {
        this.pitch = pitch.value;
        this.ref =
          330 +
          pitch.value * TailstrikeIndicator.ONEDEG -
          (pitch.value / 2 - this.tailStrikePitchLimit / 2) * TailstrikeIndicator.ONEDEG;
        //check srs value
        //console.log(this.ref + ' pitch: ' + this.pitch + 'limit: ' + this.tailStrikePitchLimit);

        this.ref1.instance.setAttribute('d', `M 590 ${this.ref} l 40 0 `);
        this.ref2.instance.setAttribute('d', `M 690 ${this.ref} l -40 0 `);
        this.pl.instance.setAttribute(
          'points',
          ` 590,${this.lim} 640,${this.lim}  640, ${this.lim - 10}    640,${this.lim}   690, ${this.lim} `,
        );
      }
    });

    sub.on('leftMainGearCompressed').handle((v) => {
      v ? (this.leftGear = true) : (this.leftGear = false);
      this.checkOnGround();
    });

    sub.on('rightMainGearCompressed').handle((v) => {
      v ? (this.rightGear = true) : (this.rightGear = false);
      this.checkOnGround();
    });
  }

  private checkOnGround() {
    this.leftGear || this.rightGear ? (this.onGround = true) : (this.onGround = false);

    if (this.onGround) {
      if (this.pitch > this.tailStrikePitchLimit) {
        this.pl.instance.style.display = 'none';
        this.ref1.instance.style.display = 'none';
        this.ref2.instance.style.display = 'none';
      } else {
        this.pl.instance.style.display = 'block';
        this.ref1.instance.style.display = 'block';
        this.ref2.instance.style.display = 'block';
      }
    } else {
      this.pl.instance.style.display = 'none';
      this.ref1.instance.style.display = 'none';
      this.ref2.instance.style.display = 'none';
    }
  }

  render(): VNode {
    // FIXME: What is the tailstrike pitch limit with compressed main landing gear for A320? Assume 11.7 degrees now.
    // FIXME: further fine tune.
    return (
      <g>
        {/* <path ref={this.deb} class="WideStroke  debug" d="" /> */}

        <polyline ref={this.pl} id="TailstrikeWarning" points="" class="WideStroke  Green" />
        <path ref={this.ref1} class="WideStroke  Green" d="" />
        <path ref={this.ref2} class="WideStroke  Green" d="" />
      </g>
    );
  }
}
