// Copyright (c) 2020, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// TODO this whole thing is thales layout...

class CDUDirectToPage {
    static ShowPage(mcdu, directWaypoint, wptsListIndex = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.DirectToPage;
        mcdu.returnPageCallback = () => {
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
        };

        mcdu.activeSystem = 'FMGC';

        let directWaypointCell = "";
        if (directWaypoint) {
            directWaypointCell = directWaypoint.ident;
        } else if (mcdu.flightPlanService.hasTemporary) {
            mcdu.eraseTemporaryFlightPlan(() => {
                CDUDirectToPage.ShowPage(mcdu);
            });
            return;
        }

        const waypointsCell = ["", "", "", "", ""];
        let iMax = 5;
        let eraseLabel = "";
        let eraseLine = "";
        let insertLabel = "";
        let insertLine = "";
        if (mcdu.flightPlanService.hasTemporary) {
            iMax--;
            eraseLabel = "\xa0DIR TO[color]amber";
            eraseLine = "{ERASE[color]amber";
            insertLabel = "TMPY\xa0[color]amber";
            insertLine = "DIRECT*[color]amber";
            mcdu.onLeftInput[5] = () => {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUDirectToPage.ShowPage(mcdu);
                });
            };
            mcdu.onRightInput[5] = () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    SimVar.SetSimVarValue("K:A32NX.FMGC_DIR_TO_TRIGGER", "number", 0);
                    CDUFlightPlanPage.ShowPage(mcdu);
                });
            };
        }

        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUDirectToPage.ShowPage(mcdu, undefined, wptsListIndex);
                });
                return;
            }

            mcdu.getOrSelectWaypointByIdent(value, (w) => {
                if (w) {
                    mcdu.eraseTemporaryFlightPlan(() => {
                        // FIXME fm pos
                        const ppos = {
                            lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'Degrees'),
                            long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'Degrees'),
                        };

                        // FIXME fm track
                        const trueTrack = SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_1_TRUE_TRACK', 'Number');
                        const trueTrackWord = new Arinc429Word(trueTrack);

                        if (trueTrackWord.isNormalOperation()) {
                            mcdu.flightPlanService.directTo(ppos, trueTrackWord.value, w);
                        }

                        CDUDirectToPage.ShowPage(mcdu, w, wptsListIndex);
                    });
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                }
            });
        };

        mcdu.onRightInput[2] = () => {
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        };
        mcdu.onRightInput[3] = () => {
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        };
        mcdu.onRightInput[4] = () => {
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        };

        const plan = mcdu.flightPlanService.active;

        let i = 0;
        let cellIter = 0;
        wptsListIndex = Math.max(wptsListIndex, mcdu.flightPlanService.active.activeLegIndex);

        const totalWaypointsCount = plan.legCount;

        while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount && cellIter < iMax) {
            if (plan.elementAt(i + wptsListIndex).isDiscontinuity) {
                i++;
                continue;
            }

            const leg = plan.legElementAt(i + wptsListIndex);

            if (leg) {
                if (!leg.isXF()) {
                    i++;
                    continue;
                }

                waypointsCell[cellIter] = "{" + leg.ident + "[color]cyan";
                if (waypointsCell[cellIter]) {
                    mcdu.onLeftInput[cellIter + 1] = () => {
                        mcdu.eraseTemporaryFlightPlan(() => {
                            // FIXME fm pos
                            const ppos = {
                                lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'Degrees'),
                                long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'Degrees'),
                            };

                            // FIXME fm track
                            const trueTrack = SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_1_TRUE_TRACK', 'Number');
                            const trueTrackWord = new Arinc429Word(trueTrack);

                            if (trueTrackWord.isNormalOperation()) {
                                mcdu.flightPlanService.directTo(ppos, trueTrackWord.value, leg.terminationWaypoint());
                            }

                            CDUDirectToPage.ShowPage(mcdu, leg.terminationWaypoint(), wptsListIndex);
                        });
                    };
                }
            } else {
                waypointsCell[cellIter] = "----";
            }
            i++;
            cellIter++;
        }
        if (cellIter < iMax) {
            waypointsCell[cellIter] = "--END--";
        }
        let up = false;
        let down = false;
        if (wptsListIndex < totalWaypointsCount - 5) {
            mcdu.onUp = () => {
                wptsListIndex++;
                CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
            };
            up = true;
        }
        if (wptsListIndex > 0) {
            mcdu.onDown = () => {
                wptsListIndex--;
                CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
            };
            down = true;
        }
        mcdu.setArrows(up, down, false ,false);
        mcdu.setTemplate([
            ["DIR TO"],
            ["\xa0WAYPOINT", "DIST\xa0", "UTC"],
            ["*[" + (directWaypointCell ? directWaypointCell : "\xa0\xa0\xa0\xa0\xa0") + "][color]cyan", "---", "----"],
            ["\xa0F-PLN WPTS"],
            [waypointsCell[0], "DIRECT TO[color]cyan"],
            ["", "WITH\xa0"],
            [waypointsCell[1], "ABEAM PTS[color]cyan"],
            ["", "RADIAL IN\xa0"],
            [waypointsCell[2], "[ ]°[color]cyan"],
            ["", "RADIAL OUT\xa0"],
            [waypointsCell[3], "[ ]°[color]cyan"],
            [eraseLabel, insertLabel],
            [eraseLine ? eraseLine : waypointsCell[4], insertLine]
        ]);
    }
}
