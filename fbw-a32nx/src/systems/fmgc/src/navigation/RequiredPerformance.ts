// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, FlightPlanService } from '@fmgc/index';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FlightArea } from './FlightArea';
import { ConsumerValue } from '@microsoft/msfs-sdk';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';

const rnpDefaults: Record<FlightArea, number> = {
  [FlightArea.Takeoff]: 1,
  [FlightArea.Terminal]: 1,
  [FlightArea.Enroute]: 2,
  [FlightArea.Oceanic]: 2,
  [FlightArea.VorApproach]: 0.5,
  [FlightArea.GpsApproach]: 0.3,
  [FlightArea.PrecisionApproach]: 0.5,
  [FlightArea.NonPrecisionApproach]: 0.5,
};

// FIXME RNP-related scratchpad messages

export class RequiredPerformance {
  activeRnp: number | undefined;

  requestLDev = false;

  manualRnp = false;

  private readonly flightPhase = ConsumerValue.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  constructor(
    private readonly bus: EventBus,
    private flightPlanService: FlightPlanService,
  ) {}

  update(_deltaTime: number): void {
    this.updateAutoRnp();

    this.updateLDev();
  }

  setPilotRnp(rnp): void {
    this.manualRnp = true;
    this.setActiveRnp(rnp);
  }

  clearPilotRnp(): void {
    this.manualRnp = false;
    this.updateAutoRnp();
  }

  private updateAutoRnp(): void {
    if (this.manualRnp) {
      return;
    }

    const plan = this.flightPlanService.active;

    if (plan && plan.activeLeg && plan.activeLeg.isDiscontinuity === false) {
      const legRnp = plan.activeLeg.rnp;

      if (legRnp !== undefined) {
        if (legRnp !== this.activeRnp) {
          this.setActiveRnp(legRnp);
        }
        return;
      }
    }

    const area = this.flightPlanService.active.calculateActiveArea();
    const rnp = rnpDefaults[area];

    if (rnp !== this.activeRnp) {
      this.setActiveRnp(rnp);
    }
  }

  private setActiveRnp(rnp: number): void {
    this.activeRnp = rnp;
    SimVar.SetSimVarValue('L:A32NX_FMGC_L_RNP', 'number', rnp ?? 0);
    SimVar.SetSimVarValue('L:A32NX_FMGC_R_RNP', 'number', rnp ?? 0);
  }

  private updateLDev(): void {
    const area = this.flightPlanService.active.calculateActiveArea();
    const ldev =
      area !== FlightArea.Enroute &&
      area !== FlightArea.Oceanic &&
      this.activeRnp < 0.305 &&
      this.flightPhase.get() >= FmgcFlightPhase.Takeoff;
    if (ldev !== this.requestLDev) {
      this.requestLDev = ldev;
      SimVar.SetSimVarValue('L:A32NX_FMGC_L_LDEV_REQUEST', 'bool', this.requestLDev);
      SimVar.SetSimVarValue('L:A32NX_FMGC_R_LDEV_REQUEST', 'bool', this.requestLDev);
    }
  }
}
