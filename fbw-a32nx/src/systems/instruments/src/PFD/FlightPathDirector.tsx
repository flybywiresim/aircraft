// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FgBus } from 'instruments/src/PFD/shared/FgBusProvider';

import { calculateHorizonOffsetFromPitch } from './PFDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';

const DistanceSpacing = 15;
const ValueSpacing = 10;

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

  private isVisible = false;

  private birdPath = FSComponent.createRef<SVGGElement>();

  private birdPathWings = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & ClockEvents & FcuBus & FgBus>();

    sub
      .on('fdEngaged')
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
      if (this.needsUpdate && this.isVisible) {
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
    const trkFpaActive = this.fcuDiscreteWord1.bitValueOr(25, false);

    if (
      rollFdInvalid ||
      pitchFdInvalid ||
      !daAndFpaValid ||
      !this.data.fdEngaged ||
      !trkFpaActive ||
      this.data.fdOff ||
      this.props.isAttExcessive.get()
    ) {
      this.birdPath.instance.style.visibility = 'hidden';
      this.isVisible = false;
    } else {
      this.birdPath.instance.style.visibility = 'visible';
      this.isVisible = true;
    }
  }

  private moveBird() {
    if (this.isVisible) {
      const FDRollOrder = this.data.rollFdCommand.value;
      const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 45), -45);
      const FDPitchOrder = this.data.pitchFdCommand.value;
      const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder, 22.5), -22.5) * 1.9;

      const daLimConv = (Math.max(Math.min(this.data.da.value, 21), -21) * DistanceSpacing) / ValueSpacing;
      const pitchSubFpaConv =
        calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value);
      const rollCos = Math.cos((this.data.roll.value * Math.PI) / 180);
      const rollSin = Math.sin((-this.data.roll.value * Math.PI) / 180);

      const FDRollOffset = FDRollOrderLim * 0.77;
      const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
      const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

      const xOffset = xOffsetFpv - FDPitchOrderLim * rollSin;
      const yOffset = yOffsetFpv + FDPitchOrderLim * rollCos;

      this.birdPath.instance.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0px)`;
      this.birdPathWings.instance.setAttribute('transform', `rotate(${FDRollOffset} 15.5 15.5)`);
    }
    this.needsUpdate = false;
  }

  private handleFpdFlashing() {
    const fdRollBarFlashing = this.fmgcDiscreteWord2.bitValueOr(28, false);
    const fdPitchBarFlashing = this.fmgcDiscreteWord5.bitValueOr(24, false);

    if (fdRollBarFlashing || fdPitchBarFlashing) {
      this.birdPathWings.instance.classList.add('BlinkInfinite');
    } else {
      this.birdPathWings.instance.classList.remove('BlinkInfinite');
    }
  }

  render(): VNode {
    return (
      <g ref={this.birdPath}>
        <svg
          x="53.4"
          y="65.3"
          width="31px"
          height="31px"
          version="1.1"
          viewBox="0 0 31 31"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g ref={this.birdPathWings} class="CornerRound">
            <path
              class="NormalOutline"
              // eslint-disable-next-line max-len
              d="m16.507 15.501a1.0074 1.008 0 1 0-2.0147 0 1.0074 1.008 0 1 0 2.0147 0zm7.5551 0 6.5478-1.5119v3.0238l-6.5478-1.5119m-17.125 0-6.5478-1.5119v3.0238l6.5478-1.5119h17.125"
            />
            <path
              class="NormalStroke Green"
              // eslint-disable-next-line max-len
              d="m16.507 15.501a1.0074 1.008 0 1 0-2.0147 0 1.0074 1.008 0 1 0 2.0147 0zm7.5551 0 6.5478-1.5119v3.0238l-6.5478-1.5119m-17.125 0-6.5478-1.5119v3.0238l6.5478-1.5119h17.125"
            />
          </g>
        </svg>
      </g>
    );
  }
}
