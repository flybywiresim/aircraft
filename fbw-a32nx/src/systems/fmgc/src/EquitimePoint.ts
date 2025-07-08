import { Fix, MathUtils } from '@flybywiresim/fbw-sdk';
import { AeroMath, EventBus, UnitType, Vec2Math } from '@microsoft/msfs-sdk';
import { FlightPlanInterface } from './flightplanning/FlightPlanInterface';
import { Navigation } from './navigation/Navigation';
import { bearingTo, Coordinates, distanceTo } from 'msfs-geo';
import { Geometry } from './guidance/Geometry';
import { FlightPlanIndex } from './flightplanning/FlightPlanManager';

export class EquitimePoint {
  public pilotEnteredReferenceFix1: Fix | undefined = undefined;

  public pilotEnteredReferenceFix2: Fix | undefined = undefined;

  public pilotEnteredWindToReferenceFix1: Float64Array | undefined = undefined;

  public pilotEnteredWindToReferenceFix2: Float64Array | undefined = undefined;

  private static readonly DefaultWind = Vec2Math.create(0, 0);

  private etpTimeToRef1: number | undefined = undefined;

  private etpTimeToRef2: number | undefined = undefined;

  private pposTimeToRef1: number | undefined = undefined;

  private pposTimeToRef2: number | undefined = undefined;

  private etp: ReturnType<Geometry['pointFromEndOfPath']> | undefined = undefined;

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanService: FlightPlanInterface,
    private readonly navigation: Navigation,
  ) {}

  acceptMultipleLegGeometry(geometry: Geometry): void {
    this.updateEtp(geometry);
  }

  get referenceFix1(): Fix | undefined {
    return this.pilotEnteredReferenceFix1 ?? this.flightPlanService.active?.originAirport;
  }

  get isReferenceFix1PilotEntered(): boolean {
    return this.pilotEnteredReferenceFix1 !== undefined;
  }

  get referenceFix2(): Fix | undefined {
    return this.pilotEnteredReferenceFix2 ?? this.flightPlanService.active?.destinationAirport;
  }

  get isReferenceFix2PilotEntered(): boolean {
    return this.pilotEnteredReferenceFix2 !== undefined;
  }

  get pposBearingToReferenceFix1(): number | undefined {
    const ppos = this.navigation.getPpos();

    if (!ppos || !this.referenceFix1) {
      return undefined;
    }

    return bearingTo(ppos, this.referenceFix1.location);
  }

  get pposBearingToReferenceFix2(): number | undefined {
    const ppos = this.navigation.getPpos();

    if (!ppos || !this.referenceFix2) {
      return undefined;
    }

    return bearingTo(ppos, this.referenceFix2.location);
  }

  get pposDistanceToReferenceFix1(): number | undefined {
    const ppos = this.navigation.getPpos();

    if (!ppos || !this.referenceFix1) {
      return undefined;
    }

    return distanceTo(ppos, this.referenceFix1.location);
  }

  get pposDistanceToReferenceFix2(): number | undefined {
    const ppos = this.navigation.getPpos();

    if (!ppos || !this.referenceFix2) {
      return undefined;
    }

    return distanceTo(ppos, this.referenceFix2.location);
  }

  get pposTimeToReferenceFix1(): number | undefined {
    return this.pposTimeToRef1;
  }

  get pposTimeToReferenceFix2(): number | undefined {
    return this.pposTimeToRef2;
  }

  get etpBearingToReferenceFix1(): number | undefined {
    if (!this.etp || !this.referenceFix1) {
      return undefined;
    }

    return bearingTo(this.etp[0], this.referenceFix1.location);
  }

  get etpBearingToReferenceFix2(): number | undefined {
    if (!this.etp || !this.referenceFix2) {
      return undefined;
    }

    return bearingTo(this.etp[0], this.referenceFix2.location);
  }

  get etpDistanceToReferenceFix1(): number | undefined {
    if (!this.etp || !this.referenceFix1) {
      return undefined;
    }

    return distanceTo(this.etp[0], this.referenceFix1.location);
  }

  get etpDistanceToReferenceFix2(): number | undefined {
    if (!this.etp || !this.referenceFix2) {
      return undefined;
    }

    return distanceTo(this.etp[0], this.referenceFix2.location);
  }

  get etpTimeToReferenceFix1(): number | undefined {
    return this.etpTimeToRef1;
  }

  get etpTimeToReferenceFix2(): number | undefined {
    return this.etpTimeToRef2;
  }

  get windToReferenceFix1(): Float64Array {
    return this.pilotEnteredWindToReferenceFix1 ?? EquitimePoint.DefaultWind;
  }

  get windToReferenceFix2(): Float64Array {
    return this.pilotEnteredWindToReferenceFix2 ?? EquitimePoint.DefaultWind;
  }

  get isWindToReferenceFix1PilotEntered(): boolean {
    return this.pilotEnteredWindToReferenceFix1 !== undefined;
  }

  get isWindToReferenceFix2PilotEntered(): boolean {
    return this.pilotEnteredWindToReferenceFix2 !== undefined;
  }

  isComputed(): boolean {
    return this.etp !== undefined;
  }

  get(): ReturnType<Geometry['pointFromEndOfPath']> | undefined {
    return this.etp;
  }

  private updateEtp(geometry: Geometry) {
    const ref1 = this.referenceFix1;
    const ref2 = this.referenceFix2;

    const ppos = this.navigation.getPpos();
    const plan = this.flightPlanService.get(FlightPlanIndex.Active);

    if (!ref1 || !ref2 || !ppos || !plan) {
      return undefined;
    }

    const cruiseLevel = plan.performanceData.cruiseFlightLevel;
    // TODO consider CI and speed limit
    const tas = UnitType.MPS.convertTo(
      Math.min(
        AeroMath.casToTasIsa(
          UnitType.KNOT.convertTo(290, UnitType.MPS),
          UnitType.FOOT.convertTo(cruiseLevel * 100, UnitType.METER),
        ),
        AeroMath.machToTasIsa(0.78, UnitType.FOOT.convertTo(cruiseLevel * 100, UnitType.METER)),
      ),
      UnitType.KNOT,
    );

    this.pposTimeToRef1 = EquitimePoint.timeTo(ppos, ref1.location, this.windToReferenceFix1, tas);
    this.pposTimeToRef2 = EquitimePoint.timeTo(ppos, ref2.location, this.windToReferenceFix2, tas);

    this.etpTimeToRef1 = this.pposTimeToRef1;
    this.etpTimeToRef2 = this.pposTimeToRef2;

    if (this.etpTimeToRef1 > this.etpTimeToRef2) {
      // We are already past the ETP
      this.etp = undefined;
    }

    let etpAlongTrackDistanceGuess = distanceTo(ref1.location, ref2.location) / 2;
    this.etp = geometry.pointFromEndOfPath(
      plan.activeLegIndex,
      plan.firstMissedApproachLegIndex,
      etpAlongTrackDistanceGuess,
      'ETP',
    );
    let iterations = 0;

    while (Math.abs(this.etpTimeToRef2 - this.etpTimeToRef1) > 1 / 60 && iterations++ < 10) {
      etpAlongTrackDistanceGuess -= ((this.etpTimeToRef2 - this.etpTimeToRef1) * tas) / 2;

      this.etp = geometry.pointFromEndOfPath(
        plan.activeLegIndex,
        plan.firstMissedApproachLegIndex,
        etpAlongTrackDistanceGuess,
        'ETP',
      );

      if (!this.etp) break;

      const [etpLla, _] = this.etp;

      this.etpTimeToRef1 = EquitimePoint.timeTo(etpLla, ref1.location, this.windToReferenceFix1, tas);
      this.etpTimeToRef2 = EquitimePoint.timeTo(etpLla, ref2.location, this.windToReferenceFix2, tas);
    }

    if (iterations >= 10) {
      this.etp = undefined;
    }
  }

  /**
   * Computes the time to fly from one coordinate to another, taking into account the wind and true airspeed.
   * @param from the starting coordinates
   * @param to the destination coordinates
   * @param wind the wind vector as a Float64Array
   * @param tas the true airspeed in knots
   * @returns the time in hours to fly from `from` to `to`
   */
  public static timeTo(from: Coordinates, to: Coordinates, wind: Float64Array | undefined, tas: number): number {
    const distance = distanceTo(from, to);
    const bearing = bearingTo(from, to);

    const tailwindComponent =
      -Vec2Math.abs(wind) * Math.cos(bearing * MathUtils.DEGREES_TO_RADIANS - Vec2Math.theta(wind));

    return distance / (tas + tailwindComponent);
  }
}
