// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { UpperDisplay } from './UpperDisplay';
import { LowerLeftDisplay } from './LowerLeftDisplay';
import { LowerRightDisplay } from './LowerRightDisplay';

import './style.scss';

interface EwdProps extends ComponentProps {
  bus: EventBus;
  instrument: BaseInstrument;
}
export class EwdComponent extends DisplayComponent<EwdProps> {
  private acEssBus = Subject.create(false);

  private ewdPotentiometer = Subject.create(0);

  private lowerLeftOverflow = Subject.create(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<EwdSimvars>();

    sub
      .on('acEssBus')
      .whenChanged()
      .handle((bus) => {
        this.acEssBus.set(bus);
      });

    sub
      .on('ewdPotentiometer')
      .whenChanged()
      .handle((pot) => {
        this.ewdPotentiometer.set(pot);
      });

    sub
      .on('ewdLowerLeftOverflow')
      .whenChanged()
      .handle((overflow) => {
        this.lowerLeftOverflow.set(overflow);
      });
  }

  render(): VNode {
    return (
      <DisplayUnit bus={this.props.bus} normDmc={1} brightness={this.ewdPotentiometer} powered={this.acEssBus}>
        <svg class="ewd-svg" version="1.1" viewBox="0 0 768 768" xmlns="http://www.w3.org/2000/svg">
          <UpperDisplay bus={this.props.bus} />
          <line class="Separator" x1="4" y1="520" x2="444" y2="520" />
          <line class="Separator" x1="522" y1="520" x2="764" y2="520" />
          <LowerLeftDisplay bus={this.props.bus} />
          <line class="Separator" x1="484" y1="540" x2="484" y2="730" />
          <path
            class="GreenFill"
            d="m 482 735 h 4 v 18 h 4 l -6,11 l -6,-11 h 4 v -18"
            visibility={this.lowerLeftOverflow.map((overflow) => (overflow ? 'visible' : 'hidden'))}
          />
          <LowerRightDisplay bus={this.props.bus} />
        </svg>
      </DisplayUnit>
    );
  }
}
