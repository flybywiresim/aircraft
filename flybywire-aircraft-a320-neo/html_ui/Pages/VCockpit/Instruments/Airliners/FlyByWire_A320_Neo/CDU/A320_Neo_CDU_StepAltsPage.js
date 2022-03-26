class CDUStepAltsPage {
    static Return() {}

    static ShowPage(mcdu) {
        const flightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
        const isFlying = flightPhase >= 5 && flightPhase <= 7;
        const transitionAltitude = mcdu.flightPlanManager.originTransitionAltitude;
        const coordinator = mcdu.guidanceController.vnavDriver.stepCoordinator;
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
            CDUStepAltsPage.formatOptStepLine(coordinator.steps),
            [""],
            ["<RETURN"]
        ]);

        for (let i = 0; i < 4; i++) {
            mcdu.onLeftInput[i] = (value) => CDUStepAltsPage.tryParseLeftInput(mcdu, coordinator, i, value);
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
        const enteredStepAlts = mcdu.guidanceController.vnavDriver.stepCoordinator.steps;

        if (index > enteredStepAlts.length) {
            return [""];
        } else if (index === enteredStepAlts.length) {
            return ["{cyan}" + emptyField + "/" + emptyField + "{end}"];
        } else {
            const step = enteredStepAlts[index];

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

            return ["{cyan}" + CDUStepAltsPage.formatFl(step.toAltitude, transitionAltitude) + "/" + step.ident + "{end}", lastColumn];
        }
    }

    static tryParseLeftInput(mcdu, coordinator, index, input) {
        if (index < coordinator.steps.length) {
            return this.onClickExistingStepClimb(mcdu, coordinator, index, input);
        }

        // Create new step altitude
        if (coordinator.steps.length >= 4) {
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        }

        const splitInputs = input.split("/");
        const altInput = splitInputs[0];
        const waypointInput = splitInputs[1];

        if (!waypointInput) {
            mcdu.addNewMessage(NXSystemMessages.notAllowed);
            return false;
            // OPT STEP
        }

        const alt = this.tryParseAltitude(mcdu, altInput);
        if (!alt) {
            return false;
        }

        if (!coordinator.requestToAddGeographicStep(waypointInput, alt)) {
            mcdu.addNewMessage(NXSystemMessages.formatError);
            return false;
        }

        CDUStepAltsPage.ShowPage(mcdu);
        return true;
    }

    static tryParseAltitude(mcdu, altitudeInput) {
        let altValue = parseInt(altitudeInput);
        if (altitudeInput.startsWith("FL")) {
            altValue = parseInt(100 * altitudeInput.slice(2));
        }

        if (!isFinite(altValue) || !/^\d{4,5}$/.test(altitudeInput) && !/^FL\d{1,3}$/.test(altitudeInput)) {
            mcdu.addNewMessage(NXSystemMessages.formatError);
            return false;
        }

        altValue = Math.round(altValue / 10) * 10;
        if (altValue < 1000 || altValue > 45000) {
            mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
            return false;
        } else if (altValue > 39800) {
            mcdu.addNewMessage(NXSystemMessages.stepAboveMaxFl);
            return false;
        }

        return altValue;
    }

    static onClickExistingStepClimb(mcdu, coordinator, index, input) {
        if (input === FMCMainDisplay.clrValue) {
            coordinator.removeStep(index);
            CDUStepAltsPage.ShowPage(mcdu);

            return true;
        }

        // Edit step

        return false;
    }
}
