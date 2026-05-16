// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { A32NXFwcBusEvents } from '@shared/publishers/A32NXFwcBusPublisher';
import { EwdSimvars } from './shared/EwdSimvarPublisher';

interface FwcFlightPhaseIndicatorProps {
  bus: EventBus;
}

export class FwcFlightPhaseIndicator extends DisplayComponent<FwcFlightPhaseIndicatorProps> {
  private readonly fwcDiscreteWord125 = Arinc429LocalVarConsumerSubject.create(
    this.props.bus.getSubscriber<A32NXFwcBusEvents>().on('a32nx_fwc_discrete_word_125_1'),
  );

  private readonly airbusTestMode = MappedSubject.create(
    ([fwcDiscreteWord125]) => fwcDiscreteWord125.bitValueOr(11, false),
    this.fwcDiscreteWord125,
  );

  private readonly fwcFlightPhase = ConsumerSubject.create(
    this.props.bus.getSubscriber<EwdSimvars>().on('fwcFlightPhase'),
    0,
  );

  render(): VNode {
    return (
      <text
        class="Standard Center White"
        x={330}
        y={514}
        visibility={this.airbusTestMode.map((airbusTestMode) => (airbusTestMode ? 'inherit' : 'hidden'))}
      >
        {this.fwcFlightPhase}
      </text>
    );
  }
}
