// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FgBus } from 'instruments/src/PFD/shared/FgBusProvider';

import { calculateHorizonOffsetFromPitch } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';
import { getDisplayIndex } from './HUD';

const DistanceSpacing = (1024 / 28) * 5;
const ValueSpacing = 5;

interface FlightPathVectorData {
  roll: Arinc429WordData;
  pitch: Arinc429WordData;
  fpa: Arinc429WordData;
  da: Arinc429WordData;
  rollFdCommand: Arinc429WordData;
  pitchFdCommand: Arinc429WordData;
  fdEngaged: boolean;
  fdOff: boolean;
}

export class FlightPathDirector extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
}> {
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode;
  private fdCueOffRange;
  private sVisibility = Subject.create<String>('');

  private data: FlightPathVectorData = {
    roll: new Arinc429Word(0),
    pitch: new Arinc429Word(0),
    fpa: new Arinc429Word(0),
    da: new Arinc429Word(0),
    rollFdCommand: new Arinc429Word(0),
    pitchFdCommand: new Arinc429Word(0),
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

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & FcuBus & FgBus>();

    sub.on(isCaptainSide ? 'crosswindModeL' : 'crosswindModeR').handle((d) => {
      this.crosswindMode = d;
    });
    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.flightPhase = fp;
        if (fp < 5 || fp >= 9) {
          this.sVisibility.set('none');
        }
        if (fp > 4 && fp < 9) {
          this.sVisibility.set('block');
        }
      });
    sub
      .on(isCaptainSide ? 'declutterModeL' : 'declutterModeR')
      .whenChanged()
      .handle((value) => {
        this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Number');
        this.declutterMode = value;
      });
    sub
      .on(isCaptainSide ? 'fd1Active' : 'fd2Active')
      .whenChanged()
      .handle((fd) => {
        this.data.fdEngaged = fd;
        this.needsUpdate = true;
      });

    sub
      .on('fcuDiscreteWord1')
      .whenChanged()
      .handle((a) => {
        this.fcuDiscreteWord1 = a;
        this.needsUpdate = true;
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((tr) => {
        this.data.fdOff = tr.bitValueOr(23, false);
        this.needsUpdate = true;
      });

    sub
      .on('fmgcDiscreteWord2')
      .whenChanged()
      .handle((tr) => {
        this.fmgcDiscreteWord2 = tr;

        this.handleFpdFlashing();
      });

    sub
      .on('fmgcDiscreteWord5')
      .whenChanged()
      .handle((tr) => {
        this.fmgcDiscreteWord5 = tr;

        this.handleFpdFlashing();
      });

    sub.on('fpa').handle((fpa) => {
      this.data.fpa = fpa;
      this.needsUpdate = true;
    });

    sub.on('da').handle((da) => {
      this.data.da = da;
      this.needsUpdate = true;
    });

    sub.on('rollFdCommand').handle((fdp) => {
      this.data.rollFdCommand = fdp;
      this.needsUpdate = true;
    });

    sub.on('pitchFdCommand').handle((fdr) => {
      this.data.pitchFdCommand = fdr;
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
      this.handlePath();
      if (this.needsUpdate && this.isVisible.get()) {
        this.moveBird();
      }
    });

    this.props.isAttExcessive.sub((_a) => {
      this.needsUpdate = true;
    }, true);
  }

  private handlePath() {
    const rollFdInvalid = this.data.rollFdCommand.isFailureWarning() || this.data.rollFdCommand.isNoComputedData();
    const pitchFdInvalid = this.data.pitchFdCommand.isFailureWarning() || this.data.pitchFdCommand.isNoComputedData();
    const daAndFpaValid = this.data.fpa.isNormalOperation() && this.data.da.isNormalOperation();
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
      const daLimConv = (this.data.da.value * DistanceSpacing) / ValueSpacing;
      const pitchSubFpaConv =
        calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value);
      const rollCos = Math.cos((this.data.roll.value * Math.PI) / 180);
      const rollSin = Math.sin((-this.data.roll.value * Math.PI) / 180);

      //FD Smoothing when close to FPV
      //roll
      const FDRollOrder = this.data.rollFdCommand.value;
      let FDRollOrder2 = FDRollOrder;
      let cx, cy, r;
      cx = -30;
      cy = 90;
      r = 94.86835;
      if (FDRollOrder >= 0) {
        FDRollOrder2 = cy - Math.sqrt(r ** 2 - (FDRollOrder - cx) ** 2);
      } else {
        FDRollOrder2 = -cy + Math.sqrt(r ** 2 - (FDRollOrder + cx) ** 2);
      }
      const FDRollOrderLim = Math.max(Math.min(FDRollOrder2, 45), -45);

      //pitch
      const FDPitchOrder = this.data.pitchFdCommand.value; //in degrees on pitch scale
      let FDPitchOrder2 = FDRollOrder;

      cx = -10;
      cy = 18;
      r = 20.5913;
      if (FDPitchOrder >= 0) {
        FDPitchOrder2 = cy - Math.sqrt(r ** 2 - (FDPitchOrder - cx) ** 2);
      } else {
        FDPitchOrder2 = -cy + Math.sqrt(r ** 2 - (FDPitchOrder + cx) ** 2);
      }
      const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder2, 5), -5);

      const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
      const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

      const xOffset = xOffsetFpv + FDRollOrderLim * 13;
      const yOffset = yOffsetFpv + FDPitchOrderLim * (182.86 / 5);

      // console.log(
      //   'initial fdr: ' +
      //     FDRollOrder +
      //     '  new:  ' +
      //     FDRollOrder2 +
      //     '  xOffset: ' +
      //     xOffset +
      //     '  testOffset: ' +
      //     testOffset +
      //     '  FDRollOrderLim: ' +
      //     FDRollOrderLim,
      // );

      //set lateral limit for fdCue
      if (this.crosswindMode == 0) {
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

      this.birdPathCircle.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - 182.86}px, 0px)`;

      if (this.fdCueOffRange) {
        this.birdPathCircle.instance.setAttribute('stroke-dasharray', '3 6');
      } else {
        this.birdPathCircle.instance.setAttribute('stroke-dasharray', '');
      }

      // console.log(
      //   'FDPitchOrderLim ' +
      //     FDPitchOrderLim +
      //     'FDRollOrderLim ' +
      //     FDRollOrderLim +
      //     'xOffsetLim ' +
      //     xOffsetLim +
      //     'yOffset ' +
      //     yOffset,
      //   'xOffsetFpv ' + xOffsetFpv + 'yOffsetFpv ' + yOffsetFpv,
      // );
    }
    this.needsUpdate = false;
  }

  private handleFpdFlashing() {
    const fdRollBarFlashing = this.fmgcDiscreteWord2.bitValueOr(28, false);
    const fdPitchBarFlashing = this.fmgcDiscreteWord5.bitValueOr(24, false);

    this.shouldFlash.set(fdRollBarFlashing || fdPitchBarFlashing);
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
                class="SmallStroke Green"
                stroke-dasharray="3 6"
              />
            </g>
          </FlashOneHertz>
        </svg>
      </g>
    );
  }
}
