class CDUStepAltsPage {
    static Return() {}

    static ShowPage(mcdu) {
        mcdu.pageUpdate = () => { };

        mcdu.page.Current = mcdu.page.StepAltsPage;
        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.StepAltsPage) {
                CDUStepAltsPage.ShowPage(mcdu);
            }
        }, mcdu.PageTimeout.Medium);

        const plan = mcdu.flightPlanManager.getCurrentFlightPlan();
        if (!plan) {
            return;
        }

        const steps = plan.cruiseStepWaypoints;

        const isFlying = mcdu.flightPhaseManager.phase >= FmgcFlightPhases.TAKEOFF && mcdu.flightPhaseManager.phase < FmgcFlightPhases.DONE;
        const transitionAltitude = mcdu.flightPlanManager.originTransitionAltitude;

        const predictions = mcdu.guidanceController.vnavDriver.mcduProfile && mcdu.guidanceController.vnavDriver.mcduProfile.isReadyToDisplay
            ? mcdu.guidanceController.vnavDriver.mcduProfile.waypointPredictions
            : null;

        mcdu.setTemplate([
            ["STEP ALTS {small}FROM{end} {green}FL" + mcdu._cruiseFlightLevel + "{end}"],
            ["\xa0ALT\xa0/\xa0WPT", "DIST\xa0TIME"],
            CDUStepAltsPage.formatStepClimbLine(mcdu, steps, 0, predictions, isFlying, transitionAltitude),
            [""],
            CDUStepAltsPage.formatStepClimbLine(mcdu, steps, 1, predictions, isFlying, transitionAltitude),
            [""],
            CDUStepAltsPage.formatStepClimbLine(mcdu, steps, 2, predictions, isFlying, transitionAltitude),
            [""],
            CDUStepAltsPage.formatStepClimbLine(mcdu, steps, 3, predictions, isFlying, transitionAltitude),
            [""],
            CDUStepAltsPage.formatOptStepLine(steps),
            [""],
            ["<RETURN"]
        ]);

        for (let i = 0; i < 4; i++) {
            mcdu.onLeftInput[i] = (value, scratchpadCallback) => CDUStepAltsPage.tryAddOrUpdateCruiseStepFromLeftInput(mcdu, scratchpadCallback, steps, i, value);
        }

        mcdu.onLeftInput[4] = () => { };

        mcdu.onLeftInput[5] = () => {
            CDUStepAltsPage.Return();
        };

        mcdu.onRightInput[0] = () => { };
        mcdu.onRightInput[1] = () => { };
        mcdu.onRightInput[2] = () => { };
        mcdu.onRightInput[3] = () => { };
        mcdu.onRightInput[4] = () => { };
        mcdu.onRightInput[5] = () => { };
    }

    static formatFl(altitude, transAlt) {
        if (transAlt >= 100 && altitude > transAlt) {
            return "FL" + Math.round(altitude / 100);
        }
        return altitude;
    }

    static formatOptStepLine(steps) {
        if (steps.length > 0) {
            return ["", ""];
        }

        return ["{small}OPT STEP:{end}", "{small}ENTER ALT ONLY{end}"];
    }

    // TODO: I think it should not allow entries of step climbs after step descents, but I'm not sure if it rejects it entirely
    // or gives you an IGNORED.
    static formatStepClimbLine(mcdu, steps, index, predictions, isFlying, transitionAltitude) {
        if (!steps || index > steps.length) {
            return [""];
        } else if (index === steps.length) {
            return ["{cyan}[\xa0\xa0\xa0]/[\xa0\xa0\xa0\xa0\xa0]{end}"];
        } else {
            const waypoint = steps[index];
            const step = steps[index].additionalData.cruiseStep;

            const prediction = predictions ? predictions.get(step.waypointIndex) : null;

            // Cases:
            // 1. Step above MAX FL (on PROG page)
            // 2. IGNORED (If too close to T/D or before T/C)
            // 3. STEP AHEAD
            // 4. Distance and time<

            let lastColumn = "----\xa0----";
            if (this.checkIfStepAboveMaxFl(mcdu, step.toAltitude)) {
                lastColumn = "ABOVE\xa0MAX[s-text]";
            } else if (step.isIgnored) {
                lastColumn = "IGNORED\xa0[s-text]";
            } else if (prediction) {
                const { distanceFromAircraft, secondsFromPresent } = prediction;

                if (Number.isFinite(distanceFromAircraft) && Number.isFinite(secondsFromPresent)) {
                    if (distanceFromAircraft < 20) {
                        lastColumn = "STEP\xa0AHEAD[s-text]";
                    } else {
                        const distanceCell = "{green}" + Math.round(distanceFromAircraft).toFixed(0) + "{end}";

                        const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                        const timeCell = isFlying
                            ? `{green}${FMCMainDisplay.secondsToUTC(utcTime + secondsFromPresent)}[s-text]{end}`
                            : `{green}${FMCMainDisplay.secondsTohhmm(secondsFromPresent)}[s-text]{end}`;

                        lastColumn = distanceCell + "\xa0" + timeCell;
                    }
                }
            }

            return ["{cyan}" + CDUStepAltsPage.formatFl(step.toAltitude, transitionAltitude) + "/" + waypoint.ident + "{end}", lastColumn];
        }
    }

    static tryAddOrUpdateCruiseStepFromLeftInput(mcdu, scratchpadCallback, stepWaypoints, index, input) {
        if (index < stepWaypoints.length) {
            this.onClickExistingStepClimb(mcdu, scratchpadCallback, stepWaypoints, index, input);

            return;
        }

        // Create new step altitude
        if (stepWaypoints.length >= 4) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
        }

        const splitInputs = input.split("/");
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

        const waypointIndex = mcdu.flightPlanManager.findWaypointIndexByIdent(rawIdentInput);
        if (waypointIndex < 0) {
            // Waypoint ident not found in flightplan
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
        } else if (waypointIndex < mcdu.flightPlanManager.getActiveWaypointIndex()) {
            // Don't allow step on FROM waypoint
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
        } else if (!this.checkStepInsertionRules(mcdu, stepWaypoints, waypointIndex, alt)) {
            // Step too small or step descent after step climb
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
        }

        const waypoint = mcdu.flightPlanManager.getWaypoint(waypointIndex);
        // It is not allowed to have two steps on the same waypoint (FCOM)
        if (waypoint.additionalData.cruiseStep !== undefined) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
        }

        mcdu.flightPlanManager.addOrUpdateCruiseStep(waypoint, alt);

        if (CDUStepAltsPage.checkIfStepAboveMaxFl(mcdu, alt)) {
            mcdu.setScratchpadMessage(NXSystemMessages.stepAboveMaxFl);
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

    static onClickExistingStepClimb(mcdu, scratchpadCallback, stepWaypoints, index, input) {
        const stepWaypoint = stepWaypoints[index];
        const clickedStep = stepWaypoint.additionalData.cruiseStep;

        if (input === FMCMainDisplay.clrValue) {
            mcdu.flightPlanManager.removeCruiseStep(stepWaypoint);

            return true;
        }

        // Edit step
        const splitInputs = input.split("/");
        if (splitInputs.length === 1 || splitInputs.length === 2 && splitInputs[1] === "") {
            // Altitude
            const altitude = this.tryParseAltitude(splitInputs[0]);
            if (!altitude) {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                scratchpadCallback();
                return;
            } else if (!this.checkStepInsertionRules(mcdu, stepWaypoints, clickedStep.wapyointIndex, clickedStep.toAltitude)) {
                // Step too small or step descent after step climb
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                scratchpadCallback();
                return;
            }

            mcdu.flightPlanManager.addOrUpdateCruiseStep(stepWaypoint, altitude, clickedStep.waypointIndex);

            if (this.checkIfStepAboveMaxFl(mcdu, altitude)) {
                mcdu.setScratchpadMessage(NXSystemMessages.stepAboveMaxFl);
            }
        } else if (splitInputs.length === 2) {
            const rawAltitudeInput = splitInputs[0];
            const rawIdentInput = splitInputs[1];

            const waypointIndex = mcdu.flightPlanManager.findWaypointIndexByIdent(rawIdentInput)
            if (waypointIndex < 0) {
                // Waypoint ident not found in flightplan
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                scratchpadCallback();
                return;
            }

            const waypoint = mcdu.flightPlanManager.getWaypoint(waypointIndex);

            if (rawAltitudeInput === "") {
                // /Waypoint
                mcdu.flightPlanManager.addOrUpdateCruiseStep(waypoint, clickedStep.toAltitude, waypointIndex);
                mcdu.flightPlanManager.removeCruiseStep(stepWaypoint);
            } else {
                // Altitude/waypoint
                const altitude = this.tryParseAltitude(rawAltitudeInput);
                if (!altitude) {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                    scratchpadCallback();
                    return;
                }

                mcdu.flightPlanManager.addOrUpdateCruiseStep(waypoint, altitude, waypointIndex);
                mcdu.flightPlanManager.removeCruiseStep(stepWaypoint);

                if (this.checkIfStepAboveMaxFl(mcdu, altitude)) {
                    mcdu.setScratchpadMessage(NXSystemMessages.stepAboveMaxFl);
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
        const maxFl = mcdu.getMaxFlCorrected()
        return Number.isFinite(maxFl) && altitude > maxFl * 100;
    }

    /**
     * Check a couple of rules about insertion of step:
     * - Minimum step size is 1000ft
     * - S/C follows step descent
     * TODO: It's possible that the insertion of a step in between already inserted steps causes a step descent after step climb
     * I don't know how the plane handles this.
     * @param {*} mcdu
     * @param {*} stepWaypoints Existing steps
     * @param {*} insertAtIndex Index of waypoint to insert step at
     * @param {*} toAltitude Altitude of step
     */
    static checkStepInsertionRules(mcdu, stepWaypoints, insertAtIndex, toAltitude) {
        let altitude = mcdu._cruiseFlightLevel * 100;
        let doesHaveStepDescent = false;

        let i = 0;
        for (; i < stepWaypoints.length; i++) {
            const step = stepWaypoints[i].additionalData.cruiseStep;
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

        const isClimbVsDescent = toAltitude > altitude
        if (!isClimbVsDescent) {
            doesHaveStepDescent = true;
        } else if (doesHaveStepDescent) {
            return false;
        }

        if (i < stepWaypoints.length) {
            const stepAfter = stepWaypoints[i].additionalData.cruiseStep;
            const isStepSizeValid = Math.abs(stepAfter.toAltitude - toAltitude) >= 1000;
            const isClimbVsDescent = stepAfter.toAltitude > toAltitude;

            const isClimbAfterDescent = isClimbVsDescent && doesHaveStepDescent;

            return isStepSizeValid && !isClimbAfterDescent
        }

        return true;
    }
}
