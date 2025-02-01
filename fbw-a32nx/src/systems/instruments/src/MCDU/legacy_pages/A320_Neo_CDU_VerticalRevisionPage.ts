// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { FmgcFlightPhase } from '@shared/flightphase';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { CDUStepAltsPage } from './A320_Neo_CDU_StepAltsPage';
import { CDUWindPage } from './A320_Neo_CDU_WindPage';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { AltitudeDescriptor } from '@flybywiresim/fbw-sdk';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class CDUVerticalRevisionPage {
  /**
   * @param mcdu
   * @param {FlightPlanLeg} waypoint
   * @param verticalWaypoint
   * @param confirmSpeed
   * @param confirmAlt
   * @param confirmCode
   */
  static ShowPage(
    mcdu: LegacyFmsPageInterface,
    waypoint,
    wpIndex,
    verticalWaypoint,
    confirmSpeed = undefined,
    confirmAlt = undefined,
    confirmCode = undefined,
    forPlan = FlightPlanIndex.Active,
    inAlternate = false,
  ) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.VerticalRevisionPage;

    const targetPlan = inAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);
    const mainTargetPlan = mcdu.getFlightPlan(forPlan);
    // Use performance data of primary for waypoints in alternate
    const performanceData = mainTargetPlan.performanceData;

    const confirmConstraint = Number.isFinite(confirmSpeed) || Number.isFinite(confirmAlt);
    const constraintType = CDUVerticalRevisionPage.constraintType(mcdu, wpIndex, forPlan, inAlternate);
    const isOrigin = wpIndex === 0;
    const isDestination = wpIndex === targetPlan.destinationLegIndex;

    let waypointIdent = '---';
    if (waypoint) {
      if (isDestination && targetPlan.destinationRunway) {
        waypointIdent = targetPlan.destinationRunway.ident;
      } else {
        waypointIdent = waypoint.ident;
      }
    }

    const showSpeedLim =
      mcdu._fuelPredDone || isOrigin || isDestination || constraintType !== WaypointConstraintType.Unknown;
    // the conditions other than isDestination are a workaround for no ToC
    const showDesSpeedLim =
      showSpeedLim &&
      (isDestination ||
        constraintType === WaypointConstraintType.DES ||
        (mcdu.flightPhaseManager.phase > FmgcFlightPhase.Cruise &&
          mcdu.flightPhaseManager.phase < FmgcFlightPhase.GoAround));

    const climbSpeedLimitSpeed = inAlternate
      ? performanceData.alternateClimbSpeedLimitSpeed
      : performanceData.climbSpeedLimitSpeed;
    const climbSpeedLimitAltitude = inAlternate
      ? performanceData.alternateClimbSpeedLimitAltitude
      : performanceData.climbSpeedLimitAltitude;
    const isClimbSpeedLimitPilotEntered = inAlternate
      ? performanceData.isAlternateClimbSpeedLimitPilotEntered
      : performanceData.isClimbSpeedLimitPilotEntered;

    const descentSpeedLimitSpeed = inAlternate
      ? performanceData.alternateDescentSpeedLimitSpeed
      : performanceData.descentSpeedLimitSpeed;
    const descentSpeedLimitAltitude = inAlternate
      ? performanceData.alternateDescentSpeedLimitAltitude
      : performanceData.descentSpeedLimitAltitude;
    const isDescentSpeedLimitPilotEntered = inAlternate
      ? performanceData.isAlternateDescentSpeedLimitPilotEntered
      : performanceData.isDescentSpeedLimitPilotEntered;

    let speedLimitTitle = '';
    let speedLimitCell = '';
    if (showDesSpeedLim) {
      speedLimitTitle = '\xa0DES SPD LIM';
      if (descentSpeedLimitSpeed !== null) {
        speedLimitCell = `{magenta}{${isDescentSpeedLimitPilotEntered ? 'big' : 'small'}}${descentSpeedLimitSpeed.toFixed(0).padStart(3, '0')}/${this.formatFl(descentSpeedLimitAltitude, performanceData.transitionLevel * 100)}{end}{end}`;
      } else {
        speedLimitCell = '{cyan}*[ ]/[   ]{end}';
      }
    } else if (showSpeedLim) {
      speedLimitTitle = '\xa0CLB SPD LIM';
      if (climbSpeedLimitSpeed !== null) {
        speedLimitCell = `{magenta}{${isClimbSpeedLimitPilotEntered ? 'big' : 'small'}}${climbSpeedLimitSpeed.toFixed(0).padStart(3, '0')}/${this.formatFl(climbSpeedLimitAltitude, performanceData.transitionAltitude)}{end}{end}`;
      } else {
        speedLimitCell = '{cyan}*[ ]/[   ]{end}';
      }
    }

    const speedConstraint = waypoint.speedConstraint
      ? Math.round(waypoint.speedConstraint.speed).toFixed(0)
      : undefined;
    const transAltLevel =
      constraintType === WaypointConstraintType.DES
        ? performanceData.transitionLevel * 100
        : performanceData.transitionAltitude;
    const altitudeConstraint = this.formatAltConstraint(waypoint.altitudeConstraint, transAltLevel);
    const canHaveAltConstraint = !isDestination && !waypoint.isXA();

    let r3Title = canHaveAltConstraint ? 'ALT CSTR\xa0' : '';
    let r3Cell = canHaveAltConstraint ? '{cyan}[\xa0\xa0\xa0\xa0]*{end}' : '';
    let l3Title = '\xa0SPD CSTR';
    let l3Cell = '{cyan}*[\xa0\xa0\xa0]{end}';
    let l4Title = 'MACH/START WPT[color]inop';
    let l4Cell = `\xa0{inop}[\xa0]/{small}${waypointIdent}{end}{end}`;
    let r4Title = '';
    let r4Cell = '';
    let r5Cell = '';

    if (isDestination) {
      const hasGsIntercept =
        targetPlan.approach && (targetPlan.approach.type === 5 /* ILS */ || targetPlan.approach.type === 6); /* GLS */
      const gsIntercept = hasGsIntercept ? targetPlan.glideslopeIntercept() : 0;

      if (hasGsIntercept && gsIntercept > 0) {
        r3Title = 'G/S INTCP\xa0';
        r3Cell = `{green}{small}${gsIntercept.toFixed(0)}{end}{end}`;
      } else {
        r3Title = '';
        r3Cell = '';
      }

      const distanceToDest = mcdu.getDistanceToDestination();
      const closeToDest = distanceToDest !== undefined && distanceToDest <= 180;
      l4Title = '\xa0QNH';
      if (isFinite(mcdu.perfApprQNH)) {
        if (mcdu.perfApprQNH < 500) {
          l4Cell = `{cyan}${mcdu.perfApprQNH.toFixed(2)}{end}`;
        } else {
          l4Cell = `{cyan}${mcdu.perfApprQNH.toFixed(0)}{end}`;
        }
      } else if (closeToDest) {
        l4Cell = '{amber}____{end}';
      } else {
        l4Cell = '{cyan}[\xa0\xa0]{end}';
      }
      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (mcdu.setPerfApprQNH(value)) {
          CDUVerticalRevisionPage.ShowPage(
            mcdu,
            waypoint,
            wpIndex,
            verticalWaypoint,
            confirmSpeed,
            confirmAlt,
            confirmCode,
            forPlan,
            inAlternate,
          );
        } else {
          scratchpadCallback();
        }
      };

      l3Title = '';
      l3Cell = '';
      r5Cell = '';
    } else {
      if (canHaveAltConstraint && altitudeConstraint) {
        r3Cell = `{magenta}${altitudeConstraint}{end}`;
      }
      if (speedConstraint) {
        l3Cell = `{magenta}${speedConstraint}{end}`;
      }

      [r4Title, r4Cell] = this.formatAltErrorTitleAndValue(waypoint, verticalWaypoint);

      if (
        mcdu.cruiseLevel &&
        (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Descent ||
          mcdu.flightPhaseManager.phase > FmgcFlightPhase.GoAround)
      ) {
        r5Cell = 'STEP ALTS>';
      }
    }

    mcdu.setTemplate([
      ['VERT REV {small}AT{end}{green} ' + waypointIdent + '{end}'],
      [],
      [''],
      [speedLimitTitle, ''],
      [speedLimitCell, 'RTA>[color]inop'],
      [l3Title, r3Title],
      [l3Cell, r3Cell],
      [l4Title, r4Title],
      [l4Cell, r4Cell],
      [''],
      ['<WIND/TEMP', r5Cell],
      [''],
      [
        confirmConstraint ? '{amber}*CLB{end}' : '<RETURN',
        confirmConstraint ? '{amber}DES*{end}' : '',
        confirmConstraint ? '{amber}{small}OR{end}{end}' : '',
      ],
    ]);

    mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
      if (!showSpeedLim) {
        scratchpadCallback();
        return;
      }

      if (value === Keypad.clrValue) {
        if (showDesSpeedLim) {
          mainTargetPlan.setPerformanceData(
            inAlternate ? 'alternateDescentSpeedLimitSpeed' : 'descentSpeedLimitSpeed',
            null,
          );
          mainTargetPlan.setPerformanceData(
            inAlternate ? 'alternateDescentSpeedLimitAltitude' : 'descentSpeedLimitAltitude',
            null,
          );
          mainTargetPlan.setPerformanceData(
            inAlternate ? 'isAlternateDescentSpeedLimitPilotEntered' : 'isDescentSpeedLimitPilotEntered',
            false,
          );
        } else {
          mainTargetPlan.setPerformanceData(
            inAlternate ? 'alternateClimbSpeedLimitSpeed' : 'climbSpeedLimitSpeed',
            null,
          );
          mainTargetPlan.setPerformanceData(
            inAlternate ? 'alternateClimbSpeedLimitAltitude' : 'climbSpeedLimitAltitude',
            null,
          );
          mainTargetPlan.setPerformanceData(
            inAlternate ? 'isAlternateClimbSpeedLimitPilotEntered' : 'isClimbSpeedLimitPilotEntered',
            false,
          );
        }
        CDUVerticalRevisionPage.ShowPage(
          mcdu,
          waypoint,
          wpIndex,
          verticalWaypoint,
          undefined,
          undefined,
          undefined,
          forPlan,
          inAlternate,
        );
        return;
      }

      const matchResult = value.match(/^([0-9]{1,3})\/(((FL)?([0-9]{1,3}))|([0-9]{4,5}))$/);
      if (matchResult === null) {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }

      const speed = parseInt(matchResult[1]);
      let alt = matchResult[5] !== undefined ? parseInt(matchResult[5]) * 100 : parseInt(matchResult[6]);

      if (speed < 90 || speed > 350 || alt > 45000) {
        mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        scratchpadCallback();
        return;
      }

      alt = Math.round(alt / 10) * 10;

      if (showDesSpeedLim) {
        mainTargetPlan.setPerformanceData(
          inAlternate ? 'alternateDescentSpeedLimitSpeed' : 'descentSpeedLimitSpeed',
          speed,
        );
        mainTargetPlan.setPerformanceData(
          inAlternate ? 'alternateDescentSpeedLimitAltitude' : 'descentSpeedLimitAltitude',
          alt,
        );
        mainTargetPlan.setPerformanceData(
          inAlternate ? 'isAlternateDescentSpeedLimitPilotEntered' : 'isDescentSpeedLimitPilotEntered',
          true,
        );
      } else {
        mainTargetPlan.setPerformanceData(
          inAlternate ? 'alternateClimbSpeedLimitSpeed' : 'climbSpeedLimitSpeed',
          speed,
        );
        mainTargetPlan.setPerformanceData(
          inAlternate ? 'alternateClimbSpeedLimitAltitude' : 'climbSpeedLimitAltitude',
          alt,
        );
        mainTargetPlan.setPerformanceData(
          inAlternate ? 'isAlternateClimbSpeedLimitPilotEntered' : 'isClimbSpeedLimitPilotEntered',
          true,
        );
      }

      CDUVerticalRevisionPage.ShowPage(
        mcdu,
        waypoint,
        wpIndex,
        verticalWaypoint,
        undefined,
        undefined,
        undefined,
        forPlan,
        inAlternate,
      );
    }; // SPD LIM
    mcdu.onRightInput[1] = () => {}; // RTA
    mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        await mcdu.flightPlanService.setPilotEnteredSpeedConstraintAt(
          wpIndex,
          constraintType === WaypointConstraintType.DES,
          undefined,
          forPlan,
          inAlternate,
        );

        mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

        this.ShowPage(mcdu, waypoint, wpIndex, verticalWaypoint, undefined, undefined, undefined, forPlan, inAlternate);
        return;
      }

      if (value.match(/^[0-9]{1,3}$/) === null) {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }

      const speed = parseInt(value);

      if (speed < 90 || speed > 350) {
        mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        scratchpadCallback();
        return;
      }

      if (constraintType === WaypointConstraintType.Unknown) {
        CDUVerticalRevisionPage.ShowPage(
          mcdu,
          waypoint,
          wpIndex,
          verticalWaypoint,
          speed,
          undefined,
          undefined,
          forPlan,
          inAlternate,
        );
        return;
      }

      await mcdu.flightPlanService.setPilotEnteredSpeedConstraintAt(
        wpIndex,
        constraintType === WaypointConstraintType.DES,
        speed,
        forPlan,
        inAlternate,
      );

      mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

      this.ShowPage(mcdu, waypoint, wpIndex, verticalWaypoint, undefined, undefined, undefined, forPlan, inAlternate);
    }; // SPD CSTR
    if (canHaveAltConstraint) {
      mcdu.onRightInput[2] = async (value, scratchpadCallback) => {
        if (value === Keypad.clrValue) {
          await mcdu.flightPlanService.setPilotEnteredAltitudeConstraintAt(
            wpIndex,
            constraintType === WaypointConstraintType.DES,
            undefined,
            forPlan,
            inAlternate,
          );

          mcdu.updateConstraints();
          mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

          this.ShowPage(
            mcdu,
            waypoint,
            wpIndex,
            verticalWaypoint,
            undefined,
            undefined,
            undefined,
            forPlan,
            inAlternate,
          );

          return;
        }

        const matchResult = value.match(/^([+-])?(((FL)?([0-9]{1,3}))|([0-9]{4,5}))$/);

        if (matchResult === null) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        const altitude = matchResult[5] !== undefined ? parseInt(matchResult[5]) * 100 : parseInt(matchResult[6]);
        const code =
          matchResult[1] === undefined
            ? AltitudeDescriptor.AtAlt1
            : matchResult[1] === '-'
              ? AltitudeDescriptor.AtOrBelowAlt1
              : AltitudeDescriptor.AtOrAboveAlt1;

        if (altitude > 45000) {
          mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          scratchpadCallback();
          return;
        }

        if (constraintType === WaypointConstraintType.Unknown) {
          CDUVerticalRevisionPage.ShowPage(
            mcdu,
            waypoint,
            wpIndex,
            verticalWaypoint,
            undefined,
            altitude,
            code,
            forPlan,
            inAlternate,
          );
          return;
        }

        await mcdu.flightPlanService.setPilotEnteredAltitudeConstraintAt(
          wpIndex,
          constraintType === WaypointConstraintType.DES,
          {
            altitudeDescriptor: code,
            altitude1: altitude,
          },
          forPlan,
          inAlternate,
        );

        mcdu.updateConstraints();
        mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

        this.ShowPage(mcdu, waypoint, wpIndex, verticalWaypoint, undefined, undefined, undefined, forPlan, inAlternate);
      }; // ALT CSTR
    }
    mcdu.onLeftInput[4] = () => {
      //TODO: show appropriate wind page based on waypoint
      CDUWindPage.Return = () => {
        CDUVerticalRevisionPage.ShowPage(
          mcdu,
          waypoint,
          wpIndex,
          verticalWaypoint,
          undefined,
          undefined,
          undefined,
          forPlan,
          inAlternate,
        );
      };
      CDUWindPage.ShowPage(mcdu);
    }; // WIND
    mcdu.onRightInput[4] = () => {
      if (!mcdu.cruiseLevel) {
        return;
      }
      CDUStepAltsPage.Return = () => {
        CDUVerticalRevisionPage.ShowPage(
          mcdu,
          waypoint,
          wpIndex,
          verticalWaypoint,
          undefined,
          undefined,
          undefined,
          forPlan,
          inAlternate,
        );
      };
      CDUStepAltsPage.ShowPage(mcdu);
    }; // STEP ALTS
    if (!confirmConstraint) {
      mcdu.onLeftInput[5] = () => {
        CDUFlightPlanPage.ShowPage(mcdu);
      };
    } else {
      mcdu.onLeftInput[5] = async () => {
        if (Number.isFinite(confirmSpeed)) {
          await mcdu.flightPlanService.setPilotEnteredSpeedConstraintAt(
            wpIndex,
            false,
            confirmSpeed,
            forPlan,
            inAlternate,
          );

          mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

          this.ShowPage(
            mcdu,
            waypoint,
            wpIndex,
            verticalWaypoint,
            undefined,
            undefined,
            undefined,
            forPlan,
            inAlternate,
          );
        }

        if (Number.isFinite(confirmAlt)) {
          await mcdu.flightPlanService.setPilotEnteredAltitudeConstraintAt(
            wpIndex,
            false,
            {
              altitudeDescriptor: confirmCode,
              altitude1: confirmAlt,
            },
            forPlan,
            inAlternate,
          );

          mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

          this.ShowPage(
            mcdu,
            waypoint,
            wpIndex,
            verticalWaypoint,
            undefined,
            undefined,
            undefined,
            forPlan,
            inAlternate,
          );
        }
      };

      mcdu.onRightInput[5] = async () => {
        if (Number.isFinite(confirmSpeed)) {
          await mcdu.flightPlanService.setPilotEnteredSpeedConstraintAt(
            wpIndex,
            true,
            confirmSpeed,
            forPlan,
            inAlternate,
          );

          mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

          this.ShowPage(
            mcdu,
            waypoint,
            wpIndex,
            verticalWaypoint,
            undefined,
            undefined,
            undefined,
            forPlan,
            inAlternate,
          );
        }
        if (Number.isFinite(confirmAlt)) {
          await mcdu.flightPlanService.setPilotEnteredAltitudeConstraintAt(
            wpIndex,
            true,
            {
              altitudeDescriptor: confirmCode,
              altitude1: confirmAlt,
            },
            forPlan,
            inAlternate,
          );

          mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

          this.ShowPage(
            mcdu,
            waypoint,
            wpIndex,
            verticalWaypoint,
            undefined,
            undefined,
            undefined,
            forPlan,
            inAlternate,
          );
        }
      };
    }
  }

  static formatFl(constraint, transAlt) {
    if (transAlt >= 100 && constraint > transAlt) {
      return 'FL' + Math.round(constraint / 100);
    }
    return constraint;
  }

  static formatAltConstraint(constraint, transAltLvl) {
    if (!constraint) {
      return '';
    }

    switch (constraint.altitudeDescriptor) {
      case '@': // AtAlt1
      case 'I': // AtAlt1GsIntcptAlt2
      case 'X': // AtAlt1AngleAlt2
        return this.formatFl(Math.round(constraint.altitude1), transAltLvl);
      case '+': // AtOrAboveAlt1
      case 'J': // AtOrAboveAlt1GsIntcptAlt2
      case 'V': // AtOrAboveAlt1AngleAlt2
        return '+' + this.formatFl(Math.round(constraint.altitude1), transAltLvl);
      case '-': // AtOrBelowAlt1
      case 'Y': // AtOrBelowAlt1AngleAlt2
        return '-' + this.formatFl(Math.round(constraint.altitude1), transAltLvl);
      case 'B': // range
        if (constraint.altitude1 < constraint.altitude2) {
          return (
            '+' +
            this.formatFl(Math.round(constraint.altitude1), transAltLvl) +
            '/-' +
            this.formatFl(Math.round(constraint.altitude2), transAltLvl)
          );
        } else {
          return (
            '+' +
            this.formatFl(Math.round(constraint.altitude2), transAltLvl) +
            '/-' +
            this.formatFl(Math.round(constraint.altitude1), transAltLvl)
          );
        }
      case 'C': // AtOrAboveAlt2:
        return '+' + this.formatFl(Math.round(constraint.altitude2), transAltLvl);
      default:
        return '';
    }
  }

  /**
   * @param mcdu
   * @param legIndex {number}
   * @param forPlan {number}
   * @param inAlternate {boolean}
   * @returns {number|(function(*, *): (*))|*|WaypointConstraintType|VerticalWaypointType}
   */
  static constraintType(mcdu, legIndex, forPlan, inAlternate) {
    const planAtIndex = mcdu.flightPlanService.get(forPlan);
    const plan = inAlternate ? planAtIndex.alternateFlightPlan : planAtIndex;

    const leg = plan.legElementAt(legIndex);

    if (leg.constraintType !== 3 /* Unknown */) {
      return leg.constraintType;
    }

    return plan.autoConstraintTypeForLegIndex(legIndex);
  }

  // constraints can be set directly by LSK on f-pln page
  static async setConstraints(
    mcdu,
    leg,
    legIndex,
    verticalWaypoint,
    value,
    scratchpadCallback,
    offset = 0,
    forPlan = 0,
    inAlternate = false,
  ) {
    const type = CDUVerticalRevisionPage.constraintType(mcdu, legIndex, forPlan, inAlternate);
    const isDescentConstraint = type === WaypointConstraintType.DES;

    if (value === Keypad.clrValue) {
      await mcdu.flightPlanService.setPilotEnteredAltitudeConstraintAt(
        legIndex,
        isDescentConstraint,
        undefined,
        forPlan,
        inAlternate,
      );
      await mcdu.flightPlanService.setPilotEnteredSpeedConstraintAt(
        legIndex,
        isDescentConstraint,
        undefined,
        forPlan,
        inAlternate,
      );

      mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

      CDUFlightPlanPage.ShowPage(mcdu, offset);
      return;
    }

    const matchResult = value.match(/^(([0-9]{1,3})\/?)?(\/([+-])?(((FL)?([0-9]{1,3}))|([0-9]{4,5})))?$/);
    if (matchResult === null) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      scratchpadCallback();
      return;
    }

    let speed;
    let alt;

    if (matchResult[2] !== undefined) {
      speed = parseInt(matchResult[2]);
    }

    const code = matchResult[4] === undefined ? '@' : matchResult[4] === '-' ? '-' : '+';

    if (matchResult[8] !== undefined) {
      alt = parseInt(matchResult[8]) * 100;
    }

    if (matchResult[9] !== undefined) {
      alt = parseInt(matchResult[9]);
    }

    if ((speed !== undefined && (speed < 90 || speed > 350)) || (alt !== undefined && alt > 45000)) {
      mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      scratchpadCallback();
      return;
    }

    if (type === WaypointConstraintType.Unknown) {
      CDUVerticalRevisionPage.ShowPage(mcdu, leg, legIndex, verticalWaypoint, speed, alt, code, forPlan, inAlternate);
      return;
    }

    if (speed !== undefined) {
      await mcdu.flightPlanService.setPilotEnteredSpeedConstraintAt(
        legIndex,
        isDescentConstraint,
        speed,
        forPlan,
        inAlternate,
      );

      mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

      CDUFlightPlanPage.ShowPage(mcdu, offset);
    }

    if (alt !== undefined) {
      await mcdu.flightPlanService.setPilotEnteredAltitudeConstraintAt(
        legIndex,
        isDescentConstraint,
        {
          altitudeDescriptor: code,
          altitude1: alt,
        },
        forPlan,
        inAlternate,
      );

      mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();

      CDUFlightPlanPage.ShowPage(mcdu, offset);
    }
  }

  static formatAltErrorTitleAndValue(waypoint, verticalWaypoint) {
    const empty = ['', ''];

    if (!waypoint || !verticalWaypoint) {
      return empty;
    }

    // No constraint
    if (!verticalWaypoint.altitudeConstraint || verticalWaypoint.isAltitudeConstraintMet) {
      return empty;
    }

    // Weird prediction error
    if (!isFinite(verticalWaypoint.altError)) {
      return empty;
    }

    let formattedAltError = (Math.round(verticalWaypoint.altError / 10) * 10).toFixed(0);
    if (verticalWaypoint.altError > 0) {
      formattedAltError = '+' + formattedAltError;
    }

    return ['ALT ERROR\xa0', '{green}{small}' + formattedAltError + '{end}{end}'];
  }
}
