// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import {
  ArincEventBus,
  Arinc429Register,
  Arinc429Word,
  Arinc429WordData,
  Arinc429RegisterSubject,
} from '@flybywiresim/fbw-sdk';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';

import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import {
  calculateHorizonOffsetFromPitch,
  calculateVerticalOffsetFromRoll,
  LagFilter,
  getSmallestAngle,
} from './PFDUtils';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HorizontalTape } from './HorizontalTape';
import { getDisplayIndex } from './PFD';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';

const DisplayRange = 35;
const DistanceSpacing = 15;
const ValueSpacing = 10;

class HeadingBug extends DisplayComponent<{
  bus: ArincEventBus;
  isCaptainSide: boolean;
  yOffset: Subscribable<number>;
}> {
  private fcuSelectedHeading = new Arinc429Word(0);

  private fcuSelectedTrack = new Arinc429Word(0);

  private fcuEisDiscreteWord2 = new Arinc429Word(0);

  private fcuDiscreteWord1 = new Arinc429Word(0);

  private heading: Arinc429WordData = new Arinc429Word(0);

  private bugVisible = Subject.create(false);

  private bugTranslate = Subject.create('');

  private yOffset = 0;

  private calculateAndSetOffset() {
    const fdActive = !this.fcuEisDiscreteWord2.bitValueOr(23, false);
    const trkFpaActive = this.fcuDiscreteWord1.bitValueOr(25, false);

    const targetValue = trkFpaActive ? this.fcuSelectedTrack : this.fcuSelectedHeading;

    const showSelectedHeadingBug = !(fdActive || targetValue.isNoComputedData() || targetValue.isFailureWarning());

    if (showSelectedHeadingBug) {
      const headingDelta = getSmallestAngle(targetValue.value, this.heading.value);

      const offset = (headingDelta * DistanceSpacing) / ValueSpacing;

      if (Math.abs(offset) <= DisplayRange + 10) {
        this.bugVisible.set(true);
        this.bugTranslate.set(`transform: translate3d(${offset}px, ${this.yOffset}px, 0px)`);
      } else {
        this.bugVisible.set(false);
      }
    } else {
      this.bugVisible.set(false);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<DmcLogicEvents & PFDSimvars & Arinc429Values & FcuBus>();

    sub
      .on('fcuSelectedHeading')
      .whenChanged()
      .handle((s) => {
        this.fcuSelectedHeading = s;
        this.calculateAndSetOffset();
      });

    sub
      .on('fcuSelectedTrack')
      .whenChanged()
      .handle((s) => {
        this.fcuSelectedTrack = s;
        this.calculateAndSetOffset();
      });

    sub.on('heading').handle((h) => {
      this.heading = h;
      this.calculateAndSetOffset();
    });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((fd) => {
        this.fcuEisDiscreteWord2 = fd;
      });

    sub
      .on('fcuDiscreteWord1')
      .whenChanged()
      .handle((fd) => {
        this.fcuDiscreteWord1 = fd;
      });

    this.props.yOffset.sub((yOffset) => {
      this.yOffset = yOffset;
      this.calculateAndSetOffset();
    });
  }

  render(): VNode {
    return (
      <g
        id="HorizonHeadingBug"
        style={this.bugTranslate}
        visibility={this.bugVisible.map((v) => (v ? 'inherit' : 'hidden'))}
      >
        <path class="ThickOutline" d="m68.906 80.823v-9.0213" />
        <path class="ThickStroke Cyan" d="m68.906 80.823v-9.0213" />
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

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const apfd = this.props.bus.getArincSubscriber<Arinc429Values>();

    apfd
      .on('pitchAr')
      .withArinc429Precision(3)
      .handle((pitch) => {
        if (pitch.isNormalOperation()) {
          this.pitchGroupRef.instance.style.display = 'block';

          this.pitchGroupRef.instance.style.transform = `translate3d(0px, ${calculateHorizonOffsetFromPitch(pitch.value)}px, 0px)`;
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

          this.rollGroupRef.instance.setAttribute('transform', `rotate(${-roll.value} 68.814 80.730)`);
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
        <g id="PitchGroup" ref={this.pitchGroupRef}>
          <path d="m23.906 80.823v-160h90v160z" class="SkyFill" />
          <path d="m113.91 223.82h-90v-143h90z" class="EarthFill" />

          {/* If you're wondering why some paths have an "h0" appended, it's to work around a
                rendering bug in webkit, where paths with only one line is rendered blurry. */}

          <g class="NormalStroke White">
            <path d="m66.406 85.323h5h0" />
            <path d="m64.406 89.823h9h0" />
            <path d="m66.406 94.073h5h0" />
            <path d="m59.406 97.823h19h0" />
            <path d="m64.406 103.82h9h0" />
            <path d="m59.406 108.82h19h0" />
            <path d="m55.906 118.82h26h0" />
            <path d="m52.906 138.82h32h0" />
            <path d="m47.906 168.82h42h0" />
            <path d="m66.406 76.323h5h0" />
            <path d="m64.406 71.823h9h0" />
            <path d="m66.406 67.323h5h0" />
            <path d="m59.406 62.823h19h0" />
            <path d="m66.406 58.323h5h0" />
            <path d="m64.406 53.823h9h0" />
            <path d="m66.406 49.323h5h0" />
            <path d="m59.406 44.823h19h0" />
            <path d="m66.406 40.573h5h0" />
            <path d="m64.406 36.823h9h0" />
            <path d="m66.406 33.573h5h0" />
            <path d="m55.906 30.823h26h0" />
            <path d="m52.906 10.823h32h0" />
            <path d="m47.906-19.177h42h0" />
          </g>

          <g id="PitchProtUpper" visibility={this.pitchProtActiveVisibility} class="NormalStroke Green">
            <path d="m51.506 31.523h4m-4-1.4h4" />
            <path d="m86.306 31.523h-4m4-1.4h-4" />
          </g>
          <g id="PitchProtLostUpper" visibility={this.pitchProtLostVisibility} class="NormalStroke Amber">
            <path d="m52.699 30.116 1.4142 1.4142m-1.4142 0 1.4142-1.4142" />
            <path d="m85.114 31.53-1.4142-1.4142m1.4142 0-1.4142 1.4142" />
          </g>
          <g id="PitchProtLower" visibility={this.pitchProtActiveVisibility} class="NormalStroke Green">
            <path d="m59.946 104.52h4m-4-1.4h4" />
            <path d="m77.867 104.52h-4m4-1.4h-4" />
          </g>
          <g id="PitchProtLostLower" visibility={this.pitchProtLostVisibility} class="NormalStroke Amber">
            <path d="m61.199 103.12 1.4142 1.4142m-1.4142 0 1.4142-1.4142" />
            <path d="m76.614 104.53-1.4142-1.4142m1.4142 0-1.4142 1.4142" />
          </g>

          <path d="m68.906 121.82-8.0829 14h2.8868l5.1962-9 5.1962 9h2.8868z" class="NormalStroke Red" />
          <path d="m57.359 163.82 11.547-20 11.547 20h-4.0414l-7.5056-13-7.5056 13z" class="NormalStroke Red" />
          <path d="m71.906 185.32v3.5h15l-18-18-18 18h15v-3.5h-6.5l9.5-9.5 9.5 9.5z" class="NormalStroke Red" />
          <path d="m60.824 13.823h2.8868l5.1962 9 5.1962-9h2.8868l-8.0829 14z" class="NormalStroke Red" />
          <path d="m61.401-13.177h-4.0414l11.547 20 11.547-20h-4.0414l-7.5056 13z" class="NormalStroke Red" />
          <path d="m68.906-26.177-9.5-9.5h6.5v-3.5h-15l18 18 18-18h-15v3.5h6.5z" class="NormalStroke Red" />

          <TailstrikeIndicator bus={this.props.bus} />

          <path d="m23.906 80.823h90h0" class="NormalOutline" />
          <path d="m23.906 80.823h90h0" class="NormalStroke White" />

          <g class="FontSmall White Fill EndAlign">
            <text x="55.729935" y="64.812828">
              10
            </text>
            <text x="88.618317" y="64.812714">
              10
            </text>
            <text x="54.710766" y="46.931034">
              20
            </text>
            <text x="89.564583" y="46.930969">
              20
            </text>
            <text x="50.867237" y="32.910896">
              30
            </text>
            <text x="93.408119" y="32.910839">
              30
            </text>
            <text x="48.308414" y="12.690886">
              50
            </text>
            <text x="96.054962" y="12.690853">
              50
            </text>
            <text x="43.050652" y="-17.138285">
              80
            </text>
            <text x="101.48304" y="-17.138248">
              80
            </text>
            <text x="55.781109" y="99.81395">
              10
            </text>
            <text x="88.669487" y="99.813919">
              10
            </text>
            <text x="54.645519" y="110.8641">
              20
            </text>
            <text x="89.892426" y="110.86408">
              20
            </text>
            <text x="51.001217" y="120.96314">
              30
            </text>
            <text x="93.280037" y="120.96311">
              30
            </text>
            <text x="48.220913" y="140.69778">
              50
            </text>
            <text x="96.090324" y="140.69786">
              50
            </text>
            <text x="43.125065" y="170.80962">
              80
            </text>
            <text x="101.38947" y="170.80959">
              80
            </text>
          </g>
        </g>
        <path d="m40.952 49.249v-20.562h55.908v20.562z" class="NormalOutline SkyFill" />
        <path d="m40.952 49.249v-20.562h55.908v20.562z" class="NormalStroke White" />

        <SideslipIndicator bus={this.props.bus} instrument={this.props.instrument} />
        <RisingGround bus={this.props.bus} filteredRadioAltitude={this.props.filteredRadioAlt} />
        <HorizontalTape
          type="horizon"
          bus={this.props.bus}
          displayRange={DisplayRange}
          valueSpacing={ValueSpacing}
          distanceSpacing={DistanceSpacing}
          yOffset={this.yOffset}
        />
        <HeadingBug bus={this.props.bus} isCaptainSide={getDisplayIndex() === 1} yOffset={this.yOffset} />
        <RadioAltAndDH
          bus={this.props.bus}
          filteredRadioAltitude={this.props.filteredRadioAlt}
          attExcessive={this.props.isAttExcessive}
        />
      </g>
    );
  }
}

class TailstrikeIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private tailStrike = FSComponent.createRef<SVGPathElement>();

  private needsUpdate = false;

  private tailStrikeConditions = {
    altitude: new Arinc429Word(0),
    speed: 0,
    tla1: 0,
    tla2: 0,
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & ClockEvents>();

    sub.on('chosenRa').handle((ra) => {
      this.tailStrikeConditions.altitude = ra;
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
      if (
        this.tailStrikeConditions.altitude.value > 400 ||
        this.tailStrikeConditions.speed < 50 ||
        this.tailStrikeConditions.tla1 >= 35 ||
        this.tailStrikeConditions.tla2 >= 35
      ) {
        this.tailStrike.instance.style.display = 'none';
      } else {
        this.tailStrike.instance.style.display = 'inline';
      }
    }
  }

  render(): VNode {
    return (
      <path
        ref={this.tailStrike}
        id="TailstrikeWarning"
        d="m72.682 50.223h2.9368l-6.7128 8-6.7128-8h2.9368l3.7759 4.5z"
        class="NormalStroke Amber"
      />
    );
  }
}

class RadioAltAndDH extends DisplayComponent<{
  bus: ArincEventBus;
  filteredRadioAltitude: Subscribable<number>;
  attExcessive: Subscribable<boolean>;
}> {
  private daRaGroup = FSComponent.createRef<SVGGElement>();

  private roll = new Arinc429Word(0);

  private readonly dh = Arinc429RegisterSubject.createEmpty();

  private filteredRadioAltitude = 0;

  private radioAltitude = new Arinc429Word(0);

  private transAltAr = Arinc429Register.empty();

  private transLvlAr = Arinc429Register.empty();

  private fmgcFlightPhase = 0;

  private altitude = new Arinc429Word(0);

  private readonly attDhTextVisible = Subject.create(false);

  private radioAltText = Subject.create('0');

  private readonly radioAltVisible = Subject.create(true);

  private readonly raFlagFlashing = Subject.create(false);

  private classSub = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    sub.on('rollAr').handle((roll) => {
      this.roll = roll;
    });

    sub
      .on('fmTransAltRaw')
      .whenChanged()
      .handle((ta) => {
        this.transAltAr.set(ta);
      });

    sub
      .on('fmTransLvlRaw')
      .whenChanged()
      .handle((tl) => {
        this.transLvlAr.set(tl);
      });

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.fmgcFlightPhase = fp;
      });

    sub.on('altitudeAr').handle((a) => {
      this.altitude = a;
    });

    sub.on('chosenRa').handle((ra) => {
      if (!this.props.attExcessive.get()) {
        this.radioAltitude = ra;
        const raNotFailed = !this.radioAltitude.isFailureWarning();
        const raHasData = !this.radioAltitude.isNoComputedData();
        const raValue = this.filteredRadioAltitude;
        const verticalOffset = calculateVerticalOffsetFromRoll(this.roll.value);
        const useTransAltVsLvl = this.fmgcFlightPhase <= 3;
        const chosenTransalt = useTransAltVsLvl ? this.transAltAr : this.transLvlAr;
        const belowTransitionAltitude =
          chosenTransalt.isNormalOperation() &&
          !this.altitude.isNoComputedData() &&
          this.altitude.value < (useTransAltVsLvl ? chosenTransalt.value : chosenTransalt.value * 100);
        let size = 'FontLarge';
        const dh = this.dh.get();
        const DHValid = dh.value >= 0 && !dh.isNoComputedData() && !dh.isFailureWarning();

        let text = '';
        let color = 'Amber';

        if (raHasData) {
          if (raNotFailed) {
            if (raValue < 2500) {
              if (raValue > 400 || (raValue > dh.value + 100 && DHValid)) {
                color = 'Green';
              }
              if (raValue < 400) {
                size = 'FontLargest';
              }
              if (raValue < 5) {
                text = Math.round(raValue).toString();
              } else if (raValue <= 50) {
                text = (Math.round(raValue / 5) * 5).toString();
              } else if (raValue > 50 || (raValue > dh.value + 100 && DHValid)) {
                text = (Math.round(raValue / 10) * 10).toString();
              }
            }
          } else {
            color = 'Red';
            text = 'RA';
          }
        }

        this.raFlagFlashing.set(!raNotFailed && belowTransitionAltitude);

        this.daRaGroup.instance.style.transform = `translate3d(0px, ${-verticalOffset}px, 0px)`;
        if (raNotFailed && DHValid && raValue <= dh.value) {
          this.attDhTextVisible.set(true);
        } else {
          this.attDhTextVisible.set(false);
        }
        this.radioAltText.set(text);
        this.classSub.set(`${size} ${color} MiddleAlign TextOutline`);
      }
    });

    this.props.filteredRadioAltitude.sub((fra) => {
      this.filteredRadioAltitude = fra;
    }, true);

    this.props.attExcessive.sub((ae) => {
      if (ae) {
        this.radioAltVisible.set(false);
      } else {
        this.radioAltVisible.set(true);
      }
    });

    sub.on('fmDhRaw').handle(this.dh.setWord.bind(this.dh));
  }

  render(): VNode {
    return (
      <g ref={this.daRaGroup} id="DHAndRAGroup">
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.attDhTextVisible}>
          <text id="AttDHText" x="73.511879" y="113.19068" class="FontLargest Amber EndAlign TextOutline">
            DH
          </text>
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={9}
          visible={this.radioAltVisible}
          flashing={this.raFlagFlashing}
        >
          <text id="RadioAlt" x="69.202454" y="119.76205" class={this.classSub}>
            {this.radioAltText}
          </text>
        </FlashOneHertz>
      </g>
    );
  }
}

interface SideslipIndicatorProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

class SideslipIndicator extends DisplayComponent<SideslipIndicatorProps> {
  private latAccFilter = new LagFilter(0.5);

  private classNameSub = Subject.create('Yellow');

  private filteredLatAccSub = Subject.create(0);

  private rollTriangle = FSComponent.createRef<SVGPathElement>();

  private slideSlip = FSComponent.createRef<SVGPathElement>();

  private readonly siFlagVisible = Subject.create(false);

  private onGround = true;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;

  private roll = new Arinc429Word(0);

  private beta = new Arinc429Word(0);

  private betaTarget = new Arinc429Word(0);

  private latAcc = new Arinc429Word(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values & ClockEvents>();

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
    const currentValueAtPrecision = Math.round(this.roll.value * multiplier) / multiplier;
    const verticalOffset = calculateVerticalOffsetFromRoll(currentValueAtPrecision);
    let offset = 0;

    let betaTargetActive = false;

    if (
      (this.onGround && this.latAcc.isFailureWarning()) ||
      (!this.onGround && this.latAcc.isFailureWarning() && this.beta.isFailureWarning())
    ) {
      this.slideSlip.instance.style.visibility = 'hidden';
      this.siFlagVisible.set(true);
    } else {
      this.slideSlip.instance.style.visibility = 'visible';
      this.siFlagVisible.set(false);
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

    this.rollTriangle.instance.style.transform = `translate3d(0px, ${verticalOffset.toFixed(2)}px, 0px)`;
    this.classNameSub.set(betaTargetActive ? 'Cyan' : 'Yellow');
    this.slideSlip.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
  }

  render(): VNode {
    return (
      <g id="RollTriangleGroup" ref={this.rollTriangle} class="NormalStroke Yellow CornerRound">
        <path d="m66.074 43.983 2.8604-4.2333 2.8604 4.2333z" />
        <path
          id="SideSlipIndicator"
          ref={this.slideSlip}
          class={this.classNameSub}
          d="m73.974 47.208-1.4983-2.2175h-7.0828l-1.4983 2.2175z"
        />
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.siFlagVisible}>
          <text id="SIFailText" x="72.315376" y="48.116844" class="FontSmall Red EndAlign">
            SI
          </text>
        </FlashOneHertz>
      </g>
    );
  }
}

class RisingGround extends DisplayComponent<{ bus: ArincEventBus; filteredRadioAltitude: Subscribable<number> }> {
  private radioAlt: Arinc429WordData = new Arinc429Word(0);

  private lastPitch: Arinc429WordData = new Arinc429Word(0);

  private horizonGroundRectangle = FSComponent.createRef<SVGGElement>();

  private setOffset() {
    const targetPitch =
      this.radioAlt.isNoComputedData() || this.radioAlt.isFailureWarning()
        ? 200
        : 0.1 * this.props.filteredRadioAltitude.get();

    const targetOffset = Math.max(
      Math.min(calculateHorizonOffsetFromPitch(this.lastPitch.value + targetPitch) - 31.563, 0),
      -63.093,
    );
    this.horizonGroundRectangle.instance.style.transform = `translate3d(0px, ${targetOffset.toFixed(2)}px, 0px)`;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

    sub.on('pitchAr').handle((pitch) => {
      this.lastPitch = pitch;
    });

    sub.on('chosenRa').handle((p) => {
      this.radioAlt = p;
      this.setOffset();
    });

    this.props.filteredRadioAltitude.sub((_fra) => {
      this.setOffset();
    });
  }

  render(): VNode {
    return (
      <g ref={this.horizonGroundRectangle} id="HorizonGroundRectangle">
        <path d="m113.95 157.74h-90.08v-45.357h90.08z" class="NormalOutline EarthFill" />
        <path d="m113.95 157.74h-90.08v-45.357h90.08z" class="NormalStroke White" />
      </g>
    );
  }
}
