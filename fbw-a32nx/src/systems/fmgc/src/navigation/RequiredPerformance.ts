// Copyright (c) 2022-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FmgcFlightPhase } from '@shared/flightphase';
import { FlightArea } from './FlightArea';
import { ConsumerValue, EventBus, Subject } from '@microsoft/msfs-sdk';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';
import { FlightPlanService } from '../flightplanning/FlightPlanService';
import { FmsNavigationEvents } from '../events/NavigationEvents';
import { isLeg } from '../flightplanning/legs/FlightPlanLeg';

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

export class RequiredPerformance {
  activeRnp: number | undefined;

  requestLDev = false;

  manualRnp = false;

  private readonly flightPhase = ConsumerValue.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly rnpEventsPublisher = this.bus.getPublisher<FmsNavigationEvents>();

  private readonly pilotRnpGreaterThanAreaRnp = Subject.create<number | undefined>(undefined);

  private readonly pilotRnpGreaterThanProcedureRnp = Subject.create<number | undefined>(undefined);

  constructor(
    private readonly bus: EventBus,
    private flightPlanService: FlightPlanService,
  ) {
    this.pilotRnpGreaterThanAreaRnp.sub((areaRnp) => {
      this.rnpEventsPublisher.pub('fms_pilot_rnp_greater_than_area_rnp', areaRnp, false, false);
    });

    this.pilotRnpGreaterThanProcedureRnp.sub((procedureRnp) => {
      this.rnpEventsPublisher.pub('fms_pilot_rnp_greater_than_procedure_rnp', procedureRnp, false, false);
    });
  }

  update(_deltaTime: number): void {
    this.updateAutoRnp();

    this.updateLDev();
  }

  setPilotRnp(rnp: number): void {
    this.manualRnp = true;
    this.setActiveRnp(rnp);
  }

  clearPilotRnp(): void {
    this.manualRnp = false;
    this.pilotRnpGreaterThanAreaRnp.set(undefined);
    this.pilotRnpGreaterThanProcedureRnp.set(undefined);
    this.updateAutoRnp();
  }

  private updateAutoRnp(): void {
    if (this.manualRnp) {
      this.checkManualRnp();
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

  private setActiveRnp(rnp: number | undefined): void {
    this.activeRnp = rnp;
    SimVar.SetSimVarValue('L:A32NX_FMGC_L_RNP', 'number', rnp ?? 0);
    SimVar.SetSimVarValue('L:A32NX_FMGC_R_RNP', 'number', rnp ?? 0);
  }

  private updateLDev(): void {
    const area = this.flightPlanService.active.calculateActiveArea();
    const ldev =
      this.activeRnp !== undefined &&
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

  private checkManualRnp(): void {
    if (this.manualRnp) {
      const pilotRnp = this.activeRnp;
      // Check if pilot rnp is greater than procedure rnp.
      const plan = this.flightPlanService.hasActive ? this.flightPlanService.active : undefined;
      const leg = plan?.maybeElementAt(plan.activeLegIndex);
      const legrnp = isLeg(leg) ? leg.rnp : undefined;
      this.pilotRnpGreaterThanProcedureRnp.set(
        pilotRnp !== undefined && legrnp !== undefined && pilotRnp > legrnp ? legrnp : undefined,
      );

      // Check if pilot rnp is greater than area rnp if no leg rnp exists.
      const areaRnp = legrnp === undefined && plan ? rnpDefaults[plan.calculateActiveArea()] : undefined;
      this.pilotRnpGreaterThanAreaRnp.set(
        pilotRnp !== undefined && areaRnp !== undefined && pilotRnp > areaRnp ? areaRnp : undefined,
      );
    }
  }
}
