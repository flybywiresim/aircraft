// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
  ClockEvents,
  Subscription,
  ConsumerSubject,
  MappedSubject,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429ConsumerSubject } from '@flybywiresim/fbw-sdk';
import { LateralMode } from '@shared/autopilot';
import { FgBus } from 'instruments/src/HUD/shared/FgBusProvider';
import { FcuBus } from 'instruments/src/HUD/shared/FcuBusProvider';

import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FlightPathDirector } from './FlightPathDirector';
import { HudElems, LagFilter, FIVE_DEG } from './HUDUtils';
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

interface AttitudeIndicatorFixedUpperProps {
  bus: ArincEventBus;
}

export class AttitudeIndicatorFixedUpper extends DisplayComponent<AttitudeIndicatorFixedUpperProps> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & HudElems>();
  private fullGroupRef = FSComponent.createRef<SVGGElement>();
  private attitudeIndicatorRef = FSComponent.createRef<SVGGElement>();
  private alternateLawRef = FSComponent.createRef<SVGGElement>();
  private roll = new Arinc429Word(0);
  private pitch = new Arinc429Word(0);

  private readonly fullGroupVis = ConsumerSubject.create(this.sub.on('attitudeIndicator').whenChanged(), '');
  private readonly attitudeIndicator = ConsumerSubject.create(this.sub.on('attitudeIndicator').whenChanged(), '');
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.fullGroupVis, this.attitudeIndicator);

    this.subscriptions.push(
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
        }),
    );

    this.subscriptions.push(
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
        }),
    );
  }

  render(): VNode {
    return (
      <g id="FullAttitudeUpperInfoGroup" ref={this.fullGroupRef} display={this.fullGroupVis}>
        <g id="AttitudeUpperInfoGroup" ref={this.attitudeIndicatorRef} display={this.attitudeIndicator}>
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
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values>();
  private onRwy = false;

  private visibilitySub = Subject.create('hidden');

  private failureVis = Subject.create('hidden');

  private readonly attFlagVisible = Subject.create(false);

  private fdVisibilitySub = Subject.create('hidden');

  private readonly roll = ConsumerSubject.create(this.sub.on('rollAr'), new Arinc429Word(0));
  private readonly pitch = Arinc429ConsumerSubject.create(this.sub.on('pitchAr'));
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.roll, this.pitch);
    this.subscriptions.push(
      this.roll.sub((roll) => {
        if (!roll.isNormalOperation()) {
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
      }),
    );

    this.subscriptions.push(
      this.pitch.sub((pitch) => {
        if (!pitch.isNormalOperation()) {
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
      }),
    );

    this.props.isAttExcessive.sub((a) => {
      if (a) {
        this.fdVisibilitySub.set('display:none');
      } else if (this.roll.get().isNormalOperation() && this.pitch.get().isNormalOperation()) {
        this.fdVisibilitySub.set('display:inline');
      }
    });
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
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
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

  private textSub = Subject.create('');

  private declutterModeRef = FSComponent.createRef<SVGPathElement>();

  private handleFdState(decMode: number) {
    let text: string = '';
    if (decMode == 0) {
      text = 'N';
      this.declutterModeRef.instance.style.visibility = 'visible';
    } else if (decMode == 1) {
      text = 'D';
      this.declutterModeRef.instance.style.visibility = 'visible';
    } else if (decMode == 2) {
      this.declutterModeRef.instance.style.visibility = 'hidden';

      text = '';
    }
    this.textSub.set(text);
  }
  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode').whenChanged(), 0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.decMode);
    this.subscriptions.push(
      this.decMode.sub((decMode) => {
        this.handleFdState(decMode);
      }),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
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
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & FgBus & FcuBus>();
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

    this.subscriptions.push(
      this.sub
        .on('leftMainGearCompressed')
        .whenChanged()
        .handle((v) => {
          this.lmgc = v;
        }),
    );
    this.subscriptions.push(
      this.sub
        .on('rightMainGearCompressed')
        .whenChanged()
        .handle((v) => {
          this.rmgc = v;
        }),
    );

    this.subscriptions.push(
      this.sub.on('yawFdCommand').handle((fy) => {
        this.fdYawCommand = fy;

        this.handleFdState();
      }),
    );

    this.subscriptions.push(
      this.sub
        .on('fdEngaged')
        .whenChanged()
        .handle((fd) => {
          this.fdEngaged = fd;

          this.handleFdState();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fcuEisDiscreteWord2')
        .whenChanged()
        .handle((tr) => {
          this.fcuEisDiscreteWord2 = tr;

          this.handleFdState();
        }),
    );
    this.subscriptions.push(
      this.sub.on('pitchAr').handle((p) => {
        this.pitch = p.value;
        this.handleFdState();
      }),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
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
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & ClockEvents & Arinc429Values & HudElems>();
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

    this.subscriptions.push(
      this.sub
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
        }),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g id="YawLocSymbolsGroup" transform="translate(467.5 105)">
        <g ref={this.LSLocRef} id="LocalizerSymbolsGroup">
          <path class="NormalStroke Green" d="m137.01 326.275a2.518 2.52 0 1 0 -5.037 0 2.518 2.52 0 1 0 5.037 0z" />
          <path class="NormalStroke Green" d="m99.232 326.275a2.519 2.52 0 1 0 -5.037 0 2.519 2.52 0 1 0 5.037 0z" />
          <path class="NormalStroke Green" d="m212.56 326.275a2.518 2.52 0 1 0 -5.037 0 2.518 2.52 0 1 0 5.037 0z" />
          <path class="NormalStroke Green" d="m250.325 326.275a2.519 2.52 0 1 0 -5.037 0 2.519 2.52 0 1 0 5.037 0z" />
          <g class="HiddenElement" ref={this.diamondGroup}>
            <path
              id="LocDiamondRight"
              ref={this.rightDiamond}
              class="NormalStroke Green HiddenElement"
              d="m247.817 332.575 9.444 -6.3 -9.444 -6.3"
            />
            <path
              id="LocDiamondLeft"
              ref={this.leftDiamond}
              class="NormalStroke Green HiddenElement"
              d="m96.715 332.575 -9.444 -6.3 9.444 -6.3"
            />
            <path
              id="LocDiamond"
              ref={this.locDiamond}
              class="NormalStroke Green HiddenElement"
              d="m162.823 326.275 9.444 6.3 9.444 -6.3 -9.444 -6.3z"
            />
          </g>
          <path id="LocalizerNeutralLine" class="Green Fill" d="m170.351 334.228v-15.886h3.829v15.886z" />
        </g>
      </g>
    );
  }
}

class AircraftReference extends DisplayComponent<{ bus: ArincEventBus; instrument: BaseInstrument }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & HudElems>();
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

    this.subscriptions.push(
      this.sub
        .on('leftMainGearCompressed')
        .whenChanged()
        .handle((value) => {
          this.onGround = value;
        }),
    );
    this.subscriptions.push(
      this.sub
        .on('hasLoc')
        .whenChanged()
        .handle((hasLoc) => {
          this.hasLoc = hasLoc;
        }),
    );
    this.subscriptions.push(
      this.sub
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
        }),
    );

    this.subscriptions.push(
      this.sub
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
        }),
    );

    this.subscriptions.push(
      this.sub
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
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('pitchAr')
        .whenChanged()
        .handle((pitch) => {
          if (pitch.isNormalOperation()) {
            this.pitch = pitch.value;
          }
        }),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g id="AircraftReferences">
        <g id="AircraftReferenceInAir" class="NormalStroke Green" display={this.visibilityAirSub}>
          <path d="m 625,335  v -6 h -30" />
          <path d="m 637,332 h 6 v -6 h -6 z" />
          <path d="m 655, 335 v -6 h 30" />
        </g>
        <ReverserIndicator bus={this.props.bus} />
      </g>
    );
  }
}

export class ReverserIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & HudElems & ClockEvents>();
  private revGroupRef = FSComponent.createRef<SVGGElement>();
  private rev2Ref = FSComponent.createRef<SVGGElement>();
  private rev1Ref = FSComponent.createRef<SVGGElement>();
  private rev2TxtRef = FSComponent.createRef<SVGTextElement>();
  private rev1TxtRef = FSComponent.createRef<SVGTextElement>();

  private readonly eng2State = ConsumerSubject.create(this.sub.on('eng2State').whenChanged(), 0); // no rev failure implemented  using on/off state instead
  private readonly eng1State = ConsumerSubject.create(this.sub.on('eng1State').whenChanged(), 0); // no rev failure implemented  using on/off state instead
  private readonly rev1 = ConsumerSubject.create(this.sub.on('rev1').whenChanged(), 0);
  private readonly rev2 = ConsumerSubject.create(this.sub.on('rev2').whenChanged(), 0);
  private readonly rev1Pos = ConsumerSubject.create(this.sub.on('rev1Pos').whenChanged(), 0);
  private readonly rev2Pos = ConsumerSubject.create(this.sub.on('rev2Pos').whenChanged(), 0);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);

  private readonly reverser2State = MappedSubject.create(
    ([rev2, rev2Pos, eng2State, hudMode]) => {
      if (hudMode !== 0) {
        if (rev2 === 1) {
          if (eng2State === 1) {
            if (rev2Pos < 0.95) {
              return 1; // rev deployement in progress  display dash
            } else {
              return 2; // rev on  display R
            }
          } else {
            return 3; // not opperative  display cross
          }
        } else {
          return 0; // show nothing
        }
      } else {
        return 0; // show nothing
      }
    },
    this.rev2,
    this.rev2Pos,
    this.eng2State,
    this.hudMode,
  );
  private readonly reverser3State = MappedSubject.create(
    ([rev1, rev1Pos, eng1State, hudMode]) => {
      if (hudMode !== 0) {
        if (rev1 === 1) {
          if (eng1State === 1) {
            if (rev1Pos < 0.95) {
              return 1; // rev deployement in progress  display dash
            } else {
              return 2; // rev on  display R
            }
          } else {
            return 3; // not opperative  display cross
          }
        } else {
          return 0; // show nothing
        }
      } else {
        return 0; // show nothing
      }
    },
    this.rev1,
    this.rev1Pos,
    this.eng1State,
    this.hudMode,
  );

  private setState() {
    if (this.reverser2State.get() === 1) {
      this.rev2Ref.instance.setAttribute('d', 'm 648.5 290 v -17 h 17 v 17 z');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '3 6');
      this.rev2TxtRef.instance.textContent = '';
    } else if (this.reverser2State.get() === 2) {
      this.rev2Ref.instance.setAttribute('d', 'm 648.5 290 v -17 h 17 v 17 z');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev2TxtRef.instance.textContent = 'R';
    } else if (this.reverser2State.get() === 3) {
      this.rev2Ref.instance.setAttribute('d', 'm 648.5 290 v -17 h 17 v 17 z  m 0 0 l 17 -17   m -17 0 l 17 17 ');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev2TxtRef.instance.textContent = '';
    } else {
      this.rev2Ref.instance.setAttribute('d', '');
      this.rev2TxtRef.instance.textContent = '';
    }

    if (this.reverser3State.get() === 1) {
      this.rev1Ref.instance.setAttribute('d', 'm 614.5 290 v -17 h 17 v 17 z');
      this.rev1Ref.instance.setAttribute('stroke-dasharray', '3 6');
      this.rev1TxtRef.instance.textContent = '';
    } else if (this.reverser3State.get() === 2) {
      this.rev1Ref.instance.setAttribute('d', 'm 614.5 290 v -17 h 17 v 17 z');
      this.rev1Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev1TxtRef.instance.textContent = 'R';
    } else if (this.reverser3State.get() === 3) {
      this.rev1Ref.instance.setAttribute('d', 'm 614.5 290 v -17 h 17 v 17 z  m 0 0 l 17 -17   m -17 0 l 17 17 ');
      this.rev1Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev1TxtRef.instance.textContent = '';
    } else {
      this.rev1Ref.instance.setAttribute('d', '');
      this.rev1TxtRef.instance.textContent = '';
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.eng2State,
      this.eng1State,
      this.rev1,
      this.rev2,
      this.rev1Pos,
      this.rev2Pos,
      this.hudMode,
      this.reverser2State,
      this.reverser3State,
    );
    this.sub.on('realTime').handle(() => {
      if (this.reverser2State.get() !== 0 && this.reverser3State.get() !== 0) {
        this.revGroupRef.instance.style.display = 'block';
        this.setState();
      } else {
        this.revGroupRef.instance.style.display = 'none';
      }
    });
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode | null {
    return (
      <g id="ReverseIndicator" ref={this.revGroupRef}>
        <path ref={this.rev1Ref} class="LargeStroke Green " d="" />
        <text ref={this.rev1TxtRef} x="624" y="288.25 " class="FontSmallest MiddleAlign Green ">
          R
        </text>
        <path ref={this.rev2Ref} class="LargeStroke Green " d="" />
        <text ref={this.rev2TxtRef} x="658" y="288.25 " class="FontSmallest MiddleAlign Green ">
          R
        </text>
      </g>
    );
  }
}
