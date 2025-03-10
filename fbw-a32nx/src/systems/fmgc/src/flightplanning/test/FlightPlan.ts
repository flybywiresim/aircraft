// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

const bus = new EventBus();

export function emptyFlightPlan() {
  return FlightPlan.empty(
    { syncClientID: Math.round(Math.random() * 10_000_000), batchStack: [] },
    0,
    bus,
    new A320FlightPlanPerformanceData(), // TODO make test-specific data or something
  );
}

export function dumpFlightPlan(plan: BaseFlightPlan): string {
  const string = plan.allLegs
    .map((it, index) => {
      if (it.isDiscontinuity === true) {
        return '---F-PLN DISCONTINUITY--';
      }

      const isActive = index === plan.activeLegIndex;
      // const isMissedApproach = index > plan.destinationLegIndex;

      let ident: any;
      let legIdent = it.ident;

      if (it.definition.overfly) {
        legIdent += 'Δ';
      }

      if (isActive) {
        // ident = chalk.rgb(255, 255, 255)(legIdent);
        ident = legIdent;
      } else {
        // ident = isMissedApproach ? chalk.rgb(0, 255, 255)(legIdent) : chalk.rgb(0, 255, 0)(legIdent);
        ident = legIdent;
      }

      return ` ${it.annotation}\n${ident}`;
    })
    .join('\n');

  return string;
}
