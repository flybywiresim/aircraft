class CDUAtcAtisMenu {
    static CreateDataBlock(mcdu) {
        const airports = [
            { icao: "", type: Atsu.AtisType.Departure, requested: false, autoupdate: false },
            { icao: "", type: Atsu.AtisType.Arrival, requested: false, autoupdate: false },
            { icao: "", type: Atsu.AtisType.Arrival, requested: false, autoupdate: false },
            { icao: "", type: Atsu.AtisType.Arrival, requested: false, autoupdate: false }
        ];

        if (mcdu.flightPlanManager.getPersistentOrigin() && mcdu.flightPlanManager.getPersistentOrigin().ident) {
            airports[0].icao = mcdu.flightPlanManager.getPersistentOrigin().ident;
            airports[0].autoupdate = mcdu.atsu.atc.atisAutoUpdateActive(airports[0].icao);
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            airports[1].icao = mcdu.flightPlanManager.getDestination().ident;
            airports[1].autoupdate = mcdu.atsu.atc.atisAutoUpdateActive(airports[1].icao);
        }
        if (mcdu.altDestination && mcdu.altDestination.ident) {
            airports[2].icao = mcdu.altDestination.ident;
            airports[2].autoupdate = mcdu.atsu.atc.atisAutoUpdateActive(airports[2].icao);
        }

        return airports;
    }

    static InterpretLSK(mcdu, value, airports, idx) {
        if (!value) {
            const reports = mcdu.atsu.atc.atisReports(airports[idx].icao);
            if (reports.length !== 0) {
                CDUAtcReportAtis.ShowPage(mcdu, `${airports[idx].icao}/${airports[idx].type === Atsu.AtisType.Departure ? "DEP" : "ARR"}`, reports, 0);
            }
        } else if (value === FMCMainDisplay.clrValue) {
            airports[idx].icao = "";
            airports[idx].requested = false;
            airports[idx].autoupdate = false;
            CDUAtcAtisMenu.ShowPage(mcdu, airports);
        } else {
            // validate the generic format and if the airport is described by four characters
            const entries = value.split("/");
            if (entries.length !== 2 || !/^[A-Z0-9]{4}$/.test(entries[0])) {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                return;
            }

            // validate the ATIS type
            let type = null;
            if (entries[1] === "ARR" || entries[1] === "AR" || entries[1] === "A") {
                type = Atsu.AtisType.Arrival;
            } else if (entries[1] === "DEP" || entries[1] === "DDE" || entries[1] === "D") {
                type = Atsu.AtisType.Departure;
            }
            if (type === null) {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                return;
            }

            // check that this is setup is not already set
            const currentIndex = airports.findIndex((elem) => elem.icao === entries[0] && elem.type === type);
            if (currentIndex !== -1 && idx !== currentIndex) {
                mcdu.setScratchpadMessage(NXSystemMessages.arptTypeAlreadyInUse);
                return;
            }

            // validate the airport
            mcdu.dataManager.GetAirportByIdent(entries[0]).then((airport) => {
                if (airport) {
                    airports[idx].autoupdate = mcdu.atsu.atc.atisAutoUpdateActive(entries[0]);
                    airports[idx].icao = entries[0];
                    airports[idx].type = type;
                    CDUAtcAtisMenu.ShowPage(mcdu, airports);
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                }
            });
        }
    }

    static InterpretRSK(mcdu, airports, idx) {
        if (airports[idx].icao === "") {
            return;
        }

        if (airports[idx].autoupdate) {
            const reports = mcdu.atsu.atc.atisReports(airports[idx].icao);
            if (reports.length !== 0) {
                CDUAtcAtisAutoUpdate.ToggleAutoUpdate(mcdu, airports[idx].icao);
                airports[0].autoupdate = false;
                CDUAtcAtisMenu.ShowPage(mcdu, airports);
            } else if (!airports[idx].requested) {
                CDUAtcAtisMenu.RequestAtis(mcdu, airports, idx);
            }
        } else if (!airports[idx].requested) {
            CDUAtcAtisMenu.RequestAtis(mcdu, airports, idx);
        }
    }

    static CreateLineData(mcdu, airport) {
        if (airport.icao !== "") {
            const reports = mcdu.atsu.atc.atisReports(airport.icao);

            let prefix = "\xa0";
            let middle = "";
            if (reports.length !== 0) {
                middle = `\xa0\xa0${reports[0].Information} ${reports[0].Timestamp.dcduTimestamp()}`;
                middle = middle.substring(0, middle.length - 1);
                prefix = "{white}<{end}";
            }

            let suffix = "\xa0";
            if (!airport.requested) {
                suffix = "*";
            }

            let right = "SEND*";
            let rightTitle = "REQ\xa0";
            const left = `{cyan}${prefix}${airport.icao}/${airport.type === Atsu.AtisType.Arrival ? "ARR" : "DEP"}{end}`;

            if (airport.autoupdate) {
                rightTitle = "UPDATE\xa0";
                if (reports.length !== 0) {
                    right = "CANCEL*";
                } else {
                    right = `SEND${suffix}`;
                }
            } else {
                right = `SEND${suffix}`;
            }

            return [left, middle, rightTitle, right];
        } else {
            return ["{cyan}\xa0[  ]/[ ]{end}", "", "REQ\xa0", "SEND\xa0"];
        }
    }

    static RequestAtis(mcdu, airports, idx) {
        if (airports[idx].icao !== "" && !airports[idx].requested) {
            airports[idx].requested = true;

            mcdu.atsu.atc.receiveAtis(airports[idx].icao, airports[idx].type).then((code) => {
                if (code !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(code);
                }

                airports[idx].requested = false;
                if (mcdu.page.Current === mcdu.page.ATCAtis) {
                    CDUAtcAtisMenu.ShowPage(mcdu, airports);
                }
            });

            CDUAtcAtisMenu.ShowPage(mcdu, airports);
        }
    }

    static ShowPage(mcdu, airports = CDUAtcAtisMenu.CreateDataBlock(mcdu)) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCAtis;

        const lines = [
            CDUAtcAtisMenu.CreateLineData(mcdu, airports[0]),
            CDUAtcAtisMenu.CreateLineData(mcdu, airports[1]),
            CDUAtcAtisMenu.CreateLineData(mcdu, airports[2]),
            CDUAtcAtisMenu.CreateLineData(mcdu, airports[3])
        ];

        let printTitle = "PRINT:MANUAL\xa0";
        let printButton = "SET AUTO*";
        if (mcdu.atsu.atc.printAtisReportsPrint()) {
            printTitle = "PRINT:AUTO\xa0";
            printButton = "SET MANUAL*";
        }

        mcdu.setTemplate([
            ["ATIS MENU"],
            ["\xa0ARPT/TYPE", `{cyan}${lines[0][2]}{end}`],
            [lines[0][0], `{cyan}${lines[0][3]}{end}`, `{small}${lines[0][1]}{end}`],
            ["", `{cyan}${lines[1][2]}{end}`],
            [lines[1][0], `{cyan}${lines[1][3]}{end}`, `{small}${lines[1][1]}{end}`],
            ["", `{cyan}${lines[2][2]}{end}`],
            [lines[2][0], `{cyan}${lines[2][3]}{end}`, `{small}${lines[2][1]}{end}`],
            ["", `{cyan}${lines[3][2]}{end}`],
            [lines[3][0], `{cyan}${lines[3][3]}{end}`, `{small}${lines[3][1]}{end}`],
            ["", "AUTO\xa0"],
            ["", "UPDATE>"],
            ["\xa0ATC MENU", printTitle],
            ["<RETURN", printButton]
        ]);

        for (let i = 0; i < 4; ++i) {
            mcdu.leftInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[i] = (value) => {
                CDUAtcAtisMenu.InterpretLSK(mcdu, value, airports, i);
            };
        }

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        for (let i = 0; i < 4; ++i) {
            mcdu.rightInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[i] = () => {
                CDUAtcAtisMenu.InterpretRSK(mcdu, airports, i);
            };
        }

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
            mcdu.atsu.atc.togglePrintAtisReports();
            CDUAtcAtisMenu.ShowPage(mcdu, airports);
        };
    }
}
