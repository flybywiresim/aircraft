class CDUPerformancePage {
    static ShowPage(fmc, mcdu) {
        mcdu.activeSystem = 'FMGC';

        switch (fmc.currentFlightPhase) {
            case FmgcFlightPhases.PREFLIGHT: CDUPerformancePage.ShowTAKEOFFPage(fmc, mcdu); break;
            case FmgcFlightPhases.TAKEOFF: CDUPerformancePage.ShowTAKEOFFPage(fmc, mcdu); break;
            case FmgcFlightPhases.CLIMB: CDUPerformancePage.ShowCLBPage(fmc, mcdu); break;
            case FmgcFlightPhases.CRUISE: CDUPerformancePage.ShowCRZPage(fmc, mcdu); break;
            case FmgcFlightPhases.DESCENT: CDUPerformancePage.ShowDESPage(fmc, mcdu); break;
            case FmgcFlightPhases.APPROACH: CDUPerformancePage.ShowAPPRPage(fmc, mcdu); break;
            case FmgcFlightPhases.GOAROUND: CDUPerformancePage.ShowGOAROUNDPage(fmc, mcdu); break;
        }
    }
    static ShowTAKEOFFPage(fmc, mcdu) {
        CDUPerformancePage._lastPhase = fmc.currentFlightPhase;
        mcdu.setCurrentPage(() => {
            if (fmc.currentFlightPhase === CDUPerformancePage._lastPhase) {
                CDUPerformancePage.ShowTAKEOFFPage(fmc, mcdu);
            } else {
                CDUPerformancePage.ShowPage(fmc, mcdu);
            }
        });

        let titleColor = "white";
        if (fmc.currentFlightPhase === FmgcFlightPhases.TAKEOFF) {
            titleColor = "green";
        }

        // check if we even have an airport
        const hasOrigin = !!fmc.flightPlanManager.getOrigin();

        // runway
        let runway = "";
        let hasRunway = false;
        if (hasOrigin) {
            const runwayObj = fmc.flightPlanManager.getDepartureRunway();
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
        if (fmc.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
            v1 = "{amber}___{end}";
            if (fmc.v1Speed) {
                if (fmc._v1Checked) {
                    v1 = `{cyan}${("" + fmc.v1Speed).padEnd(3)}{end}`;
                } else {
                    v1Check = `{small}{cyan}${("" + fmc.v1Speed).padEnd(3)}{end}{end}`;
                }
            }
            mcdu.onLeftInput[0] = (value) => {
                if (value === "") {
                    if (fmc._v1Checked) {
                        // not real: v-speed helper
                        if (fmc.flaps) {
                            mcdu.sendDataToScratchpad(fmc._getV1Speed().toString());
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.formatError);
                        }
                    } else {
                        fmc._v1Checked = true;
                        fmc.tryRemoveMessage(NXSystemMessages.checkToData.text);
                        fmc.vSpeedDisagreeCheck();
                    }
                    mcdu.requestUpdate();
                } else {
                    if (fmc.trySetV1Speed(value)) {
                        mcdu.requestUpdate();
                    }
                }
            };
            vR = "{amber}___{end}";
            if (fmc.vRSpeed) {
                if (fmc._vRChecked) {
                    vR = `{cyan}${("" + fmc.vRSpeed).padEnd(3)}{end}`;
                } else {
                    vRCheck = `{small}{cyan}${("" + fmc.vRSpeed).padEnd(3)}{end}{end}`;
                }
            }
            mcdu.onLeftInput[1] = (value) => {
                if (value === "") {
                    if (fmc._vRChecked) {
                        if (fmc.flaps) {
                            mcdu.sendDataToScratchpad(fmc._getVRSpeed().toString());
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.formatError);
                        }
                    } else {
                        fmc._vRChecked = true;
                        fmc.tryRemoveMessage(NXSystemMessages.checkToData.text);
                        fmc.vSpeedDisagreeCheck();
                    }
                    mcdu.requestUpdate();
                } else {
                    if (fmc.trySetVRSpeed(value)) {
                        mcdu.requestUpdate();
                    }
                }
            };
            v2 = "{amber}___{end}";
            if (fmc.v2Speed) {
                if (fmc._v2Checked) {
                    v2 = `{cyan}${("" + fmc.v2Speed).padEnd(3)}{end}`;
                } else {
                    v2Check = `{small}{cyan}${("" + fmc.v2Speed).padEnd(3)}{end}{end}`;
                }
            }
            mcdu.onLeftInput[2] = (value) => {
                if (value === "") {
                    if (fmc._v2Checked) {
                        if (fmc.flaps) {
                            mcdu.sendDataToScratchpad(fmc._getV2Speed().toString());
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.formatError);
                        }
                    } else {
                        fmc._v2Checked = true;
                        fmc.tryRemoveMessage(NXSystemMessages.checkToData.text);
                        fmc.vSpeedDisagreeCheck();
                    }
                    mcdu.requestUpdate();
                } else {
                    if (fmc.trySetV2Speed(value)) {
                        mcdu.requestUpdate();
                    }
                }
            };
        } else {
            v1 = "\xa0\xa0\xa0";
            vR = "\xa0\xa0\xa0";
            v2 = "\xa0\xa0\xa0";
            if (fmc.v1Speed) {
                v1 = `{green}${("" + fmc.v1Speed).padEnd(3)}{end}`;
            }
            if (fmc.vRSpeed) {
                vR = `{green}${("" + fmc.vRSpeed).padEnd(3)}{end}`;
            }
            if (fmc.v2Speed) {
                v2 = `{green}${("" + fmc.v2Speed).padEnd(3)}{end}`;
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
            const transAltitude = fmc.getTransitionAltitude();
            if (isFinite(transAltitude)) {
                transAltCell = `{cyan}${transAltitude}{end}`;
                if (!fmc.transitionAltitudeIsPilotEntered) {
                    transAltCell += "[s-text]";
                }
            } else {
                transAltCell = "{cyan}[]{end}";
            }
            mcdu.onLeftInput[3] = (value) => {
                if (fmc.trySetTakeOffTransAltitude(value)) {
                    mcdu.requestUpdate();
                }
            };
        }

        // thrust reduction / acceleration altitude
        let thrRedAcc = "-----/-----";
        if (hasOrigin) {
            if (fmc.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
                let thrRed = "[\xa0]";
                if (isFinite(fmc.thrustReductionAltitude)) {
                    thrRed = ("" + fmc.thrustReductionAltitude.toFixed(0)).padStart(5, "\xa0");
                }
                if (!fmc.thrustReductionAltitudeIsPilotEntered) {
                    thrRed = `{small}${thrRed}{end}`;
                }
                let acc = "[\xa0]";
                if (isFinite(fmc.accelerationAltitude)) {
                    acc = fmc.accelerationAltitude.toFixed(0);
                }
                acc = "/" + acc;
                if (!fmc.accelerationAltitudeIsPilotEntered) {
                    acc = `{small}${acc}{end}`;
                }
                thrRedAcc = `${thrRed}${acc}[color]cyan`;
                mcdu.onLeftInput[4] = (value) => {
                    if (fmc.trySetThrustReductionAccelerationAltitude(value)) {
                        mcdu.requestUpdate();
                    }
                };
            } else {
                let thrRed = "-----";
                if (isFinite(fmc.thrustReductionAltitude)) {
                    thrRed = ("" + fmc.thrustReductionAltitude.toFixed(0)).padStart(5, "\xa0");
                }
                if (!fmc.thrustReductionAltitudeIsPilotEntered) {
                    thrRed = `{small}${thrRed}{end}`;
                }
                let acc = "-----";
                if (isFinite(fmc.accelerationAltitude)) {
                    acc = fmc.accelerationAltitude.toFixed(0);
                }
                acc = "/" + acc;
                if (!fmc.accelerationAltitudeIsPilotEntered) {
                    acc = `{small}${acc}{end}`;
                }
                thrRedAcc = `${thrRed}${acc}[color]green`;
            }
        } else if (fmc.currentFlightPhase >= FmgcFlightPhases.TAKEOFF) {
            thrRedAcc = "";
        }

        // center column
        let flpRetrCell = "---";
        let sltRetrCell = "---";
        let cleanCell = "---";
        const flapSpeed = fmc.computedVfs;
        if (flapSpeed !== 0) {
            flpRetrCell = `{green}${flapSpeed.toFixed(0)}{end}`;
        }
        const slatSpeed = fmc.computedVss;
        if (slatSpeed !== 0) {
            sltRetrCell = `{green}${slatSpeed.toFixed(0)}{end}`;
        }
        const cleanSpeed = fmc.computedVgd;
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
        const formattedThs = !isNaN(fmc.ths)
            ? (fmc.ths >= 0 && !Object.is(fmc.ths, -0) ? `UP${Math.abs(fmc.ths).toFixed(1)}` : `DN${Math.abs(fmc.ths).toFixed(1)}`)
            : '';
        if (fmc.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
            const flaps = !isNaN(fmc.flaps) ? fmc.flaps : "[]";
            const ths = formattedThs ? formattedThs : "[\xa0\xa0\xa0]";
            flapsThs = `${flaps}/${ths}[color]cyan`;
            mcdu.onRightInput[2] = (value) => {
                if (fmc.trySetFlapsTHS(value)) {
                    mcdu.requestUpdate();
                }
            };
        } else {
            const flaps = !isNaN(fmc.flaps) ? fmc.flaps : "";
            const ths = formattedThs ? formattedThs : "\xa0\xa0\xa0\xa0\xa0";
            flapsThs = `${flaps}/${ths}[color]green`;
        }

        // flex takeoff temperature
        let flexTakeOffTempCell = "[\xa0\xa0]°[color]cyan";
        if (fmc.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
            if (isFinite(fmc.perfTOTemp)) {
                if (fmc._toFlexChecked) {
                    flexTakeOffTempCell = `${fmc.perfTOTemp.toFixed(0)}°[color]cyan`;
                } else {
                    flexTakeOffTempCell = `{small}${fmc.perfTOTemp.toFixed(0)}{end}${flexTakeOffTempCell}[color]cyan`;
                }
            }
            mcdu.onRightInput[3] = (value) => {
                if (fmc._toFlexChecked) {
                    if (fmc.setPerfTOFlexTemp(value)) {
                        mcdu.requestUpdate();
                    }
                } else {
                    if (value === "" || fmc.setPerfTOFlexTemp(value)) {
                        fmc._toFlexChecked = true;
                        mcdu.requestUpdate();
                    }
                }
            };
        } else {
            if (isFinite(fmc.perfTOTemp)) {
                flexTakeOffTempCell = `${fmc.perfTOTemp.toFixed(0)}°[color]green`;
            } else {
                flexTakeOffTempCell = "";
            }
        }

        // eng out acceleration altitude
        let engOutAcc = "-----";
        if (hasOrigin) {
            if (fmc.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
                if (isFinite(fmc.engineOutAccelerationAltitude)) {
                    engOutAcc = fmc.engineOutAccelerationAltitude.toFixed(0);
                    if (fmc.engineOutAccelerationAltitudeIsPilotEntered) {
                        engOutAcc = `${engOutAcc}[color]cyan`;
                    } else {
                        engOutAcc = `${engOutAcc}[s-text][color]cyan`;
                    }
                } else {
                    engOutAcc = "[][color]cyan";
                }
                mcdu.onRightInput[4] = (value) => {
                    if (fmc.trySetEngineOutAcceleration(value)) {
                        mcdu.requestUpdate();
                    }
                };
            } else if (isFinite(fmc.engineOutAccelerationAltitude)) {
                if (fmc.engineOutAccelerationAltitudeIsPilotEntered) {
                    engOutAcc = `${fmc.engineOutAccelerationAltitude}[color]green`;
                } else {
                    engOutAcc = `${fmc.engineOutAccelerationAltitude}[s-text][color]green`;
                }
            }
        } else if (fmc.currentFlightPhase >= FmgcFlightPhases.TAKEOFF) {
            engOutAcc = "";
        }

        let next = "NEXT\xa0";
        let nextPhase = "PHASE>";
        if (!(fmc._v1Checked && fmc._vRChecked && fmc._v2Checked && fmc._toFlexChecked) && fmc.currentFlightPhase < FmgcFlightPhases.TAKEOFF) {
            next = "CONFIRM\xa0";
            nextPhase = "TO DATA*";
            mcdu.onRightInput[5] = (value) => {
                fmc._v1Checked = true;
                fmc._vRChecked = true;
                fmc._v2Checked = true;
                fmc._toFlexChecked = true;
                fmc.vSpeedDisagreeCheck();
                mcdu.requestUpdate();
            };
        } else {
            mcdu.rightInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[5] = (value) => {
                CDUPerformancePage.ShowCLBPage(fmc, mcdu);
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
    static ShowCLBPage(fmc, mcdu, confirmAppr = false) {
        CDUPerformancePage._lastPhase = fmc.currentFlightPhase;
        mcdu.setCurrentPage(() => {
            if (fmc.currentFlightPhase === CDUPerformancePage._lastPhase) {
                CDUPerformancePage.ShowCLBPage(fmc, mcdu);
            } else {
                CDUPerformancePage.ShowPage(fmc, mcdu);
            }
        });
        const isPhaseActive = fmc.currentFlightPhase === FmgcFlightPhases.CLIMB;
        const titleColor = isPhaseActive ? "green" : "white";
        const isSelected = Simplane.getAutoPilotAirspeedSelected();
        const actModeCell = isSelected ? "SELECTED" : "MANAGED";
        const costIndexCell = isFinite(fmc.costIndex) ? fmc.costIndex.toFixed(0) + "[color]cyan" : "[][color]cyan";
        let managedSpeedCell = "";
        if (isPhaseActive) {
            if (fmc.managedSpeedTarget === fmc.managedSpeedClimb) {
                managedSpeedCell = "{small}" + fmc.managedSpeedClimb.toFixed(0) + "/" + fmc.managedSpeedClimbMach.toFixed(2).replace("0.", ".") + "{end}";
            } else if (Simplane.getAutoPilotMachModeActive() || SimVar.GetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_ON", "Bool")) {
                managedSpeedCell = "{small}" + fmc.managedSpeedClimbMach.toFixed(2).replace("0.", ".") + "{end}";
            } else {
                managedSpeedCell = "{small}" + fmc.managedSpeedTarget.toFixed(0) + "{end}";
            }
        } else {
            managedSpeedCell = (isSelected ? "*" : "") + fmc.managedSpeedClimb > fmc.managedSpeedLimit ? fmc.managedSpeedLimit.toFixed(0) : fmc.managedSpeedClimb.toFixed(0);

            mcdu.onLeftInput[3] = (value) => {
                if (fmc.trySetPreSelectedClimbSpeed(value)) {
                    mcdu.requestUpdate();
                }
            };
        }
        const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getSelectedTitleAndValue(isPhaseActive, isSelected, fmc.preSelectedClbSpeed);
        mcdu.onLeftInput[1] = (value) => {
            if (fmc.tryUpdateCostIndex(value)) {
                mcdu.requestUpdate();
            }
        };
        const timeLabel = fmc.getIsFlying() ? "UTC" : "TIME";
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
                    fmc.tryGoInApproachPhase();
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.onLeftInput[5] = () => {
                    CDUPerformancePage.ShowCLBPage(fmc, mcdu, true);
                };
            }
        } else {
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowTAKEOFFPage(fmc, mcdu);
            };
        }
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUPerformancePage.ShowCRZPage(fmc, mcdu);
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
    static ShowCRZPage(fmc, mcdu, confirmAppr = false) {
        CDUPerformancePage._lastPhase = fmc.currentFlightPhase;
        mcdu.setCurrentPage(() => {
            if (fmc.currentFlightPhase === CDUPerformancePage._lastPhase) {
                CDUPerformancePage.ShowCRZPage(fmc, mcdu);
            } else {
                CDUPerformancePage.ShowPage(fmc, mcdu);
            }
        });
        const isPhaseActive = fmc.currentFlightPhase === FmgcFlightPhases.CRUISE;
        const titleColor = isPhaseActive ? "green" : "white";
        const isSelected = Simplane.getAutoPilotAirspeedSelected();
        const isFlying = false;
        const actModeCell = isSelected ? "SELECTED" : "MANAGED";
        const costIndexCell = isFinite(fmc.costIndex) ? fmc.costIndex.toFixed(0) + "[color]cyan" : "[][color]cyan";
        let managedSpeedCell = "";
        const managedSpeed = isPhaseActive ? fmc.managedSpeedTarget : fmc.managedSpeedCruise;
        if (isFinite(managedSpeed)) {
            managedSpeedCell = (isSelected ? "*" : "") + managedSpeed.toFixed(0);
        }
        const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getSelectedTitleAndValue(isPhaseActive, isSelected, fmc.preSelectedCrzSpeed);
        mcdu.onLeftInput[1] = (value) => {
            if (fmc.tryUpdateCostIndex(value)) {
                mcdu.requestUpdate();
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
                    fmc.tryGoInApproachPhase();
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.onLeftInput[5] = () => {
                    CDUPerformancePage.ShowCRZPage(fmc, mcdu, true);
                };
            }
        } else {
            mcdu.onLeftInput[3] = (value) => {
                if (fmc.trySetPreSelectedCruiseSpeed(value)) {
                    mcdu.requestUpdate();
                }
            };
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowCLBPage(fmc, mcdu);
            };
        }
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUPerformancePage.ShowDESPage(fmc, mcdu);
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
    static ShowDESPage(fmc, mcdu, confirmAppr = false) {
        CDUPerformancePage._lastPhase = fmc.currentFlightPhase;
        mcdu.setCurrentPage(() => {
            if (fmc.currentFlightPhase === CDUPerformancePage._lastPhase) {
                CDUPerformancePage.ShowDESPage(fmc, mcdu);
            } else {
                CDUPerformancePage.ShowPage(fmc, mcdu);
            }
        });
        const isPhaseActive = fmc.currentFlightPhase === FmgcFlightPhases.DESCENT;
        const titleColor = isPhaseActive ? "green" : "white";
        const isFlying = false;
        const isSelected = Simplane.getAutoPilotAirspeedSelected();
        const actModeCell = isSelected ? "SELECTED" : "MANAGED";
        const costIndexCell = isFinite(fmc.costIndex) ? fmc.costIndex.toFixed(0) + "[color]cyan" : "[][color]cyan";
        let managedSpeedCell = "";
        const managedSpeed = isPhaseActive ? fmc.managedSpeedTarget : fmc.managedSpeedDescend;
        if (isFinite(managedSpeed)) {
            managedSpeedCell = (isSelected ? "*" : "") + managedSpeed.toFixed(0);
        }
        const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getSelectedTitleAndValue(isPhaseActive, isSelected, fmc.preSelectedDesSpeed);
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
                    fmc.tryGoInApproachPhase();
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.onLeftInput[5] = () => {
                    CDUPerformancePage.ShowDESPage(fmc, mcdu, true);
                };
            }
        } else {
            mcdu.onLeftInput[3] = (value) => {
                if (fmc.trySetPreSelectedDescentSpeed(value)) {
                    mcdu.requestUpdate();
                }
            };
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowCRZPage(fmc, mcdu);
            };
        }
        mcdu.onLeftInput[1] = (value) => {
            if (fmc.tryUpdateCostIndex(value)) {
                mcdu.requestUpdate();
            }
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUPerformancePage.ShowAPPRPage(fmc, mcdu);
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

    static ShowAPPRPage(fmc, mcdu) {
        CDUPerformancePage._lastPhase = fmc.currentFlightPhase;
        mcdu.setCurrentPage(() => {
            if (fmc.currentFlightPhase === CDUPerformancePage._lastPhase) {
                CDUPerformancePage.ShowAPPRPage(fmc, mcdu);
            } else {
                CDUPerformancePage.ShowPage(fmc, mcdu);
            }
        });

        const closeToDest = fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getDestination().liveDistanceTo <= 180;

        let qnhCell = "[\xa0\xa0][color]cyan";
        if (isFinite(fmc.perfApprQNH)) {
            if (fmc.perfApprQNH < 500) {
                qnhCell = fmc.perfApprQNH.toFixed(2) + "[color]cyan";
            } else {
                qnhCell = fmc.perfApprQNH.toFixed(0) + "[color]cyan";
            }
        } else if (closeToDest) {
            qnhCell = "____[color]amber";
        }
        mcdu.onLeftInput[0] = (value) => {
            if (fmc.setPerfApprQNH(value)) {
                mcdu.requestUpdate();
            }
        };

        let tempCell = "{cyan}[\xa0]°{end}";
        if (isFinite(fmc.perfApprTemp)) {
            tempCell = "{cyan}" + (fmc.perfApprTemp >= 0 ? "+" : "-") + ("" + Math.abs(fmc.perfApprTemp).toFixed(0)).padStart(2).replace(/ /g, "\xa0") + "°{end}";
        } else if (closeToDest) {
            tempCell = "{amber}___°{end}";
        }
        mcdu.onLeftInput[1] = (value) => {
            if (fmc.setPerfApprTemp(value)) {
                mcdu.requestUpdate();
            }
        };
        let magWindHeadingCell = "[\xa0]";
        if (isFinite(fmc.perfApprWindHeading)) {
            magWindHeadingCell = ("" + fmc.perfApprWindHeading.toFixed(0)).padStart(3, 0);
        }
        let magWindSpeedCell = "[\xa0]";
        if (isFinite(fmc.perfApprWindSpeed)) {
            magWindSpeedCell = fmc.perfApprWindSpeed.toFixed(0).padStart(3, "0");
        }
        mcdu.onLeftInput[2] = (value) => {
            if (fmc.setPerfApprWind(value)) {
                fmc.updateTowerHeadwind();
                fmc.updatePerfSpeeds();
                mcdu.requestUpdate();
            }
        };

        let transAltCell = "[\xa0]".padEnd(5, "\xa0");
        if (isFinite(fmc.perfApprTransAlt)) {
            transAltCell = fmc.perfApprTransAlt.toFixed(0).padEnd(5, "\xa0");
            if (!fmc.perfApprTransAltPilotEntered) {
                transAltCell = `{small}${transAltCell}{end}`;
            }
        }
        mcdu.onLeftInput[3] = (value) => {
            if (fmc.setPerfApprTransAlt(value)) {
                mcdu.requestUpdate();
            }
        };

        let vappCell = "---";
        let vlsCell = "---";
        let flpRetrCell = "---";
        let sltRetrCell = "---";
        let cleanCell = "---";
        if (fmc.approachSpeeds && fmc.approachSpeeds.valid) {
            vappCell = `{cyan}{small}${fmc.approachSpeeds.vapp.toFixed(0)}{end}{end}`;
            vlsCell = `{green}${fmc.approachSpeeds.vls.toFixed(0)}{end}`;
            flpRetrCell = `{green}${fmc.approachSpeeds.f.toFixed(0)}{end}`;
            sltRetrCell = `{green}${fmc.approachSpeeds.s.toFixed(0)}{end}`;
            cleanCell = `{green}${fmc.approachSpeeds.gd.toFixed(0)}{end}`;
        }
        if (isFinite(fmc.vApp)) { // pilot override
            vappCell = `{cyan}${fmc.vApp.toFixed(0).padStart(3, "\xa0")}{end}`;
        }
        mcdu.onLeftInput[4] = (value) => {
            if (fmc.setPerfApprVApp(value)) {
                mcdu.requestUpdate();
            }
        };
        mcdu.onRightInput[4] = () => {
            fmc.setPerfApprFlaps3(!fmc.perfApprFlaps3);
            fmc.updatePerfSpeeds();
            mcdu.requestUpdate();
        };

        let baroCell = "[\xa0\xa0\xa0]";
        if (isFinite(fmc.perfApprMDA)) {
            baroCell = fmc.perfApprMDA.toFixed(0);
        }
        mcdu.onRightInput[1] = (value) => {
            if (fmc.setPerfApprMDA(value) && fmc.setPerfApprDH(FMCMainDisplay.clrValue)) {
                mcdu.requestUpdate();
            }
        };

        const approach = fmc.flightPlanManager.getApproach();
        const isILS = approach && approach.name && approach.name.indexOf("ILS") !== -1;
        let radioLabel = "";
        let radioCell = "";
        if (isILS) {
            radioLabel = "RADIO";
            if (isFinite(fmc.perfApprDH)) {
                radioCell = fmc.perfApprDH.toFixed(0);
            } else if (fmc.perfApprDH === "NO DH") {
                radioCell = "NO DH";
            } else {
                radioCell = "[\xa0]";
            }
            mcdu.onRightInput[2] = (value) => {
                if (fmc.setPerfApprDH(value) && fmc.setPerfApprMDA(FMCMainDisplay.clrValue)) {
                    mcdu.requestUpdate();
                }
            };
        }

        const bottomRowLabels = ["\xa0PREV", "NEXT\xa0"];
        const bottomRowCells = ["<PHASE", "PHASE>"];
        let titleColor = "white";
        if (fmc.currentFlightPhase === FmgcFlightPhases.APPROACH) {
            bottomRowLabels[0] = "";
            bottomRowCells[0] = "";
            titleColor = "green";
        } else {
            if (fmc.currentFlightPhase === FmgcFlightPhases.GOAROUND) {
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = (value) => {
                    CDUPerformancePage.ShowGOAROUNDPage(fmc, mcdu);
                };
            } else {
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = (value) => {
                    CDUPerformancePage.ShowDESPage(fmc, mcdu);
                };
            }
        }
        if (fmc.currentFlightPhase === FmgcFlightPhases.GOAROUND) {
            bottomRowLabels[1] = "";
            bottomRowCells[1] = "";
        } else {
            mcdu.rightInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[5] = (value) => {
                CDUPerformancePage.ShowGOAROUNDPage(fmc, mcdu);
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
            /* 5L */[`${vappCell}${"\xa0".repeat(4)}${vlsCell}`, fmc.perfApprFlaps3 ? "{cyan}CONF3/{end}{small}FULL{end}*" : "{cyan}FULL/{end}{small}CONF3{end}*"],
            /* 6l */bottomRowLabels,
            /* 6L */bottomRowCells,
        ]);
    }

    static ShowGOAROUNDPage(fmc, mcdu, confirmAppr = false) {
        CDUPerformancePage._lastPhase = fmc.currentFlightPhase;
        mcdu.setCurrentPage(() => {
            if (fmc.currentFlightPhase === CDUPerformancePage._lastPhase) {
                CDUPerformancePage.ShowGOAROUNDPage(fmc, mcdu);
            } else {
                CDUPerformancePage.ShowPage(fmc, mcdu);
            }
        });

        let titleColor = "white";
        if (fmc.currentFlightPhase === FmgcFlightPhases.GOAROUND) {
            titleColor = "green";
        }
        let thrRedAcc = "---";
        if (isFinite(fmc.thrustReductionAltitudeGoaround) && fmc.thrustReductionAltitudeGoaround != 0) {
            thrRedAcc = fmc.thrustReductionAltitudeGoaround.toFixed(0);
        }

        thrRedAcc += "/";

        if (isFinite(fmc.accelerationAltitudeGoaround && fmc.accelerationAltitudeGoaround != 0)) {
            thrRedAcc += fmc.accelerationAltitudeGoaround.toFixed(0);
        } else {
            thrRedAcc += "---";
        }
        thrRedAcc += "[color]cyan";

        mcdu.onLeftInput[4] = (value) => {
            if (fmc.trySetThrustReductionAccelerationAltitudeGoaround(value)) {
                mcdu.requestUpdate();
            }
        };

        let engOut = "---";
        if (isFinite(fmc.engineOutAccelerationAltitudeGoaround) && fmc.engineOutAccelerationAltitudeGoaround != 0) {
            engOut = fmc.engineOutAccelerationAltitudeGoaround.toFixed(0);
        } else if (isFinite(fmc.thrustReductionAltitudeGoaround) && fmc.thrustReductionAltitudeGoaround != 0) {
            engOut = fmc.thrustReductionAltitudeGoaround.toFixed(0);
        }
        engOut += "[color]cyan";

        mcdu.onRightInput[4] = (value) => {
            if (fmc.trySetengineOutAccelerationAltitudeGoaround(value)) {
                mcdu.requestUpdate();
            }
        };
        let flpRetrCell = "---";
        const flapSpeed = fmc.computedVfs;
        if (isFinite(flapSpeed)) {
            flpRetrCell = flapSpeed.toFixed(0) + "[color]green";
        }
        let sltRetrCell = "---";
        const slatSpeed = fmc.computedVss;
        if (isFinite(slatSpeed)) {
            sltRetrCell = slatSpeed.toFixed(0) + "[color]green";
        }
        let cleanCell = "---";
        const cleanSpeed = fmc.computedVgd;
        if (isFinite(cleanSpeed)) {
            cleanCell = cleanSpeed.toFixed(0) + "[color]green";
        }

        const bottomRowLabels = ["", ""];
        const bottomRowCells = ["", ""];
        if (fmc.currentFlightPhase === FmgcFlightPhases.GOAROUND) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = async () => {
                    fmc.tryGoInApproachPhase();
                };
            } else {
                bottomRowLabels[0] = "\xa0ACTIVATE[color]cyan";
                bottomRowCells[0] = "{APPR PHASE[color]cyan";
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = () => {
                    CDUPerformancePage.ShowGOAROUNDPage(fmc, mcdu, true);
                };
            }
            bottomRowLabels[1] = "NEXT\xa0";
            bottomRowCells[1] = "PHASE>";
            mcdu.rightInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[5] = () => {
                CDUPerformancePage.ShowAPPRPage(fmc, mcdu);
            };
        } else {
            bottomRowLabels[0] = "\xa0PREV";
            bottomRowCells[0] = "<PHASE";
            mcdu.leftInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowAPPRPage(fmc, mcdu);
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
    static UpdateThrRedAccFromOrigin(fmc, updateThrRedAlt = true, updateAccAlt = true) {
        const origin = fmc.flightPlanManager.getOrigin();
        const elevation = origin ? origin.altitudeinFP : SimVar.GetSimVarValue("GROUND ALTITUDE", "feet");

        if (updateThrRedAlt && !fmc.thrustReductionAltitudeIsPilotEntered) {
            const thrRedOffset = +NXDataStore.get("CONFIG_THR_RED_ALT", "1500");
            const thrRedAltitude = Math.round((elevation + thrRedOffset) / 10) * 10;

            fmc.thrustReductionAltitude = thrRedAltitude;
            fmc.thrustReductionAltitudeIsPilotEntered = false;
            SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT", "Number", thrRedAltitude);
        }

        if (updateAccAlt && !fmc.accelerationAltitudeIsPilotEntered) {
            const accOffset = +NXDataStore.get("CONFIG_ACCEL_ALT", "1500");
            const accAlt = Math.round((elevation + accOffset) / 10) * 10;

            fmc.accelerationAltitude = accAlt;
            fmc.accelerationAltitudeIsPilotEntered = false;
            SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT", "Number", accAlt);
        }
    }
    static UpdateEngOutAccFromOrigin(fmc) {
        if (fmc.engineOutAccelerationAltitudeIsPilotEntered) {
            return;
        }
        const origin = fmc.flightPlanManager.getOrigin();
        const elevation = origin ? origin.altitudeinFP : SimVar.GetSimVarValue("GROUND ALTITUDE", "feet");

        const offset = +NXDataStore.get("CONFIG_ENG_OUT_ACCEL_ALT", "1500");
        const alt = Math.round((elevation + offset) / 10) * 10;

        fmc.engineOutAccelerationAltitude = alt;
        fmc.engineOutAccelerationAltitudeIsPilotEntered = false;
        SimVar.SetSimVarValue("L:A32NX_ENG_OUT_ACC_ALT", "feet", alt);
    }
    static UpdateThrRedAccFromDestination(fmc) {
        const destination = fmc.flightPlanManager.getDestination();
        const elevation = destination ? destination.altitudeinFP : SimVar.GetSimVarValue("GROUND ALTITUDE", "feet");

        const offset = +NXDataStore.get("CONFIG_ENG_OUT_ACCEL_ALT", "1500");
        const alt = Math.round((elevation + offset) / 10) * 10;

        fmc.thrustReductionAltitudeGoaround = alt;
        fmc.accelerationAltitudeGoaround = alt;
        fmc.engineOutAccelerationAltitudeGoaround = alt;

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
