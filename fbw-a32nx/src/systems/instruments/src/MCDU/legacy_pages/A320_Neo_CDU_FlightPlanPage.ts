// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { A32NX_Util } from '../../../../shared/src/A32NX_Util';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CDULateralRevisionPage } from './A320_Neo_CDU_LateralRevisionPage';
import { CDUVerticalRevisionPage } from './A320_Neo_CDU_VerticalRevisionPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { CDUHoldAtPage } from './A320_Neo_CDU_HoldAtPage';
import { CDUInitPage } from './A320_Neo_CDU_InitPage';
import { AltitudeDescriptor, NXUnits, WaypointConstraintType } from '@flybywiresim/fbw-sdk';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanLeg, isDiscontinuity } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

const Markers = {
  FPLN_DISCONTINUITY: ['---F-PLN DISCONTINUITY--'],
  END_OF_FPLN: ['------END OF F-PLN------'],
  NO_ALTN_FPLN: ['-----NO ALTN F-PLN------'],
  END_OF_ALTN_FPLN: ['---END OF ALTN F-PLN----'],
  TOO_STEEP_PATH: ['-----TOO STEEP PATH-----'],
};

const Altitude = Object.freeze({
  Empty: '\xa0\xa0\xa0\xa0\xa0',
  NoPrediction: '-----',
});
const Speed = Object.freeze({
  Empty: '\xa0\xa0\xa0',
  NoPrediction: '---',
});
const Time = Object.freeze({
  Empty: '\xa0\xa0\xa0\xa0',
  NoPrediction: '----',
});

export class CDUFlightPlanPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, offset = 0, forPlan = 0) {
    // INIT
    function addLskAt(index, delay, callback) {
      mcdu.leftInputDelay[index] = typeof delay === 'function' ? delay : () => delay;
      mcdu.onLeftInput[index] = callback;
    }

    function addRskAt(index, delay, callback) {
      mcdu.rightInputDelay[index] = typeof delay === 'function' ? delay : () => delay;
      mcdu.onRightInput[index] = callback;
    }

    //mcdu.flightPlanManager.updateWaypointDistances(false /* approach */);
    //mcdu.flightPlanManager.updateWaypointDistances(true /* approach */);
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.FlightPlanPage;
    mcdu.returnPageCallback = () => {
      CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
    };
    mcdu.activeSystem = 'FMGC';

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.FlightPlanPage) {
        CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
      }
    }, mcdu.PageTimeout.Medium);

    const flightPhase = mcdu.flightPhaseManager.phase;
    const isFlying = flightPhase >= FmgcFlightPhase.Takeoff && flightPhase != FmgcFlightPhase.Done;

    let showFrom = false;

    const forActiveOrTemporary = forPlan === 0;
    const targetPlan = forActiveOrTemporary
      ? mcdu.flightPlanService.activeOrTemporary
      : mcdu.flightPlanService.secondary(1);
    const planAccentColor = forActiveOrTemporary ? (mcdu.flightPlanService.hasTemporary ? 'yellow' : 'green') : 'white';

    let headerText;
    if (forActiveOrTemporary) {
      if (mcdu.flightPlanService.hasTemporary) {
        headerText = `{yellow}{sp}TMPY{end}`;
      } else {
        headerText = `{sp}`;
      }
    } else {
      headerText = `{sp}{sp}{sp}{sp}{sp}{sp}{sp}{sp}{sp}{sp}{sp}SEC`;
    }

    let flightNumberText = '';
    if (forActiveOrTemporary) {
      flightNumberText = mcdu.flightNumber ?? '';
    }

    const waypointsAndMarkers = [];
    const first = Math.max(0, targetPlan.fromLegIndex);
    let destinationAirportOffset = 0;
    let alternateAirportOffset = 0;

    // VNAV
    const fmsGeometryProfile = mcdu.guidanceController.vnavDriver.mcduProfile;
    const fmsPseudoWaypoints = mcdu.guidanceController.currentPseudoWaypoints;

    /** @type {Map<number, VerticalWaypointPrediction>} */
    let vnavPredictionsMapByWaypoint = null;
    if (fmsGeometryProfile && fmsGeometryProfile.isReadyToDisplay) {
      vnavPredictionsMapByWaypoint = fmsGeometryProfile.waypointPredictions;
    }

    let cumulativeDistance = 0;
    // Primary F-PLAN

    // In this loop, we insert pseudowaypoints between regular waypoints and compute the distances between the previous and next (pseudo-)waypoint.
    for (let i = first; i < targetPlan.legCount; i++) {
      const inMissedApproach = i >= targetPlan.firstMissedApproachLegIndex;
      const isActiveLeg = i === targetPlan.activeLegIndex && forActiveOrTemporary;
      const isBeforeActiveLeg = i < targetPlan.activeLegIndex && forActiveOrTemporary;

      const wp = targetPlan.allLegs[i];

      if (wp.isDiscontinuity === true) {
        waypointsAndMarkers.push({
          marker: Markers.FPLN_DISCONTINUITY,
          fpIndex: i,
          inAlternate: false,
          inMissedApproach,
        });
        continue;
      }

      const pseudoWaypointsOnLeg = fmsPseudoWaypoints.filter((it) => it.displayedOnMcdu && it.alongLegIndex === i);
      pseudoWaypointsOnLeg.sort((a, b) => a.distanceFromStart - b.distanceFromStart);

      for (let j = 0; j < pseudoWaypointsOnLeg.length; j++) {
        const pwp = pseudoWaypointsOnLeg[j];
        const distanceFromLastLine = pwp.distanceFromStart - cumulativeDistance;
        cumulativeDistance = pwp.distanceFromStart;

        // No PWP on FROM leg
        if (!isBeforeActiveLeg) {
          waypointsAndMarkers.push({
            pwp,
            fpIndex: i,
            inMissedApproach,
            distanceFromLastLine,
            isActive: isActiveLeg && j === 0,
          });
        }
      }

      if (i >= targetPlan.activeLegIndex && wp.isDiscontinuity === false && wp.definition.type === 'HM') {
        waypointsAndMarkers.push({ holdResumeExit: wp, fpIndex: i, inMissedApproach, isActive: isActiveLeg });
      }

      const distanceFromLastLine =
        wp.isDiscontinuity === false && wp.calculated
          ? wp.calculated.cumulativeDistanceWithTransitions - cumulativeDistance
          : 0;
      cumulativeDistance =
        wp.isDiscontinuity === false && wp.calculated
          ? wp.calculated.cumulativeDistanceWithTransitions
          : cumulativeDistance;

      waypointsAndMarkers.push({
        wp,
        fpIndex: i,
        inAlternate: false,
        inMissedApproach,
        distanceFromLastLine,
        isActive: isActiveLeg && pseudoWaypointsOnLeg.length === 0,
      });

      if (wp.calculated && wp.calculated.endsInTooSteepPath) {
        waypointsAndMarkers.push({ marker: Markers.TOO_STEEP_PATH, fpIndex: i, inAlternate: false, inMissedApproach });
      }

      if (i === targetPlan.destinationLegIndex) {
        destinationAirportOffset = Math.max(waypointsAndMarkers.length - 4, 0);
      }

      if (i === targetPlan.lastIndex) {
        waypointsAndMarkers.push({
          marker: Markers.END_OF_FPLN,
          fpIndex: i + 1,
          inAlternate: false,
          inMissedApproach: false,
        });
      }
    }

    // Primary ALTN F-PLAN
    if (targetPlan.alternateDestinationAirport) {
      for (let i = 0; i < targetPlan.alternateFlightPlan.legCount; i++) {
        const inMissedApproach = i >= targetPlan.alternateFlightPlan.firstMissedApproachLegIndex;

        const wp = targetPlan.alternateFlightPlan.allLegs[i];

        if (wp.isDiscontinuity) {
          waypointsAndMarkers.push({ marker: Markers.FPLN_DISCONTINUITY, fpIndex: i, inAlternate: true });
          continue;
        }

        if (
          i >= targetPlan.alternateFlightPlan.activeLegIndex &&
          wp.isDiscontinuity === false &&
          wp.definition.type === 'HM'
        ) {
          waypointsAndMarkers.push({ holdResumeExit: wp, fpIndex: i, inAlternate: true });
        }

        const distanceFromLastLine =
          wp.isDiscontinuity === false && wp.calculated
            ? wp.calculated.cumulativeDistanceWithTransitions - cumulativeDistance
            : 0;
        cumulativeDistance =
          wp.isDiscontinuity === false && wp.calculated
            ? wp.calculated.cumulativeDistanceWithTransitions
            : cumulativeDistance;

        waypointsAndMarkers.push({ wp, fpIndex: i, inAlternate: true, inMissedApproach, distanceFromLastLine });

        if (i === targetPlan.alternateFlightPlan.destinationLegIndex) {
          alternateAirportOffset = Math.max(waypointsAndMarkers.length - 4, 0);
        }

        if (i === targetPlan.alternateFlightPlan.lastIndex) {
          waypointsAndMarkers.push({
            marker: Markers.END_OF_ALTN_FPLN,
            fpIndex: i + 1,
            inAlternate: true,
            inMissedApproach: false,
          });
        }
      }
    } else if (targetPlan.legCount > 0) {
      waypointsAndMarkers.push({ marker: Markers.NO_ALTN_FPLN, fpIndex: targetPlan.legCount + 1, inAlternate: true });
    }

    const tocIndex = waypointsAndMarkers.findIndex(({ pwp }) => pwp && pwp.ident === '(T/C)');

    // Render F-PLAN Display

    // fprow:   1      | 2     | 3 4   | 5 6   | 7 8   | 9 10  | 11 12   |
    // display: SPD/ALT| R0    | R1    | R2    | R3    | R4    | DEST    | SCRATCHPAD
    // functions:      | F[0]  | F[1]  | F[2]  | F[3]  | F[4]  | F[5]    |
    //                 | FROM  | TO    |
    let rowsCount = 5;

    if (waypointsAndMarkers.length === 0) {
      rowsCount = 0;
      mcdu.setTemplate([
        [`{left}{small}{sp}FROM{end}${headerText}{end}{right}{small}${flightNumberText}{sp}{sp}{sp}{end}{end}`],
        ...emptyFplnPage(forPlan),
      ]);
      mcdu.onLeftInput[0] = () => CDULateralRevisionPage.ShowPage(mcdu, undefined, undefined, forPlan);
      return;
    } else if (waypointsAndMarkers.length >= 5) {
      rowsCount = 5;
    } else {
      rowsCount = waypointsAndMarkers.length;
    }

    let useTransitionAltitude = false;

    // Only examine first 5 (or less) waypoints/markers
    const scrollWindow = [];
    for (let rowI = 0, winI = offset; rowI < rowsCount; rowI++, winI++) {
      winI = winI % waypointsAndMarkers.length;

      const {
        /** @type {import('fbw-a32nx/src/systems/fmgc/src/flightplanning/legs/FlightPlanLeg').FlightPlanElement} */
        wp,
        pwp,
        marker,
        /** @type {import('fbw-a32nx/src/systems/fmgc/src/flightplanning/legs/FlightPlanLeg').FlightPlanElement} */
        holdResumeExit,
        fpIndex,
        inAlternate,
        inMissedApproach,
        distanceFromLastLine,
        isActive,
      } = waypointsAndMarkers[winI];

      const legAccentColor = inAlternate || inMissedApproach ? 'cyan' : planAccentColor;

      const wpPrev = inAlternate
        ? targetPlan.alternateFlightPlan.maybeElementAt(fpIndex - 1)
        : targetPlan.maybeElementAt(fpIndex - 1);
      const wpNext = inAlternate
        ? targetPlan.alternateFlightPlan.maybeElementAt(fpIndex - 1)
        : targetPlan.maybeElementAt(fpIndex + 1);
      const wpActive = inAlternate || fpIndex >= targetPlan.activeLegIndex;

      // Bearing/Track
      let bearingTrack = '';
      const maybeBearingTrackTo = pwp ? targetPlan.maybeElementAt(fpIndex) : wp;
      const bearingTrackTo = maybeBearingTrackTo ? maybeBearingTrackTo : wpNext;
      switch (rowI) {
        case 1: {
          const trueBearing = SimVar.GetSimVarValue('L:A32NX_EFIS_L_TO_WPT_BEARING', 'Degrees');
          if (isActive && trueBearing !== null && trueBearing >= 0) {
            bearingTrack = `BRG${trueBearing.toFixed(0).padStart(3, '0')}\u00b0`;
          }
          break;
        }
        case 2:
          bearingTrack = isDiscontinuity(wpPrev) ? '' : formatTrack(wpPrev, bearingTrackTo);
          break;
      }

      const constraintType = wp
        ? CDUVerticalRevisionPage.constraintType(mcdu, fpIndex, targetPlan.index, inAlternate)
        : WaypointConstraintType.Unknown;
      if (constraintType === WaypointConstraintType.CLB) {
        useTransitionAltitude = true;
      } else if (constraintType === WaypointConstraintType.DES) {
        useTransitionAltitude = false;
      } else if (tocIndex >= 0) {
        // FIXME Guess because VNAV doesn't tell us whether altitudes are climb or not \o/
        useTransitionAltitude = winI <= tocIndex;
      } // else we stick with the last time we were sure...

      if (wp && wp.isDiscontinuity === false) {
        // Waypoint
        if (offset === 0) {
          showFrom = true;
        }

        let ident = wp.ident;
        let isOverfly = wp.definition.overfly;
        const isFromLeg = !inAlternate && fpIndex === targetPlan.fromLegIndex;

        let verticalWaypoint = null;
        // TODO: Alternate predictions
        if (!inAlternate && vnavPredictionsMapByWaypoint) {
          verticalWaypoint = vnavPredictionsMapByWaypoint.get(fpIndex);
        }

        // Color
        let color;
        if (isActive) {
          color = 'white';
        } else {
          const inMissedApproach =
            targetPlan.index === FlightPlanIndex.Active && fpIndex >= targetPlan.firstMissedApproachLegIndex;

          if (inMissedApproach || inAlternate) {
            color = 'cyan';
          } else {
            color = planAccentColor;
          }
        }

        // Time
        let timeCell: string = Time.NoPrediction;
        let timeColor = 'white';
        if (verticalWaypoint && isFinite(verticalWaypoint.secondsFromPresent)) {
          const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

          timeCell = `${isFromLeg ? '{big}' : '{small}'}${
            isFlying
              ? FmsFormatters.secondsToUTC(utcTime + verticalWaypoint.secondsFromPresent)
              : FmsFormatters.secondsTohhmm(verticalWaypoint.secondsFromPresent)
          }{end}`;

          timeColor = color;
        } else if (!inAlternate && fpIndex === targetPlan.originLegIndex) {
          timeCell = '{big}0000{end}';
          timeColor = color;
        }

        // Fix Header
        const fixAnnotation = wp.annotation;

        // Distance
        let distance = '';
        // Active waypoint is live distance, others are distances in the flight plan
        if (isActive) {
          if (Number.isFinite(mcdu.guidanceController.activeLegAlongTrackCompletePathDtg)) {
            distance = Math.round(
              Math.max(0, Math.min(9999, mcdu.guidanceController.activeLegAlongTrackCompletePathDtg)),
            ).toFixed(0);
          }
        } else {
          distance = Math.round(Math.max(0, Math.min(9999, distanceFromLastLine))).toFixed(0);
        }

        let fpa = '';
        if (wp.definition.verticalAngle !== undefined) {
          fpa = (Math.round(wp.definition.verticalAngle * 10) / 10).toFixed(1);
        }

        let altColor = 'white';
        let spdColor = 'white';

        // Should show empty speed prediction for waypoint after hold
        let speedConstraint: string = wp.type === 'HM' ? Speed.Empty : Speed.NoPrediction;
        let speedPrefix = '';

        if (targetPlan.index !== FlightPlanIndex.Temporary && wp.type !== 'HM') {
          if (!inAlternate && fpIndex === targetPlan.originLegIndex) {
            speedConstraint = Number.isFinite(mcdu.v1Speed)
              ? `{big}${Math.round(mcdu.v1Speed)}{end}`
              : Speed.NoPrediction;
            spdColor = Number.isFinite(mcdu.v1Speed) ? color : 'white';
          } else if (isFromLeg) {
            speedConstraint = Speed.Empty;
          } else if (verticalWaypoint && verticalWaypoint.speed) {
            speedConstraint = `{small}${verticalWaypoint.speed < 1 ? formatMachNumber(verticalWaypoint.speed) : Math.round(verticalWaypoint.speed)}{end}`;

            if (verticalWaypoint.speedConstraint) {
              speedPrefix = `${verticalWaypoint.isSpeedConstraintMet ? '{magenta}' : '{amber}'}*{end}`;
            }
            spdColor = color;
          } else if (wp.hasPilotEnteredSpeedConstraint()) {
            speedConstraint = Math.round(wp.pilotEnteredSpeedConstraint.speed).toString();
            spdColor = 'magenta';
          } else if (wp.hasDatabaseSpeedConstraint()) {
            speedConstraint = `{small}${Math.round(wp.definition.speed)}{end}`;
            spdColor = 'magenta';
          }
        }

        speedConstraint = speedPrefix + speedConstraint;

        // Altitude
        const hasAltConstraint = legHasAltConstraint(wp);
        let altitudeConstraint: string = Altitude.NoPrediction;
        let altSize = 'big';
        if (targetPlan.index !== FlightPlanIndex.Temporary) {
          if (verticalWaypoint && verticalWaypoint.altitude) {
            // Just show prediction
            let altPrefix = '';
            if (hasAltConstraint && !isFromLeg) {
              altPrefix = `{big}${verticalWaypoint.isAltitudeConstraintMet ? '{magenta}*{end}' : '{amber}*{end}'}{end}`;
            }

            altitudeConstraint =
              altPrefix +
              formatAltitudeOrLevel(mcdu, verticalWaypoint.altitude, useTransitionAltitude).padStart(5, '\xa0');
            altColor = color;
            altSize = isFromLeg ? 'big' : 'small';
          } else if (hasAltConstraint) {
            altitudeConstraint = formatAltConstraint(mcdu, wp.altitudeConstraint, useTransitionAltitude);
            altColor = 'magenta';
            altSize = wp.hasPilotEnteredAltitudeConstraint() ? 'big' : 'small';
          } else if (inAlternate && fpIndex === targetPlan.alternateFlightPlan.destinationLegIndex) {
            if (
              legIsRunway(wp) &&
              targetPlan.alternateFlightPlan.destinationRunway &&
              Number.isFinite(targetPlan.alternateFlightPlan.destinationRunway.thresholdCrossingHeight)
            ) {
              altitudeConstraint = formatAlt(targetPlan.alternateFlightPlan.destinationRunway.thresholdCrossingHeight);
              altColor = color;
              altSize = 'small';
            } else if (
              legIsAirport(wp) &&
              targetPlan.alternateFlightPlan.destinationAirport &&
              Number.isFinite(targetPlan.alternateFlightPlan.destinationAirport.location.alt)
            ) {
              altitudeConstraint = formatAlt(targetPlan.alternateFlightPlan.destinationAirport.location.alt);
              altColor = color;
              altSize = 'small';
            }
          } else if (inAlternate && fpIndex === targetPlan.alternateFlightPlan.originLegIndex) {
            if (
              legIsRunway(wp) &&
              targetPlan.alternateFlightPlan.originRunway &&
              Number.isFinite(targetPlan.alternateFlightPlan.originRunway.thresholdLocation.alt)
            ) {
              altitudeConstraint = formatAlt(targetPlan.alternateFlightPlan.originRunway.thresholdLocation.alt);
              altColor = color;
            } else if (
              legIsAirport(wp) &&
              targetPlan.alternateFlightPlan.originAirport &&
              Number.isFinite(targetPlan.alternateFlightPlan.originAirport.location.alt)
            ) {
              altitudeConstraint = formatAlt(targetPlan.alternateFlightPlan.originAirport.location.alt);
              altColor = color;
            }
          } else if (!inAlternate && fpIndex === targetPlan.destinationLegIndex) {
            if (
              legIsRunway(wp) &&
              targetPlan.destinationRunway &&
              Number.isFinite(targetPlan.destinationRunway.thresholdCrossingHeight)
            ) {
              altitudeConstraint = formatAlt(targetPlan.destinationRunway.thresholdCrossingHeight);
              altColor = color;
              altSize = 'small';
            } else if (
              legIsAirport(wp) &&
              targetPlan.destinationAirport &&
              Number.isFinite(targetPlan.destinationAirport.location.alt)
            ) {
              altitudeConstraint = formatAlt(targetPlan.destinationAirport.location.alt);
              altColor = color;
              altSize = 'small';
            }
          } else if (!inAlternate && fpIndex === targetPlan.originLegIndex) {
            if (
              legIsRunway(wp) &&
              targetPlan.originRunway &&
              Number.isFinite(targetPlan.originRunway.thresholdLocation.alt)
            ) {
              altitudeConstraint = formatAlt(targetPlan.originRunway.thresholdLocation.alt);
              altColor = color;
            } else if (
              legIsAirport(wp) &&
              targetPlan.originAirport &&
              Number.isFinite(targetPlan.originAirport.location.alt)
            ) {
              altitudeConstraint = formatAlt(targetPlan.originAirport.location.alt);
              altColor = color;
            }
          }
        }

        // forced turn indication if next leg is not a course reversal
        if (wpNext && wpNext.isDiscontinuity === false && legTurnIsForced(wpNext) && !legTypeIsCourseReversal(wpNext)) {
          if (wpNext.definition.turnDirection === 'L') {
            ident += '{';
          } else {
            ident += '}';
          }

          // the overfly symbol is not shown in this case
          isOverfly = false;
        }

        scrollWindow[rowI] = {
          fpIndex,
          inAlternate: inAlternate,
          active: wpActive,
          ident: ident,
          color,
          distance,
          fpa,
          spdColor,
          speedConstraint,
          altColor,
          altSize,
          altitudeConstraint,
          timeCell,
          timeColor,
          fixAnnotation: fixAnnotation ? fixAnnotation : '',
          bearingTrack,
          isOverfly,
        };

        if (fpIndex !== targetPlan.destinationLegIndex) {
          addLskAt(
            rowI,
            (value) => {
              if (value === '') {
                return mcdu.getDelaySwitchPage();
              }
              return mcdu.getDelayBasic();
            },
            (value, scratchpadCallback) => {
              switch (value) {
                case '':
                  CDULateralRevisionPage.ShowPage(mcdu, wp, fpIndex, forPlan, inAlternate);
                  break;
                case Keypad.clrValue:
                  CDUFlightPlanPage.clearElement(mcdu, fpIndex, offset, forPlan, inAlternate, scratchpadCallback);
                  break;
                case Keypad.ovfyValue:
                  mcdu.toggleWaypointOverfly(fpIndex, forPlan, inAlternate, () => {
                    CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
                  });
                  break;
                default:
                  if (value.length > 0) {
                    mcdu.insertWaypoint(
                      value,
                      forPlan,
                      inAlternate,
                      fpIndex,
                      true,
                      (success) => {
                        if (!success) {
                          scratchpadCallback();
                        }
                        CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
                      },
                      !mcdu.flightPlanService.hasTemporary,
                    );
                  }
                  break;
              }
            },
          );
        } else {
          addLskAt(
            rowI,
            () => mcdu.getDelaySwitchPage(),
            (value, scratchpadCallback) => {
              if (value === '') {
                CDULateralRevisionPage.ShowPage(mcdu, wp, fpIndex, forPlan, inAlternate);
              } else if (value.length > 0) {
                mcdu.insertWaypoint(
                  value,
                  forPlan,
                  inAlternate,
                  fpIndex,
                  true,
                  (success) => {
                    if (!success) {
                      scratchpadCallback();
                    }
                    CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
                  },
                  true,
                );
              }
            },
          );
        }

        addRskAt(
          rowI,
          () => mcdu.getDelaySwitchPage(),
          (value, scratchpadCallback) => {
            if (value === '') {
              CDUVerticalRevisionPage.ShowPage(
                mcdu,
                wp,
                fpIndex,
                verticalWaypoint,
                undefined,
                undefined,
                undefined,
                forPlan,
                inAlternate,
              );
            } else {
              CDUVerticalRevisionPage.setConstraints(
                mcdu,
                wp,
                fpIndex,
                verticalWaypoint,
                value,
                scratchpadCallback,
                offset,
                forPlan,
                inAlternate,
              );
            }
          },
        );
      } else if (pwp) {
        const baseColor = forActiveOrTemporary ? (mcdu.flightPlanService.hasTemporary ? 'yellow' : 'green') : 'white';
        const color = isActive ? 'white' : baseColor;

        // TODO: PWP should not be shown while predictions are recomputed or in a temporary flight plan,
        // but if I don't show them, the flight plan jumps around because the offset is no longer correct if the number of items in the flight plan changes.
        // Like this, they are still there, but have dashes for predictions.
        const shouldHidePredictions =
          !fmsGeometryProfile || !fmsGeometryProfile.isReadyToDisplay || !pwp.flightPlanInfo;

        let timeCell: string = Time.NoPrediction;
        let timeColor = 'white';
        if (!shouldHidePredictions && Number.isFinite(pwp.flightPlanInfo.secondsFromPresent)) {
          const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
          timeColor = color;

          timeCell = isFlying
            ? `${FmsFormatters.secondsToUTC(utcTime + pwp.flightPlanInfo.secondsFromPresent)}[s-text]`
            : `${FmsFormatters.secondsTohhmm(pwp.flightPlanInfo.secondsFromPresent)}[s-text]`;
        }

        let speed: string = Speed.NoPrediction;
        let spdColor = 'white';
        if (!shouldHidePredictions && Number.isFinite(pwp.flightPlanInfo.speed)) {
          speed = `{small}${pwp.flightPlanInfo.speed < 1 ? formatMachNumber(pwp.flightPlanInfo.speed) : Math.round(pwp.flightPlanInfo.speed).toFixed(0)}{end}`;
          spdColor = color;
        }

        let altitudeConstraint: string = Altitude.NoPrediction;
        let altColor = 'white';
        if (!shouldHidePredictions && Number.isFinite(pwp.flightPlanInfo.altitude)) {
          altitudeConstraint = formatAltitudeOrLevel(mcdu, pwp.flightPlanInfo.altitude, useTransitionAltitude);
          altColor = color;
        }

        let distance = undefined;
        if (!shouldHidePredictions) {
          distance = isActive
            ? mcdu.guidanceController.activeLegAlongTrackCompletePathDtg - pwp.distanceFromLegTermination
            : distanceFromLastLine;
        }

        scrollWindow[rowI] = {
          fpIndex: fpIndex,
          active: isActive,
          ident: pwp.mcduIdent || pwp.ident,
          color,
          distance: distance !== undefined ? Math.round(Math.max(0, Math.min(9999, distance))).toFixed(0) : '',
          spdColor,
          speedConstraint: speed,
          altColor,
          altSize: 'small',
          altitudeConstraint,
          timeCell,
          timeColor,
          fixAnnotation: `{${color}}${pwp.mcduHeader || ''}{end}`,
          bearingTrack,
          isOverfly: false,
        };

        addLskAt(rowI, 0, (value) => {
          if (value === Keypad.clrValue) {
            // TODO
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          }
        });
      } else if (marker) {
        // Marker
        scrollWindow[rowI] = waypointsAndMarkers[winI];
        addLskAt(rowI, 0, (value, scratchpadCallback) => {
          if (value === Keypad.clrValue) {
            if (marker === Markers.FPLN_DISCONTINUITY) {
              CDUFlightPlanPage.clearElement(mcdu, fpIndex, offset, forPlan, inAlternate, scratchpadCallback);
            } else {
              mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
              scratchpadCallback();
            }
            return;
          } else if (value === '') {
            return;
          }

          // Insert after last leg if we click on a marker after the flight plan
          const insertionIndex = fpIndex < targetPlan.legCount ? fpIndex : targetPlan.legCount - 1;
          const insertBeforeVsAfterIndex = fpIndex < targetPlan.legCount;

          // Cannot insert after MANUAL leg
          const previousElement = targetPlan.maybeElementAt(fpIndex - 1);
          if (previousElement && previousElement.isDiscontinuity === false && previousElement.isVectors()) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
          }

          mcdu.insertWaypoint(
            value,
            forPlan,
            inAlternate,
            insertionIndex,
            insertBeforeVsAfterIndex,
            (success) => {
              if (!success) {
                scratchpadCallback();
              }
              CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
            },
            !mcdu.flightPlanService.hasTemporary,
          );
        });
      } else if (holdResumeExit && holdResumeExit.isDiscontinuity === false) {
        const isNext = fpIndex === targetPlan.activeLegIndex + 1;

        let color = legAccentColor;
        if (isActive) {
          color = 'white';
        }

        const decelReached = isActive || (isNext && mcdu.holdDecelReached);
        const holdSpeed =
          fpIndex === mcdu.holdIndex && mcdu.holdSpeedTarget > 0 ? mcdu.holdSpeedTarget.toFixed(0) : '\xa0\xa0\xa0';
        const turnDirection = holdResumeExit.definition.turnDirection;
        // prompt should only be shown once entering decel for hold (3 - 20 NM before hold)
        const immExit = decelReached && !holdResumeExit.holdImmExit;
        const resumeHold = decelReached && holdResumeExit.holdImmExit;

        scrollWindow[rowI] = {
          fpIndex,
          holdResumeExit,
          color,
          immExit,
          resumeHold,
          holdSpeed,
          turnDirection,
        };

        addLskAt(rowI, 0, (value, scratchpadCallback) => {
          if (value === Keypad.clrValue) {
            CDUFlightPlanPage.clearElement(mcdu, fpIndex, offset, forPlan, inAlternate, scratchpadCallback);
            return;
          }

          CDUHoldAtPage.ShowPage(mcdu, fpIndex, forPlan, inAlternate);
          scratchpadCallback();
        });

        addRskAt(rowI, 0, (value, scratchpadCallback) => {
          // IMM EXIT, only active once reaching decel
          if (isActive) {
            mcdu.fmgcMesssagesListener.triggerToAllSubscribers('A32NX_IMM_EXIT', fpIndex, immExit);
            setTimeout(() => {
              CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
            }, 500);
          } else if (decelReached) {
            CDUFlightPlanPage.clearElement(mcdu, fpIndex, offset, forPlan, inAlternate, scratchpadCallback);
            return;
          }
          scratchpadCallback();
        });
      }
    }

    CDUFlightPlanPage.updatePlanCentre(mcdu, waypointsAndMarkers, offset, forPlan, 'L');
    CDUFlightPlanPage.updatePlanCentre(mcdu, waypointsAndMarkers, offset, forPlan, 'R');

    const isMissedApproachLegShown =
      targetPlan &&
      scrollWindow.some(
        (row, index) => index > 0 && !row.marker && row.fpIndex >= targetPlan.firstMissedApproachLegIndex,
      );
    const isAlternateLegShown = scrollWindow.some((row, index) => index > 0 && !row.marker && row.inAlternate);
    const isAlternateMissedApproachLegShown =
      targetPlan &&
      targetPlan.alternateFlightPlan &&
      scrollWindow.some(
        (row, index) =>
          index > 0 &&
          !row.marker &&
          row.inAlternate &&
          row.fpIndex >= targetPlan.alternateFlightPlan.firstMissedApproachLegIndex,
      );

    mcdu.efisInterfaces['L'].setShownFplnLegs(
      isMissedApproachLegShown,
      isAlternateLegShown,
      isAlternateMissedApproachLegShown,
    );
    mcdu.efisInterfaces['R'].setShownFplnLegs(
      isMissedApproachLegShown,
      isAlternateLegShown,
      isAlternateMissedApproachLegShown,
    );

    mcdu.onUnload = () => {
      CDUFlightPlanPage.updatePlanCentre(mcdu, waypointsAndMarkers, 0, FlightPlanIndex.Active, 'L');
      CDUFlightPlanPage.updatePlanCentre(mcdu, waypointsAndMarkers, 0, FlightPlanIndex.Active, 'R');

      mcdu.efisInterfaces['L'].setShownFplnLegs(false, false, false);
      mcdu.efisInterfaces['R'].setShownFplnLegs(false, false, false);
    };

    // Render scrolling data to text >> add ditto marks

    let firstWp = scrollWindow.length;
    const scrollText = [];
    for (let rowI = 0; rowI < scrollWindow.length; rowI++) {
      const {
        marker: cMarker,
        holdResumeExit: cHold,
        spdColor: cSpdColor,
        altColor: cAltColor,
        speedConstraint: cSpd,
        altitudeConstraint: cAlt,
        ident: cIdent,
      } = scrollWindow[rowI];
      let spdRpt = false;
      let altRpt = false;
      let showFix = true;
      let showDist = true;
      let showNm = false;

      if (cHold) {
        const { color, immExit, resumeHold, holdSpeed, turnDirection } = scrollWindow[rowI];
        scrollText[rowI * 2] = [
          '',
          `{amber}${immExit ? 'IMM\xa0\xa0' : ''}${resumeHold ? 'RESUME\xa0' : ''}{end}`,
          'HOLD\xa0\xa0\xa0\xa0',
        ];
        scrollText[rowI * 2 + 1] = [
          `{${color}}HOLD ${turnDirection}{end}`,
          `{amber}${immExit ? 'EXIT*' : ''}${resumeHold ? 'HOLD*' : ''}{end}`,
          `\xa0{${color}}{small}{white}SPD{end}\xa0${holdSpeed}{end}{end}`,
        ];
      } else if (!cMarker) {
        // Waypoint
        if (rowI > 0) {
          const {
            marker: pMarker,
            pwp: pPwp,
            holdResumeExit: pHold,
            speedConstraint: pSpd,
            altitudeConstraint: pAlt,
          } = scrollWindow[rowI - 1];
          if (!pMarker && !pPwp && !pHold) {
            firstWp = Math.min(firstWp, rowI);
            if (rowI === firstWp) {
              showNm = true;
            }
            if (cSpd !== Speed.NoPrediction && cSpdColor !== 'magenta' && cSpd === pSpd) {
              spdRpt = true;
            }

            if (cAlt !== Altitude.NoPrediction && cAltColor !== 'magenta' && cAlt === pAlt) {
              altRpt = true;
            }
            // If previous row is a marker, clear all headers unless it's a speed limit
          } else if (!pHold) {
            showDist = false;
            showFix = cIdent === '(LIM)';
          }
        }

        scrollText[rowI * 2] = renderFixHeader(scrollWindow[rowI], showNm, showDist, showFix);
        scrollText[rowI * 2 + 1] = renderFixContent(scrollWindow[rowI], spdRpt, altRpt);

        // Marker
      } else {
        scrollText[rowI * 2] = [];
        scrollText[rowI * 2 + 1] = cMarker;
      }
    }

    // Destination (R6)

    const destText = [];
    if (mcdu.flightPlanService.hasTemporary) {
      destText[0] = [' ', ' '];
      destText[1] = ['{ERASE[color]amber', 'INSERT*[color]amber'];

      addLskAt(5, 0, async () => {
        mcdu.eraseTemporaryFlightPlan(() => {
          CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
        });
      });
      addRskAt(5, 0, async () => {
        mcdu.insertTemporaryFlightPlan(() => {
          CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
        });
      });
    } else {
      let destCell = '----';
      if (targetPlan.destinationAirport) {
        destCell = targetPlan.destinationAirport.ident;

        if (targetPlan.destinationRunway) {
          destCell = targetPlan.destinationRunway.ident;
        }
      }
      let destTimeCell = '----';
      let destDistCell = '----';
      let destEFOBCell = '---.-';

      if (targetPlan.destinationAirport) {
        if (CDUInitPage.fuelPredConditionsMet(mcdu) && mcdu._fuelPredDone) {
          mcdu.tryUpdateRouteTrip(isFlying);
        }

        const destDist = mcdu.guidanceController.alongTrackDistanceToDestination;

        if (Number.isFinite(destDist)) {
          destDistCell = Math.round(destDist).toFixed(0);
        }

        if (fmsGeometryProfile && fmsGeometryProfile.isReadyToDisplay) {
          const destEfob = fmsGeometryProfile.getRemainingFuelAtDestination();

          if (Number.isFinite(destEfob)) {
            destEFOBCell = (NXUnits.poundsToUser(destEfob) / 1000).toFixed(1);
          }

          const timeRemaining = fmsGeometryProfile.getTimeToDestination();
          if (Number.isFinite(timeRemaining)) {
            const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

            destTimeCell = isFlying
              ? FmsFormatters.secondsToUTC(utcTime + timeRemaining)
              : FmsFormatters.secondsTohhmm(timeRemaining);
          }
        }
      }

      destText[0] = ['\xa0DEST', 'DIST\xa0\xa0EFOB', isFlying ? '\xa0UTC{sp}{sp}{sp}{sp}' : 'TIME{sp}{sp}{sp}{sp}'];
      destText[1] = [
        destCell,
        `{small}${destDistCell.padStart(4, '\xa0')}\xa0${destEFOBCell.padStart(5, '\xa0')}{end}`,
        `{small}${destTimeCell}{end}{sp}{sp}{sp}{sp}`,
      ];

      addLskAt(
        5,
        () => mcdu.getDelaySwitchPage(),
        () => {
          CDULateralRevisionPage.ShowPage(mcdu, targetPlan.destinationLeg, targetPlan.destinationLegIndex, forPlan);
        },
      );

      addRskAt(
        5,
        () => mcdu.getDelaySwitchPage(),
        () => {
          CDUVerticalRevisionPage.ShowPage(
            mcdu,
            targetPlan.destinationLeg,
            targetPlan.destinationLegIndex,
            undefined,
            undefined,
            undefined,
            undefined,
            forPlan,
            false,
          );
        },
      );
    }

    // scrollText pad to 10 rows
    while (scrollText.length < 10) {
      scrollText.push(['']);
    }
    const allowScroll = waypointsAndMarkers.length > 4;
    if (allowScroll) {
      mcdu.onAirport = () => {
        // Only called if > 4 waypoints
        const isOnFlightPlanPage = mcdu.page.Current === mcdu.page.FlightPlanPage;
        const allowCycleToOriginAirport = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Preflight;
        if (
          offset >= Math.max(destinationAirportOffset, alternateAirportOffset) &&
          allowCycleToOriginAirport &&
          isOnFlightPlanPage
        ) {
          // only show origin if still on ground
          // Go back to top of flight plan page to show origin airport.
          offset = 0;
        } else if (offset >= destinationAirportOffset && offset < alternateAirportOffset) {
          offset = alternateAirportOffset;
        } else {
          offset = destinationAirportOffset;
        }
        CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
      };
      mcdu.onDown = () => {
        // on page down decrement the page offset.
        if (offset > 0) {
          // if page not on top
          offset--;
        } else {
          // else go to the bottom
          offset = waypointsAndMarkers.length - 1;
        }
        CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
      };
      mcdu.onUp = () => {
        if (offset < waypointsAndMarkers.length - 1) {
          // if page not on bottom
          offset++;
        } else {
          // else go on top
          offset = 0;
        }
        CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
      };
    }
    mcdu.setArrows(allowScroll, allowScroll, true, true);
    scrollText[0][1] = 'SPD/ALT\xa0\xa0\xa0';
    scrollText[0][2] = isFlying ? '\xa0UTC{sp}{sp}{sp}{sp}' : 'TIME{sp}{sp}{sp}{sp}';
    mcdu.setTemplate([
      [
        `{left}{small}{sp}${showFrom ? 'FROM' : '{sp}{sp}{sp}{sp}'}{end}${headerText}{end}{right}{small}${flightNumberText}{sp}{sp}{sp}{end}{end}`,
      ],
      ...scrollText,
      ...destText,
    ]);
  }

  static async clearElement(
    mcdu: LegacyFmsPageInterface,
    fpIndex: number,
    offset: number,
    forPlan: number,
    forAlternate: boolean,
    scratchpadCallback: () => void,
  ) {
    if (!this.ensureCanClearElement(mcdu, fpIndex, forPlan, forAlternate, scratchpadCallback)) {
      return;
    }

    const targetPlan = forAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);
    const element = targetPlan.elementAt(fpIndex);

    const previousElement = targetPlan.maybeElementAt(fpIndex - 1);

    let insertDiscontinuity = true;
    if (element.isDiscontinuity === false) {
      if (element.isHX() || (!forAlternate && fpIndex <= targetPlan.activeLegIndex)) {
        insertDiscontinuity = false;
      } else if (previousElement.isDiscontinuity === false && previousElement.type === 'PI' && element.type === 'CF') {
        insertDiscontinuity =
          element.definition.waypoint?.databaseId === previousElement.definition.recommendedNavaid?.databaseId;
      }
    } else {
      insertDiscontinuity = false;
    }

    try {
      await mcdu.flightPlanService.deleteElementAt(fpIndex, insertDiscontinuity, forPlan, forAlternate);
      console.log('deleting element');
    } catch (e) {
      console.error(e);
      mcdu.logTroubleshootingError(e);
      mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
      scratchpadCallback();
    }

    CDUFlightPlanPage.ShowPage(mcdu, offset, forPlan);
  }

  static ensureCanClearElement(
    mcdu: LegacyFmsPageInterface,
    fpIndex: number,
    forPlan: number,
    forAlternate: boolean,
    scratchpadCallback: { (): void; (): void },
  ) {
    const targetPlan = forAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);

    if (forPlan === FlightPlanIndex.Active && mcdu.flightPlanService.hasTemporary) {
      mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
      scratchpadCallback();
      return false;
    } else if (fpIndex === targetPlan.originLegIndex || fpIndex === targetPlan.destinationLegIndex) {
      mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
      scratchpadCallback();
      return false;
    }

    // TODO maybe move this to FMS logic ?
    if (forPlan === FlightPlanIndex.Active && !forAlternate && fpIndex <= mcdu.flightPlanService.activeLegIndex) {
      // 22-72-00:67
      // Stop clearing TO or FROM waypoints when NAV is engaged
      if (mcdu.navModeEngaged()) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowedInNav);
        scratchpadCallback();
        return false;
      } else if (
        fpIndex === targetPlan.fromLegIndex /* TODO check this is ppos */ &&
        fpIndex + 2 === targetPlan.destinationLegIndex
      ) {
        const nextElement = targetPlan.elementAt(fpIndex + 1);
        if (nextElement.isDiscontinuity === true) {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
          return false;
        }
      }
    }

    const element = targetPlan.maybeElementAt(fpIndex);

    if (!element) {
      mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
      scratchpadCallback();
      return false;
    }

    const previousElement = targetPlan.maybeElementAt(fpIndex - 1);

    if (element.isDiscontinuity === true) {
      if (previousElement && previousElement.isDiscontinuity === false && previousElement.isVectors()) {
        // Cannot clear disco after MANUAL
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return false;
      } else if (fpIndex - 1 === targetPlan.fromLegIndex && forPlan === FlightPlanIndex.Active && !forAlternate) {
        // Cannot clear disco after FROM leg
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return false;
      } else if (fpIndex - 1 === targetPlan.originLegIndex && fpIndex + 1 === targetPlan.destinationLegIndex) {
        if (targetPlan.originAirport.ident === targetPlan.destinationAirport.ident) {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
          return false;
        }
      }
    }

    return true;
  }

  static updatePlanCentre(mcdu, waypointsAndMarkers, offset, forPlan, side) {
    const forActiveOrTemporary = forPlan === 0;
    const targetPlan = forActiveOrTemporary
      ? mcdu.flightPlanService.activeOrTemporary
      : mcdu.flightPlanService.secondary(1);

    for (let i = 0; i < waypointsAndMarkers.length; i++) {
      const { wp, inAlternate, fpIndex } = waypointsAndMarkers[(offset + i + 1) % waypointsAndMarkers.length];
      if (wp) {
        mcdu.efisInterfaces[side].setPlanCentre(targetPlan.index, fpIndex, inAlternate);
        break;
      }
    }
  }
}

function renderFixHeader(
  rowObj: { fixAnnotation: string; color: string; distance: string; bearingTrack: string; fpa: string },
  showNm = false,
  showDist = true,
  showFix = true,
) {
  const { fixAnnotation, color, distance, bearingTrack, fpa } = rowObj;
  let right = showDist ? `{${color}}${distance}{end}` : '';
  if (fpa) {
    right += `{white}${fpa}°{end}`;
  } else if (showNm) {
    right += `{${color}}NM{end}\xa0\xa0\xa0`;
  } else {
    right += '\xa0\xa0\xa0\xa0\xa0';
  }
  return [
    `${showFix ? fixAnnotation.padEnd(7, '\xa0').padStart(8, '\xa0') : ''}`,
    right,
    `{${color}}${bearingTrack}{end}\xa0`,
  ];
}

function renderFixContent(
  rowObj: {
    ident: string;
    isOverfly: boolean;
    color: string;
    spdColor: string;
    speedConstraint: string;
    altColor: string;
    altSize: string;
    altitudeConstraint: string;
    timeCell: string;
    timeColor: string;
  },
  spdRepeat = false,
  altRepeat = false,
) {
  const {
    ident,
    isOverfly,
    color,
    spdColor,
    speedConstraint,
    altColor,
    altSize,
    altitudeConstraint,
    timeCell,
    timeColor,
  } = rowObj;

  return [
    `${ident}${isOverfly ? Keypad.ovfyValue : ''}[color]${color}`,
    `{${spdColor}}${spdRepeat ? '\xa0"\xa0' : speedConstraint}{end}{${altColor}}{${altSize}}/${altRepeat ? '\xa0\xa0\xa0"\xa0\xa0' : altitudeConstraint.padStart(6, '\xa0')}{end}{end}`,
    `${timeCell}{sp}{sp}{sp}{sp}[color]${timeColor}`,
  ];
}

function emptyFplnPage(forPlan) {
  return [
    ['', 'SPD/ALT{sp}{sp}{sp}', 'TIME{sp}{sp}{sp}{sp}'],
    [`PPOS[color]${forPlan === 0 ? 'green' : 'white'}`, '{sp}{sp}{sp}/ -----', '----{sp}{sp}{sp}{sp}'],
    [''],
    ['---F-PLN DISCONTINUITY---'],
    [''],
    ['------END OF F-PLN-------'],
    [''],
    ['-----NO ALTN F-PLN-------'],
    [''],
    [''],
    ['\xa0DEST', 'DIST\xa0\xa0EFOB', 'TIME{sp}{sp}{sp}{sp}'],
    ['-------', '----\xa0---.-[s-text]', '----{sp}{sp}{sp}{sp}[s-text]'],
  ];
}

/**
 * Check whether leg is a course reversal leg
 * @returns true if leg is a course reversal leg
 */
function legTypeIsCourseReversal(leg: FlightPlanLeg) {
  switch (leg.type) {
    case 'HA':
    case 'HF':
    case 'HM':
    case 'PI':
      return true;
    default:
  }
  return false;
}

/**
 * Check whether leg has a coded forced turn direction
 * @returns true if leg has coded forced turn direction
 */
function legTurnIsForced(leg: FlightPlanLeg) {
  // forced turns are only for straight legs
  return (
    (leg.definition.turnDirection === 'L' /* Left */ || leg.definition.turnDirection === 'R') /* Right */ &&
    leg.type !== 'AF' &&
    leg.type !== 'RF'
  );
}

function formatMachNumber(rawNumber: number) {
  return (Math.round(100 * rawNumber) / 100).toFixed(2).slice(1);
}

function legHasAltConstraint(leg: FlightPlanLeg): boolean {
  return !leg.isXA() && (leg.hasPilotEnteredAltitudeConstraint() || leg.hasDatabaseAltitudeConstraint());
}

function legIsRunway(leg: FlightPlanLeg): boolean {
  return leg.definition && leg.definition.waypointDescriptor === 4;
}

function legIsAirport(leg: FlightPlanLeg): boolean {
  return leg.definition && leg.definition.waypointDescriptor === 1;
}

/**
 * Formats an altitude as an altitude or flight level for display.
 * @param mcdu Reference to the MCDU instance
 * @param alt  The altitude in feet.
 * @param useTransAlt Whether to use transition altitude, otherwise transition level is used.
 * @returns The formatted altitude/level.
 */
function formatAltitudeOrLevel(mcdu: LegacyFmsPageInterface, alt: number, useTransAlt: boolean): string {
  const activePlan = mcdu.flightPlanService.active;

  let isFl = false;
  if (useTransAlt) {
    const transAlt = activePlan.performanceData.transitionAltitude;
    isFl = transAlt !== null && alt > transAlt;
  } else {
    const transLevel = activePlan.performanceData.transitionLevel;
    isFl = transLevel !== null && alt >= transLevel * 100;
  }

  if (isFl) {
    return `FL${(alt / 100).toFixed(0).padStart(3, '0')}`;
  }

  return formatAlt(alt);
}

function formatTrack(from: FlightPlanLeg, to: { definition: { waypoint: { location: LatLongData }; type: string } }) {
  // TODO: Does this show something for non-waypoint terminated legs?
  if (
    !from ||
    !from.definition ||
    !from.definition.waypoint ||
    !from.definition.waypoint.location ||
    !to ||
    !to.definition ||
    !to.definition.waypoint ||
    to.definition.type === 'HM'
  ) {
    return '';
  }

  const magVar = Facilities.getMagVar(from.definition.waypoint.location.lat, from.definition.waypoint.location.long);
  const tr = Avionics.Utils.computeGreatCircleHeading(
    from.definition.waypoint.location,
    to.definition.waypoint.location,
  );
  const track = A32NX_Util.trueToMagnetic(tr, magVar);
  return `TRK${track.toFixed(0).padStart(3, '0')}\u00b0`;
}

/**
 * Formats a numberical altitude to a string to be displayed in the altitude column. Does not format FLs, use {@link formatAltitudeOrLevel} for this purpose
 * @param alt The altitude to format
 * @returns The formatted altitude string
 */
function formatAlt(alt: number): string {
  return (Math.round(alt / 10) * 10).toFixed(0);
}

function formatAltConstraint(
  mcdu: LegacyFmsPageInterface,
  constraint: { altitudeDescriptor: AltitudeDescriptor; altitude1: number; altitude2: number },
  useTransAlt: boolean,
) {
  if (!constraint) {
    return '';
  }

  // Altitude constraint types "G" and "H" are not shown in the flight plan
  switch (constraint.altitudeDescriptor) {
    case AltitudeDescriptor.AtAlt1:
    case AltitudeDescriptor.AtAlt1GsIntcptAlt2:
    case AltitudeDescriptor.AtAlt1AngleAlt2:
      return formatAltitudeOrLevel(mcdu, constraint.altitude1, useTransAlt);
    case AltitudeDescriptor.AtOrAboveAlt1:
    case AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2:
    case AltitudeDescriptor.AtOrAboveAlt1AngleAlt2:
      return '+' + formatAltitudeOrLevel(mcdu, constraint.altitude1, useTransAlt);
    case AltitudeDescriptor.AtOrBelowAlt1:
    case AltitudeDescriptor.AtOrBelowAlt1AngleAlt2:
      return '-' + formatAltitudeOrLevel(mcdu, constraint.altitude1, useTransAlt);
    case AltitudeDescriptor.BetweenAlt1Alt2:
      return 'WINDOW';
    case AltitudeDescriptor.AtOrAboveAlt2:
      return '+' + formatAltitudeOrLevel(mcdu, constraint.altitude2, useTransAlt);
    default:
      return '';
  }
}
