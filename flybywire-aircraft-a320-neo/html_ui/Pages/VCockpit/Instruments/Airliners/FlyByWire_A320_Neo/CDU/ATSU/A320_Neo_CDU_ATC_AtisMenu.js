class CDUAtcAtisMenu {
    static CreateLineData(mcdu, icao, type, requested) {
        const reports = mcdu.atsuManager.atc.atisReports(icao);

        let prefix = "\xa0";
        let middle = "";
        if (reports.length !== 0) {
            middle = `\xa0\xa0${reports[0].Information} ${reports[0].Timestamp.dcduTimestamp()}`;
            middle = middle.substring(0, middle.length - 1);
            prefix = "<";
        }

        const left = `${prefix}${icao}/${type}[color]cyan`;
        let right = "SEND*";
        if (requested) {
            right = "SEND\xa0";
        }

        return [left, middle, right];
    }

    static RequestAtis(mcdu, airports, idx) {
        if (airports[idx].icao !== "" && !airports[idx].req) {
            airports[idx].req = true;

            mcdu.atsuManager.atc.receiveAtis(airports[idx].icao).then((code) => {
                if (code !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(code);
                }

                airports[idx].req = false;
                if (mcdu.page.Current === mcdu.page.ATCAtis) {
                    CDUAtcAtisMenu.ShowPage(mcdu, airports);
                }
            });

            CDUAtcAtisMenu.ShowPage(mcdu, airports);
        }
    }

    static ShowPage(mcdu, airports = [{ icao: "", req: false }, { icao: "", req: false }, { icao: "", req: false }]) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCAtis;

        let depAtis = ["\xa0[  ]/[ ][color]cyan", "", "SEND\xa0"];
        let arrAtis = ["\xa0[  ]/[ ][color]cyan", "", "SEND\xa0"];
        let altAtis = ["\xa0[  ]/[ ][color]inop", "", "SEND\xa0"];

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
            depAtis = CDUAtcAtisMenu.CreateLineData(mcdu, mcdu.flightPlanManager.getOrigin().ident, "DEP", airports[0].req);
            airports[0].icao = mcdu.flightPlanManager.getOrigin().ident;
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            arrAtis = CDUAtcAtisMenu.CreateLineData(mcdu, mcdu.flightPlanManager.getDestination().ident, "ARR", airports[1].req);
            airports[1].icao = mcdu.flightPlanManager.getDestination().ident;
        }
        if (mcdu.altDestination && mcdu.altDestination.ident) {
            altAtis = CDUAtcAtisMenu.CreateLineData(mcdu, mcdu.altDestination.ident, "ARR", airports[2].req);
            airports[2].icao = mcdu.altDestination.ident;
        }

        let printTitle = "PRINT:MANUAL\xa0";
        let printButton = "SET AUTO*";
        if (mcdu.atsuManager.atc.printAtisReportsPrint()) {
            printTitle = "PRINT:AUTO\xa0";
            printButton = "SET MANUAL*";
        }

        mcdu.setTemplate([
            ["ATIS MENU"],
            ["\xa0ARPT/TYPE[color]white", "REQ\xa0[color]cyan"],
            [depAtis[0], `${depAtis[2]}[color]cyan`, `{small}${depAtis[1]}{end}[color]white`],
            ["", "REQ\xa0[color]cyan"],
            [arrAtis[0], `${arrAtis[2]}[color]cyan`, `{small}${arrAtis[1]}{end}[color]white`],
            ["", "REQ\xa0[color]cyan"],
            [altAtis[0], `${altAtis[2]}[color]cyan`, `{small}${altAtis[1]}{end}[color]white`],
            [""],
            [""],
            ["", "AUTO\xa0"],
            ["", "UPDATE>"],
            ["\xa0ATC MENU", printTitle],
            ["<RETURN", printButton]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (airports[0].icao !== "") {
                const reports = mcdu.atsuManager.atc.atisReports(airports[0].icao);
                if (reports.length !== 0) {
                    CDUAtcReportAtis.ShowPage(mcdu, `${airports[0].icao}/DEP`, reports, 0);
                }
            }
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (airports.icao[1] !== "") {
                const reports = mcdu.atsuManager.atc.atisReports(airports[1].icao);
                if (reports.length !== 0) {
                    CDUAtcReportAtis.ShowPage(mcdu, `${airports[1].icao}/ARR`, reports, 0);
                }
            }
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            if (airports[2].icao !== "") {
                const reports = mcdu.atsuManager.atc.atisReports(airports[2].icao);
                if (reports.length !== 0) {
                    CDUAtcReportAtis.ShowPage(mcdu, `${airports[2].icao}/ARR`, reports, 0);
                }
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDUAtcAtisMenu.RequestAtis(mcdu, airports, 0);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            CDUAtcAtisMenu.RequestAtis(mcdu, airports, 1);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            CDUAtcAtisMenu.RequestAtis(mcdu, airports, 2);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            CDUAtcAtisAutoUpdate.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            mcdu.atsuManager.atc.togglePrintAtisReports();
            CDUAtcAtisMenu.ShowPage(mcdu, airports);
        };
    }
}
