import {
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
  ClockEvents,
  ConsumerSubject,
  MappedSubject,
  Subscription,
} from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { FlightPathDirector } from './FlightPathDirector';
import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FcdcValueProvider } from './shared/FcdcValueProvider';
import { FIVE_DEG, HudElems, HudMode, LagFilter, calculateHorizonOffsetFromPitch } from './HUDUtils';
import { LateralMode } from '@shared/autopilot';
interface AttitudeIndicatorFixedUpperProps {
  readonly bus: EventBus;
  readonly fcdcData: FcdcValueProvider;
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

  private readonly isNormalLawActive = this.props.fcdcData.fcdcDiscreteWord1.map(
    (dw) => dw.bitValue(11) && !dw.isFailureWarning(),
  );

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
  private lateralMode = 0;

  private fdActive = false;
  private isActive(): boolean {
    if (!this.fdActive || !(this.lateralMode === LateralMode.ROLL_OUT || this.lateralMode === LateralMode.RWY)) {
      return false;
    }
    return true;
  }
  private sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars & HudElems>();
  private readonly inairAcftRef = ConsumerSubject.create(this.sub.on('inAirAcftRef').whenChanged(), '');
  private readonly ngc = ConsumerSubject.create(this.sub.on('noseGearCompressed').whenChanged(), true);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);

  private readonly isInAirRefVisible = MappedSubject.create(
    ([inairAcftRef, ngc, hudMode]) => {
      if (hudMode === HudMode.TAKEOFF || hudMode === HudMode.ROLLOUT_OR_RTO) {
        return !ngc || inairAcftRef === 'block' ? 'block' : 'none';
      } else {
        return inairAcftRef;
      }
    },
    this.inairAcftRef,
    this.ngc,
    this.hudMode,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('rollAr').handle((r) => {
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

    this.sub.on('pitchAr').handle((p) => {
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
            instrument={this.props.instrument}
            isAttExcessive={this.props.isAttExcessive}
            filteredRadioAlt={this.props.filteredRadioAlt}
          />
          <FlightPathDirector bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />

          <g style={this.fdVisibilitySub}>
            <FDYawBar bus={this.props.bus} instrument={this.props.instrument} />
          </g>

          <ReverserIndicator bus={this.props.bus} />
          <g id="AircraftReferences">
            <g
              id="AircraftReferenceInAir"
              class="SmallStroke Green"
              ref={this.inAirRef}
              display={this.isInAirRefVisible}
            >
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
      this.yawRef.instance.style.transform = `translate3d(${offset}px, 395px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars & HudElems>();
    sub.on('pitchAr').handle((p) => {
      this.pitch = p.value;
    });
    sub
      .on('hudFlightPhaseMode')
      .whenChanged()
      .handle((v) => {
        this.hudMode = v;
        v === 0 ? (this.onGround = false) : (this.onGround = true);
        this.onGround
          ? (this.groundYawGroupRef.instance.style.display = 'block')
          : (this.groundYawGroupRef.instance.style.display = 'none');
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
        <path ref={this.GroundYawRef} id="GroundYawRef" class="NormalStroke Green" d="m 640 385  l 10 -17.3 h -20  z" />
        <LocalizerIndicator bus={this.props.bus} instrument={this.props.instrument} />
      </g>
    );
  }
}

class LocalizerIndicator extends DisplayComponent<{ bus: EventBus; instrument: BaseInstrument }> {
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
      this.locDiamond.instance.style.transform = `translate3d(${(dots * 90.6) / 2}px, 0px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();

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
      <g ref={this.LSLocRef} id="YawRefBackCourseLocalizer" transform={`translate(433.5 77)`}>
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

  private text: string = '';
  private handleDecIndState() {
    if (this.declutterMode == 0) {
      this.text = 'N';
      this.declutterModeRef.instance.style.visibility = 'visible';
    } else if (this.declutterMode == 1) {
      this.text = 'D';
      this.declutterModeRef.instance.style.visibility = 'visible';
    } else if (this.declutterMode == 2) {
      this.declutterModeRef.instance.style.visibility = 'hidden';

      this.text = '';
    }
    this.textSub.set(this.text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        this.handleDecIndState();
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

export class ReverserIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & HudElems & ClockEvents>();
  private revGroupRef = FSComponent.createRef<SVGGElement>();
  private rev2Ref = FSComponent.createRef<SVGGElement>();
  private rev3Ref = FSComponent.createRef<SVGGElement>();
  private rev2TxtRef = FSComponent.createRef<SVGTextElement>();
  private rev3TxtRef = FSComponent.createRef<SVGTextElement>();
  private text: string = '';
  private readonly eng2State = ConsumerSubject.create(this.sub.on('eng2State').whenChanged(), 0); // no rev failure implemented  using on/off state instead
  private readonly eng3State = ConsumerSubject.create(this.sub.on('eng3State').whenChanged(), 0); // no rev failure implemented  using on/off state instead
  private readonly rev2 = ConsumerSubject.create(this.sub.on('rev2').whenChanged(), 0);
  private readonly rev3 = ConsumerSubject.create(this.sub.on('rev3').whenChanged(), 0);
  private readonly rev2Pos = ConsumerSubject.create(this.sub.on('rev2Pos'), 0);
  private readonly rev3Pos = ConsumerSubject.create(this.sub.on('rev3Pos'), 0);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);

  private readonly reverser2State = MappedSubject.create(
    ([rev2, rev2Pos, eng2State, hudMode]) => {
      if (hudMode === HudMode.ROLLOUT_OR_RTO) {
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
    ([rev3, rev3Pos, eng3State, hudMode]) => {
      if (hudMode === HudMode.ROLLOUT_OR_RTO || hudMode === HudMode.TAXI) {
        if (rev3 === 1) {
          if (eng3State === 1) {
            if (rev3Pos < 0.95) {
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
    this.rev3,
    this.rev3Pos,
    this.eng3State,
    this.hudMode,
  );

  private setState(eng: number, state: any) {
    if (eng === 2) {
      if (state === 1) {
        this.rev2Ref.instance.setAttribute('d', 'm 615 290 v -17 h 17 v 17 z');
        this.rev2Ref.instance.setAttribute('stroke-dasharray', '3 6');
        this.rev2TxtRef.instance.textContent = '';
      } else if (state === 2) {
        this.rev2Ref.instance.setAttribute('d', 'm 615 290 v -17 h 17 v 17 z');
        this.rev2Ref.instance.setAttribute('stroke-dasharray', '');
        this.rev2TxtRef.instance.textContent = 'R';
      } else if (state === 3) {
        this.rev2Ref.instance.setAttribute('d', 'm 615 290 v -17 h 17 v 17 z  m 0 0 l 17 -17   m -17 0 l 17 17 ');
        this.rev2Ref.instance.setAttribute('stroke-dasharray', '');
        this.rev2TxtRef.instance.textContent = '';
      } else {
        this.rev2Ref.instance.setAttribute('d', '');
        this.rev2TxtRef.instance.textContent = '';
      }
    }
    if (eng === 3) {
      if (state === 1) {
        this.rev3Ref.instance.setAttribute('d', 'm 648 290 v -17 h 17 v 17 z');
        this.rev3Ref.instance.setAttribute('stroke-dasharray', '3 6');
        this.rev3TxtRef.instance.textContent = '';
      } else if (state === 2) {
        this.rev3Ref.instance.setAttribute('d', 'm 648 290 v -17 h 17 v 17 z');
        this.rev3Ref.instance.setAttribute('stroke-dasharray', '');
        this.rev3TxtRef.instance.textContent = 'R';
      } else if (state === 3) {
        this.rev3Ref.instance.setAttribute('d', 'm 648 290 v -17 h 17 v 17 z  m 0 0 l 17 -17   m -17 0 l 17 17 ');
        this.rev3Ref.instance.setAttribute('stroke-dasharray', '');
        this.rev3TxtRef.instance.textContent = '';
      } else {
        this.rev3Ref.instance.setAttribute('d', '');
        this.rev3TxtRef.instance.textContent = '';
      }
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(
      this.eng2State,
      this.eng3State,
      this.rev2,
      this.rev3,
      this.rev2Pos,
      this.rev3Pos,
      this.hudMode,
    );

    this.subscriptions.push(
      this.reverser2State.sub((state) => {
        this.setState(2, state);
      }),
    );
    this.subscriptions.push(
      this.reverser3State.sub((state) => {
        this.setState(3, state);
      }),
    );
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
        <path ref={this.rev2Ref} class="NormalStroke Green " d="" />
        <text ref={this.rev2TxtRef} x="623.5" y="288 " class="FontForAnts MiddleAlign Green ">
          {this.text}
        </text>
        <path ref={this.rev3Ref} class="NormalStroke Green " d="" />
        <text ref={this.rev3TxtRef} x="656.5" y="288 " class="FontForAnts MiddleAlign Green ">
          {this.text}
        </text>
      </g>
    );
  }
}
