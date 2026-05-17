// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, MappedSubject, FSComponent } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

import { ComponentPositionProps } from './ComponentPositionProps';
import { ComponentSidePositionProps } from './ComponentSidePositionProps';
import { SvgGroup } from './SvgGroup';
import { FcdcChoiceEvents } from '../providers/FcdcChoiceProvider';

export class Spoilers extends DestroyableComponent<ComponentPositionProps & { bus: EventBus }> {
  render() {
    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <Spoiler bus={this.props.bus} x={0} y={26} side="left" number={5} />
        <Spoiler bus={this.props.bus} x={50} y={19} side="left" number={4} />
        <Spoiler bus={this.props.bus} x={99} y={12} side="left" number={3} />
        <Spoiler bus={this.props.bus} x={147} y={6} side="left" number={2} />
        <Spoiler bus={this.props.bus} x={197} y={0} side="left" number={1} />

        <Spoiler bus={this.props.bus} x={304} y={0} side="right" number={1} />
        <Spoiler bus={this.props.bus} x={354} y={6} side="right" number={2} />
        <Spoiler bus={this.props.bus} x={402} y={12} side="right" number={3} />
        <Spoiler bus={this.props.bus} x={452} y={19} side="right" number={4} />
        <Spoiler bus={this.props.bus} x={501} y={26} side="right" number={5} />
      </SvgGroup>
    );
  }
}

class Spoiler extends DestroyableComponent<
  ComponentPositionProps & ComponentSidePositionProps & { bus: EventBus } & { number: number }
> {
  private readonly sub = this.props.bus.getSubscriber<FcdcChoiceEvents>();

  private readonly fcdcDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_042'),
  );
  private readonly fcdcDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_043'),
  );

  private readonly servocontrolAvail = this.fcdcDiscreteWord3.map((word) =>
    word.bitValueOr(20 + this.props.number, false),
  );

  private readonly positionValid = this.fcdcDiscreteWord4.map((word) => word.bitValueOr(20 + this.props.number, false));

  private readonly spoilerOut = this.fcdcDiscreteWord4.map((word) =>
    word.bitValueOr(9 + this.props.number * 2 + (this.props.side === 'left' ? 0 : 1), false),
  );

  render() {
    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <path
          visibility={this.positionValid.map((valid) => (valid ? 'visible' : 'hidden'))}
          class={this.servocontrolAvail.map((avail) => (avail ? 'Green SW2' : 'Amber SW2'))}
          d={`M 0 0 l ${this.props.side === 'right' ? '-' : ''}19 0`}
        />
        <path
          visibility={MappedSubject.create(
            ([spoilerOut, positionValid]) => (spoilerOut && positionValid ? 'visible' : 'hidden'),
            this.spoilerOut,
            this.positionValid,
          )}
          class={this.servocontrolAvail.map((avail) => (avail ? 'Green SW2' : 'Amber SW2'))}
          d={`M 0 -31 l ${this.props.side === 'left' ? 19 : -19} 0 l ${this.props.side === 'left' ? -9.5 : 9.5} -16 z`}
        />
        <path
          visibility={MappedSubject.create(
            ([spoilerOut, positionValid, avail]) => (spoilerOut && positionValid && avail ? 'visible' : 'hidden'),
            this.spoilerOut,
            this.positionValid,
            this.servocontrolAvail,
          )}
          class="Green SW2"
          d={`M ${this.props.side === 'left' ? 9.5 : -9.5} 0 l 0 -31`}
        />
        <text
          x={this.props.side === 'left' ? 12 : -7}
          y={this.positionValid.map((valid) => (valid ? -4 : -12))}
          visibility={MappedSubject.create(
            ([avail, positionValid]) => (avail && positionValid ? 'hidden' : 'visible'),
            this.servocontrolAvail,
            this.positionValid,
          )}
          class={this.positionValid.map((valid) => `Amber ${valid ? 'F26' : 'F24'} Center`)}
        >
          {this.positionValid.map((valid) => (valid ? this.props.number : 'X'))}
        </text>
      </SvgGroup>
    );
  }
}
