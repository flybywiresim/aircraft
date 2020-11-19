/**
 * Value is rounded to 1000 and fixed to 1 decimal
 * @param {number | string} value
 */
function formatWeight(value) {
    return (+value / 1000).toFixed(1);
}

class CDUAocInit {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCInit;
        mcdu.activeSystem = 'ATSU';

        let fltNbr = '_______[color]red';
        let originIcao = '____[color]red';
        let destinationIcao = '____[color]red';
        let ete = "____[color]red";
        let fob = `{small}---.-{end}[color]white`;
        let requestButton = "INIT DATA REQ*[color]blue";

        const currentFob = formatWeight(mcdu.getFOB());

        function updateView() {
            if (mcdu.page.Current === mcdu.page.AOCInit) {
                CDUAocInit.ShowPage(mcdu);
            }
        }

        if (mcdu.simbrief.sendStatus !== "READY") {
            requestButton = "INIT DATA REQ[color]blue";
        }
        if (mcdu.simbrief.originIcao) {
            originIcao = `${mcdu.simbrief.originIcao}[color]blue`;
        }
        if (mcdu.simbrief.destinationIcao) {
            destinationIcao = `${mcdu.simbrief.destinationIcao}[color]blue`;
        }
        if (mcdu.simbrief.icao_airline || mcdu.simbrief.flight_number) {
            fltNbr = `${mcdu.simbrief.icao_airline}${mcdu.simbrief.flight_number}[color]green`;
        }
        if (mcdu.simbrief.ete) {
            ete = `${mcdu.simbrief.ete}[color]blue`;
        }
        if (currentFob) {
            fob = `{small}${currentFob}{end}[color]green`;
        }

        const display = [
            ["INIT/REVIEW", "1", "2", "AOC"],
            ["{big}FMC FLT NO{end}", "{big}GMT{end}"],
            [fltNbr, "2337[color]green"],
            ["{big}DEP{end}"],
            [originIcao],
            ["{big}DEST{end}"],
            [destinationIcao, "CREW DETAILS>"],
            ["{big}FOB{end}"],
            ["   " + fob],
            ["{big}ETE{end}"],
            [ete, requestButton],
            ["", "{big}ADVISORY{end} "],
            ["<AOC MENU"]
        ];
        mcdu.setTemplate(display);

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[4] = () => {
            getSimBriefOfp(mcdu, updateView);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.onNextPage = () => {
            CDUAocInit.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCInit2;
        mcdu.activeSystem = 'ATSU';

        const currentFob = formatWeight(mcdu.getFOB());

        function formatTime(timestamp) {
            var date = new Date(+timestamp * 1000);
            return `${date.getUTCHours().toString().padStart(2, "0")}${date.getUTCMinutes().toString().padEnd(2, "0")}`;
        }

        /**
            GMT: is the current zulu time
            FLT time: is wheels up to wheels down... so basically shows 0000 as soon as you are wheels up, counts up and then stops timing once you are weight on wheels again
            Out: is when you set the brakes to off...
            Doors: When the last door closes
            Off: remains blank until Take off time
            On: remains blank until Landing time
            In: remains blank until brakes set to park AND the first door opens
         */
        let fob = `{small}---.-{end}[color]white`;
        const gmtTime = `----[color]white`;
        const fltTime = `----[color]white`;
        let outTime = `----[color]white`;
        const doorsTime = `----[color]white`;
        let offTime = `----[color]white`;
        let onTime = `----[color]white`;
        const inTime = `----[color]white`;
        let blockTime = `----[color]white`;

        if (currentFob) {
            fob = `{small}${currentFob}{end}[color]green`;
        }
        if (mcdu.simbrief["outTime"]) {
            outTime = `${formatTime(mcdu.simbrief.outTime)}[color]green`;
        }
        if (mcdu.simbrief["offTime"]) {
            offTime = `${formatTime(mcdu.simbrief.offTime)}[color]green`;
        }
        if (mcdu.simbrief["onTime"]) {
            onTime = `${formatTime(mcdu.simbrief.onTime)}[color]green`;
        }
        if (mcdu.simbrief["inTime"]) {
            // In: remains blank until brakes set to park AND the first door opens
            // inTime = `${formatTime(mcdu.simbrief.inTime)}[color]green`;
        }
        if (mcdu.simbrief["blockTime"]) {
            blockTime = `${formatTime(mcdu.simbrief.blockTime)}[color]green`;
        }

        function updateView() {
            if (mcdu.page.Current !== mcdu.page.AOCInit2) {
                return;
            }
            const display = [
                ["INIT/REVIEW", "2", "2", "AOC"],
                [" {big}OUT{end}", "{big}OFF{end} ", "{big}DOORS{end}"],
                [outTime, offTime, doorsTime],
                [" {big}ON{end}", "{big}IN{end} ", "{big}GMT{end}"],
                [onTime, inTime, gmtTime],
                [" {big}BLK TIME{end}", "{big}FLT TIME{end} "],
                [blockTime, fltTime],
                [" {big}FUEL REM{end}", "{big}LDG PILOT{end} "],
                ["   " + fob, "-------"],
                ["", ""],
                ["*AUTOLAND <{small}n{end}>[color]blue"],
                ["", "{big}ADVISORY{end} "],
                ["<AOC MENU"]
            ];
            mcdu.setTemplate(display);
        }

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.onPrevPage = () => {
            CDUAocInit.ShowPage(mcdu);
        };

        updateView();
    }

    /**
     * There are two uplink requests that are made at the same time:
     * - AOC ACT F-PLN
     * - PERF DATA
     */
    static insertUplink(mcdu) {
        const fromTo = `${mcdu.simbrief["originIcao"]}/${mcdu.simbrief["destinationIcao"]}`;
        const cruiseAltitude = mcdu.simbrief["cruiseAltitude"];
        const costIndex = mcdu.simbrief["costIndex"];
        const alternateIcao = mcdu.simbrief["alternateIcao"];
        const avgTropopause = mcdu.simbrief["avgTropopause"];
        const fltNbr = `${mcdu.simbrief.icao_airline}${mcdu.simbrief.flight_number}`;

        const uplinkInProg = "UPLINK INSERT IN PROG";
        const aocActFplnUplink = "AOC ACT F-PLN UPLINK";
        const perfDataUplink = "PERF DATA UPLINK";

        mcdu.showErrorMessage(uplinkInProg);

        /**
         * AOC ACT F-PLN UPLINK
         * Updates:
         * - From/To
         * - Altn
         * - F-pln
         *
         * TODO:
         * - F-pln (almost done, needs error handling)
         */
        mcdu.tryUpdateFromTo(fromTo, async (result) => {
            if (result) {
                CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);

                await mcdu.tryUpdateAltDestination(alternateIcao);

                setTimeout(async () => {
                    await CDUAocInit.uplinkRoute(mcdu);
                    mcdu.showErrorMessage(aocActFplnUplink);
                }, mcdu.getDelayRouteChange());

                if (mcdu.page.Current === mcdu.page.InitPageA) {
                    CDUInitPage.ShowPage1(mcdu);
                }
            }
        });
        mcdu.updateFlightNo(fltNbr, (result) => {
            if (result) {
                if (mcdu.page.Current === mcdu.page.InitPageA) {
                    CDUInitPage.ShowPage1(mcdu);
                }
            }
        });

        /**
         * PERF DATA UPLINK
         * Updates:
         * - CRZ FL
         * - CI
         * - TROPO
         *
         * TODO:
         * - CRZ TEMP
         * - BLOCK
         * - ?
         */
        setTimeout(() => {
            if (mcdu.setCruiseFlightLevelAndTemperature(cruiseAltitude)) {
                mcdu.showErrorMessage(perfDataUplink);
            }
            if (mcdu.tryUpdateCostIndex(costIndex)) {
            }
            if (mcdu.tryUpdateTropo(avgTropopause)) {
            }
            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
        }, mcdu.getDelayHigh());
    }

    /**
     * TODO:
     * Sometimes the insertWaypointsAlongAirway fails with no aparent reason
     * It seems that it fails only on the first time you try
     */
    static addWaypointAsync(mcdu, routeIdent, wpIndex, via) {
        if (via) {
            return new Promise((res, rej) => {
                mcdu.insertWaypointsAlongAirway(routeIdent, wpIndex, via, (result) => {
                    if (result) {
                        console.log("Inserted waypoint: " + routeIdent + " via " + via);
                        res(true);
                    } else {
                        mcdu.showErrorMessage("AWY/WPT MISMATCH");
                        console.log('AWY/WPT MISMATCH ' + routeIdent + " via " + via);
                        res(false);
                    }
                });
            });
        } else {
            return new Promise((res, rej) => {
                mcdu.getOrSelectWaypointByIdent(routeIdent, (waypoint) => {
                    if (!waypoint) {
                        mcdu.showErrorMessage("NOT IN DATABASE");
                        console.log('NOT IN DATABASE ' + routeIdent);
                        res(false);
                    } else {
                        mcdu.flightPlanManager.addWaypoint(waypoint.icao, wpIndex, () => {
                            console.log("Inserted waypoint: " + routeIdent);
                            res(true);
                        });
                    }
                });
            });
        }
    }

    static uplinkRoute(mcdu) {
        const {navlog, route} = mcdu.simbrief;

        const routeSplit = route.split(' ');
        const procedures = new Set(navlog.filter(fix => fix.is_sid_star === "1").map(fix => fix.via_airway));

        async function asyncForEach(array, callback) {
            for (let index = 0; index < array.length; index++) {
                await callback(array[index], index, array);
            }
        }

        asyncForEach(routeSplit, async (routeIdent, i) => {
            console.log('----');
            console.log(routeIdent);
            for (const fix of navlog) {
                if (fix.is_sid_star === "0") {
                    if (!procedures.has(routeIdent)) {
                        if (routeIdent.match(/((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i) || routeIdent === "DCT") {
                            if (routeIdent === "DCT") {
                                console.log("Direct to waypoint found, skipping");
                                break;
                            } else {
                                const wpIndex = mcdu.flightPlanManager.getEnRouteWaypointsLastIndex() + 1;
                                console.log("Inserting waypoint: " + routeSplit[i + 1] + " via " + routeIdent + " | " + wpIndex);
                                await CDUAocInit.addWaypointAsync(mcdu, routeSplit[i + 1], wpIndex, routeIdent);

                                break;
                            }
                        } else {
                            const wpIndex = mcdu.flightPlanManager.getWaypointsCount() - 1;
                            console.log("Inserting waypoint: " + routeIdent + " | " + wpIndex);
                            await CDUAocInit.addWaypointAsync(mcdu, routeIdent, wpIndex);

                            break;
                        }
                    }
                }
            }
        });
    }
}
