// @ts-strict-ignore
// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { distanceTo, placeBearingDistance } from 'msfs-geo';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { Runway, WaypointDescriptor } from '@flybywiresim/fbw-sdk';
import { isOnGround } from '@shared/flightphase';
import { PathVector, PathVectorType } from '../PathVector';
import {
  alongTrackDistance,
  DepartureReference,
  getIndicatedAltitude,
  getRunwayDepartureReference,
  hasReachedAltitude,
  isRunwayFix,
  predictAltitudeTermination,
} from './AltitudeTerminationPrediction';

export class CALeg extends Leg {
  private static readonly DEFAULT_CLIMB_RATE = 2000;
  private static readonly DEFAULT_CLIMB_SPEED = 175;

  public estimatedTermination: Coordinates | undefined;
  private computedPath: PathVector[] = [];
  /** Start of the drawn path. Not necessarily the origin of the prediction. */
  private start: Coordinates;
  private altitudeReached = false;
  private wasMovedByPpos = false;
  /** Set when this leg directly follows the runway: the climb is predicted from the runway end. */
  private departureRunway: Runway | undefined;
  private departure: DepartureReference | undefined;

  constructor(
    public readonly course: Degrees,
    public readonly altitude: Feet,
    public readonly metadata: Readonly<LegMetadata>,
    segment: SegmentType,
    private readonly extraLength?: NauticalMiles,
  ) {
    super();
    this.segment = segment;
  }

  get terminationWaypoint(): Coordinates | undefined {
    return this.estimatedTermination;
  }
  getPathStartPoint(): Coordinates | undefined {
    return this.departure?.end ?? this.inboundGuidable?.getPathEndPoint();
  }
  getPathEndPoint(): Coordinates | undefined {
    return this.estimatedTermination;
  }

  public get disableAutomaticSequencing(): boolean {
    return !this.altitudeReached;
  }
  get predictedPath(): PathVector[] {
    return this.computedPath;
  }

  recomputeWithParameters(isActive: boolean, _tas: Knots, gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue) {
    const inbound = this.inboundGuidable;
    const afterRunway =
      inbound instanceof IFLeg &&
      inbound.metadata.flightPlanLegDefinition.waypointDescriptor === WaypointDescriptor.Runway;
    const inFlight = !isOnGround();

    // The runway navdata object is the fix of the runway IF leg.
    this.updateDeparture(afterRunway && inbound instanceof IFLeg ? inbound.fix : undefined);

    // TODO: hasReachedAltitude() can fire while still on the ground (bad QNH, or a target
    // altitude at/below field elevation), sequencing the leg before takeoff. Not changed in this
    // PR — flagged during review as a follow-up, e.g. require !isOnGround() here too.
    if (!this.altitudeReached && isActive && hasReachedAltitude(this.altitude)) {
      this.altitudeReached = true;
      this.start = { ...ppos };
      this.estimatedTermination = { ...ppos };
    } else if (!this.altitudeReached && isActive && !afterRunway) {
      this.wasMovedByPpos = true;

      if (!this.start) {
        this.start = { ...ppos };
      } else {
        this.start.lat = ppos.lat;
        this.start.long = ppos.long;
      }

      // Keep predicting while airborne (also in level flight); on the ground only make sure a prediction exists.
      if (inFlight || !this.estimatedTermination) {
        this.recomputeEstimatedTermination(isActive, inFlight, ppos, gs);
      }
    } else if (!this.altitudeReached && !this.wasMovedByPpos) {
      // After the runway the leg starts at the runway end, not at the runway fix (the threshold).
      const newStart = this.departure?.end ?? this.inboundGuidable?.getPathEndPoint();
      let startChanged = false;

      if (newStart) {
        if (!this.start || this.start.lat !== newStart.lat || this.start.long !== newStart.long) {
          this.start = { ...newStart };
          startChanged = true;
        }
      }

      if (this.start && (startChanged || !this.estimatedTermination || (isActive && inFlight))) {
        this.recomputeEstimatedTermination(isActive, inFlight, ppos, gs);
      }
    }

    if (this.start && this.getPathEndPoint()) {
      this.computedPath = [
        {
          type: PathVectorType.Line,
          startPoint: this.start,
          endPoint: this.getPathEndPoint() as Coordinates,
        },
      ];

      if (LnavConfig.DEBUG_PREDICTED_PATH) {
        this.computedPath.push(
          { type: PathVectorType.DebugPoint, startPoint: this.start, annotation: 'CA START' },
          { type: PathVectorType.DebugPoint, startPoint: this.getPathEndPoint() as Coordinates, annotation: 'CA END' },
        );
      }
    }

    this.isComputed = true;
  }

  private updateDeparture(runwayFix: unknown) {
    const runway = isRunwayFix(runwayFix) ? runwayFix : undefined;

    if (runway !== this.departureRunway) {
      this.departureRunway = runway;
      this.departure = runway ? getRunwayDepartureReference(runway, this.course) : undefined;
    }
  }

  /** Decides where the prediction starts and which altitude it starts from. */
  private getPredictionReference(
    isActive: boolean,
    inFlight: boolean,
    ppos: Coordinates,
  ): { origin: Coordinates; altitude: number } | undefined {
    const indicatedAltitude = getIndicatedAltitude();

    if (this.departure) {
      // On the ground, or airborne but still before the runway end: the climb is measured from the runway end
      // and the runway elevation, independent of the altimeter setting.
      const beyondRunwayEnd = isActive && inFlight && alongTrackDistance(this.departure.end, this.course, ppos) >= 0;

      if (!beyondRunwayEnd) {
        const altitude = this.departure.elevation ?? indicatedAltitude;
        return altitude === undefined ? undefined : { origin: this.departure.end, altitude };
      }
    }

    if (indicatedAltitude === undefined) {
      return undefined;
    }

    // The remaining altitude is measured from the current altitude, so once airborne the prediction has to
    // originate at ppos. The drawn path still begins at this.start.
    return { origin: isActive && inFlight ? ppos : this.start, altitude: indicatedAltitude };
  }

  private recomputeEstimatedTermination(isActive: boolean, inFlight: boolean, ppos: Coordinates, groundSpeed: Knots) {
    const reference = this.getPredictionReference(isActive, inFlight, ppos);
    if (!reference) {
      return;
    }

    const predictedTermination = predictAltitudeTermination(
      reference.origin,
      reference.altitude,
      this.altitude,
      this.course,
      groundSpeed,
      {
        defaultClimbRate: CALeg.DEFAULT_CLIMB_RATE,
        defaultSpeed: CALeg.DEFAULT_CLIMB_SPEED,
        useDefaultClimbRate: true,
        ignoreInstantaneousVS: isOnGround(),
      },
    );

    if (!predictedTermination) {
      return;
    }

    this.estimatedTermination = predictedTermination;

    if (!this.wasMovedByPpos && this.extraLength && this.extraLength > 0) {
      this.estimatedTermination = placeBearingDistance(this.estimatedTermination, this.course, this.extraLength);
    }
  }

  get inboundCourse(): Degrees {
    return this.course;
  }
  get outboundCourse(): Degrees {
    return this.course;
  }
  getDistanceToGo(ppos: Coordinates): NauticalMiles {
    if (!this.estimatedTermination) return 0;
    return courseToFixDistanceToGo(ppos, this.course, this.estimatedTermination);
  }
  getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, _tas: Knots): GuidanceParameters | undefined {
    if (!this.estimatedTermination) return undefined;
    return courseToFixGuidance(ppos, trueTrack, this.course, this.estimatedTermination);
  }
  getNominalRollAngle(_gs: Knots): Degrees {
    return undefined;
  }
  get distanceToTermination(): NauticalMiles {
    const start = this.getPathStartPoint();
    if (!start || !this.estimatedTermination) return 0;
    return distanceTo(start, this.estimatedTermination);
  }
  isAbeam(_ppos: Coordinates): boolean {
    return false;
  }
  get repr(): string {
    return `CA(${this.course.toFixed(1)}T) TO ${Math.round(this.altitude)} FT`;
  }
}
