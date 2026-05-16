// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';
import { Arinc429LocalVarConsumerSubject, FwcBusEvents } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from '../shared/EwdSimvarPublisher';

interface FwcFlightPhaseIndicatorProps {
  bus: EventBus;
}

export class FwcFlightPhaseIndicator extends DisplayComponent<FwcFlightPhaseIndicatorProps> {
  private readonly fwcDiscreteWord125 = Arinc429LocalVarConsumerSubject.create(
    this.props.bus.getSubscriber<FwcBusEvents>().on('a32nx_fwc_discrete_word_125_1'),
  );

  private readonly avionicsTestMode = MappedSubject.create(
    ([fwcDiscreteWord125]) => fwcDiscreteWord125.bitValueOr(11, false),
    this.fwcDiscreteWord125,
  );

  private readonly fwcFlightPhase = ConsumerSubject.create(
    this.props.bus.getSubscriber<EwdSimvars>().on('fwc_flight_phase'),
    0,
  );

  render(): VNode {
    return (
      <text
        class="White F22 Center"
        x={384}
        y={371}
        visibility={this.avionicsTestMode.map((avionicsTestMode) => (avionicsTestMode ? 'inherit' : 'hidden'))}
      >
        {this.fwcFlightPhase}
      </text>
    );
  }
}
