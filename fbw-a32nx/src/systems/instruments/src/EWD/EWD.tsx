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
          <LowerRightDisplay bus={this.props.bus} />
        </svg>
      </DisplayUnit>
    );
  }
}
