/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
        let runway = "---";
        const selectedRunway = mcdu.flightPlanManager.getDepartureRunway();
        if (selectedRunway) {
            runway = Avionics.Utils.formatRunway(selectedRunway.designation);
        } else {
            const predictedRunway = mcdu.flightPlanManager.getDetectedCurrentRunway();
            if (predictedRunway) {
                runway = Avionics.Utils.formatRunway(predictedRunway.designation);
            }
        }
        let v1 = "___[color]amber";
        if (mcdu.v1Speed) {
            v1 = mcdu.v1Speed + "[color]cyan";
        }
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.v1Speed = undefined;
                SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", -1);
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            } else if (value === "") {
                mcdu.sendDataToScratchpad(mcdu._getV1Speed().toString());
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            } else {
                if (mcdu.trySetV1Speed(value)) {
                    CDUPerformancePage.ShowTAKEOFFPage(mcdu);
                }
            }
        };
        let vR = "___[color]amber";
        if (mcdu.vRSpeed) {
            vR = mcdu.vRSpeed + "[color]cyan";
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
        let v2 = "___[color]amber";
        if (mcdu.v2Speed) {
            v2 = mcdu.v2Speed + "[color]cyan";
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
        let transAlt = "---[color]cyan";
        if (isFinite(mcdu.transitionAltitude)) {
            transAlt = mcdu.transitionAltitude + "[color]cyan";
        }
        mcdu.onLeftInput[3] = (value) => {
            if (mcdu.trySetTransAltitude(value)) {
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            }
        };
        let thrRedAcc = "";
        if (isFinite(mcdu.thrustReductionAltitude)) {
            thrRedAcc = mcdu.thrustReductionAltitude.toFixed(0);
        } else {
            thrRedAcc = "---";
        }
        thrRedAcc += " /";
        if (isFinite(mcdu.accelerationAltitude)) {
            thrRedAcc += mcdu.accelerationAltitude.toFixed(0);
        } else {
            thrRedAcc += "---";
        }
        thrRedAcc += "[color]cyan";
        mcdu.onLeftInput[4] = (value) => {
            if (mcdu.trySetThrustReductionAccelerationAltitude(value)) {
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            }
        };
        let flpRetrCell = "---";
        const flapSpeed = mcdu.getFlapTakeOffSpeed();
        if (isFinite(flapSpeed)) {
            flpRetrCell = flapSpeed.toFixed(0) + "[color]green";
        }
        let sltRetrCell = "---";
        const slatSpeed = mcdu.getSlatTakeOffSpeed();
        if (isFinite(slatSpeed)) {
            sltRetrCell = slatSpeed.toFixed(0) + "[color]green";
        }
        let cleanCell = "---";
        const cleanSpeed = mcdu.getPerfGreenDotSpeed();
        if (isFinite(cleanSpeed)) {
            cleanCell = cleanSpeed.toFixed(0) + "[color]green";
        }
        let flapsThs = "[]/[]";
        if (mcdu.flaps) {
            flapsThs = mcdu.flaps + "/";
            if (mcdu.ths) {
                flapsThs += mcdu.ths;
            } else {
                flapsThs += "[]";
            }
        }
        mcdu.onRightInput[2] = (value) => {
            if (mcdu.trySetFlapsTHS(value)) {
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            }
        };
        let flexTakeOffTempCell = "[]°";
        if (isFinite(mcdu.perfTOTemp)) {
            flexTakeOffTempCell = mcdu.perfTOTemp + "°";
        }
        mcdu.onRightInput[3] = (value) => {
            if (mcdu.setPerfTOFlexTemp(value)) {
                CDUPerformancePage.ShowTAKEOFFPage(mcdu);
            }
        };
        mcdu.setTemplate([
            ["TAKE OFF[color]" + titleColor],
            ["V1", "RWY", "FLP RETR"],
            [v1, runway + "[color]green", "F=" + flpRetrCell],
            ["VR", "TO SHIFT", "SLT RETR"],
            [vR, "[M][]*[color]cyan", "S=" + sltRetrCell],
            ["V2", "FLAPS/THS", "CLEAN"],
            [v2, flapsThs + "[color]cyan", "O=" + cleanCell],
            ["TRANS ALT", "FLEX TO TEMP"],
            [transAlt, flexTakeOffTempCell + "[color]cyan"],
            ["THR RED/ACC", "ENG OUT ACC"],
            [thrRedAcc, "1680[color]cyan"],
            ["", "NEXT"],
            ["", "PHASE>"]
        ]);
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
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
        let costIndexCell = "[][color]cyan";
        if (isFinite(mcdu.costIndex)) {
            costIndexCell = mcdu.costIndex.toFixed(0) + "[color]cyan";
        }
        let managedSpeedCell = "";
        let managedSpeed;
        if (SimVar.GetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool") === 1) {
            managedSpeed = mcdu.getPerfGreenDotSpeed();
        } else {
            managedSpeed = mcdu.getClbManagedSpeed();
        }
        if (isFinite(managedSpeed)) {
            managedSpeedCell = managedSpeed.toFixed(0);
        }
        let selectedSpeedCell = "";
        if (isFinite(mcdu.preSelectedClbSpeed)) {
            selectedSpeedCell = mcdu.preSelectedClbSpeed.toFixed(0);
        } else {
            selectedSpeedCell = "[]";
        }
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.tryUpdateCostIndex(value)) {
                CDUPerformancePage.ShowCLBPage(mcdu);
            }
        };
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
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async () => {
                    if (await mcdu.tryGoInApproachPhase()) {
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
            ["CI"],
            [costIndexCell + "[color]cyan"],
            ["MANAGED"],
            ["*" + managedSpeedCell + "[color]green"],
            ["SELECTED"],
            [selectedSpeedCell + "[color]green"],
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
        let costIndexCell = "[][color]cyan";
        if (isFinite(mcdu.costIndex)) {
            costIndexCell = mcdu.costIndex.toFixed(0) + "[color]cyan";
        }
        let managedSpeedCell = "";
        const managedSpeed = mcdu.getCrzManagedSpeed();
        if (isFinite(managedSpeed)) {
            managedSpeedCell = managedSpeed.toFixed(0);
        }
        let selectedSpeedCell = "";
        if (isFinite(mcdu.preSelectedCrzSpeed)) {
            selectedSpeedCell = mcdu.preSelectedCrzSpeed.toFixed(0);
        } else {
            selectedSpeedCell = "[]";
        }
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.tryUpdateCostIndex(value)) {
                CDUPerformancePage.ShowCLBPage(mcdu);
            }
        };
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
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async () => {
                    if (await mcdu.tryGoInApproachPhase()) {
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
            ["CI"],
            [costIndexCell + "[color]cyan"],
            ["MANAGED"],
            ["*" + managedSpeedCell + "[color]green"],
            ["SELECTED"],
            [selectedSpeedCell + "[color]cyan"],
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
        let titleColor = "white";
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            titleColor = "green";
        }
        const isFlying = false;
        let actModeCell = "SELECTED";
        if (mcdu.isAirspeedManaged()) {
            actModeCell = "MANAGED";
        }
        let costIndexCell = "[][color]cyan";
        if (isFinite(mcdu.costIndex)) {
            costIndexCell = mcdu.costIndex.toFixed(0) + "[color]cyan";
        }
        let managedSpeedCell = "";
        const managedSpeed = mcdu.getDesManagedSpeed();
        if (isFinite(managedSpeed)) {
            managedSpeedCell = managedSpeed.toFixed(0);
        }
        let selectedSpeedCell = "";
        if (isFinite(mcdu.preSelectedDesSpeed)) {
            selectedSpeedCell = mcdu.preSelectedDesSpeed.toFixed(0);
        } else {
            selectedSpeedCell = "[]";
        }
        mcdu.onLeftInput[3] = (value) => {
            if (mcdu.trySetPreSelectedDescentSpeed(value)) {
                CDUPerformancePage.ShowDESPage(mcdu);
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
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.onLeftInput[5] = async () => {
                    if (await mcdu.tryGoInApproachPhase()) {
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
            mcdu.onLeftInput[5] = () => {
                CDUPerformancePage.ShowCRZPage(mcdu);
            };
        }
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.tryUpdateCostIndex(value)) {
                CDUPerformancePage.ShowCLBPage(mcdu);
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
            ["CI"],
            [costIndexCell + "[color]cyan"],
            ["MANAGED"],
            ["*" + managedSpeedCell + "[color]green"],
            ["SELECTED"],
            [selectedSpeedCell + "[color]cyan"],
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
        let qnhCell = "[ ]";
        const QNH_REGEX = /[0-9]{2}.[0-9]{2}/;
        if (isFinite(mcdu.perfApprQNH) || QNH_REGEX.test(mcdu.perfApprQNH)) {
            qnhCell = mcdu.perfApprQNH;
        }
        mcdu.onLeftInput[0] = (value) => {
            if (mcdu.setPerfApprQNH(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };
        let tempCell = "[ ]";
        if (isFinite(mcdu.perfApprTemp)) {
            tempCell = mcdu.perfApprTemp.toFixed(0);
        }
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.setPerfApprTemp(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };
        let magWindHeadingCell = "[ ]";
        if (isFinite(mcdu.perfApprWindHeading)) {
            magWindHeadingCell = mcdu.perfApprWindHeading.toFixed(0);
        }
        let magWindSpeedCell = "[ ]";
        if (isFinite(mcdu.perfApprWindSpeed)) {
            magWindSpeedCell = mcdu.perfApprWindSpeed.toFixed(0);
        }
        mcdu.onLeftInput[2] = (value) => {
            if (mcdu.setPerfApprWind(value)) {
                mcdu.updateTowerHeadwind();
                mcdu.updateApproachSpeeds();
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };
        let transAltCell = "---";
        if (isFinite(mcdu.perfApprTransAlt)) {
            transAltCell = mcdu.perfApprTransAlt.toFixed(0);
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
            vappCell = mcdu.approachSpeeds.vapp.toFixed(0);
            vlsCell = mcdu.approachSpeeds.vls.toFixed(0);
            flpRetrCell = mcdu.approachSpeeds.f.toFixed(0) + "[color]green";
            sltRetrCell = mcdu.approachSpeeds.s.toFixed(0) + "[color]green";
            cleanCell = mcdu.approachSpeeds.gd.toFixed(0) + "[color]green";
        }
        if (isFinite(mcdu.vApp)) { // pilot override
            vappCell = mcdu.vApp.toFixed(0);
        }
        mcdu.onLeftInput[4] = (value) => {
            if (mcdu.setPerfApprVApp(value)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };
        mcdu.onRightInput[3] = () => {
            mcdu.setPerfApprFlaps3(true);
            mcdu.updateApproachSpeeds();
            CDUPerformancePage.ShowAPPRPage(mcdu);
        };
        mcdu.onRightInput[4] = () => {
            mcdu.setPerfApprFlaps3(false);
            mcdu.updateApproachSpeeds();
            CDUPerformancePage.ShowAPPRPage(mcdu);
        };
        let finalCell = "-----";
        const approach = mcdu.flightPlanManager.getApproach();
        if (approach && approach.name) {
            finalCell = Avionics.Utils.formatRunway(approach.name);
        }
        let mdaCell = "[ ]";
        if (isFinite(mcdu.perfApprMDA)) {
            mdaCell = mcdu.perfApprMDA.toFixed(0);
        }
        mcdu.onRightInput[1] = (value) => {
            if (mcdu.setPerfApprMDA(value) && mcdu.setPerfApprDH(FMCMainDisplay.clrValue)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };
        let dhCell = "[ ]";
        if (isFinite(mcdu.perfApprDH)) {
            dhCell = mcdu.perfApprDH.toFixed(0);
        } else if (mcdu.perfApprDH === "NO DH") {
            dhCell = "NO DH";
        }
        mcdu.onRightInput[2] = (value) => {
            if (mcdu.setPerfApprDH(value) && mcdu.setPerfApprMDA(FMCMainDisplay.clrValue)) {
                CDUPerformancePage.ShowAPPRPage(mcdu);
            }
        };

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
            ["APPR[color]" + titleColor],
            ["QNH", "FINAL", "FLP RETR"],
            [qnhCell + "[color]cyan", finalCell + "[color]green", "F=" + flpRetrCell + "[color]green"],
            ["TEMP", "MDA", "SLT RETR"],
            [tempCell + "°[color]cyan", mdaCell + "[color]cyan", "S=" + sltRetrCell + "[color]green"],
            ["MAG WIND", "DH", "CLEAN"],
            [magWindHeadingCell + "°/" + magWindSpeedCell + "[color]cyan", dhCell + "[color]cyan", "0=" + cleanCell + "[color]green"],
            ["TRANS ALT", "LDG CONF"],
            [transAltCell + "[color]cyan", mcdu.perfApprFlaps3 ? "CONF3[color]cyan" : "[s-text]CONF3*[color]cyan"],
            ["VAPP", "", "VLS"],
            [vappCell + "[color]cyan", mcdu.perfApprFlaps3 ? "[s-text]FULL*[color]cyan" : "FULL[color]cyan", vlsCell + "[color]green"],
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
        if (isFinite(mcdu.engineOutAccelerationGoaround) && mcdu.engineOutAccelerationGoaround != 0) {
            engOut = mcdu.engineOutAccelerationGoaround.toFixed(0);
        } else if (isFinite(mcdu.thrustReductionAltitudeGoaround) && mcdu.thrustReductionAltitudeGoaround != 0) {
            engOut = mcdu.thrustReductionAltitudeGoaround.toFixed(0);
        }
        engOut += "[color]cyan";

        mcdu.onRightInput[4] = (value) => {
            if (mcdu.trySetEngineOutAcceleration(value)) {
                CDUPerformancePage.ShowGOAROUNDPage(mcdu);
            }
        };
        let flpRetrCell = "---";
        const flapSpeed = mcdu.getFlapTakeOffSpeed();
        if (isFinite(flapSpeed)) {
            flpRetrCell = flapSpeed.toFixed(0) + "[color]green";
        }
        let sltRetrCell = "---";
        const slatSpeed = mcdu.getSlatTakeOffSpeed();
        if (isFinite(slatSpeed)) {
            sltRetrCell = slatSpeed.toFixed(0) + "[color]green";
        }
        let cleanCell = "---";
        const cleanSpeed = mcdu.getPerfGreenDotSpeed();
        if (isFinite(cleanSpeed)) {
            cleanCell = cleanSpeed.toFixed(0) + "[color]green";
        }

        const bottomRowLabels = ["", ""];
        const bottomRowCells = ["", ""];
        if (mcdu.currentFlightPhase === FlightPhase.FLIGHT_PHASE_GOAROUND) {
            if (confirmAppr) {
                bottomRowLabels[0] = "\xa0CONFIRM[color]amber";
                bottomRowCells[0] = "*APPR PHASE[color]amber";
                mcdu.leftInputDelay[5] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[5] = async () => {
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
            ["", "", "FLP RETR"],
            ["", "", "F=" + flpRetrCell + "[color]green"],
            ["", "", "SLT RETR"],
            ["", "", "S=" + sltRetrCell + "[color]green"],
            ["", "", "CLEAN"],
            ["", "", "0=" + cleanCell + "[color]green"],
            [""],
            [""],
            ["THR RED/ACC", "ENG OUT ACC"],
            [thrRedAcc + "[color]cyan", engOut + "[color]cyan]"],
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
            ? destination.altitudeinFP + 800
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
