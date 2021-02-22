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

class CDUProgressPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ProgressPage;
        mcdu.activeSystem = 'FMGC';
        const flightPhase = "CRZ";
        const flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
        const flMax = mcdu.getMaxFlCorrected();
        const flOpt = (mcdu._zeroFuelWeightZFWCGEntered && mcdu._blockFuelEntered && (mcdu.isAllEngineOn() || Simplane.getIsGrounded())) ? "FL" + (Math.floor(flMax / 5) * 5).toString() + "[color]green" : "-----";
        let flCrz = "-----";
        switch (Simplane.getCurrentFlightPhase()) {
            case FlightPhase.FLIGHT_PHASE_PREFLIGHT:
            case FlightPhase.FLIGHT_PHASE_TAXI:
            case FlightPhase.FLIGHT_PHASE_TAKEOFF: {
                if (mcdu._cruiseEntered) {
                    flCrz = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                }
                break;
            }
            case FlightPhase.FLIGHT_PHASE_CLIMB: {
                const alt = Math.round(Simplane.getAutoPilotSelectedAltitudeLockValue("feet") / 100);
                const altCtn = Math.round(mcdu.constraintAlt / 100);
                if (!mcdu._cruiseEntered) {
                    flCrz = "FL" + (altCtn && alt > altCtn ? altCtn.toFixed(0).padStart(3, "0") : alt.toFixed(0).padStart(3, "0")) + "[color]cyan";
                } else if (mcdu.cruiseFlightLevel < alt) {
                    mcdu.cruiseFlightLevel = alt;
                    flCrz = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                    const msg = NXSystemMessages.newCrzAlt;
                    msg.text = msg.text + mcdu.cruiseFlightLevel * 100;
                    mcdu.addNewMessage(msg);
                } else {
                    flCrz = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                }
                break;
            }
            case FlightPhase.FLIGHT_PHASE_CRUISE: {
                const fl = Math.round(Simplane.getAutoPilotSelectedAltitudeLockValue("feet") / 100);
                if (fl > mcdu.cruiseFlightLevel) {
                    mcdu.cruiseFlightLevel = fl;
                    const msg = NXSystemMessages.newCrzAlt;
                    msg.text = msg.text + mcdu.cruiseFlightLevel * 100;
                    mcdu.addNewMessage(msg);
                }
                flCrz = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                break;
            }
        }
        mcdu.onLeftInput[0] = (value) => {
            if (mcdu.trySetCruiseFlCheckInput(value)) {
                CDUProgressPage.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUProgressPage.ShowReportPage(mcdu);
        };
        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUProgressPage.ShowPredictiveGPSPage(mcdu);
        };
        mcdu.setTemplate([
            ["{green}ECON " + flightPhase + "{end} " + flightNo],
            ["\xa0" + flightPhase, "REC MAX\xa0", "OPT"],
            [flCrz, "FL" + flMax.toString() + "\xa0[color]magenta", flOpt],
            [""],
            ["<REPORT", ""],
            ["\xa0POSITION UPDATE AT"],
            ["{small}*{end}[\xa0\xa0\xa0\xa0][color]cyan"],
            ["\xa0\xa0BRG / DIST"],
            ["{small}\xa0---°/----.-{end}", "{small}TO{end} {cyan}[{sp}{sp}{sp}{sp}{sp}]{end}"],
            ["\xa0PREDICTIVE"],
            ["<GPS", "GPS PRIMARY[color]green"],
            ["REQUIRED", "ESTIMATED", "ACCUR{sp}"],
            ["{small}3.4NM{end}[color]cyan", "{small}0.07NM{end}[color]green", "HIGH[color]green"]
        ]);
        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.ProgressPage) {
                CDUProgressPage.ShowPage(mcdu);
            }
        }, mcdu.PageTimeout.Prog);
    }
    static ShowReportPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ProgressPageReport;
        let altCell = "---";
        if (isFinite(mcdu.cruiseFlightLevel)) {
            altCell = mcdu.cruiseFlightLevel.toFixed(0);
        }
        mcdu.onRightInput[0] = (value) => {
            if (mcdu.setCruiseFlightLevelAndTemperature(value)) {
                CDUProgressPage.ShowReportPage(mcdu);
            }
        };
        let toWaypoint;
        if (mcdu.routeIndex === mcdu.flightPlanManager.getWaypointsCount() - 1) {
            toWaypoint = mcdu.flightPlanManager.getDestination();
        } else {
            toWaypoint = mcdu.flightPlanManager.getWaypoint(mcdu.routeIndex);
        }
        let toWaypointCell = "";
        let toWaypointUTCCell = "---";
        const toWaypointAltCell = "----";
        let nextWaypointCell = "";
        let nextWaypointUTCCell = "----";
        const nextWaypointAltCell = "---";
        if (toWaypoint) {
            toWaypointCell = toWaypoint.ident;
            toWaypointUTCCell = FMCMainDisplay.secondsTohhmm(toWaypoint.infos.etaInFP);
            let nextWaypoint;
            if (mcdu.routeIndex + 1 === mcdu.flightPlanManager.getWaypointsCount()) {
                nextWaypoint = mcdu.flightPlanManager.getDestination();
            } else {
                nextWaypoint = mcdu.flightPlanManager.getWaypoint(mcdu.routeIndex + 1);
            }
            if (nextWaypoint) {
                nextWaypointCell = nextWaypoint.ident;
                nextWaypointUTCCell = FMCMainDisplay.secondsTohhmm(nextWaypoint.infos.etaInFP);
            }
        }
        let destCell = "";
        let destUTCCell = "---";
        let destDistCell = "----";
        if (mcdu.flightPlanManager.getDestination()) {
            console.log(mcdu.flightPlanManager.getDestination());
            destCell = mcdu.flightPlanManager.getDestination().ident;
            const destInfos = mcdu.flightPlanManager.getDestination().infos;
            if (destInfos instanceof AirportInfo) {
                const destApproach = destInfos.approaches[mcdu.flightPlanManager.getApproachIndex()];
                if (destApproach) {
                    destCell += destApproach.runway;
                }
            }
            destUTCCell = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().infos.etaInFP);
            destDistCell = mcdu.flightPlanManager.getDestination().infos.totalDistInFP.toFixed(0);
        }
        mcdu.setTemplate([
            ["REPORT"],
            ["\xa0OVHD", "ALT\xa0", "UTC"],
            ["", altCell + "[color]cyan"],
            ["\xa0TO"],
            [toWaypointCell + "[color]green", toWaypointAltCell + "[color]green", toWaypointUTCCell + "[color]green"],
            ["\xa0NEXT"],
            [nextWaypointCell + "[color]green", nextWaypointAltCell + "[color]green", nextWaypointUTCCell + "[color]green"],
            ["\xa0SAT", "FOB\xa0", "T. WIND"],
            ["[][color]cyan"],
            ["\xa0S/C", "", "UTC DIST"],
            [""],
            ["\xa0DEST", "EFOB", "UTC DIST"],
            [destCell, "", destUTCCell + " " + destDistCell]
        ]);
    }
    static ShowPredictiveGPSPage(mcdu, overrideDestETA = "") {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ProgressPagePredictiveGPS;
        let destIdentCell = "";
        let destETACell = "";
        if (mcdu.flightPlanManager.getDestination()) {
            destIdentCell = mcdu.flightPlanManager.getDestination().ident + "[color]green";
            if (overrideDestETA) {
                destETACell = overrideDestETA;
            } else {
                destETACell = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().infos.etaInFP);
            }
            mcdu.onRightInput[0] = (value) => {
                CDUProgressPage.ShowPredictiveGPSPage(mcdu, value);
            };
        }
        mcdu.setTemplate([
            ["PREDICTIVE GPS"],
            ["DEST", "ETA"],
            [destIdentCell, destETACell + "[color]cyan", "{small}PRIMARY{end}"],
            ["\xa0\xa0-15 -10 -5 ETA+5 +10 +15"],
            ["{small}\xa0\xa0\xa0\xa0Y\xa0\xa0Y\xa0\xa0\xa0Y\xa0\xa0Y\xa0\xa0Y\xa0\xa0\xa0Y\xa0\xa0Y{end}[color]green"],
            ["WPT", "ETA"],
            ["[ ][color]cyan", "", "{small}PRIMARY{end}"],
            ["\xa0\xa0-15 -10 -5 ETA+5 +10 +15"],
            [""],
            ["", "", "DESELECTED SATELLITES"],
            ["[ ][color]cyan"],
            [""],
            [""]
        ]);
    }
}
