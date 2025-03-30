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
import { WaypointDescriptor } from '@flybywiresim/fbw-sdk';
import { PathVector, PathVectorType } from '../PathVector';

export class CALeg extends Leg {
  public estimatedTermination: Coordinates | undefined;

  private computedPath: PathVector[] = [];

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

  private start: Coordinates;

  get terminationWaypoint(): Coordinates | undefined {
    return this.estimatedTermination;
  }

  getPathStartPoint(): Coordinates | undefined {
    return this.inboundGuidable?.getPathEndPoint();
  }

  getPathEndPoint(): Coordinates | undefined {
    return this.estimatedTermination;
  }

  get predictedPath(): PathVector[] {
    return this.computedPath;
  }

  private wasMovedByPpos = false;

  recomputeWithParameters(isActive: boolean, _tas: Knots, _gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue) {
    const afterRunway =
      this.inboundGuidable instanceof IFLeg &&
      this.inboundGuidable.metadata.flightPlanLegDefinition.waypointDescriptor === WaypointDescriptor.Runway;

    // We assign / spread properties here to avoid copying references and causing bugs
    if (isActive && !afterRunway) {
      this.wasMovedByPpos = true;

      if (!this.start) {
        this.start = { ...ppos };
      } else {
        this.start.lat = ppos.lat;
        this.start.long = ppos.long;
      }

      if (!this.estimatedTermination) {
        this.recomputeEstimatedTermination();
      }
    } else if (!this.wasMovedByPpos) {
      const newPreviousGuidableStart = this.inboundGuidable?.getPathEndPoint();

      if (newPreviousGuidableStart) {
        if (!this.start) {
          this.start = { ...newPreviousGuidableStart };
        } else {
          this.start.lat = newPreviousGuidableStart.lat;
          this.start.long = newPreviousGuidableStart.long;
        }
      }

      this.recomputeEstimatedTermination();
    }

    this.computedPath = [
      {
        type: PathVectorType.Line,
        startPoint: this.start,
        endPoint: this.getPathEndPoint(),
      },
    ];

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.computedPath.push(
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.start,
          annotation: 'CA START',
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathEndPoint(),
          annotation: 'CA END',
        },
      );
    }

    this.isComputed = true;
  }

  private recomputeEstimatedTermination() {
    const ESTIMATED_VS; // feet per minute
    const ESTIMATED_KTS; // NM per hour
    const tas = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');
    const vs = SimVar.GetSimVarValue('VARIOMETER RATE', 'feet per second');
    const minutesToAltitude;
    const presentAltitude = 0;

    // FIXME hax!
    const originAltitude = 0;
       if (this.inboundGuidable instanceof IFLeg && this.inboundGuidable.fix.icao.startsWith('A')) {
           originAltitude = (this.inboundGuidable.fix.infos as AirportInfo).oneWayRunways[0].elevation * 3.28084;
       }
    // Get VNAV profile data for initial climb before acc
       //if (tas < 100) {
           ESTIMATED_VS = 3000;
           ESTIMATED_KTS = 165;
           presentAltitude = originAltitude
       //}
    else if (tas >= 100 && vs > 7) {
           ESTIMATED_KTS = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
           ESTIMATED_VS = SimVar.GetSimVarValue('VARIOMETER RATE', 'feet per second')*60;
           presentAltitude = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
    }
    
    // Calculate values if target alt below acc alt

    //if (this.altitude <= originAltitude+1500){
      minutesToAltitude = (this.altitude - presentAltitude) / ESTIMATED_VS; // minutes
      distanceToTermination = (minutesToAltitude / 60) * ESTIMATED_KTS; // NM
    }
/*
    // Calculate values if target alt above acc alt in acc segment

    else if (!this.wasMovedByPpos && this.extraLength > 0) {
      //Calculating values for initial climb segment
      ESTIMATED_VS = 2000;
      ESTIMATED_KTS = 175;
      minutesToAltitude = (originAltitude+1500 - Math.max(0, originAltitude)) / ESTIMATED_VS; // minutes
      distanceToTermination = (minutesToAltitude / 60) * ESTIMATED_KTS; // NM

      //Checking whether target alt is in acc segment
      if (this.altitude > originAltitude+1500 && this.altitude < cleanclimbalt){}
      //Checking whether acc alt in in clean climb segment
      else if (this.altitude >= cleanclimbalt){}
      
    }
*/
    //this.estimatedTermination = placeBearingDistance(this.start, this.course, distanceToTermination);
    this.estimatedTermination = placeBearingDistance(ppos, this.course, distanceToTermination);
  }

  get inboundCourse(): Degrees {
    return this.course;
  }

  get outboundCourse(): Degrees {
    return this.course;
  }

  getDistanceToGo(ppos: Coordinates): NauticalMiles {
    return courseToFixDistanceToGo(ppos, this.course, this.estimatedTermination);
  }

  getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, _tas: Knots): GuidanceParameters | undefined {
    // FIXME: should be just track guidance, no xtk
    // (the start of the predicted path should also float with ppos once active, along with the transition to the leg)
    // return {
    //    law: ControlLaw.TRACK,
    //    course: this.course,
    // };
    return courseToFixGuidance(ppos, trueTrack, this.course, this.estimatedTermination);
  }

  getNominalRollAngle(_gs: Knots): Degrees {
    return undefined;
  }

  get distanceToTermination(): NauticalMiles {
    const startPoint = this.getPathStartPoint();

    return distanceTo(startPoint, this.estimatedTermination);
  }

  isAbeam(_ppos: Coordinates): boolean {
    return false;
  }

  get repr(): string {
    return `CA(${this.course.toFixed(1)}T) TO ${Math.round(this.altitude)} FT`;
  }
}
