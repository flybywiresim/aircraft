import { EventBus } from '../../data';
import { FlightPlan, FlightPlanLegIterator, FlightPlanner, FlightPlannerEvents } from '../../flightplan';
import { GeoPoint, NavMath } from '../../geo';
import { GNSSEvents } from '../../instruments';
import { UnitType } from '../../math';
import { FacilityType, ICAO } from '../../navigation';
import { VNavUtils } from '../VNavUtils';

/**
 * Handles the calculation of a Glide Path.
 */
export class GlidePathCalculator {

  private mapLegIndex = 0;
  private fafLegIndex = 0;

  private readonly planePos = new GeoPoint(0, 0);

  public glidepathFpa = 0;

  private flightPlanIterator = new FlightPlanLegIterator();

  /**
   * Creates an instance of the GlidePathCalculator.
   * @param bus The EventBus to use with this instance.
   * @param flightPlanner The flight planner to use with this instance.
   * @param primaryPlanIndex The primary plan index to use for calculating GlidePath.
   */
  constructor(private readonly bus: EventBus, private readonly flightPlanner: FlightPlanner, private readonly primaryPlanIndex: number) {
    const fpl = bus.getSubscriber<FlightPlannerEvents>();

    fpl.on('fplCopied').handle(e => e.planIndex === 0 || e.targetPlanIndex === 0 && this.onPlanChanged());
    fpl.on('fplCreated').handle(e => e.planIndex === 0 && this.onPlanChanged());
    fpl.on('fplLegChange').handle(e => {
      if (e.planIndex === 0) {
        this.onPlanChanged();
      }
    });
    fpl.on('fplLoaded').handle(e => e.planIndex === 0 && this.onPlanChanged());
    fpl.on('fplSegmentChange').handle(e => {
      if (e.planIndex === 0) {
        this.onPlanChanged();
      }
    });
    fpl.on('fplIndexChanged').handle(() => this.onPlanChanged());

    fpl.on('fplCalculated').handle(e => e.planIndex === 0 && this.onPlanCalculated());

    const gnss = this.bus.getSubscriber<GNSSEvents>();
    gnss.on('gps-position').handle(lla => {
      this.planePos.set(lla.lat, lla.long);
      //this.currentGpsAltitude = UnitType.METER.convertTo(lla.alt, UnitType.FOOT);
    });
    //gnss.on('ground_speed').handle(gs => this.currentGroundSpeed = gs);
  }

  private onPlanChanged = (): void => {
    if (this.flightPlanner.hasFlightPlan(this.primaryPlanIndex)) {
      const plan = this.flightPlanner.getFlightPlan(this.primaryPlanIndex);
      this.mapLegIndex = VNavUtils.getMissedApproachLegIndex(plan);
      this.fafLegIndex = VNavUtils.getFafIndexReverse(plan, this.flightPlanIterator);
    }
  };

  private onPlanCalculated = (): void => {
    if (this.flightPlanner.hasFlightPlan(this.primaryPlanIndex)) {
      const plan = this.flightPlanner.getFlightPlan(this.primaryPlanIndex);
      this.calcGlidepathFpa(plan);
    }
  };

  /**
   * Gets the current Glidepath distance.
   * @param index The current leg index.
   * @param distanceAlongLeg The distance along the leg the aircraft is presently.
   * @returns The current Glidepath distance.
   */
  public getGlidepathDistance(index: number, distanceAlongLeg: number): number {
    let globalLegIndex = 0;
    let distance = 0;
    const plan = this.flightPlanner.getFlightPlan(this.primaryPlanIndex);
    const destLeg = plan.getLeg(this.mapLegIndex);

    if (index <= this.mapLegIndex) {
      for (let segmentIndex = 0; segmentIndex < plan.segmentCount; segmentIndex++) {
        const segment = plan.getSegment(segmentIndex);
        for (let legIndex = 0; legIndex < segment.legs.length; legIndex++) {
          const leg = segment.legs[legIndex];

          if (leg.calculated !== undefined && globalLegIndex <= this.mapLegIndex) {
            if (index === globalLegIndex) {
              distance += leg.calculated?.distanceWithTransitions - distanceAlongLeg;
            } else if (globalLegIndex > index) {
              distance += leg.calculated?.distanceWithTransitions;
            }
          }

          globalLegIndex++;
        }
      }

      if (
        ICAO.isFacility(destLeg.leg.fixIcao)
        && ICAO.getFacilityType(destLeg.leg.fixIcao) !== FacilityType.RWY
        && plan.procedureDetails.destinationRunway !== undefined
        && destLeg.calculated && destLeg.calculated.endLat !== undefined && destLeg.calculated.endLon !== undefined
      ) {
        const runway = plan.procedureDetails.destinationRunway;
        const runwayGeoPoint = new GeoPoint(runway.latitude, runway.longitude);

        if (index === this.mapLegIndex && (distanceAlongLeg >= (destLeg.calculated.distanceWithTransitions - 1))) {
          const destEnd = new GeoPoint(destLeg.calculated.endLat, destLeg.calculated.endLon);
          distance = UnitType.NMILE.convertTo(NavMath.alongTrack(runwayGeoPoint, destEnd, this.planePos), UnitType.METER);
        } else {
          distance += UnitType.GA_RADIAN.convertTo(runwayGeoPoint.distance(destLeg.calculated.endLat, destLeg.calculated.endLon), UnitType.METER);
        }
      }
    }

    return distance;
  }

  /**
   * Gets the Glidepath desired altitude.
   * @param distance The current Glidepath distance.
   * @returns The current Glidepath desired altitude.
   */
  public getDesiredGlidepathAltitude(distance: number): number {
    return this.getRunwayAltitude() + VNavUtils.altitudeForDistance(this.glidepathFpa, distance);
  }

  /**
   * Gets the Glidepath runway altitude.
   * @returns The Glidepath runway altitude.
   */
  public getRunwayAltitude(): number {
    const plan = this.flightPlanner.getFlightPlan(this.primaryPlanIndex);
    const destLeg = plan.getLeg(this.mapLegIndex);
    let destAltitude = destLeg.leg.altitude1;

    if (
      ICAO.isFacility(destLeg.leg.fixIcao)
      && ICAO.getFacilityType(destLeg.leg.fixIcao) !== FacilityType.RWY
      && plan.procedureDetails.destinationRunway !== undefined
    ) {
      destAltitude = plan.procedureDetails.destinationRunway.elevation;
    }

    return destAltitude;
  }

  /**
   * Calculates the Glidepath flight path angle using the destination elevation
   * and FAF altitude restriction.
   * @param plan The plan to calculate from.
   */
  private calcGlidepathFpa(plan: FlightPlan): void {
    if (plan.length < 2 || this.fafLegIndex > plan.length || this.mapLegIndex > plan.length) {
      return;
    }

    const fafLeg = plan.tryGetLeg(this.fafLegIndex);
    const destLeg = plan.tryGetLeg(this.mapLegIndex);

    if (!fafLeg || !destLeg) {
      return;
    }

    let fafToDestDistance = 0;
    for (let i = this.fafLegIndex + 1; i <= this.mapLegIndex; i++) {
      const leg = plan.getLeg(i);
      if (leg.calculated !== undefined) {
        fafToDestDistance += leg.calculated.distance;
      }
    }

    let destAltitude = destLeg.leg.altitude1;

    if (
      ICAO.isFacility(destLeg.leg.fixIcao)
      && ICAO.getFacilityType(destLeg.leg.fixIcao) !== FacilityType.RWY
      && plan.procedureDetails.destinationRunway !== undefined
      && destLeg.calculated && destLeg.calculated.endLat !== undefined && destLeg.calculated.endLon !== undefined
    ) {
      const runway = plan.procedureDetails.destinationRunway;
      const runwayGeoPoint = new GeoPoint(runway.latitude, runway.longitude);
      destAltitude = runway.elevation;
      fafToDestDistance += UnitType.GA_RADIAN.convertTo(runwayGeoPoint.distance(destLeg.calculated.endLat, destLeg.calculated.endLon), UnitType.METER);
    }

    this.glidepathFpa = VNavUtils.getFpa(fafToDestDistance, fafLeg.leg.altitude1 - destAltitude);
  }

}
