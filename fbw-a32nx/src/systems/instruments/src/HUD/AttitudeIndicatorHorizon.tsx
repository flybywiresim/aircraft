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
  EventBus,
  Subscription,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';

import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { calculateHorizonOffsetFromPitch, LagFilter, HudElems, PitchscaleMode, FIVE_DEG, HudMode } from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HorizontalTape } from './HorizontalTape';
import { getDisplayIndex } from './HUD';
import { HeadingOfftape } from './HeadingIndicator';
import { FmgcFlightPhase } from '@shared/flightphase';
import { VerticalMode } from '@shared/autopilot';
const DisplayRange = 35;
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

interface LSPath {
  roll: Arinc429RegisterSubject;
  pitch: Arinc429RegisterSubject;
  fpa: Arinc429RegisterSubject;
  da: Arinc429RegisterSubject;
}

class HeadingBug extends DisplayComponent<{
  bus: ArincEventBus;
  isCaptainSide: boolean;
  yOffset: Subscribable<number>;
}> {
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }
  render(): VNode {
    return <path id="airHorizonReference" class="ThickStroke Green" d="m 640,500  l 0 24" />;
  }
}

interface HorizonProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
}

export class Horizon extends DisplayComponent<HorizonProps> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<
    Arinc429Values & DmcLogicEvents & HUDSimvars & ClockEvents & HEvent
  >();
  private pitchGroupRef = FSComponent.createRef<SVGGElement>();

  private rollGroupRef = FSComponent.createRef<SVGGElement>();

  private pitchProtActiveVisibility = Subject.create('visible');

  private pitchProtLostVisibility = Subject.create('hidden');

  private yOffset = Subject.create(0);

  private headingFailed = Subject.create(true);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.sub.on('heading').handle((h) => {
        this.headingFailed.set(!h.isNormalOperation());
      }),
    );

    this.subscriptions.push(
      this.sub
        .on('pitchAr')
        .withArinc429Precision(3)
        .handle((pitch) => {
          if (pitch.isNormalOperation()) {
            this.pitchGroupRef.instance.style.display = 'block';

            this.pitchGroupRef.instance.style.transform = `translate3d(0px, ${calculateHorizonOffsetFromPitch(pitch.value) - FIVE_DEG}px, 0px)`;
          } else {
            this.pitchGroupRef.instance.style.display = 'none';
          }
          const yOffset = Math.max(Math.min(calculateHorizonOffsetFromPitch(pitch.value), 31.563), -31.563);
          this.yOffset.set(yOffset);
        }),
    );

    this.subscriptions.push(
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
        }),
    );

    this.subscriptions.push(
      this.sub.on('fcdcDiscreteWord1').handle((fcdcWord1) => {
        const isNormalLawActive = fcdcWord1.bitValue(11) && !fcdcWord1.isFailureWarning();

        this.pitchProtActiveVisibility.set(isNormalLawActive ? 'visible' : 'hidden');
        this.pitchProtLostVisibility.set(!isNormalLawActive ? 'visible' : 'hidden');
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
      <g id="RollGroup" ref={this.rollGroupRef} style="display:none">
        <g id="PitchGroup" ref={this.pitchGroupRef} class="NormalStroke Green">
          <HeadingBug bus={this.props.bus} isCaptainSide={getDisplayIndex() === 1} yOffset={this.yOffset} />
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

        {/* <RadioAltAndDH
          bus={this.props.bus}
          filteredRadioAltitude={this.props.filteredRadioAlt}
          attExcessive={this.props.isAttExcessive}
        /> */}
      </g>
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

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();

    sub
      .on('decMode')
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
      this.filteredLatAccSub.set(this.latAccFilter.step(this.latAcc.value, this.props.instrument.deltaTime / 1000));
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
      <g
        id="RollTriangleGroup"
        ref={this.rollTriangle}
        display={this.sVisibility}
        class="NormalStroke Green CornerRound"
      >
        <path d="M 640.18 140 l -10,21.89 h 20z" />
        <path
          id="SideSlipIndicator"
          ref={this.slideSlip}
          class={this.classNameSub}
          d="m 629 164.85 -8,16.15 38,0.07 -8,-16.22z"
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
}> {
  private readonly subscriptions: Subscription[] = [];

  private forcedFma = false;
  private declutterMode = 0;
  private crosswindMode = false;

  private sVisibility = Subject.create<String>('');
  private sVisibilityDeclutterMode2 = Subject.create<String>('');
  private sVisibilitySwitch = Subject.create<String>('block');

  private readonly sub = this.props.bus.getArincSubscriber<
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
    roll: Arinc429RegisterSubject.createEmpty(),
    pitch: Arinc429RegisterSubject.createEmpty(),
    fpa: Arinc429RegisterSubject.createEmpty(),
    da: Arinc429RegisterSubject.createEmpty(),
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
    this.subscriptions.push(this.ls1btn, this.ls2btn, this.decMode, this.flightPhase, this.threeDegLineVis);

    this.subscriptions.push(
      this.sub
        .on('fmaVerticalArmed')
        .whenChanged()
        .handle((fmv) => {
          ((fmv >> 4) & 1) === 1 ? (this.gsArmed = true) : (this.gsArmed = false);
        }),
    );
    this.subscriptions.push(
      this.sub
        .on('pitchScaleMode')
        .whenChanged()
        .handle((v) => {
          this.pitchScaleMode = v;
          this.setPitchScale();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('decMode')
        .whenChanged()
        .handle((value) => {
          this.declutterMode = value;
          this.setPitchScale();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('activeVerticalMode')
        .whenChanged()
        .handle((activeVerticalMode) => {
          this.activeVerticalModeSub.set(activeVerticalMode);
        }),
    );
    this.subscriptions.push(
      this.sub.on('selectedFpa').handle((fpa) => {
        this.selectedFpa.set(fpa);
        this.needsUpdate = true;
      }),
    );
    this.subscriptions.push(
      this.sub.on('fpa').handle((fpa) => {
        this.data.fpa.setWord(fpa.rawWord);
        this.needsUpdate = true;
      }),
    );
    this.subscriptions.push(
      this.sub.on('da').handle((da) => {
        this.data.da.setWord(da.rawWord);
        this.needsUpdate = true;
      }),
    );
    this.subscriptions.push(
      this.sub.on('rollAr').handle((r) => {
        this.data.roll.setWord(r.rawWord);
        this.needsUpdate = true;
      }),
    );
    this.subscriptions.push(
      this.sub.on('pitchAr').handle((p) => {
        this.data.pitch.setWord(p.rawWord);
        this.needsUpdate = true;
      }),
    );
    this.subscriptions.push(
      this.sub.on('realTime').handle((_t) => {
        if (this.needsUpdate) {
          this.needsUpdate = false;
          const daAndFpaValid = this.data.fpa.get().isNormalOperation() && this.data.da.get().isNormalOperation();
          if (daAndFpaValid) {
            // this.threeDegRef.instance.classList.remove('HiddenElement');
            this.MoveThreeDegreeMark();
          } else {
            // this.threeDegRef.instance.classList.add('HiddenElement');
          }
        }
      }),
    );
  }

  private MoveThreeDegreeMark() {
    const daLimConv = (this.data.da.get().value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.get().value) -
      calculateHorizonOffsetFromPitch(this.data.fpa.get().value);
    const rollCos = Math.cos((this.data.roll.get().value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.get().value * Math.PI) / 180);

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
        `M 565,${512 + (3 / 5) * FIVE_DEG} h -80  M 713,${512 + (3 / 5) * FIVE_DEG} h 80  `,
      );
      this.threeDegTxtRef.instance.setAttribute('y', `${512 + (3 / 5) * FIVE_DEG + 6}`);
      this.threeDegTxtRef.instance.textContent = '-3.0°'; //TODO get the actual slope of the ILS
      this.threeDegTxtRef.instance.classList.remove('Green');
      this.threeDegTxtRef.instance.classList.add('InverseGreen');
      this.threeDegTxtBgRef.instance.style.display = `block`;
      this.threeDegTxtBgRef.instance.classList.add('GreenFill');
      this.threeDegTxtBgRef.instance.setAttribute('y', `${512 + (3 / 5) * FIVE_DEG}`);
      this.threeDegTxtBgRef.instance.setAttribute('d', `m 795.5 ${512 + (3 / 5) * FIVE_DEG - 10} h 55 v 20 h -55 z `);
    } else if (this.activeVerticalModeSub.get() === VerticalMode.FPA) {
      this.threeDegPath.instance.setAttribute(
        'd',
        `M 565,${512 + (Math.abs(this.selectedFpa.get()) / 5) * FIVE_DEG} h -80  M 713,${512 + (Math.abs(this.selectedFpa.get()) / 5) * FIVE_DEG} h 80  `,
      );
      this.threeDegPath.instance.setAttribute('y', `${512 + (3 / 5) * FIVE_DEG}`);

      this.threeDegTxtRef.instance.setAttribute('y', `${512 + (Math.abs(this.selectedFpa.get()) / 5) * FIVE_DEG + 6}`);
      this.threeDegTxtRef.instance.textContent = fpaTxt;
      this.threeDegTxtRef.instance.classList.remove('InverseGreen');
      this.threeDegTxtRef.instance.classList.add('Green');
      this.threeDegTxtBgRef.instance.style.display = `none`;
      this.threeDegTxtBgRef.instance.classList.remove('GreenFill');
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

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
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
          <path ref={this.threeDegTxtBgRef} d=""></path>
          <text x="822.5" ref={this.threeDegTxtRef} class="FontSmallest MiddleAlign InverseGreen"></text>
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
        <text class="FontSmall Green EndAlign" x="445" y={512 - i * FIVE_DEG + 8.35} display={this.sVisibilitySwitch}>
          {str}
        </text>,
      );
      result.push(
        <text class="FontSmall Green StartAlign" x="835" y={512 - i * FIVE_DEG + 8.35} display={this.sVisibilitySwitch}>
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
class TailstrikeIndicator extends DisplayComponent<{ bus: EventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();
  private tailStrike = FSComponent.createRef<SVGPathElement>();
  private hudMode = 0;
  private needsUpdate = false;
  private ra = 0;
  private pitch = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.sub
        .on('hudFlightPhaseMode')
        .whenChanged()
        .handle((value) => {
          this.hudMode = value;
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(
      this.sub.on('pitchAr').handle((pitch) => {
        this.pitch = pitch.value;
        this.needsUpdate = true;
      }),
    );
    this.subscriptions.push(
      this.sub
        .on('chosenRa')
        .whenChanged()
        .handle((ra) => {
          this.ra = ra.value;
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(this.sub.on('realTime').onlyAfter(2).handle(this.hideShow.bind(this)));
  }

  private hideShow(_time: number) {
    if (this.needsUpdate) {
      this.needsUpdate = false;

      if (this.hudMode === HudMode.TAKEOFF || this.hudMode === HudMode.ROLLOUT_OR_RTO) {
        this.tailStrike.instance.style.display = 'block';
      } else if (this.hudMode === HudMode.NORMAL) {
        if (this.pitch > 10 && this.ra < 50) {
          this.tailStrike.instance.style.display = 'block';
        } else {
          this.tailStrike.instance.style.display = 'none';
        }
      } else {
        setTimeout(() => {
          this.tailStrike.instance.style.display = 'none';
        }, 3000);
      }
    }
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <path
        ref={this.tailStrike}
        id="TailstrikeWarning"
        d="m 658.88 40 h 14.684 l-33.564 40 -33.564 -40 h 14.684 l 18.88  22.5 z"
        class="LargeStroke Green"
      />
    );
  }
}
