import { CruiseWindRequest, WindRequestMessage } from '@datalink/common';
import { FmgcFlightPhase } from '@shared/flightphase';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { ProfilePhase } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { DataManager } from '@fmgc/flightplanning/DataManager';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FlightPlanLeg, isLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';

/**
 * Formats a wind request message for a given flight plan and phase.
 * @param planIndex the index of the flight plan.
 * @param plan the flight plan.
 * @param phase the active fmgc flight phase.
 * @param guidanceController {@link GuidanceController} used to retrieve waypoint predictions for the active flight plan.
 * @param dataManager {@link DataManager} used to retrieve stored waypoints if necessary.
 * @param flightPlanService the flight plan service used to propagate winds if necessary.
 * @returns the formatted wind request.
 */
export function formatWindRequest(
  planIndex: number,
  plan: FlightPlan,
  phase: FmgcFlightPhase,
  guidanceController: GuidanceController,
  dataManager: DataManager | null,
  flightPlanService: FlightPlanService,
): WindRequestMessage {
  const cruiseLevel = plan.performanceData.cruiseFlightLevel.get();

  const shouldRequestClimbWinds =
    !plan.isActiveOrCopiedFromActive() ||
    (phase >= FmgcFlightPhase.Preflight && phase <= FmgcFlightPhase.Takeoff) ||
    phase === FmgcFlightPhase.Done;
  const shouldRequestCruiseWinds =
    !plan.isActiveOrCopiedFromActive() ||
    (phase >= FmgcFlightPhase.Preflight && phase <= FmgcFlightPhase.Cruise) ||
    phase === FmgcFlightPhase.Done;
  const shouldRequestDescentWinds = plan.destinationAirport !== undefined;

  const finalCruiseLevel = plan.allLegs.reduce(
    (acc, leg) => (isLeg(leg) && leg.cruiseStep !== undefined ? Math.round(leg.cruiseStep.toAltitude / 100) : acc),
    cruiseLevel,
  );

  const legPredictions =
    planIndex === FlightPlanIndex.Active ? guidanceController?.vnavDriver.mcduProfile?.waypointPredictions : undefined;
  const cruiseLegs = plan.allLegs.filter((leg, i) => {
    if (!isLeg(leg) || !leg.isXF()) {
      return false;
    }

    const legPrediction = legPredictions?.get(i);
    return legPrediction !== undefined
      ? legPrediction.profilePhase === ProfilePhase.Cruise
      : leg.segment.class === SegmentClass.Enroute;
  }) as FlightPlanLeg[];

  let cruiseWinds: CruiseWindRequest | undefined = undefined;
  if (shouldRequestCruiseWinds && cruiseLegs.length > 0) {
    const propagatedWinds = flightPlanService.propagateWindsAt(0, [], planIndex);
    const flightLevels = propagatedWinds.map((wind) => Math.round(wind.altitude / 100));

    if (flightLevels.length === 0) {
      if (cruiseLevel !== null) {
        flightLevels.push(cruiseLevel);
      }

      plan.allLegs.forEach((leg) => {
        if (isLeg(leg) && leg.cruiseStep !== undefined) {
          const cruiseStep = Math.round(leg.cruiseStep.toAltitude / 100);

          if (flightLevels.length < 4 && cruiseStep !== cruiseLevel && !flightLevels.includes(cruiseStep)) {
            flightLevels.push(cruiseStep);
          }
        }
      });
    }

    cruiseWinds = {
      flightLevels,
      waypoints: cruiseLegs.map((leg) => {
        const isStoredWaypoint = (dataManager?.getStoredWaypointsByIdent(leg.ident).length ?? 0) > 0;

        return isStoredWaypoint ? leg.definition.waypoint!.location : leg.ident;
      }),
    };
  }

  let alternateWind = undefined;
  if (plan.destinationAirport !== undefined && plan.alternateDestinationAirport !== undefined) {
    alternateWind = {
      destinationIcao: plan.destinationAirport.ident,
      alternateIcao: plan.alternateDestinationAirport.ident,
    };
  }

  return {
    climbWindLevel: shouldRequestClimbWinds ? cruiseLevel : undefined,
    cruiseWinds,
    descentWindLevel: shouldRequestDescentWinds ? finalCruiseLevel ?? null : undefined,
    alternateWind,
  };
}
