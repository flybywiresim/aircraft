// @ts-strict-ignore
// Copyright (c) 2021-2023 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { FmgcFlightPhase } from '@shared/flightphase';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { VerticalWaypointPrediction } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';

export class CDUStepAltsPage {
  static Return() {}

  static ShowPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    mcdu.pageUpdate = () => {};

    mcdu.page.Current = mcdu.page.StepAltsPage;
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.StepAltsPage) {
        CDUStepAltsPage.ShowPage(mcdu, forPlan);
      }
    }, mcdu.PageTimeout.Medium);

    const isActivePlan = forPlan === FlightPlanIndex.Active;
    const plan = mcdu.getFlightPlan(forPlan);

    const legsWithSteps = plan.allLegs
      .filter((it) => it.isDiscontinuity === false)
      .filter((it) => it.cruiseStep !== undefined);

    const isFlying =
      mcdu.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff && mcdu.flightPhaseManager.phase < FmgcFlightPhase.Done;
    const transitionAltitude = plan.performanceData.transitionAltitude.get();

    const predictions =
      isActivePlan &&
      mcdu.guidanceController.vnavDriver.mcduProfile &&
      mcdu.guidanceController.vnavDriver.mcduProfile.isReadyToDisplay
        ? mcdu.guidanceController.vnavDriver.mcduProfile.waypointPredictions
        : null;

    mcdu.setTemplate([
      [
        `${!isActivePlan ? 'SEC ' : ''}STEP ALTS {small}FROM{end} {green}FL${plan.performanceData.cruiseFlightLevel.get() ?? ''}{end}`,
      ],
      ['\xa0ALT\xa0/\xa0WPT', 'DIST\xa0TIME'],
      CDUStepAltsPage.formatStepClimbLine(mcdu, legsWithSteps, 0, predictions, isFlying, transitionAltitude),
      [''],
      CDUStepAltsPage.formatStepClimbLine(mcdu, legsWithSteps, 1, predictions, isFlying, transitionAltitude),
      [''],
      CDUStepAltsPage.formatStepClimbLine(mcdu, legsWithSteps, 2, predictions, isFlying, transitionAltitude),
      [''],
      CDUStepAltsPage.formatStepClimbLine(mcdu, legsWithSteps, 3, predictions, isFlying, transitionAltitude),
      [''],
      CDUStepAltsPage.formatOptStepLine(legsWithSteps),
      [''],
      ['<RETURN'],
    ]);

    for (let i = 0; i < 4; i++) {
      mcdu.onLeftInput[i] = (value, scratchpadCallback) =>
        CDUStepAltsPage.tryAddOrUpdateCruiseStepFromLeftInput(
          mcdu,
          scratchpadCallback,
          legsWithSteps,
          i,
          value,
          forPlan,
        );
    }

    mcdu.onLeftInput[4] = () => {};

    mcdu.onLeftInput[5] = () => {
      CDUStepAltsPage.Return();
    };

    mcdu.onRightInput[0] = () => {};
    mcdu.onRightInput[1] = () => {};
    mcdu.onRightInput[2] = () => {};
    mcdu.onRightInput[3] = () => {};
    mcdu.onRightInput[4] = () => {};
    mcdu.onRightInput[5] = () => {};
  }

  static formatFl(altitude: number, transAlt: number) {
    if (transAlt >= 100 && altitude > transAlt) {
      return 'FL' + Math.round(altitude / 100);
    }
    return altitude;
  }

  static formatOptStepLine(steps: FlightPlanLeg[]) {
    if (steps.length > 0) {
      return ['', ''];
    }

    return ['{small}OPT STEP:{end}', '{small}ENTER ALT ONLY{end}'];
  }

  // TODO: I think it should not allow entries of step climbs after step descents, but I'm not sure if it rejects it entirely
  // or gives you an IGNORED.
  /**
   * @param legsWithSteps {FlightPlanLeg[]}
   */
  static formatStepClimbLine(
    mcdu: LegacyFmsPageInterface,
    legsWithSteps: FlightPlanLeg[],
    index: number,
    predictions: Map<number, VerticalWaypointPrediction>,
    isFlying: boolean,
    transitionAltitude: number,
  ) {
    if (!legsWithSteps || index > legsWithSteps.length) {
      return [''];
    } else if (index === legsWithSteps.length) {
      return ['{cyan}[\xa0\xa0\xa0]/[\xa0\xa0\xa0\xa0\xa0]{end}'];
    } else {
      const waypoint = legsWithSteps[index];
      const step = legsWithSteps[index].cruiseStep;

      const prediction = predictions ? predictions.get(step.waypointIndex) : null;

      // Cases:
      // 1. Step above MAX FL (on PROG page)
      // 2. IGNORED (If too close to T/D or before T/C)
      // 3. STEP AHEAD
      // 4. Distance and time<

      let lastColumn = '----\xa0----';
      if (this.checkIfStepAboveMaxFl(mcdu, step.toAltitude)) {
        lastColumn = 'ABOVE\xa0MAX[s-text]';
      } else if (step.isIgnored) {
        lastColumn = 'IGNORED\xa0[s-text]';
      } else if (prediction) {
        const { distanceFromAircraft, secondsFromPresent } = prediction;

        if (Number.isFinite(distanceFromAircraft) && Number.isFinite(secondsFromPresent)) {
          if (distanceFromAircraft < 20) {
            lastColumn = 'STEP\xa0AHEAD[s-text]';
          } else {
            const distanceCell = '{green}' + Math.round(distanceFromAircraft).toFixed(0) + '{end}';
            const timeCell = `{green}${mcdu.getTimePrediction(secondsFromPresent)}[s-text]{end}`;

            lastColumn = distanceCell + '\xa0' + timeCell;
          }
        }
      }

      return [
        '{cyan}' + CDUStepAltsPage.formatFl(step.toAltitude, transitionAltitude) + '/' + waypoint.ident + '{end}',
        lastColumn,
      ];
    }
  }

  static tryAddOrUpdateCruiseStepFromLeftInput(
    mcdu: LegacyFmsPageInterface,
    scratchpadCallback: () => void,
    stepLegs: FlightPlanLeg[],
    index: number,
    input: string,
    forPlan: FlightPlanIndex,
  ) {
    if (index < stepLegs.length) {
      this.onClickExistingStepClimb(mcdu, scratchpadCallback, stepLegs, index, input, forPlan);

      return;
    }

    // Create new step altitude
    if (stepLegs.length >= 4) {
      mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
      scratchpadCallback();
      return;
    }

    const splitInputs = input.split('/');
    const rawAltitudeInput = splitInputs[0];
    const rawIdentInput = splitInputs[1];

    if (!rawIdentInput) {
      // OPT STEP
      mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
      return false;
    }

    const alt = this.tryParseAltitude(rawAltitudeInput);
    if (!alt) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      scratchpadCallback();
      return;
    }

    const plan = mcdu.getFlightPlan(forPlan);
    const legIndex = plan.findLegIndexByFixIdent(rawIdentInput);

    if (legIndex < 0) {
      // Waypoint ident not found in flightplan
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      scratchpadCallback();
      return;
    } else if (legIndex < plan.activeLegIndex) {
      // Don't allow step on FROM waypoint
      mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
      scratchpadCallback();
      return;
    } else if (!this.checkStepInsertionRules(stepLegs, legIndex, alt, plan.performanceData.cruiseFlightLevel.get())) {
      // Step too small or step descent after step climb
      mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
      scratchpadCallback();
      return;
    }

    const leg = plan.legElementAt(legIndex);

    // It is not allowed to have two steps on the same waypoint (FCOM)
    if (leg.cruiseStep !== undefined) {
      mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
      scratchpadCallback();
      return;
    }

    mcdu.flightPlanService.addOrUpdateCruiseStep(legIndex, alt, forPlan);

    if (CDUStepAltsPage.checkIfStepAboveMaxFl(mcdu, alt)) {
      mcdu.addMessageToQueue(NXSystemMessages.stepAboveMaxFl);
    }
  }

  static tryParseAltitude(altitudeInput) {
    if (!altitudeInput) {
      return false;
    }

    const match = altitudeInput.match(/^(FL)?(\d{1,3})$/);

    if (!match) {
      return false;
    }

    const altValue = parseInt(match[2]) * 100;
    if (altValue < 1000 || altValue > 39000) {
      return false;
    }

    return altValue;
  }

  static onClickExistingStepClimb(
    mcdu: LegacyFmsPageInterface,
    scratchpadCallback: () => void,
    stepLegs: FlightPlanLeg[],
    index: number,
    input: string,
    forPlan: FlightPlanIndex,
  ) {
    const plan = mcdu.getFlightPlan(forPlan);

    const stepWaypoint = stepLegs[index];
    const clickedStep = stepWaypoint.cruiseStep;

    if (input === Keypad.clrValue) {
      mcdu.flightPlanService.removeCruiseStep(clickedStep.waypointIndex, forPlan);

      return true;
    }

    // Edit step
    const splitInputs = input.split('/');
    if (splitInputs.length === 1 || (splitInputs.length === 2 && splitInputs[1] === '')) {
      // Altitude
      const altitude = this.tryParseAltitude(splitInputs[0]);
      if (!altitude) {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      } else if (
        !this.checkStepInsertionRules(
          stepLegs,
          clickedStep.waypointIndex,
          clickedStep.toAltitude,
          plan.performanceData.cruiseFlightLevel.get(),
        )
      ) {
        // Step too small or step descent after step climb
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return;
      }

      mcdu.flightPlanService.addOrUpdateCruiseStep(clickedStep.waypointIndex, altitude, forPlan);

      if (this.checkIfStepAboveMaxFl(mcdu, altitude)) {
        mcdu.addMessageToQueue(NXSystemMessages.stepAboveMaxFl);
      }
    } else if (splitInputs.length === 2) {
      const rawAltitudeInput = splitInputs[0];
      const rawIdentInput = splitInputs[1];

      const legIndex = plan.findLegIndexByFixIdent(rawIdentInput);

      if (legIndex < 0) {
        // Waypoint ident not found in flightplan
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }

      if (rawAltitudeInput === '') {
        // /Waypoint
        mcdu.flightPlanService.addOrUpdateCruiseStep(legIndex, clickedStep.toAltitude, forPlan);
        mcdu.flightPlanService.removeCruiseStep(clickedStep.waypointIndex, forPlan);
      } else {
        // Altitude/waypoint
        const altitude = this.tryParseAltitude(rawAltitudeInput);

        if (!altitude) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        mcdu.flightPlanService.addOrUpdateCruiseStep(legIndex, altitude, forPlan);
        mcdu.flightPlanService.removeCruiseStep(clickedStep.waypointIndex, forPlan);

        if (this.checkIfStepAboveMaxFl(mcdu, altitude)) {
          mcdu.addMessageToQueue(NXSystemMessages.stepAboveMaxFl);
        }
      }
    } else if (splitInputs.length === 3) {
      // Altitude/place/distance or
      // /Place/distance
      mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
      scratchpadCallback();
      return;
    }
  }

  static checkIfStepAboveMaxFl(mcdu, altitude) {
    const maxFl = mcdu.getMaxFlCorrected();
    return Number.isFinite(maxFl) && altitude > maxFl * 100;
  }

  /**
   * Check a couple of rules about insertion of step:
   * - Minimum step size is 1000ft
   * - S/C follows step descent
   * TODO: It's possible that the insertion of a step in between already inserted steps causes a step descent after step climb
   * I don't know how the plane handles this.
   */
  static checkStepInsertionRules(
    stepLegs: FlightPlanLeg[],
    insertAtIndex: number,
    toAltitude: number,
    cruiseLevel: number,
  ) {
    let altitude = cruiseLevel * 100;
    let doesHaveStepDescent = false;

    let i = 0;
    for (; i < stepLegs.length; i++) {
      const step = stepLegs[i].cruiseStep;
      if (step.waypointIndex > insertAtIndex) {
        break;
      }

      const stepAltitude = step.toAltitude;
      if (stepAltitude < altitude) {
        doesHaveStepDescent = true;
      }

      altitude = stepAltitude;
    }

    const isStepSizeValid = Math.abs(toAltitude - altitude) >= 1000;
    if (!isStepSizeValid) {
      return false;
    }

    const isClimbVsDescent = toAltitude > altitude;
    if (!isClimbVsDescent) {
      doesHaveStepDescent = true;
    } else if (doesHaveStepDescent) {
      return false;
    }

    if (i < stepLegs.length) {
      const stepAfter = stepLegs[i].cruiseStep;
      const isStepSizeValid = Math.abs(stepAfter.toAltitude - toAltitude) >= 1000;
      const isClimbVsDescent = stepAfter.toAltitude > toAltitude;

      const isClimbAfterDescent = isClimbVsDescent && doesHaveStepDescent;

      return isStepSizeValid && !isClimbAfterDescent;
    }

    return true;
  }
}
