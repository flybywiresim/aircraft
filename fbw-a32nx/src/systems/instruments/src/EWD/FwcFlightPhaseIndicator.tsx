// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './shared/EwdSimvarPublisher';

interface FwcFlightPhaseIndicatorProps {
  bus: EventBus;
}

export class FwcFlightPhaseIndicator extends DisplayComponent<FwcFlightPhaseIndicatorProps> {
  private readonly developmentMode = Subject.create(false);

  private readonly fwcFlightPhase = Subject.create(0);

  private readonly visibility = Subject.create('hidden');

  private readonly displayedPhase = Subject.create('');

  private cancelDevelopmentModeSub?: () => void;

  private updateDisplay(): void {
    const developmentModeEnabled = this.developmentMode.get();

    this.visibility.set(developmentModeEnabled ? 'inherit' : 'hidden');
    this.displayedPhase.set(developmentModeEnabled ? this.fwcFlightPhase.get().toString() : '');
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<EwdSimvars>();

    this.cancelDevelopmentModeSub = NXDataStore.getAndSubscribeLegacy(
      'CONFIG_A32NX_DEVELOPMENT_MODE',
      (_, developmentMode) => {
        this.developmentMode.set(developmentMode === '1');
        this.updateDisplay();
      },
      '0',
    );

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((flightPhase) => {
        this.fwcFlightPhase.set(flightPhase);
        this.updateDisplay();
      });
  }

  destroy(): void {
    this.cancelDevelopmentModeSub?.();
  }

  render(): VNode {
    return (
      <text class="Standard Center White" x={330} y={514} visibility={this.visibility}>
        {this.displayedPhase}
      </text>
    );
  }
}
