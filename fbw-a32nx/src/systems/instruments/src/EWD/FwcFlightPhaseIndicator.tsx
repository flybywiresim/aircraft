// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, EventBus, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';
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

  private readonly developmentMode = MappedSubject.create(
    ([fwcDiscreteWord125]) => fwcDiscreteWord125.bitValueOr(11, false),
    this.fwcDiscreteWord125,
  );

  private readonly fwcFlightPhase = Subject.create(0);

  private readonly visibility = Subject.create('hidden');

  private readonly displayedPhase = Subject.create('');

  private updateDisplay(): void {
    const developmentModeEnabled = this.developmentMode.get();

    this.visibility.set(developmentModeEnabled ? 'inherit' : 'hidden');
    this.displayedPhase.set(developmentModeEnabled ? this.fwcFlightPhase.get().toString() : '');
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<EwdSimvars>();

    this.developmentMode.sub(() => this.updateDisplay());

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((flightPhase) => {
        this.fwcFlightPhase.set(flightPhase);
        this.updateDisplay();
      });
  }

  render(): VNode {
    return (
      <text class="Standard Center White" x={330} y={514} visibility={this.visibility}>
        {this.displayedPhase}
      </text>
    );
  }
}
