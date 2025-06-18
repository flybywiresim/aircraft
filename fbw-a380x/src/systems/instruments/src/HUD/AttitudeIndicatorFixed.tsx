import {
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
  ClockEvents,
} from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { Arinc429ConsumerSubject, Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { FlightPathDirector } from './FlightPathDirector';
import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FIVE_DEG, HudElems, LagFilter, calculateHorizonOffsetFromPitch } from './HUDUtils';
import { LateralMode } from '@shared/autopilot';
interface AttitudeIndicatorFixedUpperProps {
  bus: EventBus;
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

  private visibilitySub = Subject.create('hidden');

  private readonly fcdcDiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdcDiscreteWord1'));

  private readonly isNormalLawActive = this.fcdcDiscreteWord1.map((dw) => dw.bitValue(11) && !dw.isFailureWarning());

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('attitudeIndicator').handle((value) => {
      this.fullGroupVis = value.get().toString();
      this.fullGroupRef.instance.style.display = `${this.fullGroupVis}`;
    });

    this.sub
      .on('attitudeIndicator')
      .whenChanged()
      .handle((v) => {
        this.attitudeIndicator = v.get().toString();
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
        this.pitch = pitch;
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
          <g id="RollIndicatorFixed" class="NormalStroke Green">
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

interface AttitudeIndicatorFixedCenterProps {
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
  instrument: BaseInstrument;
}

export class AttitudeIndicatorFixedCenter extends DisplayComponent<AttitudeIndicatorFixedCenterProps> {
  private roll = new Arinc429Word(0);

  private pitch = new Arinc429Word(0);

  private visibilitySub = Subject.create('hidden');

  private failureVis = Subject.create('hidden');

  private fdVisibilitySub = Subject.create('hidden');
  private inAirRef = FSComponent.createRef<SVGGElement>();
  private gndRef = FSComponent.createRef<SVGGElement>();
  private declutterMode = 0;
  private onGround = true;
  private visibilityAirSub = '';
  private visibilityGroundSub = '';
  private lateralMode = 0;

  private fdActive = false;
  private isActive(): boolean {
    if (!this.fdActive || !(this.lateralMode === LateralMode.ROLL_OUT || this.lateralMode === LateralMode.RWY)) {
      return false;
    }
    return true;
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars & HudElems>();

    sub.on('inAirAcftRef').handle((v) => {
      if (this.visibilityAirSub != v.get().toString()) {
        this.visibilityAirSub = v.get().toString();
        this.inAirRef.instance.style.display = `${this.visibilityAirSub}`;
      }
    });

    sub.on('gndAcftRef').handle((v) => {
      if (this.visibilityGroundSub != v.get().toString()) {
        this.visibilityGroundSub = v.get().toString();
        //todo
      }
    });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        this.onGround = value;
      });

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
          y="532"
        >
          ATT / HDG
        </text>
        <g id="AttitudeSymbolsGroup" style={this.visibilitySub}>
          <FlightPathVector
            bus={this.props.bus}
            isAttExcessive={this.props.isAttExcessive}
            filteredRadioAlt={this.props.filteredRadioAlt}
          />
          <FlightPathDirector bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />

          <g style={this.fdVisibilitySub}>
            <FDYawBar bus={this.props.bus} instrument={this.props.instrument} />
          </g>

          <g id="AircraftReferences">
            <g id="AircraftReferenceInAir" class="SmallStroke Green" ref={this.inAirRef} display="none">
              <path d="m 625,335  v -6 h -30" />
              <path d="m 637,332 h 6 v -6 h -6 z" />
              <path d="m 655, 335 v -6 h 30" />
            </g>
          </g>
        </g>
      </>
    );
  }
}

class FDYawBar extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
  private lateralMode = 0;

  private fdYawCommand = 0;

  private fdActive = false;
  private pitch = 0;

  private groundYawGroupRef = FSComponent.createRef<SVGGElement>();
  private yawRef = FSComponent.createRef<SVGPathElement>();
  private GroundYawRef = FSComponent.createRef<SVGPathElement>();
  private onGround = true;
  private hudMode = -1;
  private isActive(): boolean {
    if (
      !this.fdActive ||
      !this.onGround ||
      !(this.lateralMode === 40 || this.lateralMode === 33 || this.lateralMode === 34)
    ) {
      return false;
    }
    return true;
  }

  private setOffset() {
    const groupOffset = calculateHorizonOffsetFromPitch(this.pitch);
    this.groundYawGroupRef.instance.style.transform = `translate3d(0px, ${groupOffset}px, 0px)`;
    const offset = -Math.max(Math.min(this.fdYawCommand * 3, 120), -120);
    if (this.isActive()) {
      this.yawRef.instance.style.visibility = 'visible';
      this.GroundYawRef.instance.style.visibility = 'visible';
      this.yawRef.instance.style.transform = `translate3d(${offset}px, 410px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars & HudElems>();
    sub.on('pitchAr').handle((p) => {
      this.pitch = p.value;
    });
    sub.on('hudFlightPhaseMode').handle((v) => {
      if (this.hudMode != v.get()) {
        this.hudMode = v.get();
        v.get() === 0 ? (this.onGround = false) : (this.onGround = true);
        this.onGround
          ? (this.groundYawGroupRef.instance.style.display = 'block')
          : (this.groundYawGroupRef.instance.style.display = 'none');
      }
    });
    sub.on('fdYawCommand').handle((fy) => {
      this.fdYawCommand = fy;

      if (this.isActive()) {
        this.setOffset();
      } else {
        this.yawRef.instance.style.visibility = 'hidden';
        this.GroundYawRef.instance.style.visibility = 'hidden';
      }
    });

    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((lm) => {
        this.lateralMode = lm;

        if (this.isActive()) {
          this.setOffset();
        } else {
          this.yawRef.instance.style.visibility = 'hidden';
          this.GroundYawRef.instance.style.visibility = 'hidden';
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
          } else {
            this.yawRef.instance.style.visibility = 'hidden';
            this.GroundYawRef.instance.style.visibility = 'hidden';
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
          } else {
            this.yawRef.instance.style.visibility = 'hidden';
            this.GroundYawRef.instance.style.visibility = 'hidden';
          }
        }
      });
  }

  render(): VNode {
    return (
      <g id="GroundYawGroup" ref={this.groundYawGroupRef}>
        <path
          ref={this.yawRef}
          id="GroundYawSymbol"
          class="NormalStroke Green"
          d="m 640 0 v 40 h 8.059 v -40 l -4.03 -6.854 z"
        />
        <path ref={this.GroundYawRef} id="GroundYawRef" class="NormalStroke Green" d="m 640 400  l 10 -17.3 h -20  z" />
        <LocalizerIndicator bus={this.props.bus} instrument={this.props.instrument} />
      </g>
    );
  }
}

class LocalizerIndicator extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
  private flightPhase = -1;
  private fmgcFlightPhase = -1;
  private declutterMode = 0;
  private onGround = true;
  private LsState = false;
  private LSLocRef = FSComponent.createRef<SVGGElement>();
  private LSLocGroupVerticalOffset = 0;
  private locVis = '';
  private locVisBool = false;
  private hudFlightPhaseMode = 0;
  private lsBtnState = false;
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
      this.locDiamond.instance.style.transform = `translate3d(${(dots * 90.6) / 2}px, 0px, 0px)`;
    }
  }
  private setLocGroupPos() {
    this.LSLocRef.instance.style.transform = `translate3d(433.5px, 77px, 0px)`;
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();

    sub.on('hudFlightPhaseMode').handle((mode) => {
      if (this.hudFlightPhaseMode != mode.get()) {
        this.hudFlightPhaseMode = mode.get();
        mode.get() === 0 ? (this.onGround = false) : (this.onGround = true);
        this.setLocGroupPos();
      }
    });

    const isCaptainSide = getDisplayIndex() === 1;
    sub.on(isCaptainSide ? 'ls1Button' : 'ls2Button').handle((value) => {
      this.lsBtnState = value;
    });

    sub.on('IlsLoc').handle((value) => {
      if (this.locVis != value.get().toString()) {
        this.locVis = value.get().toString();
        this.locVis === 'block' ? (this.locVisBool = true) : (this.locVisBool = false);
        if (this.hudFlightPhaseMode === 0) {
          this.lsBtnState && this.locVisBool
            ? (this.LSLocRef.instance.style.display = `block`)
            : (this.LSLocRef.instance.style.display = `none`);
        } else {
          this.LSLocRef.instance.style.display = `${this.locVis}`;
        }
      }
    });
    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.flightPhase = fp;
      });
    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.fmgcFlightPhase = fp;
      });

    sub.on('decMode').handle((value) => {
      if (this.declutterMode != value.get()) {
        this.declutterMode = value.get();
        this.setLocGroupPos();
      }
    });

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
    sub.on(getDisplayIndex() === 1 ? 'ls1Button' : 'ls2Button').handle((value) => {
      this.LsState = value;
      this.setLocGroupPos();
    });
  }

  render(): VNode {
    return (
      <g ref={this.LSLocRef} id="YawRefBackCourseLocalizer">
        <path class="NormalStroke Green" d="m164.412 391.53a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m119.079 391.53a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m255.072 391.53a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <path class="NormalStroke Green" d="m300.39 391.53a3.022 3.024 0 1 0 -6.044 0 3.022 3.024 0 1 0 6.044 0z" />
        <g class="HiddenElement" ref={this.diamondGroup}>
          <path
            id="LocDiamondRight"
            ref={this.rightDiamond}
            class="NormalStroke Green HiddenElement"
            d="m297.381 399.09 11.333 -7.559 -11.333 -7.559"
          />
          <path
            id="LocDiamondLeft"
            ref={this.leftDiamond}
            class="NormalStroke Green HiddenElement"
            d="m116.058 399.09 -11.333 -7.559 11.333 -7.559"
          />
          <path
            id="LocDiamond"
            ref={this.locDiamond}
            class="NormalStroke Green HiddenElement"
            d="m195.387 391.53 11.333 7.559 11.333 -7.559 -11.333 -7.559z"
          />
        </g>
        <path id="LocalizerNeutralLine" class="Green Fill" d="m204.294 403.5v-24.191h4.536v24.191z" />
      </g>
    );
  }
}

interface DeclutterIndicatorProps {
  bus: ArincEventBus;
}

export class DeclutterIndicator extends DisplayComponent<DeclutterIndicatorProps> {
  private declutterMode = 0;

  private textSub = Subject.create('');

  private declutterModeRef = FSComponent.createRef<SVGPathElement>();

  private handleDecIndState() {
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

    const sub = this.props.bus.getSubscriber<HudElems>();
    sub.on('decMode').handle((value) => {
      if (this.declutterMode != value.get()) {
        this.declutterMode = value.get();
        this.handleDecIndState();
      }
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
