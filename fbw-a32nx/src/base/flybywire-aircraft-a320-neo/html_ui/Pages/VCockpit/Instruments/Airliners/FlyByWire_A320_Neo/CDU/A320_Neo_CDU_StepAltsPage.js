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

        const flightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
        const isFlying = flightPhase >= 5 && flightPhase <= 7;
        const transitionAltitude = mcdu.flightPlanManager.originTransitionAltitude;
        const predictions = mcdu.guidanceController.vnavDriver.currentNavGeometryProfile.waypointPredictions;

        mcdu.setTemplate([
            ["STEP ALTS {small}FROM{end} {green}FL" + mcdu._cruiseFlightLevel + "{end}"],
            ["\xa0ALT\xa0/\xa0WPT", "DIST\xa0TIME"],
            CDUStepAltsPage.formatStepClimbLine(mcdu, 0, predictions, isFlying, transitionAltitude),
            [""],
            CDUStepAltsPage.formatStepClimbLine(mcdu, 1, predictions, isFlying, transitionAltitude),
            [""],
            CDUStepAltsPage.formatStepClimbLine(mcdu, 2, predictions, isFlying, transitionAltitude),
            [""],
            CDUStepAltsPage.formatStepClimbLine(mcdu, 3, predictions, isFlying, transitionAltitude),
            [""],
            CDUStepAltsPage.formatOptStepLine(mcdu.guidanceController.vnavDriver.currentNavGeometryProfile.cruiseSteps),
            [""],
            ["<RETURN"]
        ]);

        for (let i = 0; i < 4; i++) {
            mcdu.onLeftInput[i] = (value) => CDUStepAltsPage.tryParseLeftInput(mcdu, i, value);
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

    static formatStepClimbLine(mcdu, index, predictions, isFlying, transitionAltitude) {
        const emptyField = "[\xa0".padEnd(4, "\xa0") + "]";
        const enteredStepAlts = mcdu.guidanceController.vnavDriver.currentNavGeometryProfile.cruiseSteps;

        if (index > enteredStepAlts.length) {
            return [""];
        } else if (index === enteredStepAlts.length) {
            return ["{cyan}" + emptyField + "/" + emptyField + "{end}"];
        } else {
            const step = enteredStepAlts[index];
            const waypoint = mcdu.flightPlanManager.getWaypoint(step.waypointIndex);

            let distanceCell = "----";
            let timeCell = "----";

            const prediction = predictions.get(step.waypointIndex);
            if (prediction) {
                const { distanceFromStart, secondsFromPresent } = prediction;

                if (isFinite(distanceFromStart)) {
                    distanceCell = "{green}" + Math.round(distanceFromStart).toFixed(0) + "{end}";
                }

                if (isFinite(secondsFromPresent)) {
                    const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");

                    timeCell = isFlying
                        ? `{green}${FMCMainDisplay.secondsToUTC(utcTime + secondsFromPresent)}[s-text]{end}`
                        : `{green}${FMCMainDisplay.secondsTohhmm(secondsFromPresent)}[s-text]{end}`;
                }
            }

            const lastColumn = step.isIgnored ? "IGNORED" : distanceCell + "\xa0" + timeCell;

            return ["{cyan}" + CDUStepAltsPage.formatFl(step.toAltitude, transitionAltitude) + "/" + waypoint.ident + "{end}", lastColumn];
        }
    }

    static tryParseLeftInput(mcdu, index, input) {
        if (index < mcdu.guidanceController.vnavDriver.currentNavGeometryProfile.cruiseSteps.length) {
            return this.onClickExistingStepClimb(mcdu, index, input);
        }

        // Create new step altitude
        if (mcdu.guidanceController.vnavDriver.currentNavGeometryProfile.cruiseSteps.length >= 4) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        const splitInputs = input.split("/");
        const rawAltitudeInput = splitInputs[0];
        const rawIdentInput = splitInputs[1];

        if (!rawIdentInput) {
            // OPT STEP
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
            return false;
        }

        const alt = this.tryParseAltitude(mcdu, rawAltitudeInput);
        if (!alt) {
            return false;
        }

        if (!mcdu.flightPlanManager.tryAddOrUpdateCruiseStep(rawIdentInput, alt)) {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        return true;
    }

    static tryParseAltitude(mcdu, altitudeInput) {
        let altValue = parseInt(altitudeInput);
        if (altitudeInput.startsWith("FL")) {
            altValue = parseInt(100 * altitudeInput.slice(2));
        }

        if (!isFinite(altValue) || !/^\d{4,5}$/.test(altitudeInput) && !/^FL\d{1,3}$/.test(altitudeInput)) {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        altValue = Math.round(altValue / 10) * 10;
        if (altValue < 1000 || altValue > 45000) {
            mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        } else if (altValue > 39800) {
            mcdu.setScratchpadMessage(NXSystemMessages.stepAboveMaxFl);
            return false;
        }

        return altValue;
    }

    static onClickExistingStepClimb(mcdu, index, input) {
        const existingStep = mcdu.guidanceController.vnavDriver.currentNavGeometryProfile.cruiseSteps[index];

        if (input === FMCMainDisplay.clrValue) {
            mcdu.flightPlanManager.tryRemoveCruiseStep(existingStep.waypointIndex);

            return true;
        }

        // Edit step
        const splitInputs = input.split("/");
        if (splitInputs.length === 1) {
            // Altitude
            const altitude = this.tryParseAltitude(mcdu, splitInputs[0]);

            if (altitude && mcdu.flightPlanManager.tryAddOrUpdateCruiseStep(existingStep, altitude)) {
                mcdu.flightPlanManager.tryRemoveCruiseStep(existingStep.waypointIndex);

                return true;
            }
        } else if (splitInputs.length === 2) {
            const rawAltitudeInput = splitInputs[0];
            const rawIdentInput = splitInputs[1];

            if (rawAltitudeInput === "") {
                // /Waypoint
                if (mcdu.flightPlanManager.tryAddOrUpdateCruiseStep(rawIdentInput, existingStep.toAltitude)) {
                    mcdu.flightPlanManager.tryRemoveCruiseStep(existingStep.waypointIndex);

                    return true;
                }
            } else {
                // Altitude/waypoint
                const altitude = this.tryParseAltitude(mcdu, rawAltitudeInput);

                if (altitude && mcdu.flightPlanManager.tryAddOrUpdateCruiseStep(rawIdentInput, altitude)) {
                    mcdu.flightPlanManager.tryRemoveCruiseStep(existingStep.waypointIndex);

                    return true;
                }
            }
        } else if (splitInputs.length === 3) {
            // Altitude/place/distance or
            // /Place/distance
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
            return false;
        }

        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
    }
}
