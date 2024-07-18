//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FmsAtcMessages } from '@datalink/atc';
import { Waypoint } from '@datalink/common';
import { EventBus, Publisher } from '@microsoft/msfs-sdk';
import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/plans/ReadonlyFlightPlan';

export class FlightPlanSynchronization {
  private readonly publisher: Publisher<FmsAtcMessages>;

  private originIdent: string = '';

  private lastWaypoint: Waypoint = { ident: '', altitude: 0, utc: 0 };

  private activeWaypoint: Waypoint = { ident: '', altitude: 0, utc: 0 };

  private nextWaypoint: Waypoint = { ident: '', altitude: 0, utc: 0 };

  private destination: Waypoint = { ident: '', altitude: 0, utc: 0 };

  private static findLastWaypoint(flightPlan: ReadonlyFlightPlan): Waypoint {
    for (let idx = flightPlan.activeLegIndex; idx >= 0; idx--) {
      const leg = flightPlan.maybeElementAt(idx);

      if (leg?.isDiscontinuity === false) {
        // TODO connect to VNAV
        return {
          ident: leg.ident ?? '',
          altitude: 0,
          utc: -1,
        };
      }
    }

    return { ident: '', altitude: 0, utc: 0 };
  }

  private static findActiveWaypoint(flightPlan: ReadonlyFlightPlan): Waypoint {
    const activeLeg = flightPlan.activeLeg;

    if (activeLeg?.isDiscontinuity === false) {
      // TODO connect to VNAV
      return {
        ident: activeLeg?.ident ?? '',
        altitude: 0,
        utc: -1,
      };
    }

    return { ident: '', altitude: 0, utc: 0 };
  }

  private static findNextWaypoint(flightPlan: ReadonlyFlightPlan): Waypoint {
    for (let idx = flightPlan.activeLegIndex + 1; idx < flightPlan.firstMissedApproachLegIndex; idx++) {
      const leg = flightPlan.maybeElementAt(idx);

      if (leg?.isDiscontinuity === false) {
        // TODO connect to VNAV
        return {
          ident: leg.ident,
          altitude: 0,
          utc: -1,
        };
      }
    }

    return { ident: '', altitude: 0, utc: 0 };
  }

  private static findDestinationWaypoint(flightPlan: ReadonlyFlightPlan): Waypoint {
    for (let idx = flightPlan.activeLegIndex; idx < flightPlan.firstMissedApproachLegIndex; idx++) {
      const leg = flightPlan.maybeElementAt(idx);

      // Note that the destination leg index must not necessarily be an airport or a runway, just the last leg of the flight plan (excluding missed approach legs)
      if (leg?.isDiscontinuity === false && idx === flightPlan.destinationLegIndex) {
        // TODO connect to VNAV
        return {
          ident: leg.ident,
          altitude: 0,
          utc: -1,
        };
      }
      idx += 1;
    }

    return { ident: '', altitude: 0, utc: 0 };
  }

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanService: FlightPlanInterface,
  ) {
    this.publisher = this.bus.getPublisher<FmsAtcMessages>();

    // FIXME use the non-guidance FMGC to get the flightplan data
    setInterval(() => {
      const activeFlightPlan = this.flightPlanService.active;

      if (activeFlightPlan && activeFlightPlan.legCount !== 0) {
        const origin = activeFlightPlan.originAirport;
        const lastWaypoint = FlightPlanSynchronization.findLastWaypoint(activeFlightPlan);
        const activeWaypoint = FlightPlanSynchronization.findActiveWaypoint(activeFlightPlan);
        const nextWaypoint = FlightPlanSynchronization.findNextWaypoint(activeFlightPlan);
        const destination = FlightPlanSynchronization.findDestinationWaypoint(activeFlightPlan);

        if (origin) {
          if (origin.ident !== this.originIdent || destination.ident !== this.destination.ident) {
            // new route entered -> reset ATIS updater
            this.publisher.pub('atcResetAtisAutoUpdate', true, true, false);
          }

          // check if we need to update the route data
          const updateRoute =
            this.lastWaypoint.ident !== lastWaypoint.ident ||
            this.activeWaypoint.ident !== activeWaypoint.ident ||
            this.nextWaypoint.ident !== nextWaypoint.ident ||
            this.destination.ident !== destination.ident ||
            Math.abs(this.activeWaypoint.utc - activeWaypoint.utc) >= 60 ||
            Math.abs(this.nextWaypoint.utc - nextWaypoint.utc) >= 60;

          if (updateRoute) {
            this.publisher.pub(
              'atcRouteData',
              {
                lastWaypoint,
                activeWaypoint,
                nextWaypoint,
                destination,
              },
              true,
              false,
            );
          }
        }
      }
    }, 1000);
  }
}
