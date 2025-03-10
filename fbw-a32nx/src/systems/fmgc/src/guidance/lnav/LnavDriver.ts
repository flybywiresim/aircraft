// Copyright (c) 2021-2024 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ControlLaw } from '@shared/autopilot';
import { Arinc429Register, Constants, LegType, MathUtils, TurnDirection } from '@flybywiresim/fbw-sdk';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { PathCaptureTransition } from '@fmgc/guidance/lnav/transitions/PathCaptureTransition';
import { CourseCaptureTransition } from '@fmgc/guidance/lnav/transitions/CourseCaptureTransition';
import { GuidanceConstants } from '@fmgc/guidance/GuidanceConstants';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { distanceTo } from 'msfs-geo';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { GuidanceController } from '../GuidanceController';
import { GuidanceComponent } from '../GuidanceComponent';
import { FlightPlanLeg, isDiscontinuity } from '../../flightplanning/legs/FlightPlanLeg';

/**
 * Represents the current turn state of the LNAV driver
 */
export enum LnavTurnState {
  /**
   * No turn direction is being forced
   */
  Normal,

  /**
   * A left turn is being forced using phi_command
   */
  ForceLeftTurn,

  /**
   * A right turn is being forced using phi_command
   */
  ForceRightTurn,
}

export class LnavDriver implements GuidanceComponent {
  private static readonly NavActiveCaptureZone = 1.0;

  private guidanceController: GuidanceController;

  private lastAvail: boolean;

  private lastLaw: ControlLaw;

  public lastXTE: number;

  private lastTAE: number;

  private lastPhi: number;

  private lastNavCaptureCondition: boolean;

  public turnState = LnavTurnState.Normal;

  public ppos: LatLongAlt = new LatLongAlt();

  private register = Arinc429Register.empty();

  private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

  constructor(
    private readonly flightPlanService: FlightPlanService,
    guidanceController: GuidanceController,
    private readonly acConfig: AircraftConfig,
  ) {
    this.guidanceController = guidanceController;
    this.lastAvail = null;
    this.lastLaw = null;
    this.lastXTE = null;
    this.lastTAE = null;
    this.lastPhi = null;
  }

  init(): void {
    console.log('[FMGC/Guidance] LnavDriver initialized!');
  }

  update(_: number): void {
    let available = false;

    // TODO FIXME: Use FM position
    this.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
    this.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

    const trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree');

    const geometry = this.guidanceController.activeGeometry;
    const activeLegIdx = this.guidanceController.activeLegIndex;

    // this is not the correct groundspeed to use, but it will suffice for now
    const tas = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    if (geometry && geometry.legs.size > 0) {
      const dtg = geometry.getDistanceToGo(this.guidanceController.activeLegIndex, this.ppos);

      const activeLegAlongTrackCompletePathDtg = this.computeAlongTrackDistanceToGo(geometry, activeLegIdx, trueTrack);
      if (
        activeLegAlongTrackCompletePathDtg === undefined &&
        this.guidanceController.activeLegAlongTrackCompletePathDtg !== undefined
      ) {
        console.log('[FMS/LNAV] No reference leg found to compute alongTrackDistanceToGo');
      }

      this.guidanceController.activeLegAlongTrackCompletePathDtg = activeLegAlongTrackCompletePathDtg;

      const inboundTrans = geometry.transitions.get(activeLegIdx - 1);
      const activeLeg = geometry.legs.get(activeLegIdx);
      const outboundTrans = geometry.transitions.get(activeLegIdx) ? geometry.transitions.get(activeLegIdx) : null;

      if (!activeLeg) {
        if (LnavConfig.DEBUG_GUIDANCE) {
          console.log('[FMS/LNAV] No leg at activeLegIdx!');
        }
        return;
      }

      let completeDisplayLegPathDtg;
      if (inboundTrans instanceof FixedRadiusTransition && !inboundTrans.isNull) {
        if (inboundTrans.isAbeam(this.ppos)) {
          const inboundHalfDistance = inboundTrans.distance / 2;
          const inboundDtg = inboundTrans.getDistanceToGo(this.ppos);

          if (inboundDtg > inboundHalfDistance) {
            completeDisplayLegPathDtg = inboundDtg - inboundHalfDistance;
          }
        }
      }

      const completeLegPathDtg = Geometry.completeLegPathDistanceToGo(
        this.ppos,
        activeLeg,
        inboundTrans,
        outboundTrans,
      );

      this.guidanceController.activeLegDtg = dtg;
      this.guidanceController.activeLegCompleteLegPathDtg = completeLegPathDtg;
      this.guidanceController.displayActiveLegCompleteLegPathDtg = completeDisplayLegPathDtg;

      // Update activeTransIndex in GuidanceController
      if (inboundTrans && inboundTrans.isAbeam(this.ppos)) {
        this.guidanceController.activeTransIndex = activeLegIdx - 1;
      } else if (outboundTrans && outboundTrans.isAbeam(this.ppos)) {
        this.guidanceController.activeTransIndex = activeLegIdx;
      } else {
        this.guidanceController.activeTransIndex = -1;
      }

      // Pseudo waypoint sequencing

      // FIXME when we have a path model, we don't have to do any of this business ?
      // FIXME see PseudoWaypoints.ts:153 for why we also allow the previous leg
      const pseudoWaypointsOnActiveLeg = this.guidanceController.currentPseudoWaypoints.filter(
        (it) => it.alongLegIndex === activeLegIdx || it.alongLegIndex === activeLegIdx - 1,
      );

      for (const pseudoWaypoint of pseudoWaypointsOnActiveLeg) {
        // FIXME as with the hack above, we use the dtg to the intermediate point of the transition instead of
        // completeLegPathDtg, since we are pretending the previous leg is still active
        let dtgToUse;
        if (inboundTrans instanceof FixedRadiusTransition && pseudoWaypoint.alongLegIndex === activeLegIdx - 1) {
          const inboundHalfDistance = inboundTrans.distance / 2;
          const inboundDtg = inboundTrans.getDistanceToGo(this.ppos);

          if (inboundDtg > inboundHalfDistance) {
            dtgToUse = inboundDtg - inboundHalfDistance;
          } else {
            dtgToUse = completeLegPathDtg;
          }
        } else {
          dtgToUse = completeLegPathDtg;
        }

        if (pseudoWaypoint.distanceFromLegTermination >= dtgToUse) {
          this.guidanceController.sequencePseudoWaypoint(pseudoWaypoint);
        }
      }

      // Leg sequencing

      const params = geometry.getGuidanceParameters(activeLegIdx, this.ppos, trueTrack, gs, tas);

      if (params) {
        if (this.lastLaw !== params.law) {
          this.lastLaw = params.law;

          SimVar.SetSimVarValue('L:A32NX_FG_CURRENT_LATERAL_LAW', 'number', params.law);
        }

        // Send bank limit to FG
        const bankLimit = params?.phiLimit ?? maxBank(tas, false);

        SimVar.SetSimVarValue('L:A32NX_FG_PHI_LIMIT', 'Degrees', bankLimit);

        switch (params.law) {
          case ControlLaw.LATERAL_PATH: {
            let { crossTrackError, trackAngleError, phiCommand } = params;

            // Update and take into account turn state; only guide using phi during a forced turn

            if (this.turnState !== LnavTurnState.Normal) {
              if (Math.abs(trackAngleError) < GuidanceConstants.FORCED_TURN_TKAE_THRESHOLD) {
                // Stop forcing turn
                this.turnState = LnavTurnState.Normal;
              }

              const forcedTurnPhi =
                this.turnState === LnavTurnState.ForceLeftTurn ? -maxBank(tas, true) : maxBank(tas, true);

              crossTrackError = 0;
              trackAngleError = 0;
              phiCommand = forcedTurnPhi;
            }

            // Set FG inputs

            if (!this.lastAvail) {
              SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', true);
              this.lastAvail = true;
            }

            if (crossTrackError !== this.lastXTE) {
              SimVar.SetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', crossTrackError);
              this.lastXTE = crossTrackError;
            }

            if (trackAngleError !== this.lastTAE) {
              SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', trackAngleError);
              this.lastTAE = trackAngleError;
            }

            if (phiCommand !== this.lastPhi) {
              SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', phiCommand);
              this.lastPhi = phiCommand;
            }

            break;
          }
          case ControlLaw.HEADING: {
            const { heading, phiCommand: forcedPhiHeading } = params;

            if (!this.lastAvail) {
              SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', true);
              this.lastAvail = true;
            }

            if (this.lastXTE !== 0) {
              SimVar.SetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', 0);
              this.lastXTE = 0;
            }

            // Track Angle Error
            const currentHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'Degrees');
            const deltaHeading = MathUtils.diffAngle(currentHeading, heading);

            // Update and take into account turn state; only guide using phi during a forced turn

            if (this.turnState !== LnavTurnState.Normal) {
              if (Math.abs(deltaHeading) < GuidanceConstants.FORCED_TURN_TKAE_THRESHOLD) {
                // Stop forcing turn
                this.turnState = LnavTurnState.Normal;
              }

              const forcedTurnPhi =
                this.turnState === LnavTurnState.ForceLeftTurn ? -maxBank(tas, true) : maxBank(tas, true);

              if (forcedTurnPhi !== this.lastPhi) {
                SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', forcedTurnPhi);
                this.lastPhi = forcedTurnPhi;
              }

              if (this.lastTAE !== 0) {
                SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', 0);
                this.lastTAE = 0;
              }
            } else {
              if (deltaHeading !== this.lastTAE) {
                SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', deltaHeading);
                this.lastTAE = deltaHeading;
              }

              if (forcedPhiHeading !== undefined) {
                if (forcedPhiHeading !== this.lastPhi) {
                  SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', forcedPhiHeading);
                  this.lastPhi = forcedPhiHeading;
                }
              } else if (this.lastPhi !== 0) {
                SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', 0);
                this.lastPhi = 0;
              }
            }

            break;
          }
          case ControlLaw.TRACK: {
            const { course, phiCommand: forcedPhiCourse } = params;

            if (!this.lastAvail) {
              SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', true);
              this.lastAvail = true;
            }

            if (this.lastXTE !== 0) {
              SimVar.SetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', 0);
              this.lastXTE = 0;
            }

            const deltaCourse = MathUtils.diffAngle(trueTrack, course);

            if (this.turnState !== LnavTurnState.Normal) {
              if (Math.abs(deltaCourse) < GuidanceConstants.FORCED_TURN_TKAE_THRESHOLD) {
                // Stop forcing turn
                this.turnState = LnavTurnState.Normal;
              }

              const forcedTurnPhi =
                this.turnState === LnavTurnState.ForceLeftTurn ? -maxBank(tas, true) : maxBank(tas, true);

              if (forcedTurnPhi !== this.lastPhi) {
                SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', forcedTurnPhi);
                this.lastPhi = forcedTurnPhi;
              }

              if (this.lastTAE !== 0) {
                SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', 0);
                this.lastTAE = 0;
              }
            } else {
              if (deltaCourse !== this.lastTAE) {
                SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', deltaCourse);
                this.lastTAE = deltaCourse;
              }

              if (forcedPhiCourse !== undefined) {
                if (forcedPhiCourse !== this.lastPhi) {
                  SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', forcedPhiCourse);
                  this.lastPhi = forcedPhiCourse;
                }
              } else if (this.lastPhi !== 0) {
                SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', 0);
                this.lastPhi = 0;
              }
            }
            break;
          }
          default:
            break;
        }

        available = true;
      } else if (DEBUG) {
        console.error('[FMS/LNAV] Guidance parameters from geometry are null.');
      }

      if (LnavConfig.DEBUG_GUIDANCE) {
        SimVar.SetSimVarValue('L:A32NX_FM_TURN_STATE', 'Enum', this.turnState);
      }

      SimVar.SetSimVarValue('L:A32NX_GPS_WP_DISTANCE', 'nautical miles', dtg ?? 0);

      const flightPhase = SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum') as FmgcFlightPhase;

      // Sequencing

      const canSequence = !activeLeg.disableAutomaticSequencing && flightPhase >= FmgcFlightPhase.Takeoff;

      let withinSequencingArea = true;
      if (params.law === ControlLaw.LATERAL_PATH) {
        withinSequencingArea = Math.abs(params.crossTrackError) < 7 && Math.abs(params.trackAngleError) < 90;
      }

      if (
        (canSequence && withinSequencingArea && geometry.shouldSequenceLeg(activeLegIdx, this.ppos)) ||
        activeLeg.isNull
      ) {
        const outboundTransition = geometry.transitions.get(activeLegIdx);
        const nextLeg = geometry.legs.get(activeLegIdx + 1);
        const followingLeg = geometry.legs.get(activeLegIdx + 2);

        if (nextLeg) {
          this.sequenceLeg(activeLeg, outboundTransition);
          geometry.onLegSequenced(activeLeg, nextLeg, followingLeg);
        } else {
          this.sequenceDiscontinuity(activeLeg, followingLeg);
          geometry.onLegSequenced(activeLeg, nextLeg, followingLeg);
        }
      }
    }

    this.updateNavCaptureCondition(tas, gs);

    /* Set FG parameters */

    if (!available && this.lastAvail !== false) {
      SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', false);
      SimVar.SetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', 0);
      SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', 0);
      SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', 0);

      this.lastAvail = false;
      this.lastTAE = null;
      this.lastXTE = null;
      this.lastPhi = null;
      this.turnState = LnavTurnState.Normal;
    }
  }

  /**
   *
   * @param geometry active geometry
   * @param activeLegIdx index of active leg in the geometry
   * @param trueTrack true track of the aircraft
   * @returns distance to go along the active leg
   */
  private computeAlongTrackDistanceToGo(
    geometry: Geometry,
    activeLegIdx: number,
    trueTrack: DegreesTrue,
  ): NauticalMiles {
    // Iterate over the upcoming legs until we find one that has a distance to go.
    // If we sequence a discontinuity for example, there is no geometry leg for the active leg, so we iterate downpath until we find one.
    // This will typically be an IF leg
    for (let i = activeLegIdx ?? 0; geometry.legs.has(i) || geometry.legs.has(i + 1); i++) {
      const leg = geometry.legs.get(i);
      if (!leg || leg instanceof VMLeg || leg instanceof FMLeg) {
        continue;
      }

      const inboundTrans = geometry.transitions.get(i - 1);
      const outboundTrans = geometry.transitions.get(i);

      const completeLegAlongTrackPathDtg = Geometry.completeLegAlongTrackPathDistanceToGo(
        this.ppos,
        trueTrack,
        leg,
        inboundTrans,
        outboundTrans,
      );

      return completeLegAlongTrackPathDtg;
    }

    return undefined;
  }

  public legEta(gs: Knots, termination: Coordinates): number {
    // FIXME use a more accurate estimate, calculate in predictions

    const UTC_SECONDS = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));

    const nauticalMilesToGo = distanceTo(this.ppos, termination);
    const secondsToGo = (nauticalMilesToGo / Math.max(this.acConfig.lnavConfig.DEFAULT_MIN_PREDICTED_TAS, gs)) * 3600;

    const eta = (UTC_SECONDS + secondsToGo) % (3600 * 24);

    return eta;
  }

  sequenceLeg(leg?: Leg, outboundTransition?: Transition): void {
    this.flightPlanService.active.sequence();

    console.log(`[FMGC/Guidance] LNAV - sequencing leg. [new Index: ${this.flightPlanService.active.activeLegIndex}]`);

    outboundTransition?.freeze();

    // Set turn state based on turn direction
    if (
      outboundTransition &&
      (outboundTransition instanceof PathCaptureTransition || outboundTransition instanceof CourseCaptureTransition)
    ) {
      if (outboundTransition.turnDirection === TurnDirection.Left) {
        this.turnState = LnavTurnState.ForceLeftTurn;
      } else if (outboundTransition.turnDirection === TurnDirection.Right) {
        this.turnState = LnavTurnState.ForceRightTurn;
      } else {
        // Just to be safe
        this.turnState = LnavTurnState.Normal;
      }
    } else {
      this.turnState = LnavTurnState.Normal;
    }
  }

  sequenceDiscontinuity(_leg?: Leg, followingLeg?: Leg): void {
    console.log('[FMGC/Guidance] LNAV - sequencing discontinuity');

    if (this.isNavModeEngaged()) {
      // TODO does this var do anything?
      SimVar.SetSimVarValue('L:A32NX_FM_HEADING_SYNC', 'boolean', true);
      this.guidanceController.disengageNavMode();
    }

    this.sequenceLeg(_leg, null);

    // The leg after the disco should become the active leg, so we sequence again
    if (followingLeg) {
      this.sequenceLeg(null, null);
    }
  }

  sequenceManual(_leg?: Leg): void {
    console.log('[FMGC/Guidance] LNAV - sequencing MANUAL');
  }

  private updateNavCaptureCondition(tas: number, gs: number) {
    this.setNavCaptureCondition(this.computeNavCaptureCondition(tas, gs));
  }

  private setNavCaptureCondition(condition: boolean) {
    if (condition !== this.lastNavCaptureCondition) {
      SimVar.SetSimVarValue('L:A32NX_FM1_NAV_CAPTURE_CONDITION', 'Bool', condition);
      SimVar.SetSimVarValue('L:A32NX_FM2_NAV_CAPTURE_CONDITION', 'Bool', condition);
    }
  }

  private canAlwaysCaptureLeg(leg: FlightPlanLeg) {
    return leg.isVx() || (leg.isCx() && leg.type !== LegType.CF);
  }

  private isNavModeEngaged(): boolean {
    // TODO use correct FM
    return this.register
      .setFromSimVar('L:A32NX_FMGC_1_DISCRETE_WORD_2')
      .bitValueOr(12, this.register.setFromSimVar('L:A32NX_FMGC_2_DISCRETE_WORD_2').bitValueOr(12, false));
  }

  private computeNavCaptureCondition(trueAirspeed: number, groundSpeed: number): boolean {
    const plan = this.flightPlanService.active;
    const geometry = this.guidanceController.activeGeometry;
    const activeLeg = plan.activeLeg;

    if (!activeLeg || isDiscontinuity(activeLeg)) {
      return false;
    } else if (this.canAlwaysCaptureLeg(activeLeg)) {
      return true;
    } else if (this.isNavModeEngaged()) {
      return Math.abs(this.lastXTE) < LnavDriver.NavActiveCaptureZone;
    } else {
      const bankAngle = maxBank(trueAirspeed, true);
      const turnRadius = trueAirspeed ** 2 / Math.tan((bankAngle * Math.PI) / 180) / HpathLaw.G;

      if (this.lastTAE * this.lastXTE > 0) {
        return Math.abs(this.lastXTE) < Math.abs(2 * turnRadius);
      } else {
        const unsaturatedTrackAngleError = MathUtils.clamp(
          this.lastTAE,
          -HpathLaw.InterceptAngle,
          HpathLaw.InterceptAngle,
        );

        const saturatedCaptureZone =
          Math.sign(this.lastTAE) *
          turnRadius *
          (Math.cos(unsaturatedTrackAngleError * MathUtils.DEGREES_TO_RADIANS) -
            Math.cos(this.lastTAE * MathUtils.DEGREES_TO_RADIANS));

        const activeGeometryLeg = geometry.legs.get(plan.activeLegIndex);
        const nominalRollAngle = activeGeometryLeg.getNominalRollAngle(groundSpeed) ?? 0;
        const unsaturatedCaptureZone =
          (nominalRollAngle / HpathLaw.K2 - unsaturatedTrackAngleError * groundSpeed) / HpathLaw.K1;

        return Math.abs(this.lastXTE) < Math.abs(saturatedCaptureZone - unsaturatedCaptureZone);
      }
    }
  }
}

class HpathLaw {
  static readonly Tau = 3;
  static readonly Zeta = 0.8;
  static readonly G = Constants.G * 6997.84; // kts/h
  static readonly T = this.Tau / 3600;
  static readonly K1 = 180 / 4 / Math.PI ** 2 / this.Zeta / this.T;
  static readonly K2 = this.Zeta / Math.PI / this.G / this.T;
  static readonly InterceptAngle = 45;
}
