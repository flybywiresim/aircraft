// @ts-strict-ignore
import {
  ClockEvents,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
  ConsumerSubject,
  HEvent,
  NodeReference,
  MappedSubject,
} from '@microsoft/msfs-sdk';

import { Arinc429WordData, Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import {
  calculateHorizonOffsetFromPitch,
  calculateVerticalOffsetFromRoll,
  LagFilter,
  getSmallestAngle,
  HudElems,
} from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HorizontalTape } from './HorizontalTape';
import { SimplaneValues } from '../MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { getDisplayIndex } from './HUD';
import { ONE_DEG, FIVE_DEG, PitchscaleMode } from './HUDUtils';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { HeadingOfftape } from './HeadingIndicator';
import { SyntheticRunway } from './SyntheticRunway';
import { VerticalMode } from '@shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FcdcValueProvider } from './shared/FcdcValueProvider';

const DisplayRange = 35;
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

interface LSPath {
  roll: Arinc429WordData;
  pitch: Arinc429WordData;
  fpa: Arinc429WordData;
  da: Arinc429WordData;
}
class HeadingBug extends DisplayComponent<{ bus: EventBus; isCaptainSide: boolean; yOffset: Subscribable<number> }> {
  private isActive = false;

  private selectedHeading = 0;

  private heading = new Arinc429Word(0);

  private horizonHeadingBug = FSComponent.createRef<SVGGElement>();

  private yOffset = 0;

  private calculateAndSetOffset() {
    const headingDelta = getSmallestAngle(this.selectedHeading, this.heading.value);

    const offset = (headingDelta * DistanceSpacing) / ValueSpacing;

    if (Math.abs(offset) <= DisplayRange + 10) {
      this.horizonHeadingBug.instance.classList.remove('HiddenElement');
      this.horizonHeadingBug.instance.style.transform = `translate3d(${offset}px, ${this.yOffset}px, 0px)`;
    } else {
      this.horizonHeadingBug.instance.classList.add('HiddenElement');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & SimplaneValues & Arinc429Values>();

    sub
      .on('selectedHeading')
      .whenChanged()
      .handle((s) => {
        this.selectedHeading = s;
        if (this.isActive) {
          this.calculateAndSetOffset();
        }
      });

    sub.on('headingAr').handle((h) => {
      this.heading = h;
      if (this.isActive) {
        this.calculateAndSetOffset();
      }
    });

    sub
      .on(this.props.isCaptainSide ? 'fd1Active' : 'fd2Active')
      .whenChanged()
      .handle((fd) => {
        this.isActive = !fd;
        if (this.isActive) {
          this.horizonHeadingBug.instance.classList.remove('HiddenElement');
        } else {
          this.horizonHeadingBug.instance.classList.add('HiddenElement');
        }
      });

    this.props.yOffset.sub((yOffset) => {
      this.yOffset = yOffset;
      if (this.isActive) {
        this.calculateAndSetOffset();
      }
    });
  }

  render(): VNode {
    return (
      <g ref={this.horizonHeadingBug} id="HorizonHeadingBug">
        <path class="ThickOutline" d="m68.906 80.823v-9.0213" />
        <path class="ThickStroke Cyan" d="m68.906 80.823v-9.0213" />
      </g>
    );
  }
}

interface HorizonProps {
  readonly bus: ArincEventBus;
  readonly instrument: BaseInstrument;
  readonly isAttExcessive: Subscribable<boolean>;
  readonly filteredRadioAlt: Subscribable<number>;
  readonly fcdcData: FcdcValueProvider;
}

export class Horizon extends DisplayComponent<HorizonProps> {
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars>();

  private pitchGroupRef = FSComponent.createRef<SVGGElement>();

  private rollGroupRef = FSComponent.createRef<SVGGElement>();

  private yOffset = Subject.create(0);

  private headingFailed = Subject.create(true);

  private readonly isNormalLawActive = this.props.fcdcData.fcdcDiscreteWord1.map(
    (dw) => dw.bitValue(11) && !dw.isFailureWarning(),
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('headingAr').handle((h) => {
      this.headingFailed.set(!h.isNormalOperation());
    });
    this.sub
      .on('pitchAr')
      .withArinc429Precision(3)
      .handle((pitch) => {
        if (pitch.isNormalOperation()) {
          this.pitchGroupRef.instance.style.display = 'block';
        } else {
          this.pitchGroupRef.instance.style.display = 'none';
        }
        this.pitchGroupRef.instance.style.transform = `translate3d(0px, ${calculateHorizonOffsetFromPitch(pitch.value) - FIVE_DEG}px, 0px)`;
        const yOffset = calculateHorizonOffsetFromPitch(pitch.value) - FIVE_DEG;
        this.yOffset.set(yOffset);
      });

    this.sub
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
  }

  render(): VNode {
    return (
      <g id="RollGroup" ref={this.rollGroupRef} style="display:none">
        <g id="PitchGroup" ref={this.pitchGroupRef}>
          <PitchScale
            bus={this.props.bus}
            filteredRadioAlt={this.props.filteredRadioAlt}
            isAttExcessive={this.props.isAttExcessive}
          />

          {/* horizon */}
          <path id="HorizonLine" d="m -100 512 h 1480" class="NormalStroke Green" />

          <HorizontalTape
            type="headingTape"
            bus={this.props.bus}
            displayRange={DisplayRange}
            valueSpacing={ValueSpacing}
            distanceSpacing={DistanceSpacing}
            yOffset={Subject.create(0)}
          />

          <HeadingOfftape bus={this.props.bus} failed={this.headingFailed} />

          <TailstrikeIndicator bus={this.props.bus} />
        </g>

        <SideslipIndicator bus={this.props.bus} instrument={this.props.instrument} />

        <HeadingBug bus={this.props.bus} isCaptainSide={getDisplayIndex() === 1} yOffset={this.yOffset} />
      </g>
    );
  }
}

class TailstrikeIndicator extends DisplayComponent<{ bus: EventBus }> {
  private tailStrike = FSComponent.createRef<SVGPathElement>();

  private needsUpdate = false;

  private tailStrikeConditions = {
    altitude: new Arinc429Word(0),
    speed: 0,
    tla1: 0,
    tla2: 0,
    tla3: 0,
    tla4: 0,
    leftGearCompressed: true,
    rightGearCompressed: true,
    approachPhase: false,
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents>();

    sub.on('chosenRa').handle((ra) => {
      this.tailStrikeConditions.altitude = ra;
      this.needsUpdate = true;
    });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((lg) => {
        this.tailStrikeConditions.leftGearCompressed = lg;
        this.needsUpdate = true;
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((rg) => {
        this.tailStrikeConditions.rightGearCompressed = rg;
        this.needsUpdate = true;
      });

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.tailStrikeConditions.approachPhase = fp === 5;
        this.needsUpdate = true;
      });

    sub
      .on('tla1')
      .whenChanged()
      .handle((tla) => {
        this.tailStrikeConditions.tla1 = tla;
        this.needsUpdate = true;
      });
    sub
      .on('tla2')
      .whenChanged()
      .handle((tla) => {
        this.tailStrikeConditions.tla2 = tla;
        this.needsUpdate = true;
      });

    sub
      .on('tla3')
      .whenChanged()
      .handle((tla) => {
        this.tailStrikeConditions.tla3 = tla;
        this.needsUpdate = true;
      });
    sub
      .on('tla4')
      .whenChanged()
      .handle((tla) => {
        this.tailStrikeConditions.tla4 = tla;
        this.needsUpdate = true;
      });

    sub
      .on('speedAr')
      .whenChanged()
      .handle((speed) => {
        this.tailStrikeConditions.speed = speed.value;
        this.needsUpdate = true;
      });

    sub.on('realTime').onlyAfter(2).handle(this.hideShow.bind(this));
  }

  private hideShow(_time: number) {
    if (this.needsUpdate) {
      this.needsUpdate = false;

      // FIX ME indicatior should disappear 3 seconds after takeoff and 4 seconds after go aroud initaition. Use better logic without FM flight phase?
      if (
        ((this.tailStrikeConditions.tla1 >= 35 ||
          this.tailStrikeConditions.tla2 >= 35 ||
          this.tailStrikeConditions.tla3 >= 35 ||
          this.tailStrikeConditions.tla4 >= 35) &&
          this.tailStrikeConditions.leftGearCompressed &&
          this.tailStrikeConditions.rightGearCompressed) ||
        (this.tailStrikeConditions.approachPhase &&
          this.tailStrikeConditions.altitude.value < 400 &&
          this.tailStrikeConditions.speed > 50)
      ) {
        this.tailStrike.instance.style.display = 'inline';
      } else {
        this.tailStrike.instance.style.display = 'none';
      }
    }
  }

  render(): VNode {
    return (
      <path
        ref={this.tailStrike}
        id="TailstrikeWarning"
        d="m 658.88 40 h 14.684 l-33.564 40 -33.564 -40 h 14.684 l 18.88  22.5 z"
        class="NormalStroke Green"
      />
    );
  }
}

interface SideslipIndicatorProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

class SideslipIndicator extends DisplayComponent<SideslipIndicatorProps> {
  private sideslipIndicatorFilter = new LagFilter(0.8);

  private classNameSub = Subject.create('Yellow');

  private rollTriangleRef = FSComponent.createRef<SVGGElement>();

  private slideSlip = FSComponent.createRef<SVGPathElement>();

  private onGround = true;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;

  private roll = new Arinc429Word(0);

  private betaTargetActive = 0;

  private beta = 0;

  private betaTarget = 0;

  private latAcc = 0;

  private attitudeIndicator = '';

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & HudElems>();

    sub
      .on('attitudeIndicator')
      .whenChanged()
      .handle((v) => {
        this.attitudeIndicator = v;
        this.rollTriangleRef.instance.style.display = `${this.attitudeIndicator}`;
      });
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
      .on('beta')
      .withPrecision(2)
      .handle((beta) => {
        this.beta = beta;
        this.determineSlideSlip();
      });

    sub
      .on('betaTargetActive')
      .whenChanged()
      .handle((betaTargetActive) => {
        this.betaTargetActive = betaTargetActive;
        this.determineSlideSlip();
      });

    sub
      .on('betaTarget')
      .withPrecision(2)
      .handle((betaTarget) => {
        this.betaTarget = betaTarget;
        this.determineSlideSlip();
      });

    sub
      .on('latAcc')
      .atFrequency(2)
      .handle((latAcc) => {
        this.latAcc = latAcc;
        this.determineSlideSlip();
      });
  }

  private determineSlideSlip() {
    const multiplier = 100;
    const currentValueAtPrecision = Math.round(this.roll.value * multiplier) / multiplier;
    const verticalOffset = calculateVerticalOffsetFromRoll(currentValueAtPrecision);
    let offset = 0;

    if (this.onGround) {
      // on ground, lateral g is indicated. max 0.3g, max deflection is 15mm
      const latAcc = Math.round(this.latAcc * multiplier) / multiplier; // SimVar.GetSimVarValue('ACCELERATION BODY X', 'G Force');
      const accInG = Math.min(0.3, Math.max(-0.3, latAcc));
      offset = (-accInG * 15) / 0.3;
    } else {
      const beta = this.beta;
      const betaTarget = this.betaTarget;
      offset = Math.max(Math.min((beta - betaTarget) * 5, 75), -75);
    }

    const betaTargetActive = this.betaTargetActive === 1;
    const SIIndexOffset = Math.max(
      0.00001,
      this.sideslipIndicatorFilter.step(offset, this.props.instrument.deltaTime / 1000),
    );

    this.rollTriangleRef.instance.style.transform = `translate3d(0px, ${verticalOffset.toFixed(2)}px, 0px)`;
    this.classNameSub.set(`${betaTargetActive ? 'Green' : 'Green'}`);
    this.slideSlip.instance.style.transform = `translate3d(${SIIndexOffset}px, 0px, 0px)`;
  }

  render(): VNode {
    return (
      <g id="RollTriangleGroup" ref={this.rollTriangleRef} class="NormalStroke Green CornerRound">
        <g transform="translate(295 -60)">
          <path d="m330.37 219.915 14.302 -21.166 14.302 21.166z" />
          <path id="SideSlipIndicator" ref={this.slideSlip} d="m369.87 236.04 -7.492 -11.087h-35.414l-7.492 11.087z" />
        </g>
      </g>
    );
  }
}

class PitchScale extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
}> {
  private forcedFma = false;
  private declutterMode = 0;
  private crosswindMode = false;

  private sVisibility = Subject.create<String>('');
  private sVisibilityDeclutterMode2 = Subject.create<String>('');
  private sVisibilitySwitch = Subject.create<String>('block');

  private sub = this.props.bus.getArincSubscriber<
    Arinc429Values & DmcLogicEvents & HUDSimvars & ClockEvents & HEvent & HudElems
  >();
  private needsUpdate = false;

  private threeDegLine = FSComponent.createRef<SVGGElement>();
  private pitchScaleMode = PitchscaleMode.FULL;
  private activeVerticalModeSub = Subject.create(0);
  private selectedFpa = Subject.create(0);
  private gsArmed = false;
  private threeDegPath = FSComponent.createRef<SVGPathElement>();
  private threeDegTxtRef = FSComponent.createRef<SVGTextElement>();
  private threeDegTxtBgRef = FSComponent.createRef<SVGPathElement>();
  private readonly ls1btn = ConsumerSubject.create(this.sub.on('ls1Button').whenChanged(), false);
  private readonly ls2btn = ConsumerSubject.create(this.sub.on('ls2Button').whenChanged(), false);
  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode').whenChanged(), 0);
  private readonly flightPhase = ConsumerSubject.create(this.sub.on('fmgcFlightPhase').whenChanged(), 0);
  private readonly threeDegLineVis = MappedSubject.create(
    ([ls1btn, ls2btn, decMode, flightPhase]) => {
      if (ls1btn || ls2btn) {
        if (flightPhase === FmgcFlightPhase.Approach) {
          return 'block';
        } else {
          return decMode === 2 ? 'none' : 'block';
        }
      } else {
        return 'none';
      }
    },
    this.ls1btn,
    this.ls2btn,
    this.decMode,
    this.flightPhase,
  );
  private data: LSPath = {
    roll: new Arinc429Word(0),
    pitch: new Arinc429Word(0),
    fpa: new Arinc429Word(0),
    da: new Arinc429Word(0),
  };

  private setPitchScale() {
    if (this.pitchScaleMode === PitchscaleMode.OFF) {
      this.sVisibility.set('none');
      this.sVisibilityDeclutterMode2.set('none');
    } else if (this.pitchScaleMode === PitchscaleMode.FULL) {
      this.sVisibility.set('block');
      this.sVisibilityDeclutterMode2.set('block');
    } else {
      this.sVisibility.set('none');
      this.sVisibilityDeclutterMode2.set('block');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('fmaVerticalArmed')
      .whenChanged()
      .handle((fmv) => {
        ((fmv >> 4) & 1) === 1 ? (this.gsArmed = true) : (this.gsArmed = false);
      });
    this.sub
      .on('pitchScaleMode')
      .whenChanged()
      .handle((v) => {
        this.pitchScaleMode = v;
        this.setPitchScale();
      });

    this.sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        this.setPitchScale();
      });

    this.sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((activeVerticalMode) => {
        this.activeVerticalModeSub.set(activeVerticalMode);
      });
    this.sub.on('selectedFpa').handle((fpa) => {
      this.selectedFpa.set(fpa);
      this.needsUpdate = true;
    });
    this.sub.on('fpa').handle((fpa) => {
      this.data.fpa = fpa;
      this.needsUpdate = true;
    });
    this.sub.on('da').handle((da) => {
      this.data.da = da;
      this.needsUpdate = true;
    });
    this.sub.on('rollAr').handle((r) => {
      this.data.roll = r;
      this.needsUpdate = true;
    });
    this.sub.on('pitchAr').handle((p) => {
      this.data.pitch = p;
      this.needsUpdate = true;
    });
    this.sub.on('realTime').handle((_t) => {
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
    // FIXME slope data from the FMS only available or updated when navaid page is displayed. Using sim data instead
    let lsSlope = parseInt(SimVar.GetSimVarValue('NAV RAW GLIDE SLOPE:3', 'degrees'));
    lsSlope === 0 ? (lsSlope = 3) : (lsSlope = parseInt(SimVar.GetSimVarValue('NAV RAW GLIDE SLOPE:3', 'degrees')));
    const daLimConv = (this.data.da.value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value);
    const rollCos = Math.cos((this.data.roll.value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    this.threeDegLine.instance.style.transform = `translate3d(${xOffset}px, 0px, 0px)`;

    const fpaTxt = this.selectedFpa.get() % 1 === 0 ? `${this.selectedFpa.get()}.0°` : `${this.selectedFpa.get()}°`;

    if (
      this.activeVerticalModeSub.get() === VerticalMode.GS_TRACK ||
      this.activeVerticalModeSub.get() === VerticalMode.GS_CPT ||
      this.activeVerticalModeSub.get() === VerticalMode.LAND ||
      this.gsArmed === true
    ) {
      this.threeDegPath.instance.setAttribute(
        'd',
        `M 565,${512 + (lsSlope / 5) * FIVE_DEG} h -80  M 713,${512 + (lsSlope / 5) * FIVE_DEG} h 80  `,
      );
      this.threeDegTxtRef.instance.setAttribute('y', `${512 + (lsSlope / 5) * FIVE_DEG + 6.5}`);
      this.threeDegTxtRef.instance.textContent = `-${lsSlope}.0°`;
      this.threeDegTxtRef.instance.classList.remove('Green');
      this.threeDegTxtRef.instance.classList.add('InverseGreen');
      this.threeDegTxtBgRef.instance.style.display = `block`;
      this.threeDegTxtBgRef.instance.classList.add('GreenFill3');
      this.threeDegTxtBgRef.instance.setAttribute('y', `${512 + (lsSlope / 5) * FIVE_DEG}`);
      this.threeDegTxtBgRef.instance.setAttribute(
        'd',
        `m 800 ${512 + (lsSlope / 5) * FIVE_DEG - 13.5} h 45 v 27 h -45 z `,
      );
    } else if (this.activeVerticalModeSub.get() === VerticalMode.FPA) {
      this.threeDegPath.instance.setAttribute(
        'd',
        `M 565,${512 + (Math.abs(this.selectedFpa.get()) / 5) * FIVE_DEG} h -80  M 713,${512 + (Math.abs(this.selectedFpa.get()) / 5) * FIVE_DEG} h 80  `,
      );

      this.threeDegTxtRef.instance.setAttribute(
        'y',
        `${512 + (Math.abs(this.selectedFpa.get()) / 5) * FIVE_DEG + 6.5}`,
      );
      this.threeDegTxtRef.instance.textContent = fpaTxt;
      this.threeDegTxtRef.instance.classList.remove('InverseGreen');
      this.threeDegTxtRef.instance.classList.add('Green');
      this.threeDegTxtBgRef.instance.style.display = `none`;
      this.threeDegTxtBgRef.instance.classList.remove('GreenFill3');
      this.threeDegTxtBgRef.instance.setAttribute('y', `${512 + (Math.abs(this.selectedFpa.get()) / 5) * FIVE_DEG}`);
      this.threeDegTxtBgRef.instance.setAttribute('d', ``);
    } else {
      this.threeDegPath.instance.setAttribute(
        'd',
        `M 565,${512 + (3 / 5) * FIVE_DEG} h -80  M 713,${512 + (3 / 5) * FIVE_DEG} h 80  `,
      );
      this.threeDegTxtBgRef.instance.style.display = `none`;
    }
  }
  render(): VNode {
    const result = [] as SVGTextElement[];

    // positive pitch, right dotted lines
    for (let i = 1; i < 7; i++) {
      result.push(<path d={`M 518.26,${512 - i * FIVE_DEG} h -71.1 v 11`} display={this.sVisibility} />);
      result.push(<path d={`M 761.74,${512 - i * FIVE_DEG} h 71.1 v 11`} display={this.sVisibility} />);
    }

    for (let i = 1; i < 5; i++) {
      // negative pitch, right dotted lines
      i == 1 ? (this.sVisibilitySwitch = this.sVisibilityDeclutterMode2) : (this.sVisibilitySwitch = this.sVisibility);
      result.push(
        <path class="NormalStroke Green" d={`m 761.74,${512 + i * FIVE_DEG} h 12`} display={this.sVisibilitySwitch} />,
        <path class="NormalStroke Green" d={`m 781.44,${512 + i * FIVE_DEG} h 12`} display={this.sVisibilitySwitch} />,
        <path class="NormalStroke Green" d={`m 801.14,${512 + i * FIVE_DEG} h 12`} display={this.sVisibilitySwitch} />,
        <path
          class="NormalStroke Green"
          d={`m 820.84,${512 + i * FIVE_DEG} h 12 v -11 `}
          display={this.sVisibilitySwitch}
        />,
      );
      // negative pitch, left dotted lines
      result.push(
        <path class="NormalStroke Green" d={`m 518.26,${512 + i * FIVE_DEG} h -12`} display={this.sVisibilitySwitch} />,
        <path class="NormalStroke Green" d={`m 498.56,${512 + i * FIVE_DEG} h -12`} display={this.sVisibilitySwitch} />,
        <path class="NormalStroke Green" d={`m 478.86,${512 + i * FIVE_DEG} h -12`} display={this.sVisibilitySwitch} />,
        <path
          class="NormalStroke Green"
          d={`m 459.16,${512 + i * FIVE_DEG} h -12 v -11`}
          display={this.sVisibilitySwitch}
        />,
      );
    }

    // //3° line
    result.push(
      <g id="ThreeDegreeLine" ref={this.threeDegLine} display={this.threeDegLineVis}>
        <path ref={this.threeDegPath} d="" />
        <g id="SlopeTxt">
          <path ref={this.threeDegTxtBgRef} d="m835 348.5 h45v27h-45z"></path>
          <text x="822.5" ref={this.threeDegTxtRef} class="FontTinyer MiddleAlign InverseGreen"></text>
        </g>
      </g>,
    );

    for (let i = -4; i < 7; i++) {
      if (i === 0) {
        continue;
      }
      i == -1 ? (this.sVisibilitySwitch = this.sVisibilityDeclutterMode2) : (this.sVisibilitySwitch = this.sVisibility);

      const value: number = i * 5;
      const str: string = value.toString();
      result.push(
        <text
          class="FontSmall Green Fill EndAlign"
          x="445"
          y={512 - i * FIVE_DEG + 8.35}
          display={this.sVisibilitySwitch}
        >
          {str}
        </text>,
      );
      result.push(
        <text
          class="FontSmall Green Fill StartAlign"
          x="835"
          y={512 - i * FIVE_DEG + 8.35}
          display={this.sVisibilitySwitch}
        >
          {str}
        </text>,
      );
    }
    return (
      <g id="pitchScale" class="NormalStroke Green">
        {result}
      </g>
    );
  }
}

interface ExtendedHorizonProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
  filteredRadioAlt: Subscribable<number>;
}

export class ExtendedHorizon extends DisplayComponent<ExtendedHorizonProps> {
  private debugVal = FSComponent.createRef<SVGGElement>();
  private spanRefs: NodeReference<SVGTSpanElement>[] = [];
  private pitchGroupRef = FSComponent.createRef<SVGGElement>();
  private rollGroupRef = FSComponent.createRef<SVGGElement>();
  private path = FSComponent.createRef<SVGPathElement>();
  private path2 = FSComponent.createRef<SVGPathElement>();
  private path3 = FSComponent.createRef<SVGPathElement>();
  private extendedAlt = FSComponent.createRef<SVGPathElement>();
  private extendedSpd = FSComponent.createRef<SVGPathElement>();

  private pitch = 0;
  private yOffset = Subject.create(0);

  private xAltTop = Subject.create<String>('');
  private yAltTop = Subject.create<String>('');

  private xSpdTop = Subject.create<String>('');
  private ySpdTop = Subject.create<String>('');

  private spdRollDev = 0;
  private altRollDev = 0;
  private crosswindMode = false;
  private upperBound = 0;
  private lowerBound = 0;
  private valuesToLog = new Map<string, number>();
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars & HudElems>();

    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
      });

    sub
      .on('rollAr')
      .whenChanged()
      .handle((roll) => {
        const radRoll = (roll.value / 180) * Math.PI;

        //frame of reference 1  air pitch   :F1
        //frame 2  center: airHorizonHeadingBug x: hud horizon :F2
        const D = calculateHorizonOffsetFromPitch(this.pitch);

        let rSign = 1;

        const xPos = -D * Math.sin(radRoll);

        // y position from frame2 to eval if extention should be drawn y = 0 is vert pos of acft in air ref
        if (this.crosswindMode == false) {
          this.lowerBound = 0; //= -6.143;
          this.upperBound = 383; //= 355;
        } else {
          this.lowerBound = -91; //= -199.143;
          this.upperBound = 91; //= -27.143;
        }

        let Lalt = 0; //right and left edges  of the alt tape
        let Lspd = 0; //right and left edges  of the spd tape
        if (roll.value < 0) {
          if (D * Math.cos(radRoll) > this.lowerBound && D * Math.cos(radRoll) < this.upperBound) {
            Lspd = 431; // 472;
            Lalt = 400; // 400;
          } else {
            Lalt = 497; // 494;
            Lspd = 530; // 570;
          }
        } else {
          if (D * Math.cos(radRoll) > this.lowerBound && D * Math.cos(radRoll) < this.upperBound) {
            Lalt = 400; // 400;
            Lspd = 431; // 472;
          } else {
            Lalt = 497; // 494;
            Lspd = 530; // 570;
          }
        }
        const xPosF = 640 + (Lalt + xPos) / Math.cos(radRoll);
        const xPosFspd = 640 - (Lspd - xPos) / Math.cos(radRoll);

        if (roll.isNormalOperation()) {
          this.spdRollDev = -(640 - 168) * Math.tan(radRoll);
          this.altRollDev = Lalt * Math.tan(radRoll);
          this.rollGroupRef.instance.style.display = 'block';
          this.rollGroupRef.instance.setAttribute('transform', `rotate(${-roll.value} 640 329.143)`);

          if (roll.value < 0) {
            rSign = -1;
          } else {
            rSign = 1;
          }

          const ax = '640 ';
          const ay = '512 ';
          const bx = '0 ';
          const by = (-D).toString();
          const cx = (640 + xPos * Math.cos(radRoll * rSign)).toString();
          const cy = (512 + xPos * Math.sin(radRoll)).toString();

          const ex = (640 + (Lalt + xPos) * Math.cos(-radRoll)).toString(); //actual eval point
          const ey = (512 + (Lalt + xPos) * Math.sin(radRoll)).toString(); //actual eval point

          const exs = (640 - (Lspd - xPos) * Math.cos(-radRoll)).toString();
          const eys = (512 + (Lspd - xPos) * Math.sin(-radRoll)).toString();

          //vertial offset of eval point from horizon
          let F1AltSideVertDev = Math.sqrt((Number(ex) - xPosF) ** 2 + (Number(ey) - 512) ** 2);
          if (Number(ey) < 512) {
            F1AltSideVertDev *= -1;
          }
          let F1SpdSideVertDev = Math.sqrt((Number(exs) - xPosFspd) ** 2 + (Number(eys) - 512) ** 2);
          if (Number(eys) < 512) {
            F1SpdSideVertDev *= -1;
          }

          // debug eval point pos circles
          this.xAltTop.set(xPosF.toString());
          this.yAltTop.set((512).toString());
          this.xSpdTop.set(xPosFspd.toString());
          this.ySpdTop.set((512).toString());
          // end debug
          //debug draws : toggle .DEBUG to block in styles.scss to show
          this.path.instance.setAttribute('d', `m ${ax} ${ay} l ${bx}  ${by} L ${cx}  ${cy}     z`);
          this.path2.instance.setAttribute('d', `m ${ax} ${ay} L ${ex}  ${ey}  L ${xPosF} 512     z`);
          this.path3.instance.setAttribute('d', `m ${ax} ${ay} L ${exs}  ${eys}  L ${xPosFspd} 512     z`);
          //end debug

          const F1HorizonPitchOffset = D * Math.cos(radRoll);

          if (
            F1HorizonPitchOffset - F1AltSideVertDev > this.lowerBound &&
            F1HorizonPitchOffset - F1AltSideVertDev < this.upperBound
          ) {
            this.extendedAlt.instance.setAttribute('class', 'NormalStroke Green');
            this.extendedAlt.instance.setAttribute('d', ``);
          } else {
            this.extendedAlt.instance.setAttribute('class', 'NormalStroke Green');
            this.extendedAlt.instance.setAttribute('d', `m 640 512 h 1000 `);
          }

          if (
            F1HorizonPitchOffset - F1SpdSideVertDev > this.lowerBound &&
            F1HorizonPitchOffset - F1SpdSideVertDev < this.upperBound
          ) {
            this.extendedSpd.instance.setAttribute('class', 'NormalStroke Green');
            this.extendedSpd.instance.setAttribute('d', ``);
          } else {
            this.extendedSpd.instance.setAttribute('class', 'NormalStroke Green');
            this.extendedSpd.instance.setAttribute('d', `m 640 512 h -1000 `);
          }

          ////debug TextBox

          this.debugVal.instance.setAttribute('transform', `translate(640 512) rotate(${roll.value})`);

          this.valuesToLog.set('F1HorizonPitchOffset - F1AltSideVertDev', F1HorizonPitchOffset - F1AltSideVertDev);
          this.valuesToLog.set('xPosF', xPosF);
          this.valuesToLog.set('xPosFspd', xPosFspd);
          this.valuesToLog.set('roll', roll.value);

          let i = 0;
          this.valuesToLog.forEach((value, key) => {
            this.spanRefs[i].instance.textContent = `${key}: ${value}`;
            i++;
          });
        } else {
          this.rollGroupRef.instance.style.display = 'none';
        }
      });

    sub.on('pitchAr').handle((pitch) => {
      this.pitch = pitch.value;
      if (pitch.isNormalOperation()) {
        this.pitchGroupRef.instance.style.display = 'block';
        this.pitchGroupRef.instance.style.transform = `translate3d(0px, ${calculateHorizonOffsetFromPitch(pitch.value) - FIVE_DEG}px, 0px)`;
        const yOffset = calculateHorizonOffsetFromPitch(pitch.value) - FIVE_DEG;
        this.yOffset.set(yOffset);
      }
    });
  }

  private buildLog(): NodeReference<SVGGElement>[] {
    this.valuesToLog.set('F1HorizonPitchOffset - F1AltSideVertDev', 0);
    this.valuesToLog.set('xPosF', 0);
    this.valuesToLog.set('xPosFspd', 0);
    this.valuesToLog.set('roll', 0);
    this.valuesToLog.set('L1', 0);
    this.valuesToLog.set('x2', 0);

    const spans = [];
    this.valuesToLog.forEach((value, key) => {
      const spanRef = FSComponent.createRef<SVGTSpanElement>();
      spans.push(
        <tspan ref={spanRef} x="0" dy="1.2em" class="White FontSmallest">
          {`${key}: ${value}`}
        </tspan>,
      );
      this.spanRefs.push(spanRef);
    });
    return spans;
  }

  render(): VNode {
    return (
      <g id="ExtendedHorizon">
        {/* y = 329 is vert pos of the inAir acft ref */}
        <path d="m 0 329 h 1280" class="red DEBUG" />
        <path d="m 0 712 h 1280" class="red DEBUG" />
        <path d="m 0 329 h 1280" class="blue DEBUG" stroke-dasharray="5 5" />
        <path d="m 0 238 h 1280" class="blue DEBUG" />
        <path d="m 0 420 h 1280" class="blue DEBUG" />

        <g id="ARollGroup" ref={this.rollGroupRef} style="display:none">
          <g id="APitchGroup" ref={this.pitchGroupRef} class="ScaledStroke">
            <SyntheticRunway bus={this.props.bus} filteredRadioAlt={this.props.filteredRadioAlt} />

            <path ref={this.extendedAlt} id="extendedAlt" d="" class="NormalStroke Green" />
            <path ref={this.extendedSpd} id="extendedSpd" d="" class="NormalStroke Green" />

            {/* debug  */}
            <circle cx={this.xAltTop} cy={this.yAltTop} r="5" class="blue DEBUG" display="block" />
            <circle cx={this.xSpdTop} cy={this.ySpdTop} r="5" class="blue DEBUG" display="block" />
            <circle cx="640" cy="512" r="5" class="blue DEBUG" display="block" />
            <path id="path1" ref={this.path} d="" class="yellow  DEBUG" />
            <path id="path2" ref={this.path2} d="" class="yellow DEBUG" />
            <path id="path3" ref={this.path3} d="" class="yellow DEBUG" />

            <g id="debugVal" ref={this.debugVal}>
              <text class=" DEBUG White NormalStroke FontSmallest">{this.buildLog()}</text>
            </g>
            {/* debug  */}
          </g>
        </g>
      </g>
    );
  }
}
