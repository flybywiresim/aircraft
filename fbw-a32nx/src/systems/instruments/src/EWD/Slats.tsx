// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { Arinc429Values } from './shared/ArincValueProvider';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { Layer } from '../MsfsAvionicsCommon/Layer';

import './style.scss';

interface SlatsProps {
  bus: EventBus;
}
export class Slats extends DisplayComponent<SlatsProps> {
  private targetClass = Subject.create('');

  private targetText = Subject.create('');

  private targetVisible = Subject.create('hidden');

  private slatsClass = Subject.create('');

  private slatsLineClass = Subject.create('');

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

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents & EwdSimvars>();

    sub
      .on('slatsFlapsStatus')
      .whenChanged()
      .handle((s) => {
        this.configClean = s.bitValue(17);
        this.config1 = s.bitValue(18);
        this.config2 = s.bitValue(19);
        this.config3 = s.bitValue(20);
        this.configFull = s.bitValue(21);
        this.flaps1AutoRetract = s.bitValue(26);

        const alphaLockEngaged = s.bitValue(24);
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

        if (alphaLockEngaged) {
          this.slatsClass.set('Slats GreenPulseNoFill');
          this.slatsLineClass.set('GreenLine GreenPulse');
        } else {
          this.slatsClass.set('Slats');
          this.slatsLineClass.set('GreenPulse');
        }
      });

    sub
      .on('slatsPosition')
      .whenChanged()
      .handle((s) => {
        const slats = s.valueOr(0);

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
      });

    sub
      .on('flapsPosition')
      .whenChanged()
      .handle((s) => {
        const flaps = s.valueOr(0);

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
      });

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
          <text class="Standard Center" x={-101} y={15}>
            S
          </text>
          <text class="Standard Center" x={105} y={15}>
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
          className="Medium Center GreenPulseNoFill"
          x={-95}
          y={-10}
          visibility={this.alphaLockEngaged.map((v) => (v ? 'visible' : 'hidden'))}
        >
          A LOCK
        </text>

        <path class="Slats" d={this.slatsPath} />
        <line class="GreenLine" x1={-18} y1={0} x2={this.slatsEndX} y2={this.slatsEndY} />

        <path class="Flaps" d={this.flapsPath} />
        <line class="GreenLine" x1={0} y1={0} x2={this.flapsEndX} y2={this.flapsEndY} />
      </Layer>
    );
  }
}
