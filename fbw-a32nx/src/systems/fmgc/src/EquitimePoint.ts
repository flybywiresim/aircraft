// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import { Airport, Fix, MathUtils } from '@flybywiresim/fbw-sdk';
import { Accessible, AeroMath, ClockEvents, ConsumerValue, EventBus, UnitType, Value } from '@microsoft/msfs-sdk';
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
import { areWindVectorsTheSame, cloneWindVector, WindVector } from './flightplanning/data/wind';
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
  /**
   * In miliseconds.
   */
  private static readonly MINIMUM_RECOMPUTE_INTERVAL = 4000;

  private static readonly DefaultWind: WindVector = { magnitude: 0, direction: 0 };

  private static readonly AbsoluteToleranceSeconds = 10;

  private static readonly WindVectorCache = { direction: 0, magnitude: 0 };

  private static readonly WindMeasurementCache: WindMeasurement = {
    altitude: undefined,
    vector: cloneWindVector(WindUtils.undefinedWindVector),
  };

  private geometry: Geometry | undefined = undefined;

  private pilotEnteredReferenceFix1: Fix | undefined;
  private pilotEnteredReferenceFix2: Fix | undefined;

  private originAirport: Airport | undefined;
  private destinationAirport: Airport | undefined;

  private readonly isWindVectorToFix1Entered = Value.create(false);
  private readonly pilotEnteredWindToReferenceFix1: WindVector = cloneWindVector(WindUtils.undefinedWindVector);
  private readonly isWindVectorToFix2Entered = Value.create(false);
  private readonly pilotEnteredWindToReferenceFix2: WindVector = cloneWindVector(WindUtils.undefinedWindVector);

  private readonly result: Partial<EquitimePointInterface> = {};

  private readonly flightPhase = ConsumerValue.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly clock = ConsumerValue.create(this.bus.getSubscriber<ClockEvents>().on('realTime'), 0);

  private readonly selectedSpeed = ConsumerValue.create(
    this.bus.getSubscriber<GuidanceToFmsEvents>().on('fg_selected_speed'),
    null,
  );

  /**
   * The last time which the ETP was recomputed in miliseconds since epoch.
   */
  private lastEtpRecomputeTime: number | null = null;

  private readonly isEtpRecomputingDueToInputChange = Value.create(false);

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
    const plan = this.flightPlanService.hasActive ? this.flightPlanService.get(FlightPlanIndex.Active) : null;
    const origin = plan?.originAirport;
    const dest = plan?.destinationAirport;
    const ref1 = this.referenceFix1;
    const ref2 = this.referenceFix2;
    const ppos = this.navigation.getPpos();
    const cruiseLevel = plan?.performanceData.cruiseFlightLevel.get();
    const predictions = this.guidanceController.vnavDriver.mcduProfile;
    const { managedCruiseSpeed, managedCruiseSpeedMach } =
      this.guidanceController.verticalProfileComputationParametersObserver.get();
    const time = this.clock.get();

    // Reset FIX data and ETP if the airport has changed. e.g. flpln revisions.
    if (this.originAirport != origin) {
      this.onFixChange(1);
    } else if (this.destinationAirport != dest) {
      this.onFixChange(2);
    } else {
      if (!ref1 || !ref2 || !ppos || !plan || !this.geometry || !cruiseLevel || !predictions?.isReadyToDisplay) {
        this.reset(false, time);
        this.resetPposTimeToRef(undefined);
        return;
      }

      if (
        this.lastEtpRecomputeTime !== null &&
        time - this.lastEtpRecomputeTime >= EquitimePoint.MINIMUM_RECOMPUTE_INTERVAL + Math.random() * 1000
      ) {
        const cruiseAltitude = cruiseLevel * 100;
        const managedCruiseCas = Math.min(
          AeroMath.casToTasIsa(
            UnitType.KNOT.convertTo(managedCruiseSpeed, UnitType.MPS),
            UnitType.FOOT.convertTo(cruiseAltitude, UnitType.METER),
          ),
          AeroMath.machToTasIsa(managedCruiseSpeedMach, UnitType.FOOT.convertTo(cruiseAltitude, UnitType.METER)),
        );
        const cruisePhase = this.flightPhase.get() === FmgcFlightPhase.Cruise;
        const cas = cruisePhase ? this.selectedSpeed.get() ?? managedCruiseCas : managedCruiseCas;
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
        this.result.pposTimeToRef1 = cruisePhase
          ? EquitimePoint.timeTo(ppos, ref1.location, pposWind, this.pilotEnteredWindToReferenceFix1, tas)
          : undefined;
        this.result.pposTimeToRef2 = cruisePhase
          ? EquitimePoint.timeTo(ppos, ref2.location, pposWind, this.pilotEnteredWindToReferenceFix2, tas)
          : undefined;
        let numIterations = 0;
        let etpAlongTrackDistanceGuess = MathUtils.clamp(
          distanceTo(ref1.location, ref2.location) / 2,
          0,
          this.geometry.legs.get(plan.activeLegIndex - 1)?.calculated?.cumulativeDistanceToEndWithTransitions ??
            Infinity,
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
            this.reset(false, time);
            return undefined;
          }

          const [etpLla, _] = this.result.etp;

          const windAtEtp = predictions.winds.getCruiseWind(
            etpAlongTrackDistanceGuess,
            0,
            cruiseAltitude,
            EquitimePoint.WindVectorCache,
          );

          this.result.etpTimeToRef1 = EquitimePoint.timeTo(
            etpLla,
            ref1.location,
            windAtEtp,
            this.pilotEnteredWindToReferenceFix1,
            tas,
          );
          this.result.etpTimeToRef2 = EquitimePoint.timeTo(
            etpLla,
            ref2.location,
            windAtEtp,
            this.pilotEnteredWindToReferenceFix2,
            tas,
          );

          etpAlongTrackDistanceGuess -= ((this.result.etpTimeToRef2 - this.result.etpTimeToRef1) * tas) / 2;
        } while (
          numIterations++ < 10 &&
          3600 * Math.abs(this.result.etpTimeToRef2 - this.result.etpTimeToRef1) >
            EquitimePoint.AbsoluteToleranceSeconds
        );

        if (numIterations >= 10) {
          this.reset(false, time);
          return undefined;
        }

        const [_, distanceFromLegTermination, legIndex] = this.result.etp;
        const legPredictions = predictions.waypointPredictions.get(legIndex);

        if (!legPredictions) {
          this.reset(false, time);
          return;
        }

        this.result.pposDistanceToEtp = legPredictions.distanceFromAircraft - distanceFromLegTermination;
        this.result.pposTimeToEtp = predictions.interpolateTimeAtDistance(this.result.pposDistanceToEtp) / 3600;
        this.isEtpRecomputingDueToInputChange.set(false);
        this.lastEtpRecomputeTime = time;
      }
    }
    this.originAirport = origin;
    this.destinationAirport = dest;
  }

  private reset(cleanRecompute = true, at = this.clock.get()): void {
    this.result.etp = undefined;
    this.result.etpTimeToRef1 = undefined;
    this.result.etpTimeToRef2 = undefined;
    this.result.pposDistanceToEtp = undefined;
    this.result.pposTimeToEtp = undefined;
    this.lastEtpRecomputeTime = at;
    this.isEtpRecomputingDueToInputChange.set(cleanRecompute);
  }

  private resetPposTimeToRef(fix: 1 | 2 | undefined) {
    if (fix === undefined) {
      this.result.pposTimeToRef1 = undefined;
      this.result.pposTimeToRef2 = undefined;
    } else if (fix === 1) {
      this.result.pposTimeToRef1 = undefined;
    } else {
      this.result.pposTimeToRef2 = undefined;
    }
  }

  isComputed(): boolean {
    return this.result.etp !== undefined;
  }

  get(): ReturnType<Geometry['pointFromEndOfPath']> | undefined {
    return this.result.etp;
  }

  async setPilotEnteredReferenceFix1(fix: Fix | undefined): Promise<void> {
    if ((!fix && !this.isReferenceFix1PilotEntered) || (fix && fix.databaseId === this.referenceFix2?.databaseId)) {
      return Promise.reject(new FmsError(FmsErrorType.NotAllowed));
    }
    if (fix !== this.pilotEnteredReferenceFix1) {
      this.pilotEnteredReferenceFix1 = fix;
      this.onFixChange(1);
    }
  }

  async setPilotEnteredReferenceFix2(fix: Fix | undefined): Promise<void> {
    if ((!fix && !this.isReferenceFix2PilotEntered) || (fix && fix.databaseId === this.referenceFix1?.databaseId)) {
      return Promise.reject(new FmsError(FmsErrorType.NotAllowed));
    }
    if (fix !== this.pilotEnteredReferenceFix2) {
      this.pilotEnteredReferenceFix2 = fix;
      this.onFixChange(2);
    }
  }

  async setPilotEnteredWindToReferenceFix1(windVector: WindVector | undefined): Promise<void> {
    if (this.referenceFix1 !== undefined && !areWindVectorsTheSame(this.pilotEnteredWindToReferenceFix1, windVector)) {
      this.setFixWindVector(1, windVector);
      this.resetPposTimeToRef(1);
      this.reset(true);
    }
  }

  async setPilotEnteredWindToReferenceFix2(windVector: WindVector | undefined): Promise<void> {
    if (this.referenceFix2 !== undefined && !areWindVectorsTheSame(this.pilotEnteredWindToReferenceFix1, windVector)) {
      this.setFixWindVector(2, windVector);
      this.resetPposTimeToRef(2);
      this.reset(true);
    }
  }

  get referenceFix1(): Fix | undefined {
    return this.pilotEnteredReferenceFix1 ?? this.originAirport;
  }

  get isReferenceFix1PilotEntered(): boolean {
    return this.pilotEnteredReferenceFix1 !== undefined;
  }

  get referenceFix2(): Fix | undefined {
    return this.pilotEnteredReferenceFix2 ?? this.destinationAirport;
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

  getWindToReferenceFix1(): WindVector {
    return this.pilotEnteredWindToReferenceFix1;
  }

  getWindToReferenceFix2(): WindVector {
    return this.pilotEnteredWindToReferenceFix2;
  }

  getIsWindVectorToFix1Entered(): Accessible<boolean> {
    return this.isWindVectorToFix1Entered;
  }

  getIsWindVectorToFix2Entered(): Accessible<boolean> {
    return this.isWindVectorToFix2Entered;
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
   * Gets whether a ETP recomputing is in progress due to a change in the input data.
   */
  isEtpRecomputing(): Accessible<boolean> {
    return this.isEtpRecomputingDueToInputChange;
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

  private setFixWindVector(fix: 1 | 2, windVector: WindVector | undefined) {
    const fix1 = fix === 1;
    const pilotWind = fix1 ? this.pilotEnteredWindToReferenceFix1 : this.pilotEnteredWindToReferenceFix2;
    const windEntered = fix1 ? this.isWindVectorToFix1Entered : this.isWindVectorToFix2Entered;
    pilotWind.direction = windVector?.direction;
    pilotWind.magnitude = windVector?.magnitude;
    windEntered.set(windVector !== undefined);
  }

  private onFixChange(fix: 1 | 2) {
    this.setFixWindVector(fix, undefined);
    this.reset(true);
    this.resetPposTimeToRef(fix);
  }
}
