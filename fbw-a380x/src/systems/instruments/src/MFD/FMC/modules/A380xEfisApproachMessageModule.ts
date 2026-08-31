// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { ApproachUtils, ApproachType, SimVarString, RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { FmsModule } from '@fmgc/modules/FmsModule';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';
import { Fms } from '@fmgc/Fms';
import { FmgcFlightPhase } from '@shared/flightphase';

export class A380X_EfisApproachMessageModule extends FmsModule {
  private static readonly A380X_EFIS_L_APPROACH_MSG_0_VAR = RegisteredSimVar.create(
    'L:A380X_EFIS_L_APPR_MSG_0',
    SimVarValueType.String,
  );
  private static readonly A380X_EFIS_L_APPROACH_MSG_1_VAR = RegisteredSimVar.create(
    'L:A380X_EFIS_L_APPR_MSG_1',
    SimVarValueType.String,
  );
  private static readonly A380X_EFIS_R_APPROACH_MSG_0_VAR = RegisteredSimVar.create(
    'L:A380X_EFIS_R_APPR_MSG_0',
    SimVarValueType.String,
  );
  private static readonly A380X_EFIS_R_APPROACH_MSG_1_VAR = RegisteredSimVar.create(
    'L:A380X_EFIS_R_APPR_MSG_1',
    SimVarValueType.String,
  );

  private readonly flightPhase = ConsumerSubject.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly approachMessage = Subject.create<string | null>(null);

  private fms?: Fms;

  private atOrAfterCruisePhase = false;

  public init(fms: Fms): void {
    this.fms = fms;
    this.flightPhase.sub((v) => {
      if (v >= FmgcFlightPhase.Cruise) {
        this.atOrAfterCruisePhase = true;
      } else {
        this.atOrAfterCruisePhase = false;
      }
    });
    this.approachMessage.sub((v) => {
      const apprMsgVars = SimVarString.pack(v !== null ? v.padEnd(14) : '', 14);
      // setting the simvar as a number greater than about 16 million causes precision error > 1... but this works..
      A380X_EfisApproachMessageModule.A380X_EFIS_L_APPROACH_MSG_0_VAR.set(apprMsgVars[0].toString());
      A380X_EfisApproachMessageModule.A380X_EFIS_L_APPROACH_MSG_1_VAR.set(apprMsgVars[1].toString());
      A380X_EfisApproachMessageModule.A380X_EFIS_R_APPROACH_MSG_0_VAR.set(apprMsgVars[0].toString());
      A380X_EfisApproachMessageModule.A380X_EFIS_R_APPROACH_MSG_1_VAR.set(apprMsgVars[1].toString());
    }, true);
  }
  public onUpdate(_deltaTime: number): void {
    const flightPlan = this.fms?.flightPlanService.hasActive ? this.fms?.flightPlanService.active : undefined;
    if (this.atOrAfterCruisePhase) {
      const runway = this.fms!.flightPlanService.active.destinationRunway;
      if (runway) {
        const distanceToDestination = this.fms?.guidanceController.getAlongTrackDistanceToDestination() ?? -1;
        const phase = this.flightPhase.get();
        if (phase > FmgcFlightPhase.Cruise || (phase === FmgcFlightPhase.Cruise && distanceToDestination < 250)) {
          const appr = flightPlan?.approach;
          const isRnpAr = appr !== undefined ? ApproachUtils.isRnpArApproach(appr) : false;
          this.approachMessage.set(
            appr && appr.type !== ApproachType.Unknown
              ? `${ApproachUtils.longApproachName(appr, true)}${isRnpAr ? '(AR)' : ''}`
              : null,
          );
        }
      }
    } else {
      // SID identifier
      this.approachMessage.set(
        flightPlan !== undefined && flightPlan.isDepartureProcedureActive() ? flightPlan.originDeparture!.ident : null,
      );
    }
  }
}
