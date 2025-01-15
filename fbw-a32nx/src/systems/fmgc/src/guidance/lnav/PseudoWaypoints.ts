// Copyright (c) 2021-2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { GuidanceComponent } from '@fmgc/guidance/GuidanceComponent';
import {
  PseudoWaypoint,
  PseudoWaypointFlightPlanInfo,
  PseudoWaypointSequencingAction,
} from '@fmgc/guidance/PseudoWaypoint';
import { VnavConfig, VnavDescentMode } from '@fmgc/guidance/vnav/VnavConfig';
import { NdSymbolTypeFlags } from '@flybywiresim/fbw-sdk';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { LateralMode } from '@shared/autopilot';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';

const PWP_IDENT_TOC = '(T/C)';
const PWP_IDENT_STEP_CLIMB = '(S/C)';
const PWP_IDENT_STEP_DESCENT = '(S/D)';
const PWP_IDENT_TOD = '(T/D)';
const PWP_IDENT_DECEL = '(DECEL)';
const PWP_IDENT_FLAP1 = '(FLAP1)';
const PWP_IDENT_FLAP2 = '(FLAP2)';

const CHECKPOINTS_TO_PUT_IN_MCDU = new Set([
  VerticalCheckpointReason.TopOfClimb,
  VerticalCheckpointReason.CrossingClimbSpeedLimit,

  VerticalCheckpointReason.StepClimb,
  VerticalCheckpointReason.StepDescent,

  // Descent
  VerticalCheckpointReason.TopOfDescent,
  VerticalCheckpointReason.CrossingDescentSpeedLimit,

  // Approach
  VerticalCheckpointReason.Decel,
  VerticalCheckpointReason.Flaps1,
  VerticalCheckpointReason.Flaps2,
]);
const isCheckpointForMcduPwp = (checkpoint: VerticalCheckpoint) => CHECKPOINTS_TO_PUT_IN_MCDU.has(checkpoint.reason);

const CHECKPOINTS_TO_DRAW_ON_ND = new Set([
  VerticalCheckpointReason.TopOfClimb,
  VerticalCheckpointReason.LevelOffForClimbConstraint,
  VerticalCheckpointReason.ContinueClimb,
  VerticalCheckpointReason.CrossingFcuAltitudeClimb,
  VerticalCheckpointReason.TopOfDescent,
  VerticalCheckpointReason.CrossingFcuAltitudeDescent,
  VerticalCheckpointReason.ContinueDescent,
  VerticalCheckpointReason.ContinueDescentArmed,
  VerticalCheckpointReason.LevelOffForDescentConstraint,
  VerticalCheckpointReason.InterceptDescentProfileManaged,
  VerticalCheckpointReason.InterceptDescentProfileSelected,
  VerticalCheckpointReason.Decel,
  VerticalCheckpointReason.Flaps1,
  VerticalCheckpointReason.Flaps2,
]);
const isCheckpointForNdPwp = (checkpoint: VerticalCheckpoint) => CHECKPOINTS_TO_DRAW_ON_ND.has(checkpoint.reason);

const CHECKPOINT_REASONS_BEFORE_FCU_ALT_FOR_PWP: VerticalCheckpointReason[] = [
  VerticalCheckpointReason.LevelOffForClimbConstraint,
  VerticalCheckpointReason.ContinueClimb,
  VerticalCheckpointReason.CrossingClimbSpeedLimit,
  VerticalCheckpointReason.CrossingFcuAltitudeClimb,
];

const CDA_CHECKPOINT_FOR_PWP: Set<VerticalCheckpointReason> = new Set([
  VerticalCheckpointReason.Flaps1,
  VerticalCheckpointReason.Flaps2,
]);
const isCheckpointForCdaPwp = (checkpoint: VerticalCheckpoint) => CDA_CHECKPOINT_FOR_PWP.has(checkpoint.reason);

export class PseudoWaypoints implements GuidanceComponent {
  pseudoWaypoints: PseudoWaypoint[] = [];

  constructor(
    private readonly flightPlanService: FlightPlanService,
    private readonly guidanceController: GuidanceController,
    private readonly atmosphericConditions: AtmosphericConditions,
    private readonly acConfig: AircraftConfig,
  ) {}

  acceptVerticalProfile() {
    if (VnavConfig.DEBUG_PROFILE) {
      console.log('[FMS/PWP] Computed new pseudo waypoints because of new vertical profile.');
    }
    this.recompute();
  }

  acceptMultipleLegGeometry(_geometry: Geometry) {
    if (VnavConfig.DEBUG_PROFILE) {
      console.log('[FMS/PWP] Computed new pseudo waypoints because of new lateral geometry.');
    }
    this.recompute();
  }

  private recompute() {
    const geometry = this.guidanceController.activeGeometry;
    const wptCount = this.flightPlanService.active.firstMissedApproachLegIndex;

    const navGeometryProfile = this.guidanceController.vnavDriver.mcduProfile;
    if (!geometry || geometry.legs.size < 1 || !navGeometryProfile?.isReadyToDisplay) {
      this.pseudoWaypoints.length = 0;
      return;
    }

    const ndPseudoWaypointCandidates = this.guidanceController.vnavDriver.ndProfile?.isReadyToDisplay
      ? this.guidanceController.vnavDriver.ndProfile.checkpoints.filter(isCheckpointForNdPwp)
      : [];

    const newPseudoWaypoints: PseudoWaypoint[] = [];
    const totalDistance = navGeometryProfile.totalFlightPlanDistance;

    const shouldEmitCdaPwp = VnavConfig.VNAV_DESCENT_MODE === VnavDescentMode.CDA && VnavConfig.VNAV_EMIT_CDA_FLAP_PWP;

    // We do this so we only draw the first of each waypoint type
    const waypointsLeftToDraw = new Set([...CHECKPOINTS_TO_PUT_IN_MCDU, ...CHECKPOINTS_TO_DRAW_ON_ND]);

    for (const checkpoint of [
      ...navGeometryProfile.checkpoints.filter(isCheckpointForMcduPwp),
      ...ndPseudoWaypointCandidates,
    ]) {
      if (!waypointsLeftToDraw.has(checkpoint.reason) || (!shouldEmitCdaPwp && isCheckpointForCdaPwp(checkpoint))) {
        continue;
      }

      // Do not draw climb PWP past the FCU altitude
      if (
        !waypointsLeftToDraw.has(VerticalCheckpointReason.CrossingFcuAltitudeClimb) &&
        CHECKPOINT_REASONS_BEFORE_FCU_ALT_FOR_PWP.includes(checkpoint.reason)
      ) {
        continue;
      }

      waypointsLeftToDraw.delete(checkpoint.reason);

      const pwp = this.createPseudoWaypointFromVerticalCheckpoint(geometry, wptCount, totalDistance, checkpoint);
      if (pwp) {
        newPseudoWaypoints.push(pwp);
      }
    }

    // Speed Changes
    const firstSpeedChange = this.guidanceController.vnavDriver.findNextSpeedChange();

    if (Number.isFinite(firstSpeedChange)) {
      let [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = [undefined, undefined, undefined];
      if (this.guidanceController.vnavDriver.isLatAutoControlActive()) {
        const pwp = this.pointFromEndOfPath(geometry, wptCount, totalDistance - firstSpeedChange);

        if (pwp) {
          [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = pwp;
        }
      }

      newPseudoWaypoints.push({
        ident: 'Speed change',
        alongLegIndex,
        distanceFromLegTermination,
        efisSymbolFlag: NdSymbolTypeFlags.PwpSpeedChange | NdSymbolTypeFlags.MagentaColor,
        efisSymbolLla,
        distanceFromStart: firstSpeedChange,
        displayedOnMcdu: false,
        displayedOnNd: true,
      });
    }

    if (VnavConfig.DEBUG_PROFILE || VnavConfig.ALLOW_DEBUG_PARAMETER_INJECTION) {
      const debugPoint = this.createDebugPwp(geometry, wptCount, totalDistance);
      if (debugPoint) {
        newPseudoWaypoints.push(debugPoint);
      }
    }

    this.pseudoWaypoints = newPseudoWaypoints;
  }

  init() {
    console.log('[FMGC/Guidance] PseudoWaypoints initialized!');
  }

  update(_: number) {
    // Pass our pseudo waypoints to the GuidanceController
    this.guidanceController.currentPseudoWaypoints.length = 0;

    let idx = 0;
    for (const pseudoWaypoint of this.pseudoWaypoints) {
      const onPreviousLeg = pseudoWaypoint.alongLegIndex === this.guidanceController.activeLegIndex - 1;
      const onActiveLeg = pseudoWaypoint.alongLegIndex === this.guidanceController.activeLegIndex;
      const afterActiveLeg = pseudoWaypoint.alongLegIndex > this.guidanceController.activeLegIndex;
      const inSelectedHdg = !this.guidanceController.vnavDriver.isLatAutoControlActive();

      // TODO we also consider the previous leg as active because we sequence Type I transitions at the same point
      // for both guidance and legs list. IRL, the display sequences after the guidance, which means the pseudo-waypoints
      // on the first half of the transition are considered on the active leg, whereas without this hack they are
      // on the previous leg by the time we try to re-add them to the list.

      // We only want to add the pseudo waypoint if it's after the active leg or it isn't yet passed
      if (
        inSelectedHdg ||
        afterActiveLeg ||
        (onPreviousLeg &&
          this.guidanceController.displayActiveLegCompleteLegPathDtg > pseudoWaypoint.distanceFromLegTermination) ||
        (onActiveLeg && this.guidanceController.activeLegCompleteLegPathDtg > pseudoWaypoint.distanceFromLegTermination)
      ) {
        this.guidanceController.currentPseudoWaypoints[++idx] = pseudoWaypoint;
      }
    }
  }

  /**
   * Notifies the FMS that a pseudo waypoint must be sequenced.
   *
   * This is to be sued by {@link GuidanceController} only.
   *
   * @param pseudoWaypoint the {@link PseudoWaypoint} to sequence.
   */
  sequencePseudoWaypoint(pseudoWaypoint: PseudoWaypoint): void {
    if (VnavConfig.DEBUG_GUIDANCE) {
      console.log(`[FMS/PseudoWaypoints] Pseudo-waypoint '${pseudoWaypoint.ident}' sequenced.`);
    }

    switch (pseudoWaypoint.sequencingType) {
      case PseudoWaypointSequencingAction.TOD_REACHED:
        // TODO EFIS message;
        break;
      case PseudoWaypointSequencingAction.APPROACH_PHASE_AUTO_ENGAGE: {
        const apLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number');
        const agl = Simplane.getAltitudeAboveGround();

        if (
          agl < 9500 &&
          (apLateralMode === LateralMode.NAV ||
            apLateralMode === LateralMode.LOC_CPT ||
            apLateralMode === LateralMode.LOC_TRACK)
        ) {
          // Request APPROACH phase engagement for 5 seconds
          SimVar.SetSimVarValue('L:A32NX_FM_ENABLE_APPROACH_PHASE', 'Bool', true).then(() => [
            setTimeout(() => {
              SimVar.SetSimVarValue('L:A32NX_FM_ENABLE_APPROACH_PHASE', 'Bool', false);
            }, 5_000),
          ]);
        }
        break;
      }
      default:
    }
  }

  private pointFromEndOfPath(
    path: Geometry,
    wptCount: number,
    distanceFromEnd: NauticalMiles,
    debugString?: string,
  ): [lla: Coordinates, distanceFromLegTermination: number, legIndex: number] | undefined {
    if (!distanceFromEnd || distanceFromEnd < 0) {
      if (VnavConfig.DEBUG_PROFILE) {
        console.warn('[FMS/PWP](pointFromEndOfPath) distanceFromEnd was negative or undefined');
      }

      return undefined;
    }

    if (VnavConfig.DEBUG_PROFILE) {
      console.log(`[FMS/PWP] Starting placement of PWP '${debugString}': dist: ${distanceFromEnd.toFixed(2)}nm`);
    }

    const activeLegIndex = this.guidanceController.activeLegIndex;

    for (let i = activeLegIndex - 2; i < wptCount; i++) {
      if (i < activeLegIndex - 1 && !this.guidanceController.doesPreNavModeEngagementPathExist()) {
        continue;
      }

      const geometry =
        i <= activeLegIndex && this.guidanceController.doesPreNavModeEngagementPathExist()
          ? this.guidanceController.getPreNavModeEngagementPathGeometry()
          : path;

      const geometryLeg = geometry.legs.get(i);

      if (!geometryLeg || geometryLeg.isNull || !geometryLeg.calculated) {
        continue;
      }

      const accumulator = geometryLeg.calculated.cumulativeDistanceToEndWithTransitions;

      if (accumulator < distanceFromEnd) {
        const inboundTrans = geometry.transitions.get(i - 1);
        const outboundTrans = geometry.transitions.get(i);

        const [inboundTransLength, legPartLength, outboundTransLength] = Geometry.completeLegPathLengths(
          geometryLeg,
          inboundTrans,
          outboundTrans,
        );
        const totalLegPathLength = inboundTransLength + legPartLength + outboundTransLength;

        const distanceFromEndOfLeg = distanceFromEnd - accumulator;

        let lla: Coordinates | undefined;
        if (distanceFromEndOfLeg > totalLegPathLength) {
          // PWP in disco
          if (VnavConfig.DEBUG_PROFILE) {
            console.log(
              `[FMS/PWP] Placed PWP '${debugString}' in discontinuity before leg #${i} (${distanceFromEndOfLeg.toFixed(2)}nm before end)`,
            );
          }

          lla = geometryLeg.getPseudoWaypointLocation(distanceFromEndOfLeg);
        } else if (distanceFromEndOfLeg < outboundTransLength) {
          // Point is in outbound transition segment
          const distanceBeforeTerminator = distanceFromEndOfLeg;

          if (VnavConfig.DEBUG_PROFILE) {
            console.log(
              `[FMS/PWP] Placed PWP '${debugString}' on leg #${i} outbound segment (${distanceFromEndOfLeg.toFixed(2)}nm before end)`,
            );
          }

          lla = outboundTrans.getPseudoWaypointLocation(distanceBeforeTerminator);
        } else if (
          distanceFromEndOfLeg >= outboundTransLength &&
          distanceFromEndOfLeg < outboundTransLength + legPartLength
        ) {
          // Point is in leg segment
          const distanceBeforeTerminator = distanceFromEndOfLeg - outboundTransLength;

          if (VnavConfig.DEBUG_PROFILE) {
            console.log(
              `[FMS/PWP] Placed PWP '${debugString}' on leg #${i} leg segment (${distanceBeforeTerminator.toFixed(2)}nm before end)`,
            );
          }

          lla = geometryLeg.getPseudoWaypointLocation(distanceBeforeTerminator);
        } else {
          // Point is in inbound transition segment
          const distanceBeforeTerminator = distanceFromEndOfLeg - outboundTransLength - legPartLength;

          if (VnavConfig.DEBUG_PROFILE) {
            console.log(
              `[FMS/PWP] Placed PWP '${debugString}' on leg #${i} inbound segment (${distanceBeforeTerminator.toFixed(2)}nm before end)`,
            );
          }

          lla = inboundTrans.getPseudoWaypointLocation(distanceBeforeTerminator);
        }

        if (lla) {
          return [lla, distanceFromEndOfLeg, i];
        }

        if (VnavConfig.DEBUG_PROFILE) {
          console.error(`[FMS/PseudoWaypoints] Tried to place PWP ${debugString} on ${geometryLeg.repr}, but failed`);
        }

        return undefined;
      }
    }

    if (DEBUG) {
      console.error(`[FMS/PseudoWaypoints] ${distanceFromEnd.toFixed(2)}nm is larger than the total lateral path.`);
    }

    return undefined;
  }

  private createPseudoWaypointFromVerticalCheckpoint(
    geometry: Geometry,
    wptCount: number,
    totalDistance: number,
    checkpoint: VerticalCheckpoint,
  ): PseudoWaypoint | undefined {
    let [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = [undefined, undefined, undefined];

    const PWP_IDENT_SPD_LIM = this.acConfig.vnavConfig.LIM_PSEUDO_WPT_LABEL;
    const PWP_SPD_LIM_HEADER = PWP_IDENT_SPD_LIM === '(LIM)' ? '\xa0(SPD)' : undefined;

    const isLatAutoControlArmedOrActive =
      this.guidanceController.vnavDriver.isLatAutoControlActive() ||
      this.guidanceController.vnavDriver.isLatAutoControlArmedWithIntercept();

    // We want the decel point and T/D to be drawn along the track line even if not in NAV mode
    if (isLatAutoControlArmedOrActive || isCheckpointForMcduPwp(checkpoint)) {
      const pwp = this.pointFromEndOfPath(
        geometry,
        wptCount,
        totalDistance - checkpoint?.distanceFromStart,
        checkpoint.reason,
      );
      if (!pwp) {
        return undefined;
      }

      [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = pwp;
    }

    switch (checkpoint.reason) {
      case VerticalCheckpointReason.LevelOffForClimbConstraint:
        return {
          ident: 'Level 1',
          efisSymbolFlag: NdSymbolTypeFlags.PwpClimbLevelOff | NdSymbolTypeFlags.MagentaColor,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.ContinueClimb:
        return {
          ident: 'Start of climb 1',
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpStartOfClimb | NdSymbolTypeFlags.CyanColor,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.CrossingClimbSpeedLimit:
        return {
          ident: PWP_IDENT_SPD_LIM,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: 0, // Since this is not shown on the ND, it does not need a symbol
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          mcduHeader: PWP_SPD_LIM_HEADER,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd: false,
        };
      case VerticalCheckpointReason.CrossingDescentSpeedLimit:
        return {
          ident: PWP_IDENT_SPD_LIM,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: 0, // Since this is not shown on the ND, it does not need a symbol
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          mcduHeader: PWP_SPD_LIM_HEADER,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd: false,
        };
      case VerticalCheckpointReason.CrossingFcuAltitudeClimb:
        return {
          ident: 'Level 2',
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpClimbLevelOff | NdSymbolTypeFlags.CyanColor,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.TopOfClimb:
        return {
          ident: PWP_IDENT_TOC,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: 0,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd: false,
        };
      case VerticalCheckpointReason.StepClimb:
        return {
          ident: PWP_IDENT_STEP_CLIMB,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpStartOfClimb,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd: this.guidanceController.vnavDriver.isLatAutoControlActive(),
        };
      case VerticalCheckpointReason.StepDescent:
        return {
          ident: PWP_IDENT_TOD,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd: this.guidanceController.vnavDriver.isLatAutoControlActive(),
          mcduIdent: PWP_IDENT_STEP_DESCENT,
        };
      case VerticalCheckpointReason.ContinueDescent:
        return {
          ident: PWP_IDENT_TOD,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.ContinueDescentArmed:
        return {
          ident: PWP_IDENT_TOD,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent | NdSymbolTypeFlags.CyanColor,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.TopOfDescent:
        return {
          ident: PWP_IDENT_TOD,
          sequencingType: PseudoWaypointSequencingAction.TOD_REACHED,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd:
            this.guidanceController.vnavDriver.isLatAutoControlActive() ||
            this.guidanceController.vnavDriver.isFlightPhasePreflight(),
        };
      case VerticalCheckpointReason.CrossingFcuAltitudeDescent:
        return {
          ident: 'Level 2',
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpDescentLevelOff | NdSymbolTypeFlags.CyanColor,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.LevelOffForDescentConstraint:
        return {
          ident: 'Level 1',
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpDescentLevelOff | NdSymbolTypeFlags.MagentaColor,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.InterceptDescentProfileSelected:
        return {
          ident: 'Intercept point 1',
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpInterceptProfile,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.InterceptDescentProfileManaged:
        return {
          ident: 'Intercept point 2',
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpInterceptProfile | NdSymbolTypeFlags.CyanColor,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: false,
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.Decel:
        return {
          ident: PWP_IDENT_DECEL,
          sequencingType: PseudoWaypointSequencingAction.APPROACH_PHASE_AUTO_ENGAGE,
          alongLegIndex,
          distanceFromLegTermination,
          // Decel point is shown in magenta if speed is managed and NAV is armed or active
          efisSymbolFlag:
            NdSymbolTypeFlags.PwpDecel |
            (Simplane.getAutoPilotAirspeedManaged() && isLatAutoControlArmedOrActive
              ? NdSymbolTypeFlags.MagentaColor
              : 0),
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.Flaps1:
        return {
          ident: PWP_IDENT_FLAP1,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap1,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd: true,
        };
      case VerticalCheckpointReason.Flaps2:
        return {
          ident: PWP_IDENT_FLAP2,
          alongLegIndex,
          distanceFromLegTermination,
          efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap2,
          efisSymbolLla,
          distanceFromStart: checkpoint.distanceFromStart,
          displayedOnMcdu: true,
          flightPlanInfo: this.formatFlightPlanInfo(checkpoint),
          displayedOnNd: true,
        };
      default:
        return undefined;
    }
  }

  private createDebugPwp(geometry: Geometry, wptCount: number, totalDistance: number): PseudoWaypoint | null {
    const debugDistanceToEnd = SimVar.GetSimVarValue('L:A32NX_FM_VNAV_DEBUG_DISTANCE_TO_END', 'number');

    if (debugDistanceToEnd <= 0) {
      return null;
    }

    const position = this.pointFromEndOfPath(geometry, wptCount, debugDistanceToEnd);
    if (!position) {
      return null;
    }

    const [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = position;

    return {
      ident: 'DEBUG_POINT',
      alongLegIndex,
      distanceFromLegTermination,
      efisSymbolFlag: NdSymbolTypeFlags.PwpSpeedChange | NdSymbolTypeFlags.CyanColor,
      efisSymbolLla,
      distanceFromStart: totalDistance - debugDistanceToEnd,
      displayedOnMcdu: false,
      displayedOnNd: true,
    };
  }

  private formatFlightPlanInfo(checkpoint: VerticalCheckpoint): PseudoWaypointFlightPlanInfo {
    return {
      ...checkpoint,
      speed: this.atmosphericConditions.casOrMach(checkpoint.speed, checkpoint.mach, checkpoint.altitude),
    };
  }
}
