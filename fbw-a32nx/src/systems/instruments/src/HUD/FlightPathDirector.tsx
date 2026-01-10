// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
  Subscription,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FgBus } from 'instruments/src/PFD/shared/FgBusProvider';

import { calculateHorizonOffsetFromPitch, HudElems, FIVE_DEG } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';
import { getDisplayIndex } from './HUD';

const DistanceSpacing = (1024 / 28) * 5;
const ValueSpacing = 5;

interface FlightPathVectorData {
  roll: Arinc429RegisterSubject;
  pitch: Arinc429RegisterSubject;
  fpa: Arinc429RegisterSubject;
  da: Arinc429RegisterSubject;
  rollFdCommand: Arinc429RegisterSubject;
  pitchFdCommand: Arinc429RegisterSubject;
  fdEngaged: boolean;
  fdOff: boolean;
}

export class FlightPathDirector extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
}> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<
    HUDSimvars & Arinc429Values & ClockEvents & FcuBus & FgBus & HudElems
  >();
  private flightPhase = -1;
  private declutterMode = 0;
  private fdCueOffRange = false;
  private sVisibility = Subject.create<String>('');

  private data: FlightPathVectorData = {
    roll: Arinc429RegisterSubject.createEmpty(),
    pitch: Arinc429RegisterSubject.createEmpty(),
    fpa: Arinc429RegisterSubject.createEmpty(),
    da: Arinc429RegisterSubject.createEmpty(),
    rollFdCommand: Arinc429RegisterSubject.createEmpty(),
    pitchFdCommand: Arinc429RegisterSubject.createEmpty(),
    fdEngaged: false,
    fdOff: false,
  };

  private fcuDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord5 = new Arinc429Word(0);

  private needsUpdate = false;

  private readonly isVisible = Subject.create(false);

  private birdPath = FSComponent.createRef<SVGGElement>();

  private birdPathCircle = FSComponent.createRef<SVGPathElement>();

  private readonly shouldFlash = Subject.create(false);

  private readonly flightPathDirector = ConsumerSubject.create(this.sub.on('flightPathDirector').whenChanged(), '');
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);
  private readonly flightPase = ConsumerSubject.create(this.sub.on('fmgcFlightPhase').whenChanged(), 0);
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.flightPathDirector, this.crosswindMode, this.flightPase);
    const isCaptainSide = getDisplayIndex() === 1;

    this.subscriptions.push(
      this.sub
        .on(isCaptainSide ? 'fd1Active' : 'fd2Active')
        .whenChanged()
        .handle((fd) => {
          this.data.fdEngaged = fd;
          this.needsUpdate = true;
        }),
    );

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
        .on('fcuEisDiscreteWord2')
        .whenChanged()
        .handle((tr) => {
          this.data.fdOff = tr.bitValueOr(23, false);
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fmgcDiscreteWord2')
        .whenChanged()
        .handle((tr) => {
          this.fmgcDiscreteWord2 = tr;

          this.handleFpdFlashing();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fmgcDiscreteWord5')
        .whenChanged()
        .handle((tr) => {
          this.fmgcDiscreteWord5 = tr;

          this.handleFpdFlashing();
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
      this.sub.on('rollFdCommand').handle((fdp) => {
        this.data.rollFdCommand.setWord(fdp.rawWord);
        this.needsUpdate = true;
      }),
    );

    this.subscriptions.push(
      this.sub.on('pitchFdCommand').handle((fdr) => {
        this.data.pitchFdCommand.setWord(fdr.rawWord);
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

    this.subscriptions.push(this.sub.on('realTime').handle(this.onFrameUpdate.bind(this)));

    this.props.isAttExcessive.sub((_a) => {
      this.needsUpdate = true;
    }, true);
  }
  private onFrameUpdate(_realTime: number): void {
    this.handlePath();
    if (this.needsUpdate && this.isVisible.get()) {
      this.moveBird();
    }
  }
  private handlePath() {
    const rollFdInvalid =
      this.data.rollFdCommand.get().isFailureWarning() || this.data.rollFdCommand.get().isNoComputedData();
    const pitchFdInvalid =
      this.data.pitchFdCommand.get().isFailureWarning() || this.data.pitchFdCommand.get().isNoComputedData();
    const daAndFpaValid = this.data.fpa.get().isNormalOperation() && this.data.da.get().isNormalOperation();
    if (
      rollFdInvalid ||
      pitchFdInvalid ||
      !daAndFpaValid ||
      !this.data.fdEngaged ||
      this.data.fdOff ||
      this.props.isAttExcessive.get()
    ) {
      this.birdPath.instance.style.visibility = 'hidden';
      this.isVisible.set(false);
    } else {
      this.birdPath.instance.style.visibility = 'visible';
      this.isVisible.set(true);
    }
  }

  private moveBird() {
    let xOffsetLim;

    if (this.isVisible.get()) {
      const daLimConv = (this.data.da.get().value * DistanceSpacing) / ValueSpacing;
      const pitchSubFpaConv =
        calculateHorizonOffsetFromPitch(this.data.pitch.get().value) -
        calculateHorizonOffsetFromPitch(this.data.fpa.get().value);
      const rollCos = Math.cos((this.data.roll.get().value * Math.PI) / 180);
      const rollSin = Math.sin((-this.data.roll.get().value * Math.PI) / 180);

      //FD Smoothing when close to FPV
      //roll
      const FDRollOrder = this.data.rollFdCommand.get().value;
      const FDRollOrderLim =
        this.flightPase.get() === 5
          ? Math.max(Math.min(FDRollOrder, 2.5), -2.5)
          : Math.max(Math.min(FDRollOrder, 45), -45);
      // //pitch
      const FDPitchOrder = this.data.pitchFdCommand.get().value; //in degrees on pitch scale
      const FDPitchOrderLim =
        this.flightPase.get() === 5
          ? Math.max(Math.min(FDPitchOrder, 2.5), -2.5)
          : Math.max(Math.min(FDPitchOrder, 7.5), -10);

      const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
      const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

      const xOffset = xOffsetFpv + FDRollOrderLim * 13;
      const yOffset = yOffsetFpv + FDPitchOrderLim * 37 + rollSin * (xOffset - xOffsetFpv);

      //set lateral limit for fdCue
      if (this.crosswindMode.get() === false) {
        if (xOffset < -428 || xOffset > 360) {
          this.fdCueOffRange = true;
        } else {
          this.fdCueOffRange = false;
        }

        xOffsetLim = Math.max(Math.min(xOffset, 360), -428);
      } else {
        if (xOffset < -540 || xOffset > 540) {
          this.fdCueOffRange = true;
        } else {
          this.fdCueOffRange = false;
        }
        xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
      }

      this.birdPathCircle.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;

      if (this.fdCueOffRange) {
        this.birdPathCircle.instance.setAttribute('stroke-dasharray', '3 6');
      } else {
        this.birdPathCircle.instance.setAttribute('stroke-dasharray', '');
      }
    }
    this.needsUpdate = false;
  }

  private handleFpdFlashing() {
    const fdRollBarFlashing = this.fmgcDiscreteWord2.bitValueOr(28, false);
    const fdPitchBarFlashing = this.fmgcDiscreteWord5.bitValueOr(24, false);

    this.shouldFlash.set(fdRollBarFlashing || fdPitchBarFlashing);
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g ref={this.birdPath}>
        <svg>
          <FlashOneHertz
            bus={this.props.bus}
            flashDuration={Infinity}
            visible={this.isVisible}
            flashing={this.shouldFlash}
          >
            <g id="FlightPathDirector" display={this.sVisibility}>
              {/* <circle class="SmallStroke Green" cx="640" cy="512" r="10" /> */}
              <path
                ref={this.birdPathCircle}
                d="M 631 512 C 631 517,  635 521,      640 521
                S 649 517,      649 512
                S 645 503,      640 503
                S 631 507,      631 512 Z"
                class="NormalStroke Green"
                stroke-dasharray="3 6"
              />
            </g>
          </FlashOneHertz>
        </svg>
      </g>
    );
  }
}
