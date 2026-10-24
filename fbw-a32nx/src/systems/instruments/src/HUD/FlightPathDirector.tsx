// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
  Subscription,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429RegisterSubject, Arinc429ConsumerSubject } from '@flybywiresim/fbw-sdk';
import { FcuBus } from '../PFD/shared/FcuBusProvider';
import { FgBus } from '../PFD/shared/FgBusProvider';

import { calculateHorizonOffsetFromPitch, HudElems, FIVE_DEG, OutlinedPath } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';

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

  private birdPathCircleBg = FSComponent.createRef<SVGPathElement>();

  private readonly shouldFlash = Subject.create(false);

  private readonly flightPathDirector = ConsumerSubject.create(this.sub.on('flightPathDirector').whenChanged(), '');
  private readonly flightPase = ConsumerSubject.create(this.sub.on('fmgcFlightPhase').whenChanged(), 0);
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode'), false);

  private readonly roll = Arinc429ConsumerSubject.create(this.sub.on('rollAr'));
  private readonly pitch = Arinc429ConsumerSubject.create(this.sub.on('pitchAr'));
  private readonly fpa = Arinc429ConsumerSubject.create(this.sub.on('fpa'));
  private readonly da = Arinc429ConsumerSubject.create(this.sub.on('da'));
  private readonly fdRollCommand = Arinc429ConsumerSubject.create(this.sub.on('rollFdCommand'));
  private readonly fdPitchCommand = Arinc429ConsumerSubject.create(this.sub.on('pitchFdCommand'));
  private readonly fwcFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);

  private readonly fdVisible = MappedSubject.create(
    ([fdRollCommand, fdPitchCommand, fwcFlightPhase]) => {
      if (fwcFlightPhase < 4 || fwcFlightPhase >= 10) {
        return 'none';
      } else {
        if (
          !(fdRollCommand.isNoComputedData() || fdRollCommand.isFailureWarning()) &&
          !(fdPitchCommand.isNoComputedData() || fdPitchCommand.isFailureWarning())
        ) {
          return 'block';
        } else {
          return 'none';
        }
      }
    },
    this.fdRollCommand,
    this.fdPitchCommand,
    this.fwcFlightPhase,
  );
  private readonly fdTransform = MappedSubject.create(
    ([roll, pitch, fpa, da, fdRollCommand, fdPitchCommand, crosswindMode]) => {
      let xOffsetLim;

      const daLimConv = (da.value * DistanceSpacing) / ValueSpacing;
      const pitchSubFpaConv = calculateHorizonOffsetFromPitch(pitch.value) - calculateHorizonOffsetFromPitch(fpa.value);
      const rollCos = Math.cos((roll.value * Math.PI) / 180);
      const rollSin = Math.sin((-roll.value * Math.PI) / 180);

      //FD Smoothing when close to FPV
      //roll
      const FDRollOrder = fdRollCommand.value;
      const FDRollOrderLim =
        this.flightPase.get() === 5
          ? Math.max(Math.min(FDRollOrder, 2.5), -2.5)
          : Math.max(Math.min(FDRollOrder, 45), -45);
      // //pitch
      const FDPitchOrder = fdPitchCommand.value; //in degrees on pitch scale
      const FDPitchOrderLim =
        this.flightPase.get() === 5
          ? Math.max(Math.min(FDPitchOrder, 2.5), -2.5)
          : Math.max(Math.min(FDPitchOrder, 7.5), -10);

      const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
      const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

      const xOffset = xOffsetFpv + FDRollOrderLim * 13;
      const yOffset = yOffsetFpv + FDPitchOrderLim * 37 + rollSin * (xOffset - xOffsetFpv);
      //set lateral limit for fdCue
      if (crosswindMode == false) {
        xOffsetLim = Math.max(Math.min(xOffset, 360), -428);
      } else {
        xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
      }

      return `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;
    },
    this.roll,
    this.pitch,
    this.fpa,
    this.da,
    this.fdRollCommand,
    this.fdPitchCommand,
    this.crosswindMode,
  );

  private readonly fdCueOffRange = MappedSubject.create(
    ([roll, pitch, fpa, da, fdRollCommand, crosswindMode]) => {
      let fdCueOffRange;
      const daLimConv = (da.value * DistanceSpacing) / ValueSpacing;
      const pitchSubFpaConv = calculateHorizonOffsetFromPitch(pitch.value) - calculateHorizonOffsetFromPitch(fpa.value);

      const FDRollOrder = fdRollCommand.value;
      const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 45), -45);
      const rollCos = Math.cos((roll.value * Math.PI) / 180);
      const rollSin = Math.sin((-roll.value * Math.PI) / 180);
      const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;

      const xOffset = xOffsetFpv + FDRollOrderLim * 13;
      //set lateral limit for fdCue
      if (crosswindMode == false) {
        if (xOffset < -378 || xOffset > 350) {
          fdCueOffRange = true;
        } else {
          fdCueOffRange = false;
        }
      } else {
        if (xOffset < -540 || xOffset > 540) {
          fdCueOffRange = true;
        } else {
          fdCueOffRange = false;
        }
      }
      return fdCueOffRange ? '3 6' : '';
    },
    this.roll,
    this.pitch,
    this.fpa,
    this.da,
    this.fdRollCommand,
    this.crosswindMode,
  );

  render(): VNode {
    return (
      <g ref={this.birdPath}>
        <svg>
          <g id="FlightPathDirector" display={this.fdVisible}>
            <g style={{ transform: this.fdTransform }}>
              {OutlinedPath(
                'M 640 512 m 7 0 a 7 7 0 1 0 -14 0 a 7 7 0 1 0 14 0 Z M 640 512 m 7 0 a 7 7 0 1 0 -14 0 a 7 7 0 1 0 14 0 Z',
                'NormalStroke InverseGreen',
                'NormalStroke Green',
                this.birdPathCircleBg,
                this.birdPathCircle,
                this.fdCueOffRange.get(),
              )}
            </g>
          </g>
        </svg>
      </g>
    );
  }
}
