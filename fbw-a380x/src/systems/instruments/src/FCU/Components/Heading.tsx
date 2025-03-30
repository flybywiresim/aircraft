//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { FcuEvents } from 'instruments/src/FCU/Publishers/FcuPublisher';
import { OverheadEvents } from 'instruments/src/MsfsAvionicsCommon/providers/OverheadPublisher';

export interface HeadingProps {
  readonly bus: EventBus;
}

export class Heading extends DisplayComponent<HeadingProps> {
  private readonly sub = this.props.bus.getSubscriber<FcuEvents & OverheadEvents>();

  private readonly isLightTestActive = ConsumerSubject.create(this.sub.on('ovhd_ann_lt_test_active'), false);
  private readonly trueRefActive = ConsumerSubject.create(this.sub.on('fcu_push_true_ref'), false);

  private readonly trueIndicatorActive = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.isLightTestActive,
    this.trueRefActive,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode | null {
    return (
      <div id="Heading">
        <svg width="100%" height="100%">
          <text
            id="TRUE"
            class={{
              Common: true,
              Active: this.trueIndicatorActive,
              Inactive: this.trueIndicatorActive.map(SubscribableMapFunctions.not()),
            }}
            x="23%"
            y="20%"
          >
            TRUE
          </text>
          <text id="HDG" class="Common Active" x="48%" y="20%">
            HDG
          </text>
          <text id="TRK" class="Common Inactive" x="68%" y="20%">
            TRK
          </text>
          <text id="Value" class="Common Value" x="47%" y="97%">
            ---
          </text>
          <text id="DEGREES" class="Common Value" x="89%" y="97%">
            &#176;
          </text>
        </svg>
      </div>
    );
  }
}
