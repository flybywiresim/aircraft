class CDUAocInit {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCInit;
        mcdu.activeSystem = 'ATSU';

        let fromTo = "----|----[color]white";
        let block = "---.-[color]white";
        let payload = "---.-[color]white";
        let estZfw = "---.-[color]white";
        let cruiseAltitude = "-----[color]white";
        let costIndex = "--[color]white";
        let fltNbr = '-----';

        if (mcdu.simbrief["originIcao"] && mcdu.simbrief["destinationIcao"]) {
            fromTo = `${mcdu.simbrief["originIcao"]}/${mcdu.simbrief["destinationIcao"]}[color]green`;
        }
        if (mcdu.simbrief["block"]) {
            block = `${(+mcdu.simbrief["block"] / 1000).toFixed(1)}[color]green`;
        }
        if (mcdu.simbrief["payload"]) {
            payload = `${(+mcdu.simbrief["payload"] / 1000).toFixed(1)}[color]green`;
        }
        if (mcdu.simbrief["estZfw"]) {
            estZfw = `${(+mcdu.simbrief["estZfw"] / 1000).toFixed(1)}[color]green`;
        }
        if (mcdu.simbrief["cruiseAltitude"]) {
            cruiseAltitude = `${mcdu.simbrief["cruiseAltitude"]}[color]green`;
        }
        if (mcdu.simbrief["costIndex"]) {
            costIndex = `${mcdu.simbrief["costIndex"]}[color]green`;
        }
        if (mcdu.simbrief["icao_airline"] || mcdu.simbrief["flight_number"]) {
            fltNbr = `${mcdu.simbrief.icao_airline}${mcdu.simbrief.flight_number}[color]green`;
        }

        const display = [
            ["AOC INIT DATA REQUEST"],
            ["", ""],
            ["", mcdu.simbrief.navlog.length ? "ROUTE>" : "ROUTE>[color]inop"],
            ["FLT NBR", "FROM/TO"],
            [fltNbr, fromTo],
            ["BLOCK", "CRZ FL"],
            [block, cruiseAltitude],
            ["PAYLOAD", "CI"],
            [payload, costIndex],
            ["ZFW", ""],
            [estZfw, ""],
            ["RETURN TO", mcdu.simbrief["sendStatus"]],
            ["<AOC MENU", "REQUEST*[color]blue"]
        ];
        mcdu.setTemplate(display);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDU_OPTIONS_SIMBRIEF.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            if (mcdu.simbrief.navlog.length) {
                CDUAocInitRoute.ShowPage(mcdu);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onRightInput[5] = () => {
            CDUAocInit.getSimbrief(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }

    static showStatus(mcdu, status) {
        mcdu.simbrief["sendStatus"] = status;

        if (mcdu.page.Current === mcdu.page.AOCInit) {
            CDUAocInit.ShowPage(mcdu);
        }
        setTimeout(() => {
            mcdu.simbrief["sendStatus"] = "";
            if (mcdu.page.Current === mcdu.page.AOCInit) {
                CDUAocInit.ShowPage(mcdu);
            }
        }, 3000);
    }

    static getSimbrief(mcdu) {
        const simbriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "");

        if (!simbriefUsername) {
            mcdu.showErrorMessage("NO SIMBRIEF USER");
            throw ("No simbrief username provided");
        }

        mcdu.simbrief["sendStatus"] = "REQUESTING";
        if (mcdu.page.Current === mcdu.page.AOCInit) {
            CDUAocInit.ShowPage(mcdu);
        }

        return fetch(`http://www.simbrief.com/api/xml.fetcher.php?username=${simbriefUsername}&json=1`)
            .then(response => response.json())
            .then(data => {
                mcdu.simbrief["route"] = data.general.route;
                mcdu.simbrief["cruiseAltitude"] = data.general.initial_altitude;
                mcdu.simbrief["originIcao"] = data.origin.icao_code;
                mcdu.simbrief["destinationIcao"] = data.destination.icao_code;
                mcdu.simbrief["block"] = data.fuel.plan_ramp;
                mcdu.simbrief["payload"] = data.weights.payload;
                mcdu.simbrief["estZfw"] = data.weights.est_zfw;
                mcdu.simbrief["costIndex"] = data.general.costindex;
                mcdu.simbrief["navlog"] = data.navlog.fix;
                mcdu.simbrief["icao_airline"] = typeof data.general.icao_airline === 'string' ? data.general.icao_airline : "";
                mcdu.simbrief["flight_number"] = data.general.flight_number;

                if (mcdu.page.Current === mcdu.page.AOCInit) {
                    CDUAocInit.ShowPage(mcdu);
                }
                CDUAocInit.showStatus(mcdu, "DONE");
            })
            .catch(_err => {
                console.log(_err.message);
                if (mcdu.page.Current === mcdu.page.AOCInit) {
                    CDUAocInit.showStatus(mcdu, "ERROR");
                }
            });
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
        const fltNbr = `${mcdu.simbrief.icao_airline}${mcdu.simbrief.flight_number}`;

        const uplinkInProg = "UPLINK INSERT IN PROG";
        const aocActFplnUplink = "AOC ACT F-PLN UPLINK";
        const perfDataUplink = "PERF DATA UPLINK";

        mcdu.showErrorMessage(uplinkInProg);

        /**
         * AOC ACT F-PLN UPLINK
         * TODO:
         * - ROUTE
         * - ALTN
         */
        mcdu.tryUpdateFromTo(fromTo, (result) => {
            if (result) {
                CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);
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

        setTimeout(async () => {
            await CDUAocInit.buildRouteFromNavlog(mcdu);
            mcdu.showErrorMessage(aocActFplnUplink);
        }, mcdu.getDelayRouteChange()); // Fake 10s delay for perf "calculations"

        /**
         * PERF DATA UPLINK
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
            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
        }, mcdu.getDelayHigh()); // Fake 3s delay for perf "calculations"
    }

    static addWaypointAsync(mcdu, routeIdent, wpIndex, via) {
        if (via) {
            return new Promise((res, rej) => {
                mcdu.insertWaypointsAlongAirway(routeIdent, wpIndex, via, (result) => {
                    console.log('result');
                    console.log(result);
                    if (result) {
                        console.log("Inserted waypoint : " + routeIdent + " via " + via);
                        res(true);
                    } else {
                        mcdu.showErrorMessage("AWY/WPT MISMATCH");
                        res(false);
                    }
                });
            });
        } else {
            return new Promise((res, rej) => {
                mcdu.getOrSelectWaypointByIdent(routeIdent, (waypoint) => {
                    if (!waypoint) {
                        mcdu.showErrorMessage("NOT IN DATABASE");
                        console.log('NOT IN DATABASE' + routeIdent);
                        res(false);
                    } else {
                        mcdu.flightPlanManager.addWaypoint(waypoint.icao, wpIndex, () => {
                            console.log("Inserted waypoint : " + routeIdent);
                            res(true);
                        });
                    }
                });
            });
        }
    }

    static async buildRouteFromNavlog(mcdu) {
        const {navlog, route} = mcdu.simbrief;

        const routeSplit = route.split(' ');
        const procedures = new Set(navlog.filter(fix => fix.is_sid_star === "1").map(fix => fix.via_airway));

        for (const [i, routeIdent] of routeSplit.entries()) {
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
                                console.log("Inserting waypoint : " + routeSplit[i + 1] + " via " + routeIdent + " | " + wpIndex);
                                await CDUAocInit.addWaypointAsync(mcdu, routeSplit[i + 1], wpIndex, routeIdent);

                                break;
                            }
                        } else {
                            const wpIndex = mcdu.flightPlanManager.getWaypointsCount() - 1;
                            console.log("Inserting waypoint : " + routeIdent + " | " + wpIndex);
                            await CDUAocInit.addWaypointAsync(mcdu, routeIdent, wpIndex);

                            break;
                        }
                    }
                }
            }
        }
    }
}
