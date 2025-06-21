// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  DisplayComponent,
  FSComponent,
  NodeReference,
  VNode,
  Subject,
  Subscribable,
  ConsumerSubject,
  MappedSubject,
} from '@microsoft/msfs-sdk';
import {
  ArincEventBus,
  Arinc429Word,
  Arinc429WordData,
  Arinc429Register,
  Arinc429RegisterSubject,
} from '@flybywiresim/fbw-sdk';

import { SimplaneValues } from 'instruments/src/HUD/shared/SimplaneValueProvider';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { calculateHorizonOffsetFromPitch, calculateVerticalOffsetFromRoll, HudElems } from './HUDUtils';

import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FgBus } from './shared/FgBusProvider';
import { HudMode } from './HUDUtils';
const DistanceSpacing = (1024 / 28) * 5;
const ValueSpacing = 5;

interface FlightPathVectorData {
  roll: Arinc429WordData;
  pitch: Arinc429WordData;
  fpa: Arinc429WordData;
  da: Arinc429WordData;
}

export class FlightPathVector extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
}> {
  private bird = FSComponent.createRef<SVGGElement>();
  private birdPath = FSComponent.createRef<SVGPathElement>();
  private birdOffRange;
  private crosswindMode;
  private readonly fpvFlagVisible = Subject.create(false);

  private fcuDiscreteWord1 = new Arinc429Word(0);
  //TODO: test Arinc429Register.empty() instead of Arinc429Word(0)
  private data: FlightPathVectorData = {
    roll: new Arinc429Word(0),
    pitch: new Arinc429Word(0),
    fpa: new Arinc429Word(0),
    da: new Arinc429Word(0),
  };
  private needsUpdate = false;

  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & FcuBus & HudElems>();
  private readonly ap1Active = ConsumerSubject.create(this.sub.on('ap1Active').whenChanged(), false);
  private readonly ap2Active = ConsumerSubject.create(this.sub.on('ap2Active').whenChanged(), false);
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('cWndMode').handle((d) => {
      this.crosswindMode = d;
    });
    this.sub
      .on('fcuDiscreteWord1')
      .whenChanged()
      .handle((a) => {
        this.fcuDiscreteWord1 = a;
        this.needsUpdate = true;
      });
    this.sub
      .on('fpa')
      .whenChanged()
      .handle((fpa) => {
        this.data.fpa = fpa;
        this.needsUpdate = true;
      });
    this.sub
      .on('da')
      .whenChanged()
      .handle((da) => {
        this.data.da = da;
        this.needsUpdate = true;
      });
    this.sub
      .on('rollAr')
      .whenChanged()
      .handle((r) => {
        this.data.roll = r;
        this.needsUpdate = true;
      });
    this.sub
      .on('pitchAr')
      .whenChanged()
      .handle((p) => {
        this.data.pitch = p;
        this.needsUpdate = true;
      });
    this.sub.on('realTime').handle(this.onFrameUpdate.bind(this));
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.needsUpdate === true) {
      this.needsUpdate = false;

      const trkFpaActive = this.fcuDiscreteWord1.bitValueOr(25, true);
      const daAndFpaValid = this.data.fpa.isNormalOperation() && this.data.da.isNormalOperation();
      if (daAndFpaValid) {
        this.fpvFlagVisible.set(false);
        this.bird.instance.classList.remove('HiddenElement');
        this.moveBird();
      } else if (!trkFpaActive) {
        this.fpvFlagVisible.set(false);
        this.bird.instance.classList.add('HiddenElement');
      } else if (this.data.pitch.isNormalOperation() && this.data.roll.isNormalOperation()) {
        this.fpvFlagVisible.set(true);
        this.bird.instance.classList.add('HiddenElement');
      }
    }
  }

  private moveBird() {
    let xOffsetLim;
    const daLimConv = (this.data.da.value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value);
    const rollCos = Math.cos((this.data.roll.value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    //set lateral limit for fdCue
    if (this.crosswindMode == 0) {
      if (xOffset < -428 || xOffset > 360) {
        this.birdOffRange = true;
      } else {
        this.birdOffRange = false;
      }

      xOffsetLim = Math.max(Math.min(xOffset, 360), -428);
    } else {
      if (xOffset < -540 || xOffset > 540) {
        this.birdOffRange = true;
      } else {
        this.birdOffRange = false;
      }
      xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
    }

    this.bird.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - 182.86}px, 0px)`;

    if (this.birdOffRange) {
      this.birdPath.instance.setAttribute('stroke-dasharray', '3 6');
    } else {
      this.birdPath.instance.setAttribute('stroke-dasharray', '');
    }

    this.ap1Active.get() || this.ap2Active.get()
      ? this.birdPath.instance.setAttribute(
          'd',
          'm 627 512 l 13 13 l 13 -13 l -13 -13 z M 590 512 h 37 m 13 -13 v -19z m 13 13 h 37',
        )
      : this.birdPath.instance.setAttribute(
          'd',
          'M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z M 590 512 h 37 m 13 -13 v -19z m 13 13 h 37',
        );
  }

  render(): VNode {
    return (
      <>
        <g ref={this.bird} id="bird">
          <g id="FlightPathVector">
            <path ref={this.birdPath} d="" class="SmallStroke Green" stroke-dasharray="3 6" />
          </g>
          <SpeedChevrons bus={this.props.bus} />

          <DeltaSpeed bus={this.props.bus} />
          <RadioAltAndDH
            bus={this.props.bus}
            filteredRadioAltitude={this.props.filteredRadioAlt}
            attExcessive={this.props.isAttExcessive}
          />
          <FlareIndicator bus={this.props.bus} />
          <SpoilersIndicator bus={this.props.bus} />
          <ReverserIndicator bus={this.props.bus} />
        </g>
      </>
    );
  }
}

export class SpeedChevrons extends DisplayComponent<{ bus: ArincEventBus }> {
  private refElement = FSComponent.createRef<SVGGElement>();
  private leftChevron = FSComponent.createRef<SVGGElement>();
  private rightChevron = FSComponent.createRef<SVGGElement>();
  private inRange = true;
  private onGround = true;
  private merged = false;
  private onTakeoff = true;
  private vCTrend = new Arinc429Word(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars>();

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        value ? (this.onGround = true) : (this.onGround = false);
      });

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((value) => {
        value == 1 ? (this.onTakeoff = true) : (this.onTakeoff = false);
      });

    sub
      .on('vCTrend')
      .withArinc429Precision(2)
      .whenChanged()
      .handle((word) => {
        this.vCTrend = word;

        if (this.vCTrend.isNormalOperation()) {
          this.refElement.instance.style.visibility = 'visible';
          const offset = (-this.vCTrend.value * 28) / 5;
          let UsedOffset = offset;
          if (this.merged == false) {
            if (this.onTakeoff) {
              offset <= -182.857 ? (this.inRange = false) : (this.inRange = true);
              UsedOffset = Math.max((-this.vCTrend.value * 28) / 5, -182.857);
              if (UsedOffset === offset) {
                UsedOffset = (-this.vCTrend.value * 28) / 5;
                if (this.onGround == false) {
                  this.merged = true;
                  this.inRange = true;
                }
              }
            } else {
              UsedOffset = (-this.vCTrend.value * 28) / 5;
            }
          }

          if (this.merged == false) {
            if (this.inRange) {
              this.leftChevron.instance.setAttribute('stroke-dasharray', '');
              this.rightChevron.instance.setAttribute('stroke-dasharray', '');
            } else {
              this.leftChevron.instance.setAttribute('stroke-dasharray', '2 3.5 2 3.5 2 3 2 3');
              this.rightChevron.instance.setAttribute('stroke-dasharray', '2 3.5 2 3.5 2 3 2 3');
            }
          } else {
            this.leftChevron.instance.setAttribute('stroke-dasharray', '');
            this.rightChevron.instance.setAttribute('stroke-dasharray', '');
          }

          this.refElement.instance.style.transform = `translate3d(0px, ${UsedOffset}px, 0px)`;
        } else {
          this.refElement.instance.style.visibility = 'hidden';
        }
      });
  }

  render(): VNode | null {
    return (
      <g id="SpeedChevrons" ref={this.refElement}>
        <path ref={this.leftChevron} class="SmallStroke Green" d="m 574,500 12,12 -12,12" />
        <path ref={this.rightChevron} class="SmallStroke Green" d="m 706,500 -12,12 12,12" />
      </g>
    );
  }
}

interface SpeedStateInfo {
  pfdTargetSpeed: Arinc429WordData;
  fcuSelectedSpeed: Arinc429WordData;
  speed: Arinc429WordData;
  fmgcDiscreteWord5: Arinc429Word;
}

class DeltaSpeed extends DisplayComponent<{ bus: ArincEventBus }> {
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private sVisibility = Subject.create<String>('');
  private outOfRange = Subject.create<String>('');
  private speedRefs: NodeReference<SVGElement>[] = [];

  private needsUpdate = true;

  private speedState: SpeedStateInfo = {
    speed: new Arinc429Word(0),
    pfdTargetSpeed: new Arinc429Word(0),
    fcuSelectedSpeed: new Arinc429Word(0),
    fmgcDiscreteWord5: new Arinc429Word(0),
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & SimplaneValues & ClockEvents & Arinc429Values>();

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.flightPhase = fp;
      });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        if (value) {
          this.sVisibility.set('none');
        } else {
          this.sVisibility.set('block');
        }
      });

    sub
      .on('pfdSelectedSpeed')
      .withArinc429Precision(2)
      .handle((s) => {
        this.speedState.pfdTargetSpeed = s;
        this.needsUpdate = true;
      });

    sub
      .on('fmgcDiscreteWord5')
      .whenChanged()
      .handle((s) => {
        this.speedState.fmgcDiscreteWord5 = s;
        this.needsUpdate = true;
      });

    sub
      .on('fcuSelectedAirspeed')
      .withArinc429Precision(2)
      .handle((s) => {
        this.speedState.fcuSelectedSpeed = s;
        this.needsUpdate = true;
      });

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.speedState.speed = s;
        this.needsUpdate = true;
      });

    sub.on('realTime').handle(this.onFrameUpdate.bind(this));
  }

  private setVisible(refNum: number[]) {
    for (let i = 0; i < 6; i++) {
      if (refNum.includes(i)) {
        this.speedRefs[i].instance.style.visibility = 'visible';
      } else {
        this.speedRefs[i].instance.style.visibility = 'visible';
      }
    }
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.needsUpdate === true) {
      this.needsUpdate = false;

      const fmgcPfdSelectedSpeedValid = !(
        this.speedState.pfdTargetSpeed.isNoComputedData() || this.speedState.pfdTargetSpeed.isFailureWarning()
      );

      const chosenTargetSpeed = fmgcPfdSelectedSpeedValid
        ? this.speedState.pfdTargetSpeed
        : this.speedState.fcuSelectedSpeed;

      const deltaSpeed = this.speedState.speed.value - chosenTargetSpeed.value;
      const sign = Math.sign(deltaSpeed);
      this.speedRefs[1].instance.setAttribute('d', `m 595,512 v ${-deltaSpeed * 3.33} h 12 v ${deltaSpeed * 3.33}`);

      if (Math.abs(deltaSpeed) >= 27) {
        this.speedRefs[0].instance.style.visibility = 'visible';
        sign == 1
          ? this.speedRefs[0].instance.setAttribute('transform', 'translate(0 -90)')
          : this.speedRefs[0].instance.setAttribute('transform', 'translate(0 0)');
        //this.outOfRange.set('')
      } else {
        this.speedRefs[0].instance.style.visibility = 'hidden';
      }

      if (Math.abs(deltaSpeed) > 1 && Math.abs(deltaSpeed) < 27) {
        this.speedRefs[1].instance.style.visibility = 'visible';
      } else {
        this.speedRefs[1].instance.style.visibility = 'hidden';
      }
    }
  }

  render(): VNode {
    for (let i = 0; i < 6; i++) {
      this.speedRefs.push(FSComponent.createRef<SVGPathElement>());
    }
    return (
      <>
        <g id="DeltaSpeedGroup" display={this.sVisibility}>
          <g ref={this.speedRefs[0]} transform={this.outOfRange} class="ScaledStroke CornerRound Green" stroke="red">
            <path class="ScaledStroke CornerRound Green" d="m 595,602 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,592 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,582 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,572 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,562 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,552 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,542 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,532 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,522 h 11" stroke="green" />
            <path class="ScaledStroke CornerRound Green" d="m 595,512 h 11" stroke="green" />
          </g>

          <path ref={this.speedRefs[1]} d="" class="ScaledStroke CornerRound Green GreenFill2" stroke="red" />
        </g>
      </>
    );
  }
}

class RadioAltAndDH extends DisplayComponent<{
  bus: ArincEventBus;
  filteredRadioAltitude: Subscribable<number>;
  attExcessive: Subscribable<boolean>;
}> {
  private sVisibility = Subject.create('none');
  private daRaGroup = FSComponent.createRef<SVGGElement>();

  private roll = new Arinc429Word(0);

  private readonly dh = Arinc429RegisterSubject.createEmpty();

  private filteredRadioAltitude = 0;

  private radioAltitude = new Arinc429Word(0);

  private transAltAr = Arinc429Register.empty();

  private transLvlAr = Arinc429Register.empty();

  private fmgcFlightPhase = 0;

  private altitude = new Arinc429Word(0);

  private attDhText = FSComponent.createRef<SVGTextElement>();

  private radioAltText = Subject.create('0');

  private radioAlt = FSComponent.createRef<SVGTextElement>();

  private classSub = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

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
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.fmgcFlightPhase = fp;
        fp >= 4 && fp <= 9 ? this.sVisibility.set('block') : this.sVisibility.set('none');
      });

    sub.on('altitudeAr').handle((a) => {
      this.altitude = a;
    });

    sub.on('chosenRa').handle((ra) => {
      if (!this.props.attExcessive.get()) {
        this.radioAltitude = ra;
        const raFailed = !this.radioAltitude.isFailureWarning();
        const raHasData = !this.radioAltitude.isNoComputedData();
        const raValue = this.filteredRadioAltitude;
        const verticalOffset = calculateVerticalOffsetFromRoll(this.roll.value);
        const useTransAltVsLvl = this.fmgcFlightPhase <= 3;
        const chosenTransalt = useTransAltVsLvl ? this.transAltAr : this.transLvlAr;
        const belowTransitionAltitude =
          chosenTransalt.isNormalOperation() &&
          !this.altitude.isNoComputedData() &&
          this.altitude.value < (useTransAltVsLvl ? chosenTransalt.value : chosenTransalt.value * 100);
        let size = 'FontMedium';
        const dh = this.dh.get();
        const DHValid = dh.value >= 0 && !dh.isNoComputedData() && !dh.isFailureWarning();

        let text = '';
        let color = 'Amber';

        if (raHasData) {
          if (raFailed) {
            if (raValue < 2500) {
              if (raValue > 400 || (raValue > dh.value + 100 && DHValid)) {
                color = 'Green';
              }
              if (raValue < 400) {
                size = 'FontMedium';
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
            color = belowTransitionAltitude ? 'Red Blink9Seconds' : 'Red';
            text = 'RA';
          }

          raValue < 5 ? this.sVisibility.set('none') : this.sVisibility.set('block');
        }

        this.daRaGroup.instance.style.transform = `translate3d(0px, ${-verticalOffset}px, 0px)`;
        if (raFailed && DHValid && raValue <= dh.value) {
          this.attDhText.instance.style.visibility = 'visible';
        } else {
          this.attDhText.instance.style.visibility = 'hidden';
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
        this.radioAlt.instance.style.visibility = 'hidden';
      } else {
        this.radioAlt.instance.style.visibility = 'visible';
      }
    });

    sub.on('fmDhRaw').handle(this.dh.setWord.bind(this.dh));
  }

  render(): VNode {
    return (
      <g ref={this.daRaGroup} id="DHAndRAGroup" display={this.sVisibility}>
        <text
          ref={this.attDhText}
          id="AttDHText"
          x="0"
          y="0"
          class="FontMedium Amber MiddleAlign Blink9Seconds TextOutline"
          transform="translate(640 600)"
        >
          DH
        </text>
        <text ref={this.radioAlt} id="RadioAlt" x="0" y="0" transform="translate(640 600)" class={this.classSub}>
          {this.radioAltText}
        </text>
      </g>
    );
  }
}

class FlareIndicator extends DisplayComponent<{
  bus: ArincEventBus;
}> {
  private sVisibility = Subject.create('none');
  private flareGroup = FSComponent.createRef<SVGGElement>();
  private fmgcDiscreteWord1 = new Arinc429Word(0);
  private fmgcDiscreteWord2 = new Arinc429Word(0);
  private setVisibility() {
    const rollOutActive = this.fmgcDiscreteWord2.bitValueOr(26, false);
    const flareActive = this.fmgcDiscreteWord1.bitValueOr(25, false);
    if (flareActive) {
      this.sVisibility.set('block');
    }
    if (rollOutActive) {
      this.sVisibility.set('none');
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & FgBus>();

    sub
      .on('fmgcDiscreteWord1')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord1 = word;
        this.setVisibility();
      });
    sub
      .on('fmgcDiscreteWord2')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord2 = word;
        this.setVisibility();
      });
  }

  render(): VNode {
    return (
      <g ref={this.flareGroup} id="FlareArrows" display={this.sVisibility}>
        <path class="SmallStroke Green" d="m 615,512 v -32" />
        <path class="SmallStroke Green" d="m 609,496 l 6 -16  l 6 16" />
        <path class="SmallStroke Green" d="m 665,512 v -32" />
        <path class="SmallStroke Green" d="m 659,496 l 6 -16  l 6 16" />
      </g>
    );
  }
}
export class SpoilersIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & HudElems>();
  private refElement = FSComponent.createRef<SVGGElement>();
  private leftSpoilers = FSComponent.createRef<SVGGElement>();
  private rightSpoliers = FSComponent.createRef<SVGGElement>();

  private readonly spCommanded = ConsumerSubject.create(this.sub.on('spoilersCommanded').whenChanged(), 0);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);

  private readonly isDeployed = MappedSubject.create(
    ([spCommanded, hudMode]) => {
      return spCommanded > 25 && hudMode === HudMode.ROLLOUT_OR_RTO ? 'block' : 'none';
    },
    this.spCommanded,
    this.hudMode,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }
  render(): VNode | null {
    return (
      <g id="SpoilersIndicator" display={this.isDeployed}>
        <path ref={this.leftSpoilers} class="NormalStroke Green Fill" d="m 593 512 v -17 h 17 v 17" />
        <path ref={this.rightSpoliers} class="NormalStroke Green Fill" d="m 670 512 v -17 h 17 v 17" />
      </g>
    );
  }
}

export class ReverserIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
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
  private readonly tla1 = ConsumerSubject.create(this.sub.on('tla1').whenChanged(), 0);
  private readonly tla2 = ConsumerSubject.create(this.sub.on('tla2').whenChanged(), 0);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);

  private readonly reverser2State = MappedSubject.create(
    ([rev2, tla2, eng2State, hudMode]) => {
      if (hudMode !== 0) {
        if (rev2 === 1) {
          if (eng2State === 1) {
            if (tla2 > -7) {
              return 1; // rev deployement in progress  display dash
            } else if (tla2 <= -7) {
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
    this.tla2,
    this.eng2State,
    this.hudMode,
  );
  private readonly reverser3State = MappedSubject.create(
    ([rev1, tla1, eng1State, hudMode]) => {
      if (hudMode !== 0) {
        if (rev1 === 1) {
          if (eng1State === 1) {
            if (tla1 > -7) {
              return 1; // rev deployement in progress  display dash
            } else if (tla1 <= -7) {
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
    this.tla1,
    this.eng1State,
    this.hudMode,
  );

  private setState() {
    if (this.reverser2State.get() === 1) {
      this.rev2Ref.instance.setAttribute('d', 'm 615 482 v -17 h 17 v 17 z');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '3 6');
      this.rev2TxtRef.instance.textContent = '';
    } else if (this.reverser2State.get() === 2) {
      this.rev2Ref.instance.setAttribute('d', 'm 615 482 v -17 h 17 v 17 z');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev2TxtRef.instance.textContent = 'R';
    } else if (this.reverser2State.get() === 3) {
      this.rev2Ref.instance.setAttribute('d', 'm 615 482 v -17 h 17 v 17 z  m 0 0 l 17 -17   m -17 0 l 17 17 ');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev2TxtRef.instance.textContent = '';
    } else {
      this.rev2Ref.instance.setAttribute('d', '');
      this.rev2TxtRef.instance.textContent = '';
    }

    if (this.reverser3State.get() === 1) {
      this.rev1Ref.instance.setAttribute('d', 'm 648 482 v -17 h 17 v 17 z');
      this.rev1Ref.instance.setAttribute('stroke-dasharray', '3 6');
      this.rev1TxtRef.instance.textContent = '';
    } else if (this.reverser3State.get() === 2) {
      this.rev1Ref.instance.setAttribute('d', 'm 648 482 v -17 h 17 v 17 z');
      this.rev1Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev1TxtRef.instance.textContent = 'R';
    } else if (this.reverser3State.get() === 3) {
      this.rev1Ref.instance.setAttribute('d', 'm 648 482 v -17 h 17 v 17 z  m 0 0 l 17 -17   m -17 0 l 17 17 ');
      this.rev1Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev1TxtRef.instance.textContent = '';
    } else {
      this.rev1Ref.instance.setAttribute('d', '');
      this.rev1TxtRef.instance.textContent = '';
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('realTime').handle(() => {
      if (this.reverser2State.get() !== 0 && this.reverser3State.get() !== 0) {
        this.revGroupRef.instance.style.display = 'block';
        this.setState();
      } else {
        this.revGroupRef.instance.style.display = 'none';
      }
    });
  }
  //>
  render(): VNode | null {
    return (
      <g id="ReverseIndicator" ref={this.revGroupRef}>
        <path ref={this.rev2Ref} class="LargeStroke Green " d="" />
        <text ref={this.rev2TxtRef} x="623.5" y="480 " class="FontSmallest MiddleAlign Green ">
          R
        </text>
        <path ref={this.rev1Ref} class="LargeStroke Green " d="" />
        <text ref={this.rev1TxtRef} x="656.5" y="480 " class="FontSmallest MiddleAlign Green ">
          R
        </text>
      </g>
    );
  }
}
