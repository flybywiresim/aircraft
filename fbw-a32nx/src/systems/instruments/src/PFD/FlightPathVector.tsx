// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';

import { calculateHorizonOffsetFromPitch } from './PFDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';

const DistanceSpacing = 15;
const ValueSpacing = 10;

interface FlightPathVectorData {
  roll: Arinc429WordData;
  pitch: Arinc429WordData;
  fpa: Arinc429WordData;
  da: Arinc429WordData;
}

export class FlightPathVector extends DisplayComponent<{ bus: ArincEventBus }> {
  private bird = FSComponent.createRef<SVGGElement>();

  private readonly fpvFlagVisible = Subject.create(false);

  private fcuDiscreteWord1 = new Arinc429Word(0);

  private data: FlightPathVectorData = {
    roll: new Arinc429Word(0),
    pitch: new Arinc429Word(0),
    fpa: new Arinc429Word(0),
    da: new Arinc429Word(0),
  };

  private needsUpdate = false;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & ClockEvents & FcuBus>();

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
        if (trkFpaActive && daAndFpaValid) {
          this.fpvFlagVisible.set(false);
          this.bird.instance.classList.remove('HiddenElement');
          this.moveBird();
        } else if (!trkFpaActive) {
          this.fpvFlagVisible.set(false);
          this.bird.instance.classList.add('HiddenElement');
        } else if (trkFpaActive && this.data.pitch.isNormalOperation() && this.data.roll.isNormalOperation()) {
          this.fpvFlagVisible.set(true);
          this.bird.instance.classList.add('HiddenElement');
        }
      }
    });
  }

  private moveBird() {
    const daLimConv = (Math.max(Math.min(this.data.da.value, 21), -21) * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.value) - calculateHorizonOffsetFromPitch(this.data.fpa.value);
    const rollCos = Math.cos((this.data.roll.value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    this.bird.instance.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0px)`;
  }

  render(): VNode {
    return (
      <>
        <g ref={this.bird} id="bird">
          <svg
            x="53.4"
            y="65.3"
            width="31px"
            height="31px"
            version="1.1"
            viewBox="0 0 31 31"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                class="NormalOutline"
                // eslint-disable-next-line max-len
                d="m17.766 15.501c8.59e-4 -1.2531-1.0142-2.2694-2.2665-2.2694-1.2524 0-2.2674 1.0163-2.2665 2.2694-8.57e-4 1.2531 1.0142 2.2694 2.2665 2.2694 1.2524 0 2.2674-1.0163 2.2665-2.2694z"
              />
              <path class="ThickOutline" d="m17.766 15.501h5.0367m-9.5698 0h-5.0367m7.3033-2.2678v-2.5199" />
              <path
                class="NormalStroke Green"
                // eslint-disable-next-line max-len
                d="m17.766 15.501c8.59e-4 -1.2531-1.0142-2.2694-2.2665-2.2694-1.2524 0-2.2674 1.0163-2.2665 2.2694-8.57e-4 1.2531 1.0142 2.2694 2.2665 2.2694 1.2524 0 2.2674-1.0163 2.2665-2.2694z"
              />
              <path class="ThickStroke Green" d="m17.766 15.501h5.0367m-9.5698 0h-5.0367m7.3033-2.2678v-2.5199" />
            </g>
          </svg>
        </g>
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.fpvFlagVisible}>
          <text style="visibility:hidden" id="FPVFlag" x="62.987099" y="89.42025" class="FontLargest Red EndAlign">
            FPV
          </text>
        </FlashOneHertz>
      </>
    );
  }
}
