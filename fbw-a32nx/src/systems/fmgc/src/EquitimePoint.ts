import { Fix, MathUtils } from '@flybywiresim/fbw-sdk';
import { AeroMath, ConsumerValue, EventBus, UnitType, Vec2Math, Wait } from '@microsoft/msfs-sdk';
import { FlightPlanInterface } from './flightplanning/FlightPlanInterface';
import { Navigation } from './navigation/Navigation';
import { bearingTo, Coordinates, distanceTo } from 'msfs-geo';
import { Geometry } from './guidance/Geometry';
import { FlightPlanIndex } from './flightplanning/FlightPlanManager';
import { FlightPhaseManagerEvents } from './flightphase/FlightPhaseManager';
import { FmgcFlightPhase } from '@shared/flightphase';

export interface EquitimePointInterface {
  etpTimeToRef1: number;
  etpTimeToRef2: number;
  pposTimeToRef1: number;
  pposTimeToRef2: number;
  etp: ReturnType<Geometry['pointFromEndOfPath']>;
}

export class EquitimePoint {
  private static readonly DefaultWind = Vec2Math.create(0, 0);

  private static readonly AbsoluteToleranceSeconds = 10;

  private geometry: Geometry | undefined = undefined;

  private inhibitAutoRecompute = false;

  private pilotEnteredReferenceFix1: Fix | undefined;
  private pilotEnteredReferenceFix2: Fix | undefined;
  private pilotEnteredWindToReferenceFix1: Float64Array | undefined;
  private pilotEnteredWindToReferenceFix2: Float64Array | undefined;

  private result: Partial<EquitimePointInterface> = {};

  private readonly flightPhase = ConsumerValue.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanService: FlightPlanInterface,
    private readonly navigation: Navigation,
  ) {}

  acceptMultipleLegGeometry(geometry: Geometry): void {
    this.geometry = geometry;

    if (!this.inhibitAutoRecompute) {
      this.updateEtp();
    }
  }

  private updateEtp() {
    this.reset();

    const ref1 = this.referenceFix1;
    const ref2 = this.referenceFix2;

    const ppos = this.navigation.getPpos();
    const plan = this.flightPlanService.get(FlightPlanIndex.Active);

    const cruiseLevel = plan.performanceData.cruiseFlightLevel;

    if (!ref1 || !ref2 || !ppos || !plan || !this.geometry || !cruiseLevel) {
      return undefined;
    }

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

    // Time to reference waypoints is only computed in cruise phase
    if (this.flightPhase.get() === FmgcFlightPhase.Cruise) {
      this.result.pposTimeToRef1 = EquitimePoint.timeTo(ppos, ref1.location, this.windToReferenceFix1, tas);
      this.result.pposTimeToRef2 = EquitimePoint.timeTo(ppos, ref2.location, this.windToReferenceFix2, tas);
    }

    let numIterations = 0;
    let etpAlongTrackDistanceGuess = MathUtils.clamp(
      distanceTo(ref1.location, ref2.location) / 2,
      0,
      this.geometry.legs.get(plan.activeLegIndex - 1)?.calculated?.cumulativeDistanceToEndWithTransitions ?? Infinity,
    );

    do {
      this.result.etp = this.geometry.pointFromEndOfPath(
        plan.activeLegIndex,
        plan.firstMissedApproachLegIndex,
        etpAlongTrackDistanceGuess,
        'ETP',
      );

      if (!this.result.etp) {
        this.reset();
        return undefined;
      }

      const [etpLla, _] = this.result.etp;

      this.result.etpTimeToRef1 = EquitimePoint.timeTo(etpLla, ref1.location, this.windToReferenceFix1, tas);
      this.result.etpTimeToRef2 = EquitimePoint.timeTo(etpLla, ref2.location, this.windToReferenceFix2, tas);

      etpAlongTrackDistanceGuess -= ((this.result.etpTimeToRef2 - this.result.etpTimeToRef1) * tas) / 2;
    } while (
      numIterations++ < 10 &&
      3600 * Math.abs(this.result.etpTimeToRef2 - this.result.etpTimeToRef1) > EquitimePoint.AbsoluteToleranceSeconds
    );

    if (numIterations >= 10) {
      this.reset();
      return undefined;
    }
  }

  private reset(): void {
    this.result.etp = undefined;
    this.result.pposTimeToRef1 = undefined;
    this.result.pposTimeToRef2 = undefined;
    this.result.etpTimeToRef1 = undefined;
    this.result.etpTimeToRef2 = undefined;
  }

  async resetAndRecompute() {
    this.reset();
    this.inhibitAutoRecompute = true;
    await Wait.awaitDelay(2000);
    this.updateEtp();
    this.inhibitAutoRecompute = false;
  }

  isComputed(): boolean {
    return this.result.etp !== undefined;
  }

  get(): ReturnType<Geometry['pointFromEndOfPath']> | undefined {
    return this.result.etp;
  }

  setPilotEnteredReferenceFix1(fix: Fix | undefined): void {
    this.pilotEnteredReferenceFix1 = fix;
    this.reset();
  }

  setPilotEnteredReferenceFix2(fix: Fix | undefined): void {
    this.pilotEnteredReferenceFix2 = fix;
    this.reset();
  }

  setPilotEnteredWindToReferenceFix1(windVector: Float64Array | undefined): void {
    this.pilotEnteredWindToReferenceFix1 = windVector;
    this.reset();
  }

  setPilotEnteredWindToReferenceFix2(windVector: Float64Array | undefined): void {
    this.pilotEnteredWindToReferenceFix2 = windVector;
    this.reset();
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
    return this.result.pposTimeToRef1;
  }

  get pposTimeToReferenceFix2(): number | undefined {
    return this.result.pposTimeToRef2;
  }

  get etpBearingToReferenceFix1(): number | undefined {
    if (!this.result.etp || !this.referenceFix1) {
      return undefined;
    }

    return bearingTo(this.result.etp[0], this.referenceFix1.location);
  }

  get etpBearingToReferenceFix2(): number | undefined {
    if (!this.result.etp || !this.referenceFix2) {
      return undefined;
    }

    return bearingTo(this.result.etp[0], this.referenceFix2.location);
  }

  get etpDistanceToReferenceFix1(): number | undefined {
    if (!this.result.etp || !this.referenceFix1) {
      return undefined;
    }

    return distanceTo(this.result.etp[0], this.referenceFix1.location);
  }

  get etpDistanceToReferenceFix2(): number | undefined {
    if (!this.result.etp || !this.referenceFix2) {
      return undefined;
    }

    return distanceTo(this.result.etp[0], this.referenceFix2.location);
  }

  get etpTimeToReferenceFix1(): number | undefined {
    return this.result.etpTimeToRef1;
  }

  get etpTimeToReferenceFix2(): number | undefined {
    return this.result.etpTimeToRef2;
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

  /**
   * Computes the time to fly from one coordinate to another, taking into account the wind and true airspeed.
   * @param from the starting coordinates
   * @param to the destination coordinates
   * @param wind the wind vector as a Float64Array
   * @param tas the true airspeed in knots
   * @returns the time in hours to fly from `from` to `to`
   */
  private static timeTo(from: Coordinates, to: Coordinates, wind: Float64Array, tas: number): number {
    const distance = distanceTo(from, to);
    const bearing = bearingTo(from, to);

    const tailwindComponent =
      -Vec2Math.abs(wind) * Math.cos(bearing * MathUtils.DEGREES_TO_RADIANS - Vec2Math.theta(wind));

    return distance / (tas + tailwindComponent);
  }
}
