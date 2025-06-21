// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, Subscribable, VNode, ClockEvents } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Register, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { LateralMode } from '@shared/autopilot';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FgBus } from 'instruments/src/PFD/shared/FgBusProvider';

import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from '../PFD/shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FlightPathDirector } from './FlightPathDirector';
import { HudElems, LagFilter, FIVE_DEG } from './HUDUtils';
import { PFDSimvars } from 'instruments/src/PFD/shared/PFDSimvarPublisher';
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

interface AttitudeIndicatorFixedUpperProps {
  bus: ArincEventBus;
}

export class AttitudeIndicatorFixedUpper extends DisplayComponent<AttitudeIndicatorFixedUpperProps> {
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & HudElems>();
  private fullGroupVis = '';
  private fullGroupRef = FSComponent.createRef<SVGGElement>();
  private attitudeIndicatorRef = FSComponent.createRef<SVGGElement>();
  private alternateLawRef = FSComponent.createRef<SVGGElement>();
  private attitudeIndicator = '';
  private roll = new Arinc429Word(0);
  private pitch = new Arinc429Word(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('attitudeIndicator')
      .whenChanged()
      .handle((value) => {
        this.fullGroupVis = value;
        this.fullGroupRef.instance.style.display = `${this.fullGroupVis}`;
      });

    this.sub
      .on('attitudeIndicator')
      .whenChanged()
      .handle((v) => {
        this.attitudeIndicator = v;
        this.attitudeIndicatorRef.instance.style.display = `${this.attitudeIndicator}`;
      });

    this.sub
      .on('rollAr')
      .whenChanged()
      .handle((roll) => {
        this.roll = roll;
        if (!this.roll.isNormalOperation()) {
          this.attitudeIndicatorRef.instance.style.display = 'none';
          this.alternateLawRef.instance.style.display = 'none';
        } else {
          this.attitudeIndicatorRef.instance.style.display = 'block';
          Math.abs(roll.value) > 35 && Math.abs(roll.value) <= 71
            ? (this.alternateLawRef.instance.style.display = 'block')
            : (this.alternateLawRef.instance.style.display = 'none');
        }
        if (Math.abs(roll.value) > 71) {
          this.attitudeIndicatorRef.instance.style.display = 'none';
          this.alternateLawRef.instance.style.display = 'none';
        }
      });

    this.sub
      .on('pitchAr')
      .whenChanged()
      .handle((pitch) => {
        this.pitch.value = pitch.value;
        if (!this.pitch.isNormalOperation()) {
          this.attitudeIndicatorRef.instance.style.display = 'none';
        } else {
          if (pitch.value > 39 || pitch.value < -25) {
            this.attitudeIndicatorRef.instance.style.display = 'none';
            this.alternateLawRef.instance.style.display = 'none';
          } else {
            this.attitudeIndicatorRef.instance.style.display = 'block';
          }
        }
      });
  }

  render(): VNode {
    return (
      <g id="FullAttitudeUpperInfoGroup" ref={this.fullGroupRef}>
        <g id="AttitudeUpperInfoGroup" ref={this.attitudeIndicatorRef}>
          <g id="RollIndicatorFixed" class="LargeStroke  Green">
            <path d="m 640,138.44282 12.21523,-20.20611 h -24.43047 zz" />
            <path d="m 735.2  164 14.1,-24.5" />
            <path d="m 705.1 150 7.7,-20.7" />
            <path d="m 673 141.5 4,-22.2" />
            <path d="m 544.8  164 -14.1,-24.5" />
            <path d="m 574.9 150 -7.7,-20.7" />
            <path d="m 607 141.5 -4,-22.2" />

            <g id="alternateLawRollRef" ref={this.alternateLawRef}>
              <path d="m 774.5 194.5 20,-20" />
              <path d="m 813 249 19,-9" />
              <path d="m 505.5 194.5 -20,-20" />
              <path d="m 467 249 -19,-9" />
              <path d="M 467.5 249.3 A 190 190 263 0 1  812.5 249.3 " />
            </g>
          </g>
        </g>
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
            <FDYawBar bus={this.props.bus} instrument={this.props.instrument} />
          </g>

          <AircraftReference bus={this.props.bus} instrument={this.props.instrument} />
          <FlightPathVector
            bus={this.props.bus}
            isAttExcessive={this.props.isAttExcessive}
            filteredRadioAlt={this.props.filteredRadioAlt}
          />
          <FlightPathDirector bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
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

    const sub = this.props.bus.getSubscriber<HUDSimvars & PFDSimvars & HudElems>();
    sub.on('decMode').handle((m) => {
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

class FDYawBar extends DisplayComponent<{ bus: ArincEventBus; instrument: BaseInstrument }> {
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

    const sub = this.props.bus.getSubscriber<HUDSimvars & PFDSimvars & Arinc429Values & FgBus & FcuBus>();

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
        <LocalizerIndicator bus={this.props.bus} instrument={this.props.instrument} />
      </g>
    );
  }
}

class LocalizerIndicator extends DisplayComponent<{ bus: ArincEventBus; instrument: BaseInstrument }> {
  private LSLocRef = FSComponent.createRef<SVGGElement>();
  private lagFilter = new LagFilter(1.5);
  private rightDiamond = FSComponent.createRef<SVGPathElement>();

  private leftDiamond = FSComponent.createRef<SVGPathElement>();

  private locDiamond = FSComponent.createRef<SVGPathElement>();

  private diamondGroup = FSComponent.createRef<SVGGElement>();
  private handleNavRadialError(radialError: number): void {
    const deviation = this.lagFilter.step(radialError, this.props.instrument.deltaTime / 1000);
    const dots = deviation / 0.8;

    if (dots > 2) {
      this.rightDiamond.instance.classList.remove('HiddenElement');
      this.leftDiamond.instance.classList.add('HiddenElement');
      this.locDiamond.instance.classList.add('HiddenElement');
    } else if (dots < -2) {
      this.rightDiamond.instance.classList.add('HiddenElement');
      this.leftDiamond.instance.classList.remove('HiddenElement');
      this.locDiamond.instance.classList.add('HiddenElement');
    } else {
      this.locDiamond.instance.classList.remove('HiddenElement');
      this.rightDiamond.instance.classList.add('HiddenElement');
      this.leftDiamond.instance.classList.add('HiddenElement');
      this.locDiamond.instance.style.transform = `translate3d(${(dots * 30.221) / 2}px, 0px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & PFDSimvars & ClockEvents & Arinc429Values & HudElems>();

    sub
      .on('hasLoc')
      //.whenChanged()
      .handle((hasLoc) => {
        if (hasLoc) {
          this.diamondGroup.instance.classList.remove('HiddenElement');
          this.props.bus.on('navRadialError', this.handleNavRadialError.bind(this));
        } else {
          this.diamondGroup.instance.classList.add('HiddenElement');
          this.lagFilter.reset();
          this.props.bus.off('navRadialError', this.handleNavRadialError.bind(this));
        }
      });
  }

  render(): VNode {
    return (
      <g id="YawLocSymbolsGroup" transform="scale(2.5 2.5) translate(187 0)">
        <g ref={this.LSLocRef}>
          <path
            class="NormalStroke Green"
            d="m54.804 130.51a1.0073 1.0079 0 1 0-2.0147 0 1.0073 1.0079 0 1 0 2.0147 0z"
          />
          <path
            class="NormalStroke Green"
            d="m39.693 130.51a1.0074 1.0079 0 1 0-2.0147 0 1.0074 1.0079 0 1 0 2.0147 0z"
          />
          <path
            class="NormalStroke Green"
            d="m85.024 130.51a1.0073 1.0079 0 1 0-2.0147 0 1.0073 1.0079 0 1 0 2.0147 0z"
          />
          <path
            class="NormalStroke Green"
            d="m100.13 130.51a1.0074 1.0079 0 1 0-2.0147 0 1.0074 1.0079 0 1 0 2.0147 0z"
          />
          <g class="HiddenElement" ref={this.diamondGroup}>
            <path
              id="LocDiamondRight"
              ref={this.rightDiamond}
              class="NormalStroke Green HiddenElement"
              d="m99.127 133.03 3.7776-2.5198-3.7776-2.5198"
            />
            <path
              id="LocDiamondLeft"
              ref={this.leftDiamond}
              class="NormalStroke Green HiddenElement"
              d="m38.686 133.03-3.7776-2.5198 3.7776-2.5198"
            />
            <path
              id="LocDiamond"
              ref={this.locDiamond}
              class="NormalStroke Green HiddenElement"
              d="m65.129 130.51 3.7776 2.5198 3.7776-2.5198-3.7776-2.5198z"
            />
          </g>
          <path
            id="LocalizerNeutralLine"
            class="Green Fill"
            d="m 68.14059,133.69116 v -6.35451 h 1.531629 v 6.35451 z"
          />
        </g>
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

    const sub = this.props.bus.getSubscriber<HUDSimvars & PFDSimvars & Arinc429Values & HudElems>();

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
      .on('decMode')
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
