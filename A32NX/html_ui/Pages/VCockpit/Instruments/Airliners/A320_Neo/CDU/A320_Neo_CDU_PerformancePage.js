class CDUPerformancePage {
    static ShowPage(mcdu) {
        mcdu.activeSystem = 'FMGC';
        if (mcdu.currentFlightPhase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        } else if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            CDUPerformancePage.ShowCLBPage(mcdu);
        } else if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            CDUPerformancePage.ShowCRZPage(mcdu);
        } else if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            CDUPerformancePage.ShowDESPage(mcdu);
        } else if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
            CDUPerformancePage.ShowAPPRPage(mcdu);
        } else if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_GOAROUND) {
            CDUPerformancePage.ShowGOAROUNDPage(mcdu);
        }
    }

    static ShowTAKEOFFPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PerformancePageTakeoff;
        CDUPerformancePage._timer = 0;
        CDUPerformancePage._lastPhase = mcdu.currentFlightPhase;
        mcdu.pageUpdate = () => {
            CDUPerformancePage._timer++;
            if (CDUPerformancePage._timer >= 15) {
                if (mcdu.currentFlightPhase === CDUPerformancePage._lastPhase) {
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else {
                    CDUPerformancePage.ShowPage(mcdu);
                }
            }
        };

        let titleColor = "white";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            titleColor = "green";
        }

        // check if we even have an airport
        const hasOrigin = !!mcdu.flightPlanManager.getOrigin();

        // runway
        let runway = "";
        let hasRunway = false;
        if (hasOrigin) {
            const runwayObj = mcdu.flightPlanManager.getDepartureRunway();
            if (runwayObj) {
                runway = `{green}${Avionics.Utils.formatRunway(runwayObj.designation)}{end}`;
                hasRunway = true;
            }
        }

        // v speeds
        let v1 = "---";
        let vR = "---";
        let v2 = "---";
        if (mcdu.currentFlightPhase < FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            v1 = "{amber}___{end}";
            if (mcdu.v1Speed) {
                v1 = `{cyan}${("" + mcdu.v1Speed).padEnd(3)}{end}`;
            }
            mcdu.onLeftInput[0] = (value) => {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.v1Speed = undefined;
                    SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", -1);
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else if (value === "") {
                    // not real: v-speed helper
                    mcdu.sendDataToScratchpad(mcdu._getV1Speed().toString());
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else {
                    if (mcdu.trySetV1Speed(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                }
            };
            vR = "{amber}___{end}";
            if (mcdu.vRSpeed) {
                vR = `{cyan}${("" + mcdu.vRSpeed).padEnd(3)}{end}`;
            }
            mcdu.onLeftInput[1] = (value) => {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.vRSpeed = undefined;
                    SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", -1);
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else if (value === "") {
                    mcdu.sendDataToScratchpad(mcdu._getVRSpeed().toString());
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else {
                    if (mcdu.trySetVRSpeed(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                }
            };
            v2 = "{amber}___{end}";
            if (mcdu.v2Speed) {
                v2 = `{cyan}${("" + mcdu.v2Speed).padEnd(3)}{end}`;
            }
            mcdu.onLeftInput[2] = (value) => {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.v2Speed = undefined;
                    SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", -1);
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else if (value === "") {
                    mcdu.sendDataToScratchpad(mcdu._getV2Speed().toString());
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else {
                    if (mcdu.trySetV2Speed(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                }
            };
        } else {
            if (mcdu.v1Speed) {
                v1 = `{green}${("" + mcdu.v1Speed).padEnd(3)}{end}`;
            }
            if (mcdu.vRSpeed) {
                vR = `{green}${("" + mcdu.vRSpeed).padEnd(3)}{end}`;
            }
            if (mcdu.v2Speed) {
                v2 = `{green}${("" + mcdu.v2Speed).padEnd(3)}{end}`;
            }
            mcdu.onLeftInput[0] = (value) => {
                if (value !== "") {
                    mcdu.showErrorMessage("NOT ALLOWED");
                }
            };
            mcdu.onLeftInput[1] = (value) => {
                if (value !== "") {
                    mcdu.showErrorMessage("NOT ALLOWED");
                }
            };
            mcdu.onLeftInput[2] = (value) => {
                if (value !== "") {
                    mcdu.showErrorMessage("NOT ALLOWED");
                }
            };
        }

        // transition altitude - remains editable during take off
        let transAltCell = "";
        if (hasOrigin) {
            const transAltitude = mcdu.getTransitionAltitude();
            if (isFinite(transAltitude)) {
                transAltCell = "" + transAltitude;
                if (!mcdu.transitionAltitudeIsPilotEntered) {
                    transAltCell += "[s-text]";
                }
            } else {
                transAltCell = "[]";
            }
            mcdu.onLeftInput[3] = (value) => {
                if (mcdu.trySetTakeOffTransAltitude(value)) {
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                }
            };
        }

        // thrust reduction / acceleration altitude
        let thrRedAcc = "-----/-----";
        if (hasOrigin) {
            if (mcdu.currentFlightPhase < FlightPhase.FLIGHT_PHASE_TAKEOFF) {
                let thrRed = "[\xa0]";
                if (isFinite(mcdu.thrustReductionAltitude)) {
                    thrRed = ("" + mcdu.thrustReductionAltitude.toFixed(0)).padStart(5, "\xa0");
                }
                let acc = "[\xa0]";
                if (isFinite(mcdu.accelerationAltitude)) {
                    acc = mcdu.accelerationAltitude.toFixed(0);
                }
                // TODO remove s-text if user has set value
                thrRedAcc = `${thrRed}/${acc}[s-text][color]cyan`;
                mcdu.onLeftInput[4] = (value) => {
                    if (mcdu.trySetThrustReductionAccelerationAltitude(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                };
            } else {
                let thrRed = "---";
                if (isFinite(mcdu.thrustReductionAltitude)) {
                    thrRed = ("" + mcdu.thrustReductionAltitude.toFixed(0)).padStart(5, "\xa0");
                }
                let acc = "---";
                if (isFinite(mcdu.accelerationAltitude)) {
                    acc = mcdu.accelerationAltitude.toFixed(0);
                }
                // TODO remove s-text if user has set value
                thrRedAcc = `${thrRed}/${acc}[s-text][color]green`;
            }
        }

        // center column
        let flpRetrCell = "---";
        let sltRetrCell = "---";
        let cleanCell = "---";
        const flapSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_F", "number");
        if (flapSpeed !== 0) {
            flpRetrCell = `{green}${flapSpeed.toFixed(0)}{end}`;
        }
        const slatSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_S", "number");
        if (slatSpeed !== 0) {
            sltRetrCell = `{green}${slatSpeed.toFixed(0)}{end}`;
        }
        const cleanSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_GD", "number");
        if (cleanSpeed !== 0) {
            cleanCell = `{green}${cleanSpeed.toFixed(0)}{end}`;
        }

        // takeoff shift
        let toShiftCell = "----\xa0";
        if (hasOrigin) {
            toShiftCell = "{small}[M]{end}\xa0----";
            if (mcdu.currentFlightPhase < FlightPhase.FLIGHT_PHASE_TAKEOFF) {
                if (hasRunway) {
                    toShiftCell = "{inop}{small}[M]{end}[\xa0\xa0]*{end}";
                    // TODO store and show TO SHIFT
                }
            } else {
                // TODO show TO SHIFT in green if stored
            }
        }

        // flaps / trim horizontal stabilizer
        let flapsThs = "[]/[\xa0\xa0\xa0][color]cyan";
        if (mcdu.currentFlightPhase < FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            const flaps = mcdu.flaps ? mcdu.flaps : "[]";
            const ths = mcdu.ths ? mcdu.ths : "[\xa0\xa0\xa0]";
            flapsThs = `${flaps}/${ths}[color]cyan`;
            mcdu.onRightInput[2] = (value) => {
                if (mcdu.trySetFlapsTHS(value)) {
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                }
            };
        } else {
            const flaps = mcdu.flaps ? mcdu.flaps : "---";
            const ths = mcdu.ths ? mcdu.ths : "---";
            flapsThs = `${flaps}/${ths}[color]green`;
        }

        // flex takeoff temperature
        let flexTakeOffTempCell = "[\xa0]°[color]cyan";
        if (mcdu.currentFlightPhase < FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            if (isFinite(mcdu.perfTOTemp)) {
                flexTakeOffTempCell = `${mcdu.perfTOTemp}°[color]cyan`;
            }
            mcdu.onRightInput[3] = (value) => {
                if (mcdu.setPerfTOFlexTemp(value)) {
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                }
            };
        } else {
            if (isFinite(mcdu.perfTOTemp)) {
                flexTakeOffTempCell = `${mcdu.perfTOTemp}°[color]green`;
            }
        }

        // eng out acceleration altitude
        let engOutAcc = "-----";
        if (hasOrigin) {
            if (mcdu.currentFlightPhase < FlightPhase.FLIGHT_PHASE_TAKEOFF) {
                engOutAcc = "1680[s-text][color]cyan";
            } else {
                engOutAcc = "1680[s-text][color]green";
            }
            mcdu.onRightInput[4] = (value) => {
                if (mcdu.trySetEngineOutAcceleration(value)) {
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                }
            };
        }


        mcdu.setTemplate([
            ["TAKE OFF RWY " + runway.padStart(3, "\xa0") + "[color]" + titleColor],
            ["\xa0V1\xa0\xa0\xa0\xa0FLP RETR", ""],
            [v1 + "\xa0\xa0\xa0\xa0\xa0F=" + flpRetrCell, ""],
            ["\xa0VR\xa0\xa0\xa0\xa0SLT RETR", "TO SHIFT\xa0"],
            [vR + "\xa0\xa0\xa0\xa0\xa0S=" + sltRetrCell, toShiftCell],
            ["\xa0V2\xa0\xa0\xa0\xa0\xa0\xa0\xa0CLEAN", "FLAPS/THS"],
            [v2 + "\xa0\xa0\xa0\xa0\xa0O=" + cleanCell, flapsThs],
            ["TRANS ALT", "FLEX TO TEMP"],
            [transAltCell + "[color]cyan", flexTakeOffTempCell],
            ["THR RED/ACC", "ENG OUT ACC"],
            [thrRedAcc, engOutAcc],
            ["\xa0UPLINK[color]inop", "NEXT\xa0"],
            ["<TO DATA[color]inop", "PHASE>"]
        ]);

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = (value) => {
            CDUPerformancePage.ShowCLBPage(mcdu);
        };
    }

    static ShowCLBPage(mcdu, confirmAppr = false) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PerformancePageClb;
        CDUPerformancePage._timer = 0;
        CDUPerformancePage._lastPhase = mcdu.currentFlightPhase;
        mcdu.pageUpdate = () => {
            CDUPerformancePage._timer++;
            if (CDUPerformancePage._timer >= 100) {
                if (mcdu.currentFlightPhase === CDUPerformancePage._lastPhase) {
                    CDUPerformancePage.ShowCLBPage(mcdu);
                } else {
                    CDUPerformancePage.ShowPage(mcdu);
                }
            }
        };
        let titleColor = "white";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            titleColor = "green";
        }
        const isFlying = mcdu.getIsFlying();
        let actModeCell = "SELECTED";
        if (mcdu.isAirspeedManaged()) {
            actModeCell = "MANAGED";
        }

        let costIndexCell = "--";
        if (
            mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident &&
            mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident
        ) {
            costIndexCell = "__[color]amber";
            if (isFinite(mcdu.costIndex)) {
                costIndexCell = mcdu.costIndex.toFixed(0) + "[color]cyan";
            }
            mcdu.onLeftInput[1] = (value) => {
                if (mcdu.tryUpdateCostIndex(value)) {
                    CDUPerformancePage.ShowCLBPage(mcdu);
                }
            };
        }

        let managedSpeedCell = "\xa0{small}---/---{end}[color]inop";
        let managedSpeed = mcdu.getClbManagedSpeed();
        if (SimVar.GetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool")) {
            managedSpeed = mcdu.getPerfGreenDotSpeed();
        }
        if (isFinite(managedSpeed)) {
            managedSpeedCell = `\xa0{small}${managedSpeed.toFixed(0)}{inop}/---{end}{end}[color]green`;
        }

        let selectedSpeedLabel = "PRESEL";
        let selectedSpeedCell = "*[ ][color]cyan";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            selectedSpeedLabel = "SELECTED";
        }
        if (isFinite(mcdu.preSelectedClbSpeed)) {
            selectedSpeedCell = `\xa0${mcdu.preSelectedClbSpeed.toFixed(0)}[color]cyan`;
        }
        mcdu.onLeftInput[3] = (value) => {
            if (mcdu.trySetPreSelectedClimbSpeed(value)) {
                CDUPerformancePage.ShowCLBPage(mcdu);
            }
        };

        let timeLabel = "TIME";
        if (isFlying) {
            timeLabel = "UTC";
        }
        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async (value) => {
                    if (await mcdu.tryGoInApproachPhase()) {
                        CDUPerformancePage.ShowAPPRPage(mcdu);
                    }
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = (value) => {
                    CDUPerformancePage.ShowCLBPage(mcdu, true);
                };
            }
        } else {
            mcdu.leftInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[5] = (value) => {
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            };
        }
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = (value) => {
            CDUPerformancePage.ShowCRZPage(mcdu);
        };
        mcdu.setTemplate([
            ["CLB[color]" + titleColor],
            ["ACT MODE", "DEST EFOB", timeLabel],
            [actModeCell + "[color]green", "---.-", "----"],
            ["\xa0CI"],
            [costIndexCell],
            ["\xa0MANAGED"],
            [managedSpeedCell],
            ["\xa0" + selectedSpeedLabel],
            [selectedSpeedCell],
            [""],
            [""],
            bottomRowLabels,
            bottomRowCells
        ]);
    }

    static ShowCRZPage(mcdu, confirmAppr = false) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PerformancePageCrz;
        CDUPerformancePage._timer = 0;
        CDUPerformancePage._lastPhase = mcdu.currentFlightPhase;
        mcdu.pageUpdate = () => {
            CDUPerformancePage._timer++;
            if (CDUPerformancePage._timer >= 100) {
                if (mcdu.currentFlightPhase === CDUPerformancePage._lastPhase) {
                    CDUPerformancePage.ShowCRZPage(mcdu);
                } else {
                    CDUPerformancePage.ShowPage(mcdu);
                }
            }
        };
        let titleColor = "white";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            titleColor = "green";
        }
        const isFlying = false;
        let actModeCell = "SELECTED";
        if (mcdu.isAirspeedManaged()) {
            actModeCell = "MANAGED";
        }

        let costIndexCell = "--";
        if (
            mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident &&
            mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident
        ) {
            costIndexCell = "__[color]amber";
            if (isFinite(mcdu.costIndex)) {
                costIndexCell = mcdu.costIndex.toFixed(0) + "[color]cyan";
            }
            mcdu.onLeftInput[1] = (value) => {
                if (mcdu.tryUpdateCostIndex(value)) {
                    CDUPerformancePage.ShowCRZPage(mcdu);
                }
            };
        }

        let managedSpeedCell = "\xa0{small}---/---{end}[color]inop";
        const managedSpeed = mcdu.getCrzManagedSpeed();
        if (isFinite(managedSpeed)) {
            managedSpeedCell = `\xa0{small}${managedSpeed.toFixed(0)}{inop}/---{end}{end}[color]green`;
        }

        let selectedSpeedLabel = "PRESEL";
        let selectedSpeedCell = "*[ ][color]cyan";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            selectedSpeedLabel = "SELECTED";
        }
        if (isFinite(mcdu.preSelectedCrzSpeed)) {
            selectedSpeedCell = `\xa0${mcdu.preSelectedCrzSpeed.toFixed(0)}[color]cyan`;
        }
        mcdu.onLeftInput[3] = (value) => {
            if (mcdu.trySetPreSelectedCruiseSpeed(value)) {
                CDUPerformancePage.ShowCRZPage(mcdu);
            }
        };

        let timeLabel = "TIME";
        if (isFlying) {
            timeLabel = "UTC";
        }
        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async (value) => {
                    if (await mcdu.tryGoInApproachPhase()) {
                        CDUPerformancePage.ShowAPPRPage(mcdu);
                    }
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.onLeftInput[5] = (value) => {
                    CDUPerformancePage.ShowCRZPage(mcdu, true);
                };
            }
        } else {
            mcdu.leftInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[5] = (value) => {
                CDUPerformancePage.ShowCLBPage(mcdu);
            };
        }
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = (value) => {
            CDUPerformancePage.ShowDESPage(mcdu);
        };
        mcdu.setTemplate([
            ["CRZ[color]" + titleColor],
            ["ACT MODE", "DEST EFOB", timeLabel],
            [actModeCell + "[color]green", "---.-", "----"],
            ["\xa0CI"],
            [costIndexCell],
            ["\xa0MANAGED"],
            [managedSpeedCell],
            ["\xa0" + selectedSpeedLabel, "DES CABIN RATE[color]inop"],
            [selectedSpeedCell, "{small}-350FT/MIN{end}[color]inop"],
            [],
            ["", "STEP ALTS>[color]inop"],
            bottomRowLabels,
            bottomRowCells
        ]);
    }

    static ShowDESPage(mcdu, confirmAppr = false) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PerformancePageDes;
        CDUPerformancePage._timer = 0;
        CDUPerformancePage._lastPhase = mcdu.currentFlightPhase;
        mcdu.pageUpdate = () => {
            CDUPerformancePage._timer++;
            if (CDUPerformancePage._timer >= 100) {
                if (mcdu.currentFlightPhase === CDUPerformancePage._lastPhase) {
                    CDUPerformancePage.ShowDESPage(mcdu);
                } else {
                    CDUPerformancePage.ShowPage(mcdu);
                }
            }
        };
        let titleColor = "white";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            titleColor = "green";
        }
        const isFlying = false;
        let actModeCell = "SELECTED";
        if (mcdu.isAirspeedManaged()) {
            actModeCell = "MANAGED";
        }

        let costIndexCell = "--";
        if (
            mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident &&
            mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident
        ) {
            costIndexCell = "__[color]amber";
            if (isFinite(mcdu.costIndex)) {
                costIndexCell = mcdu.costIndex.toFixed(0) + "[color]cyan";
            }
            mcdu.onLeftInput[1] = (value) => {
                if (mcdu.tryUpdateCostIndex(value)) {
                    CDUPerformancePage.ShowDESPage(mcdu);
                }
            };
        }

        let managedSpeedCell = "\xa0{small}---/---{end}[color]inop";
        const managedSpeed = mcdu.getDesManagedSpeed();
        if (isFinite(managedSpeed)) {
            managedSpeedCell = `\xa0{small}${managedSpeed.toFixed(0)}{inop}/---{end}{end}[color]green`;
        }

        let selectedSpeedLabel = "PRESEL";
        let selectedSpeedCell = "*[ ][color]cyan";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            selectedSpeedLabel = "SELECTED";
        }
        if (isFinite(mcdu.preSelectedDesSpeed)) {
            selectedSpeedCell = `\xa0${mcdu.preSelectedDesSpeed.toFixed(0)}[color]cyan`;
        }
        mcdu.onLeftInput[3] = (value) => {
            if (mcdu.trySetPreSelectedClimbSpeed(value)) {
                CDUPerformancePage.ShowDESPage(mcdu);
            }
        };

        let timeLabel = "TIME";
        if (isFlying) {
            timeLabel = "UTC";
        }
        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async (value) => {
                    if (await mcdu.tryGoInApproachPhase()) {
                        CDUPerformancePage.ShowAPPRPage(mcdu);
                    }
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = (value) => {
                    CDUPerformancePage.ShowDESPage(mcdu, true);
                };
            }
        } else {
            mcdu.leftInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[5] = (value) => {
                CDUPerformancePage.ShowCRZPage(mcdu);
            };
        }
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = (value) => {
            CDUPerformancePage.ShowAPPRPage(mcdu);
        };
        mcdu.setTemplate([
            ["DES[color]" + titleColor],
            ["ACT MODE", "DEST EFOB", timeLabel],
            [actModeCell + "[color]green", "---.-", "----"],
            ["\xa0CI"],
            [costIndexCell],
            ["\xa0MANAGED"],
            [managedSpeedCell],
            ["\xa0" + selectedSpeedLabel],
            [selectedSpeedCell],
            [""],
            [""],
            bottomRowLabels,
            bottomRowCells
        ]);
    }

    static ShowAPPRPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PerformancePageAppr;
        CDUPerformancePage._timer = 0;
        CDUPerformancePage._lastPhase = mcdu.currentFlightPhase;
        mcdu.pageUpdate = () => {
            CDUPerformancePage._timer++;
            if (CDUPerformancePage._timer >= 100) {
                if (mcdu.currentFlightPhase === CDUPerformancePage._lastPhase) {
                    CDUPerformancePage.ShowAPPRPage(mcdu);
                }
            }
        };
        let titleColor = "white";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
            titleColor = "green";
        }

        let qnhCell = "[\xa0\xa0]";
        if (isFinite(mcdu.perfApprQNH)) {
            if (mcdu.perfApprQNH < 500) {
                qnhCell = mcdu.perfApprQNH.toFixed(2);
            } else {
                qnhCell = mcdu.perfApprQNH.toFixed(0);
            }
        } else if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().infos) {
            const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            const planeLla = new LatLongAlt(lat, long);
            const distance = Avionics.Utils.computeGreatCircleDistance(
                planeLla, mcdu.flightPlanManager.getDestination().infos.coordinates
            );
            if (distance <= 180) {
                qnhCell = "____[color]amber";
            }
        }
        mcdu.onLeftInput[0] = (value) => {
            if (mcdu.setPerfApprQNH(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

        let tempCell = "[\xa0]";
        if (isFinite(mcdu.perfApprTemp)) {
            tempCell = ("" + mcdu.perfApprTemp.toFixed(0)).padStart(3).replace(/ /g, "\xa0");
        }
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.setPerfApprTemp(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };
        let magWindHeadingCell = "[\xa0]";
        if (isFinite(mcdu.perfApprWindHeading)) {
            magWindHeadingCell = ("" + mcdu.perfApprWindHeading.toFixed(0)).padStart(3, 0);
        }
        let magWindSpeedCell = "[\xa0]";
        if (isFinite(mcdu.perfApprWindSpeed)) {
            magWindSpeedCell = mcdu.perfApprWindSpeed.toFixed(0);
        }
        mcdu.onLeftInput[2] = (value) => {
            if (mcdu.setPerfApprWind(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

        let transAltCell = "[\xa0][color]cyan";
        if (isFinite(mcdu.perfApprTransAlt)) {
            transAltCell = mcdu.perfApprTransAlt.toFixed(0);
        }
        mcdu.onLeftInput[3] = (value) => {
            if (mcdu.setPerfApprTransAlt(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

        let vappCell = "---";
        const vApp = mcdu.getVApp();
        if (isFinite(vApp)) {
            vappCell = vApp.toFixed(0);
            if (!mcdu.vAppIsPilotEntered) {
                vappCell += "[s-text]";
            }
        }
        mcdu.onLeftInput[4] = (value) => {
            if (mcdu.setPerfApprVApp(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };
        let vlsCell = "---";
        const vls = SimVar.GetSimVarValue("L:A32NX_SPEEDS_VLS", "number");
        if (vls !== 0) {
            vlsCell = `{green}${vls.toFixed(0)}{end}`;
        }
        let finalCell = "";
        const approach = mcdu.flightPlanManager.getApproach();
        if (approach && approach.name) {
            finalCell = Avionics.Utils.formatRunway(approach.name).replace(/ /g, "") + "[color]green";
        }

        let baroCell = "[\xa0\xa0\xa0]";
        if (isFinite(mcdu.perfApprMDA)) {
            baroCell = mcdu.perfApprMDA.toFixed(0);
        }
        mcdu.onRightInput[1] = (value) => {
            if (mcdu.setPerfApprMDA(value) && mcdu.setPerfApprDH(FMCMainDisplay.clrValue)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

        const isILS = approach && approach.name && approach.name.indexOf("ILS") !== -1;
        let radioLabel = "";
        let radioCell = "";
        if (isILS) {
            radioLabel = "RADIO\xa0";
            if (isFinite(mcdu.perfApprDH)) {
                radioCell = mcdu.perfApprDH.toFixed(0);
            } else if (mcdu.perfApprDH === "NO DH") {
                radioCell = "NO DH";
            } else {
                radioCell = "[\xa0]";
            }
            mcdu.onRightInput[2] = (value) => {
                if (mcdu.setPerfApprDH(value) && mcdu.setPerfApprMDA(FMCMainDisplay.clrValue)) {
                    CDUPerformancePage.ShowAPPRPage(mcdu);
                }
            };
        }

        // F/S/O
        let flpRetrCell = "---";
        let sltRetrCell = "---";
        let cleanCell = "---";
        const flapSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_F", "number");
        if (flapSpeed !== 0) {
            flpRetrCell = `{green}${flapSpeed.toFixed(0)}{end}`;
        }
        const slatSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_S", "number");
        if (slatSpeed !== 0) {
            sltRetrCell = `{green}${slatSpeed.toFixed(0)}{end}`;
        }
        const cleanSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_GD", "number");
        if (cleanSpeed !== 0) {
            cleanCell = `{green}${cleanSpeed.toFixed(0)}{end}`;
        }

        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
            bottomRowLabels[0] = "";
            bottomRowCells[0] = "";
        } else {
            if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_GOAROUND) {
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = (value) => {
                    CDUPerformancePage.ShowGOAROUNDPage(mcdu);
                };
            } else {
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = (value) => {
                    CDUPerformancePage.ShowDESPage(mcdu);
                };
            }
        }

        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_GOAROUND) {
            bottomRowLabels[1] = "";
            bottomRowCells[1] = "";
        } else {
            mcdu.rightInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[5] = (value) => {
                CDUPerformancePage.ShowGOAROUNDPage(mcdu);
            };
        }

        mcdu.setTemplate([
            [`APPR[color]${titleColor}`],
            ["\xa0QNH", "FINAL\xa0", "FLP RETR"],
            [qnhCell + "[color]cyan", finalCell, "F=" + flpRetrCell],
            ["\xa0TEMP", "BARO\xa0", "SLT RETR"],
            [tempCell + "°[color]cyan", baroCell + "[color]cyan", "S=" + sltRetrCell],
            ["MAG WIND", radioLabel, "CLEAN"],
            [magWindHeadingCell + "°/" + magWindSpeedCell + "[color]cyan", radioCell + "[color]cyan", "O=" + cleanCell],
            ["TRANS ALT", "LDG CONF\xa0"],
            [transAltCell + "[color]cyan", "CONF3*[s-text][color]inop"],
            ["\xa0VAPP", "", "VLS"],
            [vappCell + "[color]cyan", "FULL\xa0[color]cyan", vlsCell + "[color]green"],
            bottomRowLabels,
            bottomRowCells,
        ]);
    }

    static ShowGOAROUNDPage(mcdu, confirmAppr = false) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PerformancePageGoAround;
        CDUPerformancePage._timer = 0;
        CDUPerformancePage._lastPhase = mcdu.currentFlightPhase;
        mcdu.pageUpdate = () => {
            CDUPerformancePage._timer++;
            if (CDUPerformancePage._timer >= 100) {
                if (mcdu.currentFlightPhase === CDUPerformancePage._lastPhase) {
                    CDUPerformancePage.ShowGOAROUNDPage(mcdu);
                } else {
                    CDUPerformancePage.ShowPage(mcdu);
                }
            }
        };
        let titleColor = "white";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_GOAROUND) {
            titleColor = "green";
        }

        // check if we even have an airport
        const hasDestination = !!mcdu.flightPlanManager.getDestination();

        // F/S/O
        let flpRetrCell = "---";
        let sltRetrCell = "---";
        let cleanCell = "---";
        const flapSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_F", "number");
        if (flapSpeed !== 0) {
            flpRetrCell = `{green}${flapSpeed.toFixed(0)}{end}`;
        }
        const slatSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_S", "number");
        if (slatSpeed !== 0) {
            sltRetrCell = `{green}${slatSpeed.toFixed(0)}{end}`;
        }
        const cleanSpeed = SimVar.GetSimVarValue("L:A32NX_SPEEDS_GD", "number");
        if (cleanSpeed !== 0) {
            cleanCell = `{green}${cleanSpeed.toFixed(0)}{end}`;
        }

        // thrust reduction / acceleration altitude
        let thrRedAcc = "-----/-----";
        if (hasDestination) {
            if (mcdu.currentFlightPhase < FlightPhase.FLIGHT_PHASE_GOAROUND) {
                let thrRed = "[\xa0]";
                if (isFinite(mcdu.thrustReductionAltitudeGoaround)) {
                    thrRed = mcdu.thrustReductionAltitudeGoaround.toFixed(0);
                }
                let acc = "[\xa0]";
                if (isFinite(mcdu.accelerationAltitudeGoaround)) {
                    acc = mcdu.accelerationAltitudeGoaround.toFixed(0);
                }
                // TODO remove s-text if user has set value
                thrRedAcc = `${thrRed}/${acc}[s-text][color]cyan`;
                mcdu.onLeftInput[4] = (value) => {
                    if (mcdu.trySetThrustReductionAccelerationAltitudeGoaround(value)) {
                        CDUPerformancePage.ShowGOAROUNDPage(mcdu);
                    }
                };
            } else {
                let thrRed = "-----";
                if (isFinite(mcdu.thrustReductionAltitudeGoaround)) {
                    thrRed = ("" + mcdu.thrustReductionAltitudeGoaround.toFixed(0)).padStart(5, "\xa0");
                }
                let acc = "-----";
                if (isFinite(mcdu.accelerationAltitudeGoaround)) {
                    acc = ("" + mcdu.accelerationAltitudeGoaround.toFixed(0)).padStart(5, "\xa0");
                }
                // TODO remove s-text if user has set value
                thrRedAcc = `${thrRed}/${acc}[s-text][color]green`;
            }
        }

        // eng out acceleration altitude
        let engOutAcc = "-----";
        if (hasDestination) {
            if (mcdu.currentFlightPhase < FlightPhase.FLIGHT_PHASE_GOAROUND) {
                engOutAcc = "[\xa0][color]cyan";
                if (isFinite(mcdu.engineOutAccelerationGoaround)) {
                    engOutAcc = `${mcdu.engineOutAccelerationGoaround.toFixed(0)}[s-text][color]cyan`;
                }
            } else {
                if (isFinite(mcdu.engineOutAccelerationGoaround)) {
                    engOutAcc = `${mcdu.engineOutAccelerationGoaround.toFixed(0)}[s-text][color]green`;
                }
            }
        }

        const bottomRowLabels = ["", ""];
        const bottomRowCells = ["", ""];
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_GOAROUND) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async (value) => {
                    if (await mcdu.tryGoInApproachPhase()) {
                        CDUPerformancePage.ShowAPPRPage(mcdu);
                    }
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = (value) => {
                    CDUPerformancePage.ShowGOAROUNDPage(mcdu, true);
                };
            }
            bottomRowLabels[1] = "NEXT\xa0";
            bottomRowCells[1] = "PHASE>";
            mcdu.rightInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[5] = (value) => {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            };
        } else {
            bottomRowLabels[0] = "\xa0PREV";
            bottomRowCells[0] = "<PHASE";
            mcdu.leftInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[5] = (value) => {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            };
        }
        mcdu.setTemplate([
            [`GO AROUND[color]${titleColor}`],
            ["", "", "FLP RETR"],
            ["", "", "F=" + flpRetrCell],
            ["", "", "SLT RETR"],
            ["", "", "S=" + sltRetrCell],
            ["", "", "CLEAN"],
            ["", "", "O=" + cleanCell],
            [""],
            [""],
            ["THR RED/ACC", "ENG OUT ACC"],
            [thrRedAcc, engOutAcc],
            bottomRowLabels,
            bottomRowCells,
        ]);
    }

    static UpdateThrRedAccFromOrigin(mcdu) {
        const origin = mcdu.flightPlanManager.getOrigin();
        const thrRedAccAltitude = origin && origin.altitudeinFP
            ? origin.altitudeinFP + 1500
            : undefined;

        mcdu.thrustReductionAltitude = thrRedAccAltitude;
        mcdu.accelerationAltitude = thrRedAccAltitude;

        SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT", "Number", thrRedAccAltitude || 0);
        SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT", "Number", thrRedAccAltitude || 0);
    }

    static UpdateThrRedAccFromDestination(mcdu) {
        const destination = mcdu.flightPlanManager.getDestination();
        const thrRedAccAltitude = destination && destination.altitudeinFP
            ? destination.altitudeinFP + 1500
            : undefined;

        mcdu.thrustReductionAltitudeGoaround = thrRedAccAltitude;
        mcdu.accelerationAltitudeGoaround = thrRedAccAltitude;
        mcdu.engineOutAccelerationGoaround = thrRedAccAltitude;

        SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT_GOAROUND", "Number", thrRedAccAltitude || 0);
        SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT_GOAROUND", "Number", thrRedAccAltitude || 0);
        SimVar.SetSimVarValue("L:AIRLINER_ENG_OUT_ACC_ALT_GOAROUND", "Number", thrRedAccAltitude || 0);
    }
}
CDUPerformancePage._timer = 0;
