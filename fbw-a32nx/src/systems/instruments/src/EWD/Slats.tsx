// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429Register, Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';
import { A32NXSfccBusEvents } from '../../../shared/src/publishers/A32NXSfccBusPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { Layer } from '../MsfsAvionicsCommon/Layer';

import './style.scss';

interface SlatsProps {
  bus: EventBus;
}
export class Slats extends DisplayComponent<SlatsProps> {
  private readonly sub = this.props.bus.getSubscriber<A32NXSfccBusEvents>();

  private static readonly arinc429Cache = Arinc429Register.empty();

  // TODO: it should be label 127 and 137 from SDAC and FWC instead of SFCC words.

  private readonly sfcc1SlatsFlapsStatus = ConsumerSubject.create(this.sub.on('a32nx_sfcc_1_slats_flaps_status'), 0);

  private readonly sfcc1SlatsPosition = ConsumerSubject.create(this.sub.on('a32nx_sfcc_1_slats_position'), 0);

  private readonly sfcc1FlapsPosition = ConsumerSubject.create(this.sub.on('a32nx_sfcc_1_flaps_position'), 0);

  private readonly sfcc2SlatsFlapsStatus = ConsumerSubject.create(this.sub.on('a32nx_sfcc_2_slats_flaps_status'), 0);

  private readonly sfcc2SlatsPosition = ConsumerSubject.create(this.sub.on('a32nx_sfcc_2_slats_position'), 0);

  private readonly sfcc2FlapsPosition = ConsumerSubject.create(this.sub.on('a32nx_sfcc_2_flaps_position'), 0);

  private readonly sfccSlatsFlapsStatus = Arinc429RegisterSubject.createEmpty();

  private readonly sfccFlapsPosition = Arinc429RegisterSubject.createEmpty();

  private readonly sfccSlatsPosition = Arinc429RegisterSubject.createEmpty();

  private readonly sfcc1SlatsFlapsStatusSub = this.sfcc1SlatsFlapsStatus.sub(
    (v) => this.sfccSlatsFlapsStatus.setWord(v),
    true,
    true,
  );

  private readonly sfcc2SlatsFlapsStatusSub = this.sfcc2SlatsFlapsStatus.sub(
    (v) => this.sfccSlatsFlapsStatus.setWord(v),
    true,
    true,
  );

  // When the position from SFCC is invalid (i.e. int is 0), the EWD keeps the last valid position.

  private readonly sfcc1FlapsPositionSub = this.sfcc1FlapsPosition.sub(
    (v) => {
      if (v !== 0) this.sfccFlapsPosition.setWord(v);
    },
    true,
    true,
  );

  private readonly sfcc2FlapsPositionSub = this.sfcc2FlapsPosition.sub(
    (v) => {
      if (v !== 0) this.sfccFlapsPosition.setWord(v);
    },
    true,
    true,
  );

  private readonly sfcc1SlatsPositionSub = this.sfcc1SlatsPosition.sub(
    (v) => {
      if (v !== 0) this.sfccSlatsPosition.setWord(v);
    },
    true,
    true,
  );

  private readonly sfcc2SlatsPositionSub = this.sfcc2SlatsPosition.sub(
    (v) => {
      if (v !== 0) this.sfccSlatsPosition.setWord(v);
    },
    true,
    true,
  );

  private readonly sfccToUse = this.sfcc1SlatsFlapsStatus.map((v) => (Slats.arinc429Cache.set(v).isInvalid() ? 2 : 1));

  private targetClass = Subject.create('');

  private targetText = Subject.create('');

  private targetVisible = Subject.create('hidden');

  private slatsTargetPath = Subject.create('');

  private flapsTargetPath = Subject.create('');

  private slatsPath = Subject.create('');

  private slatsEndX = Subject.create(0);

  private slatsEndY = Subject.create(0);

  private flapsPath = Subject.create('');

  private flapsEndX = Subject.create(0);

  private flapsEndY = Subject.create(0);

  private alphaLockEngaged = Subject.create(false);

  private configClean: boolean = false;

  private config1: boolean = false;

  private config2: boolean = false;

  private config3: boolean = false;

  private configFull: boolean = false;

  private flaps1AutoRetract: boolean = false;

  private slatsOut: boolean = false;

  private flapsOut: boolean = false;

  private sfccNotValid = Subject.create(true);

  private setSlatsPath(sfccSlatsPosition: Arinc429Register): void {
    const slats = sfccSlatsPosition.valueOr(0);

    this.slatsOut = slats > 6.1;

    const xFactor = -4.5766;
    const yFactor = 1.519;
    const synchroFactor = 0.081;

    let synchroOffset = 0;
    let positionFactor = 0;
    let positionOffset = 0;
    if (slats >= 0 && slats < 222.8) {
      synchroOffset = 0;
      positionFactor = 0.43;
      positionOffset = 0;
    } else if (slats >= 222.8 && slats < 272.8) {
      synchroOffset = 18;
      positionFactor = 1.8;
      positionOffset = 7.71;
    } else if (slats >= 272.8 && slats < 346) {
      synchroOffset = 22;
      positionFactor = 1.44;
      positionOffset = 14.92;
    }

    const value = (slats * synchroFactor - synchroOffset) * positionFactor + positionOffset;
    const x = xFactor * value - 18;
    const y = yFactor * value;
    this.slatsPath.set(`M ${x},${y} l -22,7 l -5,14 l 23,-8 Z`);
    this.slatsEndX.set(x);
    this.slatsEndY.set(y);

    if (this.configClean && slats > 6.1) {
      this.slatsTargetPath.set('M -26,23 l -7,2 l -1,4 l 7,-2 Z');
    } else if (this.config1 && (slats < 209.9 || slats > 234.6)) {
      this.slatsTargetPath.set('M -63,34 l -7,2 l -1,4 l 7,-2 Z');
    } else if ((this.config2 || this.config3) && (slats < 259.3 || slats > 284)) {
      this.slatsTargetPath.set('M -96,45 l -7,2 l -1,4 l 7,-2 Z');
    } else if (this.configFull && (slats < 327.2 || slats > 339.5)) {
      this.slatsTargetPath.set('M -129,56 l -7,2 l -1,4 l 7,-2 Z');
    } else {
      this.slatsTargetPath.set('');
    }
  }

  private setFlapsPath(sfccFlapsPosition: Arinc429Register): void {
    const flaps = sfccFlapsPosition.valueOr(0);

    this.flapsOut = flaps > 73.1;

    const xFactor = 4.71;
    const yFactor = 0.97;
    const synchroFactor = 0.22;
    const synchroConstant = 15.88;

    let synchroOffset = 0;
    let positionFactor = 0;
    let positionOffset = 0;
    if (flaps >= 0 && flaps < 120.5) {
      synchroOffset = 0;
      positionFactor = 0.97;
      positionOffset = 0;
    } else if (flaps >= 120.5 && flaps < 145.5) {
      synchroOffset = 10.63;
      positionFactor = 1.4;
      positionOffset = 10.34;
    } else if (flaps >= 145.5 && flaps < 168.3) {
      synchroOffset = 16.3;
      positionFactor = 1.62;
      positionOffset = 18.27;
    } else if (flaps >= 168.3 && flaps < 355) {
      synchroOffset = 21.19;
      positionFactor = 0.43;
      positionOffset = 26.21;
    }

    const value = Math.max(
      (flaps * synchroFactor - synchroConstant - synchroOffset) * positionFactor + positionOffset,
      0,
    );
    const x = xFactor * value;
    const y = yFactor * value + 1;
    this.flapsPath.set(`M${x},${y} l 24.5,6 l 0,13.5 l -18,-4 Z`);
    this.flapsEndX.set(x);
    this.flapsEndY.set(y);

    if ((this.configClean || this.flaps1AutoRetract) && flaps > 73.1) {
      this.flapsTargetPath.set('M 12,23 l 3,5 l 5,1 l 0,-4 Z');
    } else if (this.config1 && !this.flaps1AutoRetract && (flaps < 113.1 || flaps > 122.2)) {
      this.flapsTargetPath.set('M 58,32 l 3,5 l 5,1 l 0,-4 Z');
    } else if (this.config2 && (flaps < 140.4 || flaps > 149.5)) {
      this.flapsTargetPath.set('M 95,40 l 3,5 l 5,1 l 0,-4 Z');
    } else if (this.config3 && (flaps < 163.1 || flaps > 172.2)) {
      this.flapsTargetPath.set('M 133,48 l 3,5 l 5,1 l 0,-4 Z');
    } else if (this.configFull && (flaps < 246.8 || flaps > 257.2)) {
      this.flapsTargetPath.set('M 170,56 l 3,5 l 5,1 l 0,-4 Z');
    } else {
      this.flapsTargetPath.set('');
    }
  }

  private setSfccStatus(sfccSlatsFlapsStatus: Arinc429Register): void {
    const sfccNotValid = sfccSlatsFlapsStatus.isFailureWarning();
    this.sfccNotValid.set(sfccNotValid);

    this.configClean = sfccSlatsFlapsStatus.bitValue(17);
    this.config1 = sfccSlatsFlapsStatus.bitValue(18);
    this.config2 = sfccSlatsFlapsStatus.bitValue(19);
    this.config3 = sfccSlatsFlapsStatus.bitValue(20);
    this.configFull = sfccSlatsFlapsStatus.bitValue(21);
    this.flaps1AutoRetract = sfccSlatsFlapsStatus.bitValue(26);

    const alphaLockEngaged = sfccSlatsFlapsStatus.bitValue(24);
    this.alphaLockEngaged.set(alphaLockEngaged);

    if (this.configClean) {
      this.targetText.set('0');
    } else if (this.config1 && this.flaps1AutoRetract) {
      this.targetText.set('1');
    } else if (this.config1) {
      this.targetText.set('1+F');
    } else if (this.config2) {
      this.targetText.set('2');
    } else if (this.config3) {
      this.targetText.set('3');
    } else if (this.configFull) {
      this.targetText.set('FULL');
    } else {
      this.targetText.set('');
    }

    if (sfccNotValid) {
      this.setFlapsPath(this.sfccFlapsPosition.get());
      this.setSlatsPath(this.sfccSlatsPosition.get());
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents & EwdSimvars>();

    this.sfccToUse.sub((v) => {
      if (v === 2) {
        this.sfcc1SlatsFlapsStatusSub.pause();
        this.sfcc1FlapsPositionSub.pause();
        this.sfcc1SlatsPositionSub.pause();

        this.sfcc2SlatsFlapsStatusSub.resume(true);
        this.sfcc2FlapsPositionSub.resume(true);
        this.sfcc2SlatsPositionSub.resume(true);
      } else {
        this.sfcc2SlatsFlapsStatusSub.pause();
        this.sfcc2FlapsPositionSub.pause();
        this.sfcc2SlatsPositionSub.pause();

        this.sfcc1SlatsFlapsStatusSub.resume(true);
        this.sfcc1FlapsPositionSub.resume(true);
        this.sfcc1SlatsPositionSub.resume(true);
      }
    }, true);

    this.sfccSlatsFlapsStatus.sub(this.setSfccStatus.bind(this), true);
    this.sfccFlapsPosition.sub(this.setFlapsPath.bind(this), true);
    this.sfccSlatsPosition.sub(this.setSlatsPath.bind(this), true);

    this.alphaLockEngaged.sub((_) => {
      this.setFlapsPath(this.sfccFlapsPosition.get());
      this.setSlatsPath(this.sfccSlatsPosition.get());
    });

    // FIXME should not need realtime and alloc strings every frame for this
    sub.on('realTime').handle((_t) => {
      const inMotion = this.slatsTargetPath.get() !== '' || this.flapsTargetPath.get() !== '';
      this.targetVisible.set(this.slatsOut || this.flapsOut || !this.configClean ? 'visible' : 'hidden');
      this.targetClass.set(inMotion ? 'Huge Center Cyan' : 'Huge Center Green');
    });
  }

  render(): VNode {
    return (
      <Layer x={539} y={442}>
        <path d="M0, 0l -18,0 l -4,14 l 28,1 Z" class="DarkGreyBox" />
        <g visibility={this.targetVisible}>
          <text class={this.targetClass} x={-3} y={59}>
            {this.targetText}
          </text>
          <text class={{ Amber: this.sfccNotValid, Standard: true, Center: true }} x={-101} y={15}>
            S
          </text>
          <text class={{ Amber: this.sfccNotValid, Standard: true, Center: true }} x={105} y={15}>
            F
          </text>

          <path d="M -63,19 l -7,2 l -1,4 l 7,-2 Z" class="SlatsSmallWhite" />
          <path d="M -96,30 l -7,2 l -1,4 l 7,-2 Z" class="SlatsSmallWhite" />
          <path d="M -129,41 l -7,2 l -1,4 l 7,-2 Z" class="SlatsSmallWhite" />
          <path d={this.slatsTargetPath} class="SlatsSmallCyan" />

          <path d="M 58,17 l 3,5 l 5,1 l 0,-4 Z" class="FlapsSmallWhite" />
          <path d="M 95,25 l 3,5 l 5,1 l 0,-4 Z" class="FlapsSmallWhite" />
          <path d="M 133,33 l 3,5 l 5,1 l 0,-4 Z" class="FlapsSmallWhite" />
          <path d="M 170,41 l 3,5 l 5,1 l 0,-4 Z" class="FlapsSmallWhite" />
          <path d={this.flapsTargetPath} class="FlapsSmallCyan" />
        </g>
        <text
          class="Medium Center GreenPulseNoFill"
          x={-95}
          y={-10}
          visibility={this.alphaLockEngaged.map((v) => (v ? 'visible' : 'hidden'))}
        >
          A LOCK
        </text>

        <path
          class={{
            AmberStroke: this.sfccNotValid,
            GreenPulseNoFill: this.alphaLockEngaged,
            Path: true,
          }}
          d={this.slatsPath}
        />
        <line
          class={{
            AmberStroke: this.sfccNotValid,
            GreenPulse: this.alphaLockEngaged,
            Line: true,
          }}
          x1={-18}
          y1={0}
          x2={this.slatsEndX}
          y2={this.slatsEndY}
        />

        <path class={{ AmberStroke: this.sfccNotValid, Path: true }} d={this.flapsPath} />
        <line
          class={{ AmberStroke: this.sfccNotValid, Line: true }}
          x1={0}
          y1={0}
          x2={this.flapsEndX}
          y2={this.flapsEndY}
        />
      </Layer>
    );
  }
}
