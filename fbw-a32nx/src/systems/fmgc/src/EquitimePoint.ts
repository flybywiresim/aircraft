// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import { Fix, MathUtils } from '@flybywiresim/fbw-sdk';
import { AeroMath, ClockEvents, ConsumerValue, EventBus, UnitType } from '@microsoft/msfs-sdk';
import { FlightPlanInterface } from './flightplanning/FlightPlanInterface';
import { bearingTo, Coordinates, distanceTo } from 'msfs-geo';
import { Geometry } from './guidance/Geometry';
import { FlightPlanIndex } from './flightplanning/FlightPlanManager';
import { FlightPhaseManagerEvents } from './flightphase/FlightPhaseManager';
import { FmgcFlightPhase } from '@shared/flightphase';
import { GuidanceController } from './guidance/GuidanceController';
import { NavigationProvider } from './navigation/NavigationProvider';
import { WindMeasurement } from './guidance/vnav/wind/WindObserver';
import { WindUtils } from './guidance/vnav/wind/WindUtils';
import { WindVector } from './flightplanning/data/wind';
import { FmsError, FmsErrorType } from './FmsError';
import { GuidanceToFmsEvents } from './events/GuidanceToFmsEvents';

export interface EquitimePointInterface {
  etpTimeToRef1: number;
  etpTimeToRef2: number;
  pposTimeToRef1: number;
  pposTimeToRef2: number;
  pposDistanceToEtp: number;
  pposTimeToEtp: number;
  etp: ReturnType<Geometry['pointFromEndOfPath']>;
}

export class EquitimePoint {
  private static readonly DefaultWind: WindVector = { magnitude: 0, direction: 0 };

  private static readonly AbsoluteToleranceSeconds = 10;

  private static readonly WindVectorCache = { direction: 0, magnitude: 0 };

  private static readonly WindMeasurementCache: WindMeasurement = {
    altitude: undefined,
    vector: { direction: undefined, magnitude: undefined },
  };

  private geometry: Geometry | undefined = undefined;

  private pilotEnteredReferenceFix1: Fix | undefined;
  private pilotEnteredReferenceFix2: Fix | undefined;
  private pilotEnteredWindToReferenceFix1: WindVector | undefined;
  private pilotEnteredWindToReferenceFix2: WindVector | undefined;

  private result: Partial<EquitimePointInterface> = {};

  private readonly flightPhase = ConsumerValue.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly clock = ConsumerValue.create(this.bus.getSubscriber<ClockEvents>().on('realTime'), 0);

  private readonly selectedSpeed = ConsumerValue.create(
    this.bus.getSubscriber<GuidanceToFmsEvents>().on('fg_selected_speed'),
    null,
  );

  private lastUpdateTime: number | null = null;

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanService: FlightPlanInterface,
    private readonly navigation: NavigationProvider,
    private readonly guidanceController: GuidanceController,
  ) {}

  acceptMultipleLegGeometry(geometry: Geometry): void {
    this.geometry = geometry;
    this.updateEtp();
  }

  private updateEtp() {
    const time = this.clock.get();
    // Only update ETP every 2 seconds.
    if (this.lastUpdateTime !== null && time - this.lastUpdateTime >= 2000) {
      this.reset();

      const ref1 = this.referenceFix1;
      const ref2 = this.referenceFix2;

      const ppos = this.navigation.getPpos();
      const plan = this.flightPlanService.get(FlightPlanIndex.Active);

      const cruiseLevel = plan.performanceData.cruiseFlightLevel.get();

      const predictions = this.guidanceController.vnavDriver.mcduProfile;
      const { managedCruiseSpeed, managedCruiseSpeedMach } =
        this.guidanceController.verticalProfileComputationParametersObserver.get();

      if (!ref1 || !ref2 || !ppos || !plan || !this.geometry || !cruiseLevel || !predictions?.isReadyToDisplay) {
        return undefined;
      }

      const cruiseAltitude = cruiseLevel * 100;
      const managedCruiseCas = Math.min(
        AeroMath.casToTasIsa(
          UnitType.KNOT.convertTo(managedCruiseSpeed, UnitType.MPS),
          UnitType.FOOT.convertTo(cruiseAltitude, UnitType.METER),
        ),
        AeroMath.machToTasIsa(managedCruiseSpeedMach, UnitType.FOOT.convertTo(cruiseAltitude, UnitType.METER)),
      );
      const cas =
        this.flightPhase.get() === FmgcFlightPhase.Cruise
          ? this.selectedSpeed.get() ?? managedCruiseCas
          : managedCruiseCas;
      const tas = UnitType.MPS.convertTo(
        AeroMath.casToTasIsa(
          UnitType.KNOT.convertTo(cas, UnitType.MPS),
          UnitType.FOOT.convertTo(cruiseAltitude, UnitType.METER),
        ),
        UnitType.KNOT,
      );

      const pposWind =
        predictions.winds.getCurrentWindMeasurement(EquitimePoint.WindMeasurementCache)?.vector ??
        EquitimePoint.DefaultWind;

      // Time to reference waypoints is only computed in cruise phase
      if (this.flightPhase.get() === FmgcFlightPhase.Cruise) {
        this.result.pposTimeToRef1 = EquitimePoint.timeTo(ppos, ref1.location, pposWind, this.windToReferenceFix1, tas);
        this.result.pposTimeToRef2 = EquitimePoint.timeTo(ppos, ref2.location, pposWind, this.windToReferenceFix2, tas);
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
          false,
          'ETP',
        );

        if (!this.result.etp) {
          this.reset();
          return undefined;
        }

        const [etpLla, _] = this.result.etp;

        const windAtEtp =
          predictions.winds.getCruiseWind(
            etpAlongTrackDistanceGuess,
            0,
            cruiseAltitude,
            EquitimePoint.WindVectorCache,
          ) ?? EquitimePoint.DefaultWind;

        this.result.etpTimeToRef1 = EquitimePoint.timeTo(
          etpLla,
          ref1.location,
          windAtEtp,
          this.windToReferenceFix1,
          tas,
        );
        this.result.etpTimeToRef2 = EquitimePoint.timeTo(
          etpLla,
          ref2.location,
          windAtEtp,
          this.windToReferenceFix2,
          tas,
        );

        etpAlongTrackDistanceGuess -= ((this.result.etpTimeToRef2 - this.result.etpTimeToRef1) * tas) / 2;
      } while (
        numIterations++ < 10 &&
        3600 * Math.abs(this.result.etpTimeToRef2 - this.result.etpTimeToRef1) > EquitimePoint.AbsoluteToleranceSeconds
      );

      if (numIterations >= 10) {
        this.reset();
        return undefined;
      }

      const [_, distanceFromLegTermination, legIndex] = this.result.etp;
      const legPredictions = predictions.waypointPredictions.get(legIndex);

      if (!legPredictions) {
        this.reset();
        return;
      }

      this.result.pposDistanceToEtp = legPredictions.distanceFromAircraft - distanceFromLegTermination;
      this.result.pposTimeToEtp = predictions.interpolateTimeAtDistance(this.result.pposDistanceToEtp) / 3600;
    }
    this.lastUpdateTime = time;
  }

  private reset(): void {
    this.result.etp = undefined;
    this.result.pposTimeToRef1 = undefined;
    this.result.pposTimeToRef2 = undefined;
    this.result.etpTimeToRef1 = undefined;
    this.result.etpTimeToRef2 = undefined;
    this.result.pposDistanceToEtp = undefined;
    this.result.pposTimeToEtp = undefined;
  }

  private resetAndRecompute() {
    this.reset();
    this.lastUpdateTime = null;
  }

  isComputed(): boolean {
    return this.result.etp !== undefined;
  }

  get(): ReturnType<Geometry['pointFromEndOfPath']> | undefined {
    return this.result.etp;
  }

  async setPilotEnteredReferenceFix1(fix: Fix | undefined): Promise<void> {
    if (fix && fix.databaseId === this.pilotEnteredReferenceFix2?.databaseId) {
      throw new FmsError(FmsErrorType.NotAllowed);
    }
    this.pilotEnteredReferenceFix1 = fix;
    this.resetAndRecompute();
  }

  async setPilotEnteredReferenceFix2(fix: Fix | undefined): Promise<void> {
    if (fix && fix.databaseId === this.pilotEnteredReferenceFix1?.databaseId) {
      throw new FmsError(FmsErrorType.NotAllowed);
    }
    this.pilotEnteredReferenceFix2 = fix;
    this.resetAndRecompute();
  }

  async setPilotEnteredWindToReferenceFix1(windVector: WindVector | undefined): Promise<void> {
    this.pilotEnteredWindToReferenceFix1 = windVector;
    this.resetAndRecompute();
  }

  async setPilotEnteredWindToReferenceFix2(windVector: WindVector | undefined): Promise<void> {
    this.pilotEnteredWindToReferenceFix2 = windVector;
    this.resetAndRecompute();
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

  /** Bearing from the current A/C position to reference fix 1, in degrees true, or undefined */
  get pposBearingToReferenceFix1(): number | undefined {
    const ppos = this.navigation.getPpos();

    if (!ppos || !this.referenceFix1) {
      return undefined;
    }

    return bearingTo(ppos, this.referenceFix1.location);
  }

  /** Bearing from the current A/C position to reference fix 2, in degrees true, or undefined */
  get pposBearingToReferenceFix2(): number | undefined {
    const ppos = this.navigation.getPpos();

    if (!ppos || !this.referenceFix2) {
      return undefined;
    }

    return bearingTo(ppos, this.referenceFix2.location);
  }

  /** Distance from the current A/C position to reference fix 1, in nautical miles, or undefined */
  get pposDistanceToReferenceFix1(): number | undefined {
    const ppos = this.navigation.getPpos();

    if (!ppos || !this.referenceFix1) {
      return undefined;
    }

    return distanceTo(ppos, this.referenceFix1.location);
  }

  /** Distance from the current A/C position to reference fix 2, in nautical miles, or undefined */
  get pposDistanceToReferenceFix2(): number | undefined {
    const ppos = this.navigation.getPpos();

    if (!ppos || !this.referenceFix2) {
      return undefined;
    }

    return distanceTo(ppos, this.referenceFix2.location);
  }

  /** Time in hours to reach reference fix 1 from the current A/C position, or undefined */
  get pposTimeToReferenceFix1(): number | undefined {
    return this.result.pposTimeToRef1;
  }

  /** Time in hours to reach reference fix 2 from the current A/C position, or undefined */
  get pposTimeToReferenceFix2(): number | undefined {
    return this.result.pposTimeToRef2;
  }

  /** Bearing from the ETP to reference fix 1, in degrees true, or undefined */
  get etpBearingToReferenceFix1(): number | undefined {
    if (!this.result.etp || !this.referenceFix1) {
      return undefined;
    }

    return bearingTo(this.result.etp[0], this.referenceFix1.location);
  }

  /** Bearing from the ETP to reference fix 2, in degrees true, or undefined */
  get etpBearingToReferenceFix2(): number | undefined {
    if (!this.result.etp || !this.referenceFix2) {
      return undefined;
    }

    return bearingTo(this.result.etp[0], this.referenceFix2.location);
  }

  /** Distance from the ETP to reference fix 1, in nautical miles, or undefined */
  get etpDistanceToReferenceFix1(): number | undefined {
    if (!this.result.etp || !this.referenceFix1) {
      return undefined;
    }

    return distanceTo(this.result.etp[0], this.referenceFix1.location);
  }

  /** Distance from the ETP to reference fix 2, in nautical miles, or undefined */
  get etpDistanceToReferenceFix2(): number | undefined {
    if (!this.result.etp || !this.referenceFix2) {
      return undefined;
    }

    return distanceTo(this.result.etp[0], this.referenceFix2.location);
  }

  /** Time from the ETP to reference fix 2, in hours, or undefined */
  get etpTimeToReferenceFix1(): number | undefined {
    return this.result.etpTimeToRef1;
  }

  /** Time from the ETP to reference fix 2, in hours, or undefined */
  get etpTimeToReferenceFix2(): number | undefined {
    return this.result.etpTimeToRef2;
  }

  get windToReferenceFix1(): WindVector {
    return this.pilotEnteredWindToReferenceFix1 ?? EquitimePoint.DefaultWind;
  }

  get windToReferenceFix2(): WindVector {
    return this.pilotEnteredWindToReferenceFix2 ?? EquitimePoint.DefaultWind;
  }

  get isWindToReferenceFix1PilotEntered(): boolean {
    return this.pilotEnteredWindToReferenceFix1 !== undefined;
  }

  get isWindToReferenceFix2PilotEntered(): boolean {
    return this.pilotEnteredWindToReferenceFix2 !== undefined;
  }

  /** Distance along the flight plan from the present position to the ETP, or undefined */
  get pposDistanceToEtp(): number | undefined {
    return this.result.pposDistanceToEtp;
  }

  /** Time in hours to reach the ETP from the current A/C position following the flight plan, or undefined */
  get pposTimeToEtp(): number | undefined {
    return this.result.pposTimeToEtp;
  }

  /**
   * Computes the time to fly from one coordinate to another, taking into account the wind and true airspeed.
   * @param from the starting coordinates
   * @param to the destination coordinates
   * @param toWind the wind vector
   * @param tas the true airspeed in knots
   * @returns the time in hours to fly from `from` to `to`
   */
  private static timeTo(
    from: Coordinates,
    to: Coordinates,
    fromWind: WindVector,
    toWind: WindVector,
    tas: number,
  ): number {
    const distance = distanceTo(from, to);
    const bearing = bearingTo(from, to);

    const fromTailwindComponent = WindUtils.computeTailwindComponent(fromWind, bearing);
    const toTailwindComponent = WindUtils.computeTailwindComponent(toWind, bearing);

    if (fromTailwindComponent === toTailwindComponent) {
      return distance / (tas + fromTailwindComponent);
    } else {
      return (
        (distance / (toTailwindComponent - fromTailwindComponent)) *
        Math.log((tas + toTailwindComponent) / (tas + fromTailwindComponent))
      );
    }
  }
}
