// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';

/**
 * This class exists to provide very coarse predictions for
 * LNAV turn prediction while we await the full VNAV experience
 */
export class CoarsePredictions {
    static updatePredictions(guidanceController: GuidanceController, atmosphere: AtmosphericConditions) {
        const plan = FlightPlanService.active;

        for (let i = 0; i < plan.legCount; i++) {
            const planLeg = plan.elementAt(i);
            const geomLeg = guidanceController.activeGeometry.legs.get(i);

            if (!planLeg || !geomLeg) {
                continue;
            }

            // TODO port over

            // if (LnavConfig.DEBUG_USE_SPEED_LVARS) {
            //     geomLeg.predictedTas = SimVar.GetSimVarValue('L:A32NX_DEBUG_FM_TAS', 'knots');
            //     geomLeg.predictedGs = SimVar.GetSimVarValue('L:A32NX_DEBUG_FM_GS', 'knots');
            //     continue;

            // const alt = planLeg.additionalData.predictedAltitude;
            // const cas = planLeg.additionalData.predictedSpeed;
            // let tas = atmosphere.computeTasFromCas(alt, cas);
            // let gs = tas;

            // predicted with live data for active and next two legs
            // if (i >= guidanceController.activeLegIndex && i < (guidanceController.activeLegIndex + 3)) {
            //     tas = atmosphere.currentTrueAirspeed;
            //     gs = tas + atmosphere.currentWindSpeed;
            // }

            // geomLeg.predictedTas = Number.isFinite(tas) ? tas : undefined;
            // geomLeg.predictedGs = Number.isFinite(gs) ? gs : tas;
        }
    }
}
