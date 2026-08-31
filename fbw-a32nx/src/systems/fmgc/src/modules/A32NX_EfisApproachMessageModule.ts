// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { Fms } from '../Fms';
import { FmsModule } from './FmsModule';
import { FmgcFlightPhase } from '../../../shared/src/flightphase';
import { FlightPhaseManagerEvents } from '../flightphase';
import { ApproachUtils, ApproachType, SimVarString, RegisteredSimVar } from '@flybywiresim/fbw-sdk';

export class A32NX_EfisApproachMessageModule extends FmsModule {
  private static readonly A32NX_EFIS_L_APPROACH_MSG_0_VAR = RegisteredSimVar.create(
    'L:A32NX_EFIS_L_APPR_MSG_0',
    SimVarValueType.String,
  );
  private static readonly A32NX_EFIS_L_APPROACH_MSG_1_VAR = RegisteredSimVar.create(
    'L:A32NX_EFIS_L_APPR_MSG_1',
    SimVarValueType.String,
  );
  private static readonly A32NX_EFIS_R_APPROACH_MSG_0_VAR = RegisteredSimVar.create(
    'L:A32NX_EFIS_R_APPR_MSG_0',
    SimVarValueType.String,
  );
  private static readonly A32NX_EFIS_R_APPROACH_MSG_1_VAR = RegisteredSimVar.create(
    'L:A32NX_EFIS_R_APPR_MSG_1',
    SimVarValueType.String,
  );

  private readonly flightPhase = ConsumerSubject.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly approachMessage = Subject.create<string | null>(null);

  private fms?: Fms;

  private flightPhaseForApproachMessage = false;

  public init(fms: Fms): void {
    this.fms = fms;
    this.flightPhase.sub((v) => {
      if (v >= FmgcFlightPhase.Cruise && v <= FmgcFlightPhase.Done) {
        this.flightPhaseForApproachMessage = true;
      } else {
        this.flightPhaseForApproachMessage = false;
        this.approachMessage.set(null);
      }
    });
    this.approachMessage.sub((v) => {
      const apprMsgVars = SimVarString.pack(v !== null ? v.padEnd(9) : '', 9);
      // setting the simvar as a number greater than about 16 million causes precision error > 1... but this works..
      A32NX_EfisApproachMessageModule.A32NX_EFIS_L_APPROACH_MSG_0_VAR.set(apprMsgVars[0].toString());
      A32NX_EfisApproachMessageModule.A32NX_EFIS_L_APPROACH_MSG_1_VAR.set(apprMsgVars[1].toString());
      A32NX_EfisApproachMessageModule.A32NX_EFIS_R_APPROACH_MSG_0_VAR.set(apprMsgVars[0].toString());
      A32NX_EfisApproachMessageModule.A32NX_EFIS_R_APPROACH_MSG_1_VAR.set(apprMsgVars[1].toString());
    });
  }

  public onUpdate(_deltaTime: number): void {
    if (this.flightPhaseForApproachMessage) {
      const flightPlan = this.fms?.flightPlanService.hasActive ? this.fms?.flightPlanService.active : null;
      const runway = this.fms?.flightPlanService.active.destinationRunway;
      if (runway) {
        const distanceToDestination = this.fms?.guidanceController.getAlongTrackDistanceToDestination() ?? -1;
        const phase = this.flightPhase.get();
        if (phase > FmgcFlightPhase.Cruise || (phase === FmgcFlightPhase.Cruise && distanceToDestination < 250)) {
          const appr = flightPlan?.approach;
          this.approachMessage.set(
            appr && appr.type !== ApproachType.Unknown ? ApproachUtils.longApproachName(appr) : null,
          );
        }
      }
    }
  }
}
