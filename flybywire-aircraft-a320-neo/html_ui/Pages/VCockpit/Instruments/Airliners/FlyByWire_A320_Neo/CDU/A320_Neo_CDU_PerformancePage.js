class CDUPerformancePage {
    static ShowPage(mcdu, _phase = undefined) {
        mcdu.activeSystem = 'FMGC';

        switch (_phase || mcdu.currentFlightPhase) {
            case FmgcFlightPhases.PREFLIGHT: CDUPerformancePage.ShowTAKEOFFPage(mcdu); break;
            case FmgcFlightPhases.TAKEOFF: CDUPerformancePage.ShowTAKEOFFPage(mcdu); break;
            case FmgcFlightPhases.CLIMB: CDUPerformancePage.ShowCLBPage(mcdu); break;
            case FmgcFlightPhases.CRUISE: CDUPerformancePage.ShowCRZPage(mcdu); break;
            case FmgcFlightPhases.DESCENT: CDUPerformancePage.ShowDESPage(mcdu); break;
            case FmgcFlightPhases.APPROACH: CDUPerformancePage.ShowAPPRPage(mcdu); break;
            case FmgcFlightPhases.GOAROUND: CDUPerformancePage.ShowGOAROUNDPage(mcdu); break;
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
        if (mcdu.currentFlightPhase === FmgcFlightPhases.TAKEOFF) {
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
                runway = Avionics.Utils.formatRunway(runwayObj.designation);
                hasRunway = true;
            }
        }

        // v speeds
        let v1 = "---";
        let vR = "---";
        let v2 = "---";
        let v1Check = "{small}\xa0\xa0\xa0{end}";
        let vRCheck = "{small}\xa0\xa0\xa0{end}";
        let v2Check = "{small}\xa0\xa0\xa0{end}";
        if (mcdu.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
            v1 = "{amber}___{end}";
            if (mcdu.v1Speed) {
                if (mcdu._v1Checked) {
                    v1 = `{cyan}${("" + mcdu.v1Speed).padEnd(3)}{end}`;
                } else {
                    v1Check = `{small}{cyan}${("" + mcdu.v1Speed).padEnd(3)}{end}{end}`;
                }
            }
            mcdu.onLeftInput[0] = (value) => {
                if (value === "") {
                    if (mcdu._v1Checked) {
                        // not real: v-speed helper
                        if (mcdu.flaps) {
                            mcdu.sendDataToScratchpad(mcdu._getV1Speed().toString());
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.formatError);
                        }
                    } else {
                        mcdu._v1Checked = true;
                        mcdu.tryRemoveMessage(NXSystemMessages.checkToData.text);
                        mcdu.vSpeedDisagreeCheck();
                    }
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else {
                    if (mcdu.trySetV1Speed(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                }
            };
            vR = "{amber}___{end}";
            if (mcdu.vRSpeed) {
                if (mcdu._vRChecked) {
                    vR = `{cyan}${("" + mcdu.vRSpeed).padEnd(3)}{end}`;
                } else {
                    vRCheck = `{small}{cyan}${("" + mcdu.vRSpeed).padEnd(3)}{end}{end}`;
                }
            }
            mcdu.onLeftInput[1] = (value) => {
                if (value === "") {
                    if (mcdu._vRChecked) {
                        if (mcdu.flaps) {
                            mcdu.sendDataToScratchpad(mcdu._getVRSpeed().toString());
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.formatError);
                        }
                    } else {
                        mcdu._vRChecked = true;
                        mcdu.tryRemoveMessage(NXSystemMessages.checkToData.text);
                        mcdu.vSpeedDisagreeCheck();
                    }
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else {
                    if (mcdu.trySetVRSpeed(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                }
            };
            v2 = "{amber}___{end}";
            if (mcdu.v2Speed) {
                if (mcdu._v2Checked) {
                    v2 = `{cyan}${("" + mcdu.v2Speed).padEnd(3)}{end}`;
                } else {
                    v2Check = `{small}{cyan}${("" + mcdu.v2Speed).padEnd(3)}{end}{end}`;
                }
            }
            mcdu.onLeftInput[2] = (value) => {
                if (value === "") {
                    if (mcdu._v2Checked) {
                        if (mcdu.flaps) {
                            mcdu.sendDataToScratchpad(mcdu._getV2Speed().toString());
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.formatError);
                        }
                    } else {
                        mcdu._v2Checked = true;
                        mcdu.tryRemoveMessage(NXSystemMessages.checkToData.text);
                        mcdu.vSpeedDisagreeCheck();
                    }
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                } else {
                    if (mcdu.trySetV2Speed(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                }
            };
        } else {
            v1 = "\xa0\xa0\xa0";
            vR = "\xa0\xa0\xa0";
            v2 = "\xa0\xa0\xa0";
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
                    mcdu.addNewMessage(NXSystemMessages.notAllowed);
                }
            };
            mcdu.onLeftInput[1] = (value) => {
                if (value !== "") {
                    mcdu.addNewMessage(NXSystemMessages.notAllowed);
                }
            };
            mcdu.onLeftInput[2] = (value) => {
                if (value !== "") {
                    mcdu.addNewMessage(NXSystemMessages.notAllowed);
                }
            };
        }

        // transition altitude - remains editable during take off
        let transAltCell = "";
        if (hasOrigin) {
            if (mcdu.flightPlanManager.originTransitionAltitude !== undefined) {
                transAltCell = `{cyan}${mcdu.flightPlanManager.originTransitionAltitude}{end}`;
                if (mcdu.flightPlanManager.originTransitionAltitudeFromDb) {
                    transAltCell += "[s-text]";
                }
            } else {
                transAltCell = "{cyan}[]{end}";
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
            if (mcdu.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
                let thrRed = "[\xa0]";
                if (isFinite(mcdu.thrustReductionAltitude)) {
                    thrRed = ("" + mcdu.thrustReductionAltitude.toFixed(0)).padStart(5, "\xa0");
                }
                if (!mcdu.thrustReductionAltitudeIsPilotEntered) {
                    thrRed = `{small}${thrRed}{end}`;
                }
                let acc = "[\xa0]";
                if (isFinite(mcdu.accelerationAltitude)) {
                    acc = mcdu.accelerationAltitude.toFixed(0);
                }
                acc = "/" + acc;
                if (!mcdu.accelerationAltitudeIsPilotEntered) {
                    acc = `{small}${acc}{end}`;
                }
                thrRedAcc = `${thrRed}${acc}[color]cyan`;
                mcdu.onLeftInput[4] = (value) => {
                    if (mcdu.trySetThrustReductionAccelerationAltitude(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                };
            } else {
                let thrRed = "-----";
                if (isFinite(mcdu.thrustReductionAltitude)) {
                    thrRed = ("" + mcdu.thrustReductionAltitude.toFixed(0)).padStart(5, "\xa0");
                }
                if (!mcdu.thrustReductionAltitudeIsPilotEntered) {
                    thrRed = `{small}${thrRed}{end}`;
                }
                let acc = "-----";
                if (isFinite(mcdu.accelerationAltitude)) {
                    acc = mcdu.accelerationAltitude.toFixed(0);
                }
                acc = "/" + acc;
                if (!mcdu.accelerationAltitudeIsPilotEntered) {
                    acc = `{small}${acc}{end}`;
                }
                thrRedAcc = `${thrRed}${acc}[color]green`;
            }
        } else if (mcdu.currentFlightPhase >= FmgcFlightPhases.TAKEOFF) {
            thrRedAcc = "";
        }

        // center column
        let flpRetrCell = "---";
        let sltRetrCell = "---";
        let cleanCell = "---";
        const flapSpeed = mcdu.computedVfs;
        if (flapSpeed !== 0) {
            flpRetrCell = `{green}${flapSpeed.toFixed(0)}{end}`;
        }
        const slatSpeed = mcdu.computedVss;
        if (slatSpeed !== 0) {
            sltRetrCell = `{green}${slatSpeed.toFixed(0)}{end}`;
        }
        const cleanSpeed = mcdu.computedVgd;
        if (cleanSpeed !== 0) {
            cleanCell = `{green}${cleanSpeed.toFixed(0)}{end}`;
        }

        // takeoff shift
        let toShiftCell = "{inop}----{end}\xa0";
        if (hasOrigin && hasRunway) {
            toShiftCell = "{inop}{small}[M]{end}[\xa0\xa0]*{end}";
            // TODO store and show TO SHIFT
        }

        // flaps / trim horizontal stabilizer
        let flapsThs = "[]/[\xa0\xa0\xa0][color]cyan";
        // The following line uses a special Javascript concept that is signed
        // zeroes. In Javascript -0 is strictly equal to 0, so for most cases we
        // don't care about that difference. But here, we use that fact to show
        // the pilot the precise value they entered: DN0.0 or UP0.0. The only
        // way to figure that difference out is using Object.is, as
        // Object.is(+0, -0) returns false. Alternatively we could use a helper
        // variable (yuck) or encode it using a very small, but negative value
        // such as -0.001.
        const formattedThs = !isNaN(mcdu.ths)
            ? (mcdu.ths >= 0 && !Object.is(mcdu.ths, -0) ? `UP${Math.abs(mcdu.ths).toFixed(1)}` : `DN${Math.abs(mcdu.ths).toFixed(1)}`)
            : '';
        if (mcdu.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
            const flaps = !isNaN(mcdu.flaps) ? mcdu.flaps : "[]";
            const ths = formattedThs ? formattedThs : "[\xa0\xa0\xa0]";
            flapsThs = `${flaps}/${ths}[color]cyan`;
            mcdu.onRightInput[2] = (value) => {
                if (mcdu.trySetFlapsTHS(value)) {
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                }
            };
        } else {
            const flaps = !isNaN(mcdu.flaps) ? mcdu.flaps : "";
            const ths = formattedThs ? formattedThs : "\xa0\xa0\xa0\xa0\xa0";
            flapsThs = `${flaps}/${ths}[color]green`;
        }

        // flex takeoff temperature
        let flexTakeOffTempCell = "[\xa0\xa0]°[color]cyan";
        if (mcdu.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
            if (isFinite(mcdu.perfTOTemp)) {
                if (mcdu._toFlexChecked) {
                    flexTakeOffTempCell = `${mcdu.perfTOTemp.toFixed(0)}°[color]cyan`;
                } else {
                    flexTakeOffTempCell = `{small}${mcdu.perfTOTemp.toFixed(0)}{end}${flexTakeOffTempCell}[color]cyan`;
                }
            }
            mcdu.onRightInput[3] = (value) => {
                if (mcdu._toFlexChecked) {
                    if (mcdu.setPerfTOFlexTemp(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                } else {
                    if (value === "" || mcdu.setPerfTOFlexTemp(value)) {
                        mcdu._toFlexChecked = true;
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                }
            };
        } else {
            if (isFinite(mcdu.perfTOTemp)) {
                flexTakeOffTempCell = `${mcdu.perfTOTemp.toFixed(0)}°[color]green`;
            } else {
                flexTakeOffTempCell = "";
            }
        }

        // eng out acceleration altitude
        let engOutAcc = "-----";
        if (hasOrigin) {
            if (mcdu.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
                if (isFinite(mcdu.engineOutAccelerationAltitude)) {
                    engOutAcc = mcdu.engineOutAccelerationAltitude.toFixed(0);
                    if (mcdu.engineOutAccelerationAltitudeIsPilotEntered) {
                        engOutAcc = `${engOutAcc}[color]cyan`;
                    } else {
                        engOutAcc = `${engOutAcc}[s-text][color]cyan`;
                    }
                } else {
                    engOutAcc = "[][color]cyan";
                }
                mcdu.onRightInput[4] = (value) => {
                    if (mcdu.trySetEngineOutAcceleration(value)) {
                        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                    }
                };
            } else if (isFinite(mcdu.engineOutAccelerationAltitude)) {
                if (mcdu.engineOutAccelerationAltitudeIsPilotEntered) {
                    engOutAcc = `${mcdu.engineOutAccelerationAltitude}[color]green`;
                } else {
                    engOutAcc = `${mcdu.engineOutAccelerationAltitude}[s-text][color]green`;
                }
            }
        } else if (mcdu.currentFlightPhase >= FmgcFlightPhases.TAKEOFF) {
            engOutAcc = "";
        }

        let next = "NEXT\xa0";
        let nextPhase = "PHASE>";
        if (!(mcdu._v1Checked && mcdu._vRChecked && mcdu._v2Checked && mcdu._toFlexChecked) && mcdu.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
            next = "CONFIRM\xa0";
            nextPhase = "TO DATA*";
            mcdu.onRightInput[5] = (value) => {
                mcdu._v1Checked = true;
                mcdu._vRChecked = true;
                mcdu._v2Checked = true;
                mcdu._toFlexChecked = true;
                mcdu.vSpeedDisagreeCheck();
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            };
        } else {
            mcdu.rightInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[5] = (value) => {
                CDUPerformancePage.ShowCLBPage(mcdu);
            };
        }

        mcdu.setTemplate([
            ["TAKE OFF RWY\xa0{green}" + runway.padStart(3, "\xa0") + "{end}[color]" + titleColor],
            ["\xa0V1\xa0\xa0FLP RETR", ""],
            [v1 + v1Check + "\xa0F=" + flpRetrCell, ""],
            ["\xa0VR\xa0\xa0SLT RETR", "TO SHIFT\xa0"],
            [vR + vRCheck + "\xa0S=" + sltRetrCell, toShiftCell],
            ["\xa0V2\xa0\xa0\xa0\xa0\xa0CLEAN", "FLAPS/THS"],
            [v2 + v2Check + "\xa0O=" + cleanCell, flapsThs],
            ["TRANS ALT", "FLEX TO TEMP"],
            [transAltCell, flexTakeOffTempCell],
            ["THR RED/ACC", "ENG OUT ACC"],
            [thrRedAcc, engOutAcc],
            ["\xa0UPLINK[color]inop", next],
            ["<TO DATA[color]inop", nextPhase]
        ]);
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
        const isPhaseActive = mcdu.currentFlightPhase === FmgcFlightPhases.CLIMB;
        const titleColor = isPhaseActive ? "green" : "white";
        const isSelected = Simplane.getAutoPilotAirspeedSelected();
        const actModeCell = isSelected ? "SELECTED" : "MANAGED";
        const costIndexCell = isFinite(mcdu.costIndex) ? mcdu.costIndex.toFixed(0) + "[color]cyan" : "[][color]cyan";
        let managedSpeedCell = "";
        if (isPhaseActive) {
            if (mcdu.managedSpeedTarget === mcdu.managedSpeedClimb) {
                managedSpeedCell = "{small}" + mcdu.managedSpeedClimb.toFixed(0) + "/" + mcdu.managedSpeedClimbMach.toFixed(2).replace("0.", ".") + "{end}";
            } else if (Simplane.getAutoPilotMachModeActive() || SimVar.GetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_ON", "Bool")) {
                managedSpeedCell = "{small}" + mcdu.managedSpeedClimbMach.toFixed(2).replace("0.", ".") + "{end}";
            } else {
                managedSpeedCell = "{small}" + mcdu.managedSpeedTarget.toFixed(0) + "{end}";
            }
        } else {
            managedSpeedCell = (isSelected ? "*" : "") + mcdu.managedSpeedClimb > mcdu.managedSpeedLimit ? mcdu.managedSpeedLimit.toFixed(0) : mcdu.managedSpeedClimb.toFixed(0);

            mcdu.onLeftInput[3] = (value) => {
                if (mcdu.trySetPreSelectedClimbSpeed(value)) {
                    CDUPerformancePage.ShowCLBPage(mcdu);
                }
            };
        }
        const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getSelectedTitleAndValue(isPhaseActive, isSelected, mcdu.preSelectedClbSpeed);
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.tryUpdateCostIndex(value)) {
                CDUPerformancePage.ShowCLBPage(mcdu);
            }
        };
        const timeLabel = mcdu.getIsFlying() ? "UTC" : "TIME";
        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        if (isPhaseActive) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async () => {
                    if (mcdu.tryGoInApproachPhase()) {
                        CDUPerformancePage.ShowAPPRPage(mcdu);
                    }
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.onLeftInput[5] = () => {
                    CDUPerformancePage.ShowCLBPage(mcdu, true);
                };
            }
        } else {
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            };
        }
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUPerformancePage.ShowCRZPage(mcdu);
        };
        mcdu.setTemplate([
            ["CLB[color]" + titleColor],
            ["ACT MODE", "EFOB", timeLabel],
            [actModeCell + "[color]green", "6.0[color]green", "----[color]green"],
            ["\xa0CI"],
            [costIndexCell + "[color]cyan"],
            ["\xa0MANAGED"],
            ["\xa0" + managedSpeedCell + "[color]green"],
            ["\xa0" + selectedSpeedTitle],
            ["\xa0" + selectedSpeedCell + "[color]cyan"],
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
        const isPhaseActive = mcdu.currentFlightPhase === FmgcFlightPhases.CRUISE;
        const titleColor = isPhaseActive ? "green" : "white";
        const isSelected = Simplane.getAutoPilotAirspeedSelected();
        const isFlying = false;
        const actModeCell = isSelected ? "SELECTED" : "MANAGED";
        const costIndexCell = isFinite(mcdu.costIndex) ? mcdu.costIndex.toFixed(0) + "[color]cyan" : "[][color]cyan";
        let managedSpeedCell = "";
        const managedSpeed = isPhaseActive ? mcdu.managedSpeedTarget : mcdu.managedSpeedCruise;
        if (isFinite(managedSpeed)) {
            managedSpeedCell = (isSelected ? "*" : "") + managedSpeed.toFixed(0);
        }
        const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getSelectedTitleAndValue(isPhaseActive, isSelected, mcdu.preSelectedCrzSpeed);
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.tryUpdateCostIndex(value)) {
                CDUPerformancePage.ShowCRZPage(mcdu);
            }
        };
        let timeLabel = "TIME";
        if (isFlying) {
            timeLabel = "UTC";
        }
        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        if (isPhaseActive) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async () => {
                    if (mcdu.tryGoInApproachPhase()) {
                        CDUPerformancePage.ShowAPPRPage(mcdu);
                    }
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.onLeftInput[5] = () => {
                    CDUPerformancePage.ShowCRZPage(mcdu, true);
                };
            }
        } else {
            mcdu.onLeftInput[3] = (value) => {
                if (mcdu.trySetPreSelectedCruiseSpeed(value)) {
                    CDUPerformancePage.ShowCRZPage(mcdu);
                }
            };
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowCLBPage(mcdu);
            };
        }
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUPerformancePage.ShowDESPage(mcdu);
        };
        mcdu.setTemplate([
            ["CRZ[color]" + titleColor],
            ["ACT MODE", "EFOB", timeLabel],
            [actModeCell + "[color]green", "6.0[color]green", "----[color]green"],
            ["\xa0CI"],
            [costIndexCell + "[color]cyan"],
            ["\xa0MANAGED"],
            ["\xa0" + managedSpeedCell + "[color]green"],
            ["\xa0" + selectedSpeedTitle],
            ["\xa0" + selectedSpeedCell + "[color]cyan"],
            ["", "DES CABIN RATE>"],
            ["", "-350FT/MIN[color]green"],
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
        const isPhaseActive = mcdu.currentFlightPhase === FmgcFlightPhases.DESCENT;
        const titleColor = isPhaseActive ? "green" : "white";
        const isFlying = false;
        const isSelected = Simplane.getAutoPilotAirspeedSelected();
        const actModeCell = isSelected ? "SELECTED" : "MANAGED";
        const costIndexCell = isFinite(mcdu.costIndex) ? mcdu.costIndex.toFixed(0) + "[color]cyan" : "[][color]cyan";
        let managedSpeedCell = "";
        const managedSpeed = isPhaseActive ? mcdu.managedSpeedTarget : mcdu.managedSpeedDescend;
        if (isFinite(managedSpeed)) {
            managedSpeedCell = (isSelected ? "*" : "") + managedSpeed.toFixed(0);
        }
        const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getSelectedTitleAndValue(isPhaseActive, isSelected, mcdu.preSelectedDesSpeed);
        let timeLabel = "TIME";
        if (isFlying) {
            timeLabel = "UTC";
        }
        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        if (isPhaseActive) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async () => {
                    if (mcdu.tryGoInApproachPhase()) {
                        CDUPerformancePage.ShowAPPRPage(mcdu);
                    }
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.onLeftInput[5] = () => {
                    CDUPerformancePage.ShowDESPage(mcdu, true);
                };
            }
        } else {
            mcdu.onLeftInput[3] = (value) => {
                if (mcdu.trySetPreSelectedDescentSpeed(value)) {
                    CDUPerformancePage.ShowDESPage(mcdu);
                }
            };
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowCRZPage(mcdu);
            };
        }
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.tryUpdateCostIndex(value)) {
                CDUPerformancePage.ShowDESPage(mcdu);
            }
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUPerformancePage.ShowAPPRPage(mcdu);
        };
        mcdu.setTemplate([
            ["DES[color]" + titleColor],
            ["ACT MODE", "EFOB", timeLabel],
            [actModeCell + "[color]green", "6.0[color]green", "----[color]green"],
            ["\xa0CI"],
            [costIndexCell + "[color]cyan"],
            ["\xa0MANAGED"],
            ["\xa0" + managedSpeedCell + "[color]green"],
            ["\xa0" + selectedSpeedTitle],
            ["\xa0" + selectedSpeedCell + "[color]cyan"],
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

        const closeToDest = mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().liveDistanceTo <= 180;

        let qnhCell = "[\xa0\xa0][color]cyan";
        if (isFinite(mcdu.perfApprQNH)) {
            if (mcdu.perfApprQNH < 500) {
                qnhCell = mcdu.perfApprQNH.toFixed(2) + "[color]cyan";
            } else {
                qnhCell = mcdu.perfApprQNH.toFixed(0) + "[color]cyan";
            }
        } else if (closeToDest) {
            qnhCell = "____[color]amber";
        }
        mcdu.onLeftInput[0] = (value) => {
            if (mcdu.setPerfApprQNH(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

        let tempCell = "{cyan}[\xa0]°{end}";
        if (isFinite(mcdu.perfApprTemp)) {
            tempCell = "{cyan}" + (mcdu.perfApprTemp >= 0 ? "+" : "-") + ("" + Math.abs(mcdu.perfApprTemp).toFixed(0)).padStart(2).replace(/ /g, "\xa0") + "°{end}";
        } else if (closeToDest) {
            tempCell = "{amber}___°{end}";
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
            magWindSpeedCell = mcdu.perfApprWindSpeed.toFixed(0).padStart(3, "0");
        }
        mcdu.onLeftInput[2] = (value) => {
            if (mcdu.setPerfApprWind(value)) {
                mcdu.updateTowerHeadwind();
                mcdu.updatePerfSpeeds();
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

        let transAltCell = "";
        const hasDestination = !!mcdu.flightPlanManager.getDestination();
        if (hasDestination) {
            if (mcdu.flightPlanManager.destinationTransitionLevel !== undefined) {
                transAltCell = (mcdu.flightPlanManager.destinationTransitionLevel * 100).toFixed(0).padEnd(5, "\xa0");
                if (mcdu.flightPlanManager.destinationTransitionLevelFromDb) {
                    transAltCell = `{small}${transAltCell}{end}`;
                }
            } else {
                transAltCell = "[\xa0]".padEnd(5, "\xa0");
            }
        }
        mcdu.onLeftInput[3] = (value) => {
            if (mcdu.setPerfApprTransAlt(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

        let vappCell = "---";
        let vlsCell = "---";
        let flpRetrCell = "---";
        let sltRetrCell = "---";
        let cleanCell = "---";
        if (mcdu.approachSpeeds && mcdu.approachSpeeds.valid) {
            vappCell = `{cyan}{small}${mcdu.approachSpeeds.vapp.toFixed(0)}{end}{end}`;
            vlsCell = `{green}${mcdu.approachSpeeds.vls.toFixed(0)}{end}`;
            flpRetrCell = `{green}${mcdu.approachSpeeds.f.toFixed(0)}{end}`;
            sltRetrCell = `{green}${mcdu.approachSpeeds.s.toFixed(0)}{end}`;
            cleanCell = `{green}${mcdu.approachSpeeds.gd.toFixed(0)}{end}`;
        }
        if (isFinite(mcdu.vApp)) { // pilot override
            vappCell = `{cyan}${mcdu.vApp.toFixed(0).padStart(3, "\xa0")}{end}`;
        }
        mcdu.onLeftInput[4] = (value) => {
            if (mcdu.setPerfApprVApp(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };
        mcdu.onRightInput[4] = () => {
            mcdu.setPerfApprFlaps3(!mcdu.perfApprFlaps3);
            mcdu.updatePerfSpeeds();
            CDUPerformancePage.ShowAPPRPage(mcdu);
        };

        let baroCell = "[\xa0\xa0\xa0]";
        if (isFinite(mcdu.perfApprMDA)) {
            baroCell = mcdu.perfApprMDA.toFixed(0);
        }
        mcdu.onRightInput[1] = (value) => {
            if (mcdu.setPerfApprMDA(value) && mcdu.setPerfApprDH(FMCMainDisplay.clrValue)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

        const approach = mcdu.flightPlanManager.getApproach();
        const isILS = approach && approach.name && approach.name.indexOf("ILS") !== -1;
        let radioLabel = "";
        let radioCell = "";
        if (isILS) {
            radioLabel = "RADIO";
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

        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        let titleColor = "white";
        if (mcdu.currentFlightPhase === FmgcFlightPhases.APPROACH) {
            bottomRowLabels[0] = "";
            bottomRowCells[0] = "";
            titleColor = "green";
        } else {
            if (mcdu.currentFlightPhase === FmgcFlightPhases.GOAROUND) {
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
        if (mcdu.currentFlightPhase === FmgcFlightPhases.GOAROUND) {
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

        let titleCell = `${"\xa0".repeat(5)}{${titleColor}}APPR{end}\xa0`;
        if (approach && approach.name) {
            const apprName = Avionics.Utils.formatRunway(approach.name).replace(/ /g, "");
            titleCell += `{green}${apprName}{end}` + "\xa0".repeat(24 - 10 - apprName.length);
        } else {
            titleCell += "\xa0".repeat(24 - 10);
        }

        mcdu.setTemplate([
            /* t  */[titleCell],
            /* 1l */["QNH"],
            /* 1L */[qnhCell],
            /* 2l */["TEMP", "BARO"],
            /* 2L */[`${tempCell}${"\xa0".repeat(6)}O=${cleanCell}`, baroCell + "[color]cyan"],
            /* 3l */["MAG WIND", radioLabel],
            /* 3L */[`{cyan}${magWindHeadingCell}°/${magWindSpeedCell}{end}\xa0\xa0S=${sltRetrCell}`, radioCell + "[color]cyan"],
            /* 4l */["TRANS ALT"],
            /* 4L */[`{cyan}${transAltCell}{end}${"\xa0".repeat(5)}F=${flpRetrCell}`],
            /* 5l */["VAPP\xa0\xa0\xa0VLS", "LDG CONF\xa0"],
            /* 5L */[`${vappCell}${"\xa0".repeat(4)}${vlsCell}`, mcdu.perfApprFlaps3 ? "{cyan}CONF3/{end}{small}FULL{end}*" : "{cyan}FULL/{end}{small}CONF3{end}*"],
            /* 6l */bottomRowLabels,
            /* 6L */bottomRowCells,
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
        if (mcdu.currentFlightPhase === FmgcFlightPhases.GOAROUND) {
            titleColor = "green";
        }
        let thrRedAcc = "---";
        if (isFinite(mcdu.thrustReductionAltitudeGoaround) && mcdu.thrustReductionAltitudeGoaround != 0) {
            thrRedAcc = mcdu.thrustReductionAltitudeGoaround.toFixed(0);
        }

        thrRedAcc += "/";

        if (isFinite(mcdu.accelerationAltitudeGoaround && mcdu.accelerationAltitudeGoaround != 0)) {
            thrRedAcc += mcdu.accelerationAltitudeGoaround.toFixed(0);
        } else {
            thrRedAcc += "---";
        }
        thrRedAcc += "[color]cyan";

        mcdu.onLeftInput[4] = (value) => {
            if (mcdu.trySetThrustReductionAccelerationAltitudeGoaround(value)) {
                CDUPerformancePage.ShowGOAROUNDPage(mcdu);
            }
        };

        let engOut = "---";
        if (isFinite(mcdu.engineOutAccelerationAltitudeGoaround) && mcdu.engineOutAccelerationAltitudeGoaround != 0) {
            engOut = mcdu.engineOutAccelerationAltitudeGoaround.toFixed(0);
        } else if (isFinite(mcdu.thrustReductionAltitudeGoaround) && mcdu.thrustReductionAltitudeGoaround != 0) {
            engOut = mcdu.thrustReductionAltitudeGoaround.toFixed(0);
        }
        engOut += "[color]cyan";

        mcdu.onRightInput[4] = (value) => {
            if (mcdu.trySetengineOutAccelerationAltitudeGoaround(value)) {
                CDUPerformancePage.ShowGOAROUNDPage(mcdu);
            }
        };
        let flpRetrCell = "---";
        const flapSpeed = mcdu.computedVfs;
        if (isFinite(flapSpeed)) {
            flpRetrCell = flapSpeed.toFixed(0) + "[color]green";
        }
        let sltRetrCell = "---";
        const slatSpeed = mcdu.computedVss;
        if (isFinite(slatSpeed)) {
            sltRetrCell = slatSpeed.toFixed(0) + "[color]green";
        }
        let cleanCell = "---";
        const cleanSpeed = mcdu.computedVgd;
        if (isFinite(cleanSpeed)) {
            cleanCell = cleanSpeed.toFixed(0) + "[color]green";
        }

        const bottomRowLabels = ["", ""];
        const bottomRowCells = ["", ""];
        if (mcdu.currentFlightPhase === FmgcFlightPhases.GOAROUND) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = async () => {
                    if (mcdu.tryGoInApproachPhase()) {
                        CDUPerformancePage.ShowAPPRPage(mcdu);
                    }
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = () => {
                    CDUPerformancePage.ShowGOAROUNDPage(mcdu, true);
                };
            }
            bottomRowLabels[1] = "NEXT\xa0";
            bottomRowCells[1] = "PHASE>";
            mcdu.rightInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[5] = () => {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            };
        } else {
            bottomRowLabels[0] = "\xa0PREV";
            bottomRowCells[0] = "<PHASE";
            mcdu.leftInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            };
        }
        mcdu.setTemplate([
            ["GO AROUND[color]" + titleColor],
            ["", "", "FLP RETR{sp}"],
            ["", "", "F=" + flpRetrCell + "[color]green"],
            ["", "", "SLT RETR{sp}"],
            ["", "", "S=" + sltRetrCell + "[color]green"],
            ["", "", "{sp}{sp}CLEAN"],
            ["", "", "O=" + cleanCell + "[color]green"],
            [""],
            [""],
            ["THR RED/ACC", "ENG OUT ACC"],
            [thrRedAcc + "[color]cyan", engOut + "[color]cyan]"],
            bottomRowLabels,
            bottomRowCells,
        ]);
    }
    static async UpdateThrRedAccFromOrigin(mcdu, updateThrRedAlt = true, updateAccAlt = true) {
        const origin = mcdu.flightPlanManager.getOrigin();

        let elevation = SimVar.GetSimVarValue("GROUND ALTITUDE", "feet");
        if (origin) {
            elevation = await mcdu.facilityLoader.GetAirportFieldElevation(origin.icao);
        }

        if (updateThrRedAlt && !mcdu.thrustReductionAltitudeIsPilotEntered) {
            const thrRedOffset = +NXDataStore.get("CONFIG_THR_RED_ALT", "1500");
            const thrRedAltitude = Math.round((elevation + thrRedOffset) / 10) * 10;

            mcdu.thrustReductionAltitude = thrRedAltitude;
            mcdu.thrustReductionAltitudeIsPilotEntered = false;
            SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT", "Number", thrRedAltitude);
        }

        if (updateAccAlt && !mcdu.accelerationAltitudeIsPilotEntered) {
            const accOffset = +NXDataStore.get("CONFIG_ACCEL_ALT", "1500");
            const accAlt = Math.round((elevation + accOffset) / 10) * 10;

            mcdu.accelerationAltitude = accAlt;
            mcdu.accelerationAltitudeIsPilotEntered = false;
            SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT", "Number", accAlt);
        }
    }
    static UpdateEngOutAccFromOrigin(mcdu) {
        if (mcdu.engineOutAccelerationAltitudeIsPilotEntered) {
            return;
        }
        const origin = mcdu.flightPlanManager.getOrigin();
        const elevation = origin ? origin.altitudeinFP : SimVar.GetSimVarValue("GROUND ALTITUDE", "feet");

        const offset = +NXDataStore.get("CONFIG_ENG_OUT_ACCEL_ALT", "1500");
        const alt = Math.round((elevation + offset) / 10) * 10;

        mcdu.engineOutAccelerationAltitude = alt;
        mcdu.engineOutAccelerationAltitudeIsPilotEntered = false;
        SimVar.SetSimVarValue("L:A32NX_ENG_OUT_ACC_ALT", "feet", alt);
    }
    static UpdateThrRedAccFromDestination(mcdu) {
        const destination = mcdu.flightPlanManager.getDestination();
        const elevation = destination ? destination.altitudeinFP : SimVar.GetSimVarValue("GROUND ALTITUDE", "feet");

        const offset = +NXDataStore.get("CONFIG_ENG_OUT_ACCEL_ALT", "1500");
        const alt = Math.round((elevation + offset) / 10) * 10;

        mcdu.thrustReductionAltitudeGoaround = alt;
        mcdu.accelerationAltitudeGoaround = alt;
        mcdu.engineOutAccelerationAltitudeGoaround = alt;

        SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT_GOAROUND", "Number", alt);
        SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT_GOAROUND", "Number", alt);
        SimVar.SetSimVarValue("L:AIRLINER_ENG_OUT_ACC_ALT_GOAROUND", "Number", alt);
    }
    static getSelectedTitleAndValue(_isPhaseActive, _isSelected, _preSel) {
        if (_isPhaseActive) {
            return _isSelected ? ["SELECTED", "" + Math.round(Simplane.getAutoPilotMachModeActive() ? SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', Simplane.getAutoPilotMachHoldValue()) : Simplane.getAutoPilotAirspeedHoldValue())] : ["", ""];
        } else {
            return ["PRESEL", isFinite(_preSel) ? "" + _preSel : "*[ ]"];
        }
    }
}
CDUPerformancePage._timer = 0;
