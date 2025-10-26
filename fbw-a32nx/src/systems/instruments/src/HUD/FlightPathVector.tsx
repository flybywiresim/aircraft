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
  Subscription,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429Register, Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';

import { SimplaneValues } from 'instruments/src/HUD/shared/SimplaneValueProvider';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { calculateHorizonOffsetFromPitch, calculateVerticalOffsetFromRoll, HudElems, FIVE_DEG } from './HUDUtils';

import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FgBus } from './shared/FgBusProvider';
import { HudMode } from './HUDUtils';
const DistanceSpacing = (1024 / 28) * 5;
const ValueSpacing = 5;

interface FlightPathVectorData {
  roll: Arinc429RegisterSubject;
  pitch: Arinc429RegisterSubject;
  fpa: Arinc429RegisterSubject;
  da: Arinc429RegisterSubject;
}

export class FlightPathVector extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
}> {
  private readonly subscriptions: Subscription[] = [];
  private bird = FSComponent.createRef<SVGGElement>();
  private birdPath = FSComponent.createRef<SVGPathElement>();
  private birdOffRange = false;
  private readonly fpvFlagVisible = Subject.create(false);

  private fcuDiscreteWord1 = new Arinc429Word(0);
  //TODO: test Arinc429Register.empty() instead of Arinc429Word(0)
  private data: FlightPathVectorData = {
    roll: Arinc429RegisterSubject.createEmpty(),
    pitch: Arinc429RegisterSubject.createEmpty(),
    fpa: Arinc429RegisterSubject.createEmpty(),
    da: Arinc429RegisterSubject.createEmpty(),
  };
  private needsUpdate = false;

  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & FcuBus & HudElems>();
  private readonly ap1Active = ConsumerSubject.create(this.sub.on('ap1Active').whenChanged(), false);
  private readonly ap2Active = ConsumerSubject.create(this.sub.on('ap2Active').whenChanged(), false);
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);
  onAfterRender(node: VNode): void {
    this.subscriptions.push(this.ap1Active, this.ap2Active, this.crosswindMode);
    super.onAfterRender(node);

    this.subscriptions.push(
      this.sub
        .on('fcuDiscreteWord1')
        .whenChanged()
        .handle((a) => {
          this.fcuDiscreteWord1 = a;
          this.needsUpdate = true;
        }),
    );
    this.subscriptions.push(
      this.sub
        .on('fpa')
        .whenChanged()
        .handle((fpa) => {
          this.data.fpa.setWord(fpa.rawWord);
          this.needsUpdate = true;
        }),
    );
    this.subscriptions.push(
      this.sub
        .on('da')
        .whenChanged()
        .handle((da) => {
          this.data.da.setWord(da.rawWord);
          this.needsUpdate = true;
        }),
    );
    this.subscriptions.push(
      this.sub
        .on('rollAr')
        .whenChanged()
        .handle((r) => {
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
    this.subscriptions.push(this.sub.on('realTime').handle(this.onFrameUpdate.bind(this)));
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.needsUpdate === true) {
      this.needsUpdate = false;

      const trkFpaActive = this.fcuDiscreteWord1.bitValueOr(25, true);
      const daAndFpaValid = this.data.fpa.get().isNormalOperation() && this.data.da.get().isNormalOperation();
      if (daAndFpaValid) {
        this.fpvFlagVisible.set(false);
        this.bird.instance.classList.remove('HiddenElement');
        this.moveBird();
      } else if (!trkFpaActive) {
        this.fpvFlagVisible.set(false);
        this.bird.instance.classList.add('HiddenElement');
      } else if (this.data.pitch.get().isNormalOperation() && this.data.roll.get().isNormalOperation()) {
        this.fpvFlagVisible.set(true);
        this.bird.instance.classList.add('HiddenElement');
      }
    }
  }

  private moveBird() {
    let xOffsetLim;
    const daLimConv = (this.data.da.get().value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.get().value) -
      calculateHorizonOffsetFromPitch(this.data.fpa.get().value);
    const rollCos = Math.cos((this.data.roll.get().value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.get().value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    //set lateral limit for fdCue
    if (this.crosswindMode.get() === false) {
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

    this.bird.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;

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

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <g ref={this.bird} id="bird">
          <g id="FlightPathVector">
            <path ref={this.birdPath} d="" class="NormalStroke Green" stroke-dasharray="3 6" />
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
        </g>
      </>
    );
  }
}

export class SpeedChevrons extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars & HudElems>();
  private refElement = FSComponent.createRef<SVGGElement>();
  private leftChevron = FSComponent.createRef<SVGGElement>();
  private rightChevron = FSComponent.createRef<SVGGElement>();
  private inRange = true;
  private onGround = true;
  private merged = false;
  private onTakeoff = true;

  private readonly spdChevrons = ConsumerSubject.create(this.sub.on('flightPathVector').whenChanged(), '');
  private readonly vCTrend = ConsumerSubject.create(this.sub.on('vCTrend'), new Arinc429Word(0));

  private setPos() {
    if (this.vCTrend.get().isNormalOperation()) {
      this.refElement.instance.style.visibility = 'visible';
      const offset = (-this.vCTrend.get().value * 28) / 5;
      let UsedOffset = offset;
      if (this.merged == false) {
        if (this.onTakeoff) {
          offset <= -FIVE_DEG ? (this.inRange = false) : (this.inRange = true);
          UsedOffset = Math.max((-this.vCTrend.get().value * 28) / 5, -FIVE_DEG);
          if (UsedOffset === offset) {
            UsedOffset = (-this.vCTrend.get().value * 28) / 5;
            if (this.onGround == false) {
              this.merged = true;
              this.inRange = true;
            }
          }
        } else {
          UsedOffset = (-this.vCTrend.get().value * 28) / 5;
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
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.spdChevrons, this.vCTrend);
    this.subscriptions.push(
      this.vCTrend.sub(() => {
        this.setPos();
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
      <g id="SpeedChevrons" ref={this.refElement}>
        <path ref={this.leftChevron} class="NormalStroke Green" d="m 574,500 12,12 -12,12" />
        <path ref={this.rightChevron} class="NormalStroke Green" d="m 706,500 -12,12 12,12" />
      </g>
    );
  }
}

interface SpeedStateInfo {
  pfdTargetSpeed: Arinc429RegisterSubject;
  fcuSelectedSpeed: Arinc429RegisterSubject;
  speed: Arinc429RegisterSubject;
  fmgcDiscreteWord5: Arinc429RegisterSubject;
}

class DeltaSpeed extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<
    HUDSimvars & SimplaneValues & ClockEvents & Arinc429Values
  >();
  private sVisibility = Subject.create<String>('');
  private outOfRange = Subject.create<String>('');
  private speedRefs: NodeReference<SVGElement>[] = [];

  private needsUpdate = true;

  private speedState: SpeedStateInfo = {
    speed: Arinc429RegisterSubject.createEmpty(),
    pfdTargetSpeed: Arinc429RegisterSubject.createEmpty(),
    fcuSelectedSpeed: Arinc429RegisterSubject.createEmpty(),
    fmgcDiscreteWord5: Arinc429RegisterSubject.createEmpty(),
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;

    this.subscriptions.push(
      this.sub
        .on('leftMainGearCompressed')
        .whenChanged()
        .handle((value) => {
          if (value) {
            this.sVisibility.set('none');
          } else {
            this.sVisibility.set('block');
          }
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('pfdSelectedSpeed')
        .withArinc429Precision(2)
        .handle((s) => {
          this.speedState.pfdTargetSpeed.setWord(s);
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fmgcDiscreteWord5')
        .whenChanged()
        .handle((s) => {
          this.speedState.fmgcDiscreteWord5.setWord(s);
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fcuSelectedAirspeed')
        .withArinc429Precision(2)
        .handle((s) => {
          this.speedState.fcuSelectedSpeed.setWord(s);
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('speedAr')
        .withArinc429Precision(2)
        .handle((s) => {
          this.speedState.speed.setWord(s);
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(this.sub.on('realTime').handle(this.onFrameUpdate.bind(this)));
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.needsUpdate === true) {
      this.needsUpdate = false;

      const fmgcPfdSelectedSpeedValid = !(
        this.speedState.pfdTargetSpeed.get().isNoComputedData() ||
        this.speedState.pfdTargetSpeed.get().isFailureWarning()
      );

      const chosenTargetSpeed = fmgcPfdSelectedSpeedValid
        ? this.speedState.pfdTargetSpeed
        : this.speedState.fcuSelectedSpeed;

      const deltaSpeed = this.speedState.speed.get().value - chosenTargetSpeed.get().value;
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

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    for (let i = 0; i < 6; i++) {
      this.speedRefs.push(FSComponent.createRef<SVGPathElement>());
    }
    return (
      <>
        <g id="DeltaSpeedGroup" display={this.sVisibility}>
          <g ref={this.speedRefs[0]} transform={this.outOfRange} class="NormalStroke CornerRound Green" stroke="red">
            <path class="NormalStroke CornerRound Green" d="m 595,602 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,592 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,582 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,572 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,562 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,552 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,542 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,532 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,522 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,512 h 11" stroke="green" />
          </g>

          <path ref={this.speedRefs[1]} d="" class="NormalStroke CornerRound Green GreenFill2" stroke="red" />
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
          transform="translate(640 580)"
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
        <path class="NormalStroke Green" d="m 615,512 v -32" />
        <path class="NormalStroke Green" d="m 609,496 l 6 -16  l 6 16" />
        <path class="NormalStroke Green" d="m 665,512 v -32" />
        <path class="NormalStroke Green" d="m 659,496 l 6 -16  l 6 16" />
      </g>
    );
  }
}
export class SpoilersIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
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
    this.subscriptions.push(this.spCommanded, this.hudMode);
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
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
