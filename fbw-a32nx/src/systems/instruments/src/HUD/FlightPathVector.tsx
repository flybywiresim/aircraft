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
} from '@microsoft/msfs-sdk';
import {
  ArincEventBus,
  Arinc429Word,
  Arinc429WordData,
  Arinc429Register,
  Arinc429RegisterSubject,
} from '@flybywiresim/fbw-sdk';
import { ArmedLateralMode, ArmedVerticalMode, isArmed, LateralMode, VerticalMode } from '@shared/autopilot';

import { SimplaneValues } from 'instruments/src/HUD/shared/SimplaneValueProvider';
import { getDisplayIndex } from './HUD';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import {
  calculateHorizonOffsetFromPitch,
  calculateVerticalOffsetFromRoll,
  LagFilter,
  getSmallestAngle,
} from './HUDUtils';

import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';

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

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & FcuBus>();

    sub
      .on('fcuDiscreteWord1')
      .whenChanged()
      .handle((a) => {
        this.fcuDiscreteWord1 = a;
        this.needsUpdate = true;
      });
    sub.on('fpa').handle((fpa) => {
      this.data.fpa = fpa;
      this.needsUpdate = true;
    });
    sub.on('da').handle((da) => {
      this.data.da = da;
      this.needsUpdate = true;
    });
    sub.on('rollAr').handle((r) => {
      this.data.roll = r;
      this.needsUpdate = true;
    });
    sub.on('pitchAr').handle((p) => {
      this.data.pitch = p;
      this.needsUpdate = true;
    });
    sub.on('realTime').handle((_t) => {
      if (this.needsUpdate) {
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
    });
  }

  private moveBird() {
    const daLimConv = (this.data.da.value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value);
    const rollCos = Math.cos((this.data.roll.value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    this.bird.instance.style.transform = `translate3d(${xOffset}px, ${yOffset - 182.86}px, 0px)`;
  }

  render(): VNode {
    return (
      <>
        <g ref={this.bird} id="bird">
          <g id="FlightPathVector">
            <circle class="SmallStroke Green" cx="640" cy="512" r="16" />
            <path class="SmallStroke Green" d="m 590,512 h 34" />
            <path class="SmallStroke Green" d="m 656,512 h 34" />
            <path class="SmallStroke Green" d="M 640,496 v -16" />
          </g>
          <TotalFlightPathAngle bus={this.props.bus} />

          <SelectedFlightPathAngle bus={this.props.bus} />
          <DeltaSpeed bus={this.props.bus} />
          <RadioAltAndDH
            bus={this.props.bus}
            filteredRadioAltitude={this.props.filteredRadioAlt}
            attExcessive={this.props.isAttExcessive}
          />
          <FlareIndicator bus={this.props.bus} />
        </g>
      </>
    );
  }
}

// // FIXME the same logic with the speed trend tape. Need confirmation.

export class TotalFlightPathAngle extends DisplayComponent<{ bus: ArincEventBus }> {
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
      <g id="TotalFlightPathAngle" ref={this.refElement}>
        <path ref={this.leftChevron} class="SmallStroke Green" d="m 574,500 12,12 -12,12" />
        <path ref={this.rightChevron} class="SmallStroke Green" d="m 706,500 -12,12 12,12" />
      </g>
    );
  }
}

interface FlightPathDirectorData {
  roll: Arinc429WordData;
  pitch: Arinc429WordData;
  fpa: Arinc429WordData;
  da: Arinc429WordData;
  activeVerticalMode: number;
  activeLateralMode: number;
  fdRoll: number;
  fdPitch: number;
  fdActive: boolean;
}

export class SelectedFlightPathAngle extends DisplayComponent<{ bus: ArincEventBus }> {
  private refElement = FSComponent.createRef<SVGGElement>();

  private vCTrend = new Arinc429Word(0);

  private text = '';

  private fdActive = false;

  private needsUpdate = false;

  private selectedFpa = 0;

  private selectFpaChanged = false;

  private activeVerticalMode = VerticalMode.NONE;

  private armedVerticalMode = VerticalMode.NONE;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & ClockEvents>();

    sub
      .on('fd1Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 1) {
          this.fdActive = fd;
          this.needsUpdate = true;
        }
      });

    sub
      .on('fd2Active')
      .whenChanged()
      .handle((fd) => {
        if (getDisplayIndex() === 2) {
          this.fdActive = fd;
          this.needsUpdate = true;
        }
      });

    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((vm) => {
        this.activeVerticalMode = vm;
        this.needsUpdate = true;
      });

    sub
      .on('selectedFpa')
      .whenChanged()
      .handle((a) => {
        this.selectedFpa = a;
        if (this.activeVerticalMode === VerticalMode.FPA) {
          this.selectFpaChanged = true;
        }
        const offset = (-this.selectedFpa * 1024) / 28;
        this.refElement.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
        this.needsUpdate = true;
      });

    sub
      .on('fmaVerticalArmed')
      .whenChanged()
      .handle((vm) => {
        this.armedVerticalMode = vm;
        this.needsUpdate = true;
      });

    sub.on('realTime').handle((_t) => {
      if (this.needsUpdate) {
        this.needsUpdate = false;

        if (this.fdActive && this.selectFpaChanged) {
          this.selectFpaChanged = false;
          this.refElement.instance.style.visibility = 'visible';
          this.refElement.instance.classList.remove('Apear5s');
          this.refElement.instance.classList.add('Apear5s');
        } else if (this.fdActive && this.armedVerticalMode === VerticalMode.FPA) {
          this.refElement.instance.classList.remove('Apear5s');
          this.refElement.instance.style.visibility = 'visible';
        } else {
          this.refElement.instance.style.visibility = 'hidden';
        }
      }
    });
  }

  render(): VNode | null {
    return (
      <g id="SelectedFlightPathAngle" ref={this.refElement}>
        <circle class="ScaledStroke Green" cx="640" cy="512" r="5" />
        <text class="FontLarge StartAlign Green" x="518" y="682">
          {this.text}
        </text>
      </g>
    );
  }
}

interface SpeedStateInfo {
  speed: Arinc429WordData;
  selectedTargetSpeed: number;
  managedTargetSpeed: number;
  holdValue: number;
  isSelectedSpeed: boolean;
  isMach: boolean;
}

class DeltaSpeed extends DisplayComponent<{ bus: ArincEventBus }> {
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private sVisibility = Subject.create<String>('');
  private speedRefs: NodeReference<SVGElement>[] = [];

  private needsUpdate = true;

  private speedState: SpeedStateInfo = {
    speed: new Arinc429Word(0),
    selectedTargetSpeed: 100,
    managedTargetSpeed: 100,
    holdValue: 100,
    isSelectedSpeed: false,
    isMach: false,
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
      .on('isSelectedSpeed')
      .whenChanged()
      .handle((s) => {
        this.speedState.isSelectedSpeed = s;
        this.needsUpdate = true;
      });

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.speedState.speed = s;
        this.needsUpdate = true;
      });

    sub
      .on('holdValue')
      .whenChanged()
      .handle((s) => {
        this.speedState.holdValue = s;
        this.needsUpdate = true;
      });

    sub
      .on('machActive')
      .whenChanged()
      .handle((s) => {
        this.speedState.isMach = s;
        this.needsUpdate = true;
      });

    // sub
    //   .on('targetSpeedManaged')
    //   .whenChanged()
    //   .handle((s) => {
    //     this.speedState.managedTargetSpeed = s;
    //     this.needsUpdate = true;
    //   });

    sub.on('realTime').handle(this.onFrameUpdate.bind(this));
  }

  private setVisible(refNum: number[]) {
    for (let i = 0; i < 6; i++) {
      if (refNum.includes(i)) {
        this.speedRefs[i].instance.style.visibility = 'visible';
      } else {
        this.speedRefs[i].instance.style.visibility = 'hidden';
      }
    }
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.needsUpdate === true) {
      this.needsUpdate = false;

      if (this.speedState.isSelectedSpeed) {
        if (this.speedState.isMach) {
          const holdValue = this.speedState.holdValue;
          this.speedState.selectedTargetSpeed = SimVar.GetGameVarValue(
            'FROM MACH TO KIAS',
            'number',
            holdValue === null ? undefined : holdValue,
          );
        } else {
          this.speedState.selectedTargetSpeed = this.speedState.holdValue;
        }
      }

      const deltaSpeed =
        this.speedState.speed.value -
        (this.speedState.isSelectedSpeed ? this.speedState.selectedTargetSpeed : this.speedState.managedTargetSpeed);
      const sign = Math.sign(deltaSpeed);

      if (Math.abs(deltaSpeed) < 1) {
        this.setVisible([0]);
      } else if (Math.abs(deltaSpeed) < 10) {
        this.speedRefs[1].instance.setAttribute('d', `m 595,512 v ${-deltaSpeed * 4.6} h 12 v ${deltaSpeed * 4.6}`);
        this.speedRefs[2].instance.setAttribute('d', `m 601,512 v ${-deltaSpeed * 4.6}`);
        this.setVisible([1, 2]);
      } else if (Math.abs(deltaSpeed) < 20) {
        this.speedRefs[1].instance.setAttribute('d', `m 595,512 v ${-deltaSpeed * 4.6} h 12 v ${deltaSpeed * 4.6}`);
        this.speedRefs[2].instance.setAttribute('d', `m 601,512 v ${-sign * 46}`);
        this.speedRefs[3].instance.style.transform = `translate3d(0px, ${-sign * 46}px, 0px)`;
        this.speedRefs[4].instance.setAttribute(
          'd',
          `m 601,${512 - sign * 46} v ${-sign * (Math.abs(deltaSpeed) - 10) * 4.6}`,
        );
        this.setVisible([1, 2, 3, 4]);
      } else {
        this.speedRefs[5].instance.style.transform = `translate3d(0px, ${-sign * 46}px, 0px)`;
        this.setVisible([5]);
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
          <path
            ref={this.speedRefs[0]}
            class="ScaledStroke CornerRound Green"
            d="m 595,507.4 h 12 v 9.2 h -12 z"
            style="visibility:hidden"
          />
          <path ref={this.speedRefs[1]} class="ScaledStroke CornerRound Green" style="visibility:hidden" />
          <path ref={this.speedRefs[2]} class="ScaledStroke CornerRound Green" style="visibility:hidden" />
          <path
            ref={this.speedRefs[3]}
            class="ScaledStroke CornerRound Green"
            d="m 595,512 h 12"
            style="visibility:hidden"
          />
          <path ref={this.speedRefs[4]} class="ScaledStroke CornerRound Green" style="visibility:hidden" />
          <g ref={this.speedRefs[5]} class="ScaledStroke CornerRound Green" style="visibility:hidden">
            <path class="ScaledStroke CornerRound Green" d="m 595,466 h 11" style="visibility:hidden" />
            <path class="ScaledStroke CornerRound Green" d="m 595,476.2 h 11" style="visibility:hidden" />
            <path class="ScaledStroke CornerRound Green" d="m 595,486.4 h 11" style="visibility:hidden" />
            <path class="ScaledStroke CornerRound Green" d="m 595,496.6 h 11" style="visibility:hidden" />
            <path class="ScaledStroke CornerRound Green" d="m 595,506.8 h 11" style="visibility:hidden" />
            <path class="ScaledStroke CornerRound Green" d="m 595,517 h 11" style="visibility:hidden" />
            <path class="ScaledStroke CornerRound Green" d="m 595,527.2 h 11" style="visibility:hidden" />
            <path class="ScaledStroke CornerRound Green" d="m 595,537.4 h 11" style="visibility:hidden" />
            <path class="ScaledStroke CornerRound Green" d="m 595,547.6 h 11" style="visibility:hidden" />
          </g>
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
  private sFlareVisibility = Subject.create('none');
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
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

    sub
      .on('fmgc1PitchFdCommandRaw')
      .whenChanged()
      .handle((v) => {
        v === VerticalMode.FLARE ? this.sVisibility.set('block') : this.sVisibility.set('none');
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
