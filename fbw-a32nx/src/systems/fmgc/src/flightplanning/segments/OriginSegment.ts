// @ts-strict-ignore
// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, areDatabaseItemsEqual, LegType, MathUtils as FbwMathUtils, Runway } from '@flybywiresim/fbw-sdk';
import { loadAirport, loadAllDepartures, loadAllRunways, loadRunway } from '@fmgc/flightplanning/DataLoading';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { bearingTo } from 'msfs-geo';
import { MathUtils as MsMathUtils } from '@microsoft/msfs-sdk';
import { RestringOptions } from '../plans/RestringOptions';
import { FlightPlanElement, FlightPlanLeg, FlightPlanLegFlags } from '../legs/FlightPlanLeg';
import { NavigationDatabaseService } from '../NavigationDatabaseService';
import { FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/FlightPlanQueuedOperation';
import { TerminalSegment } from '@fmgc/flightplanning/segments/TerminalSegment';

export class OriginSegment extends TerminalSegment {
  class = SegmentClass.Departure;

  allLegs: FlightPlanElement[] = [];

  protected airport: Airport | undefined;

  protected runway: Runway | undefined;

  get originAirport() {
    return this.airport;
  }

  public async setAirport(icao: string | undefined, skipUpdateLegs?: boolean) {
    if (icao === undefined) {
      this.airport = undefined;
      this.runway = undefined;

      if (!skipUpdateLegs) {
        await this.refreshDepartureLegs();
      }
      return;
    }

    this.airport = await loadAirport(icao);

    if (!skipUpdateLegs) {
      await this.refreshDepartureLegs();
    }

    if (this.originAirport) {
      this.flightPlan.availableOriginRunways = await loadAllRunways(this.originAirport);
      this.flightPlan.availableDepartures = await loadAllDepartures(this.originAirport);
    }
  }

  public async setRunway(runwayIdent: string | undefined, setByApproach?: boolean, skipUpdateLegs?: boolean) {
    if (runwayIdent === undefined) {
      this.runway = undefined;
      if (!skipUpdateLegs) {
        await this.refreshDepartureLegs();
      }
      return;
    }

    if (!this.originAirport) {
      throw new Error('[FMS/FPM] Cannot set origin runway with no origin airport');
    }

    this.runway = await loadRunway(this.originAirport, runwayIdent);

    if (!skipUpdateLegs) {
      await this.refreshDepartureLegs();

      this.insertNecessaryDiscontinuities();

      this.flightPlan.syncSegmentLegsChange(this);
    }
  }

  get originRunway() {
    return this.runway;
  }

  private resetOriginLegFlag() {
    // TODO this needs to be synced
    this.allLegs.forEach((leg) => {
      if (leg.isDiscontinuity === false) {
        leg.flags &= ~FlightPlanLegFlags.Origin;
      }
    });

    // Do the same for the departure runway transition segment
    this.flightPlan.departureRunwayTransitionSegment?.allLegs?.forEach((leg) => {
      if (leg.isDiscontinuity === false) {
        leg.flags &= ~FlightPlanLegFlags.Origin;
      }
    });

    // Do the same for the departure transition segment
    this.flightPlan.departureSegment?.allLegs?.forEach((leg) => {
      if (leg.isDiscontinuity === false) {
        leg.flags &= ~FlightPlanLegFlags.Origin;
      }
    });

    // Do the same for the departure enroute transition segment
    this.flightPlan.departureEnrouteTransitionSegment?.allLegs?.forEach((leg) => {
      if (leg.isDiscontinuity === false) {
        leg.flags &= ~FlightPlanLegFlags.Origin;
      }
    });
  }

  private async refreshDepartureLegs() {
    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    if (this.runway) {
      const newRunwayCompatibleSids = await db.getDepartures(this.runway.airportIdent, this.runway.ident);

      const currentSidCompatibleWithNewRunway = newRunwayCompatibleSids.some(
        (departure) => departure.databaseId === this.flightPlan.originDeparture?.databaseId,
      );

      if (currentSidCompatibleWithNewRunway) {
        const ident = this.runway.ident;
        const currentSidNewRunwayTransition = this.flightPlan.originDeparture.runwayTransitions.find(
          (transition) => transition.ident === ident,
        );

        if (
          currentSidNewRunwayTransition &&
          this.flightPlan.departureRunwayTransition?.ident !== currentSidNewRunwayTransition.ident
        ) {
          await this.flightPlan.departureRunwayTransitionSegment.setProcedure(currentSidNewRunwayTransition.ident);

          this.strung = true;
        }
      } else if (this.flightPlan.originDeparture) {
        // If not compatible with the new runway, remove the departure procedure
        this.flightPlan.departureSegment.setProcedure(undefined);
      } else {
        this.refreshOriginLegs();
      }

      this.flightPlan.availableDepartures = newRunwayCompatibleSids;
    } else {
      this.refreshOriginLegs();
    }
  }

  async refreshOriginLegs() {
    this.resetOriginLegFlag();

    let addOriginLeg = true;
    let addInitalAltitudeLeg = false;
    let isDisconnectedIdf = false;
    if (this.runway && this.flightPlan.originDeparture) {
      let firstDepartureLeg: FlightPlanElement;
      if (this.flightPlan.departureRunwayTransitionSegment.allLegs.length > 0) {
        firstDepartureLeg = this.flightPlan.departureRunwayTransitionSegment.allLegs[0];
      } else if (this.flightPlan.departureSegment.allLegs.length > 0) {
        firstDepartureLeg = this.flightPlan.departureSegment.allLegs[0];
      } else {
        firstDepartureLeg = this.flightPlan.departureEnrouteTransitionSegment.allLegs[0];
      }

      if (firstDepartureLeg?.isDiscontinuity === false && firstDepartureLeg.type === LegType.IF) {
        const firstTermFix = firstDepartureLeg.terminationWaypoint();
        if (areDatabaseItemsEqual(firstTermFix, this.runway)) {
          // TODO should this stuff go into DepartureRunwayTransitionSegment?
          firstDepartureLeg.flags |= FlightPlanLegFlags.Origin;

          addOriginLeg = false;
        } else if (firstTermFix) {
          const bearing = bearingTo(this.runway.thresholdLocation, firstTermFix.location);
          const diff = FbwMathUtils.normalise180(MsMathUtils.diffAngleDeg(bearing, this.runway.bearing));

          isDisconnectedIdf = Math.abs(diff) > 1.0;
        }
      }
    } else if (this.runway && !this.flightPlan.originDeparture) {
      addInitalAltitudeLeg = true;
    }

    this.allLegs.length = 0;
    if (addOriginLeg && this.airport) {
      const originLeg = FlightPlanLeg.fromAirportAndRunway(
        this,
        this.flightPlan.departureSegment.procedure?.ident ?? '',
        this.airport,
        this.runway,
      );
      originLeg.flags |= FlightPlanLegFlags.Origin;
      this.allLegs.push(originLeg);

      this.strung = false;
    }

    if (addInitalAltitudeLeg && this.runway) {
      const runwayLeg = this.allLegs[this.allLegs.length - 1];

      if (runwayLeg.isDiscontinuity === true) {
        throw new Error('[FMS/FPM] Runway leg was discontinuity');
      }

      this.allLegs.push(FlightPlanLeg.originExtendedCenterline(this, this.runway, runwayLeg));
    }

    if (isDisconnectedIdf) {
      this.allLegs.push({ isDiscontinuity: true });
    }

    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringDeparture);
    this.flightPlan.syncSegmentLegsChange(this);
  }

  clone(forPlan: BaseFlightPlan, options?: number): OriginSegment {
    const newSegment = new OriginSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [
      ...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment, options) : it)),
    ];
    newSegment.airport = this.airport;
    newSegment.runway = this.runway;

    return newSegment;
  }
}
