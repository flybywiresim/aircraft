class CDUAtcDepartReq {
    static CreateDataBlock() {
        return {
            firstCall: true,
            callsign: "",
            station: "",
            stationManual: false,
            from: "",
            to: "",
            atis: "",
            gate: "",
            freetext: [ "", "", "", "", "", "" ]
        };
    }

    static CanSendData(store) {
        return store.callsign !== "" && store.station !== "" && store.from !== "" && store.to !== "" && store.atis !== "";
    }

    static CreateMessage(store) {
        const retval = new Atsu.DclMessage();

        retval.Callsign = store.callsign;
        retval.Origin = store.from;
        retval.Destination = store.to;
        retval.AcType = "A20N";
        retval.Atis = store.atis;
        retval.Gate = store.gate;
        retval.Freetext = store.freetext.filter((n) => n);
        retval.Station = store.station;

        return retval;
    }

    static ShowPage1(mcdu, store = CDUAtcDepartReq.CreateDataBlock()) {
        mcdu.clearDisplay();

        if (store.firstCall && store.callsign === "") {
            if (mcdu.atsu.flightNumber().length !== 0) {
                store.callsign = mcdu.atsu.flightNumber();
            }
        }
        if (store.firstCall && store.from === "") {
            if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
                store.from = mcdu.flightPlanManager.getOrigin().ident;
            }
        }
        if (store.firstCall && store.to === "") {
            if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                store.to = mcdu.flightPlanManager.getDestination().ident;
            }
        }
        if (store.firstCall && store.station === "") {
            if (mcdu.atsu.atc.currentStation() !== "") {
                store.station = mcdu.atsu.atc.currentStation();
            }
        }
        store.firstCall = false;

        let flightNo = "--------";
        let fromTo = "{amber}____/____{end}";
        const atis = new CDU_SingleValueField(mcdu,
            "string",
            store.atis,
            {
                clearable: true,
                emptyValue: "{amber}_{end}",
                suffix: "[color]cyan",
                maxLength: 1,
                isValid: ((value) => {
                    return /^[A-Z()]*$/.test(value) === true;
                })
            },
            (value) => {
                store.atis = value;
                CDUAtcDepartReq.ShowPage1(mcdu, store);
            }
        );
        const gate = new CDU_SingleValueField(mcdu,
            "string",
            store.gate,
            {
                clearable: true,
                emptyValue: "{cyan}[\xa0\xa0\xa0\xa0]{end}",
                suffix: "[color]cyan",
                maxLength: 4
            },
            (value) => {
                store.gate = value;
                CDUAtcDepartReq.ShowPage1(mcdu, store);
            }
        );
        const freetext = new CDU_SingleValueField(mcdu,
            "string",
            store.freetext[0],
            {
                clearable: store.freetext[0].length !== 0,
                emptyValue: "{cyan}[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0]{end}",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                store.freetext[0] = value;
                CDUAtcDepartReq.ShowPage1(mcdu, store);
            }
        );

        if (store.callsign) {
            flightNo = `{green}${store.callsign}{end}`;
        }
        if (store.from !== "" && store.to !== "") {
            fromTo = `{cyan}${store.from}/${store.to}{end}`;

            const atisReports = mcdu.atsu.atc.atisReports(store.from);
            if (atisReports.length !== 0 && atisReports[0].Information !== "") {
                store.atis = atisReports[0].Information;
                atis.setValue(store.atis);
            }
        }

        let station = "{amber}____{end}";
        if (store.station !== "") {
            station = `{cyan}${store.station}{end}`;
            if (!store.stationManual) {
                station = `{small}${station}{end}`;
            }
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "{cyan}DCDU\xa0{end}";
        if (CDUAtcDepartReq.CanSendData(store)) {
            reqDisplButton = "{cyan}DCDU*{end}";
        }

        mcdu.setTemplate([
            ["DEPART REQ"],
            ["\xa0ATC FLT NBR", "A/C TYPE\xa0"],
            [flightNo, "{cyan}A20N{end}"],
            ["\xa0FROM/TO", "STATION\xa0"],
            [fromTo, station],
            ["\xa0GATE", "ATIS CODE\xa0"],
            [gate, atis],
            ["-------FREE TEXT--------"],
            [freetext],
            ["", "MORE\xa0"],
            ["", "FREE TEXT>"],
            ["\xa0GROUND REQ", "{cyan}XFR TO\xa0{end}"],
            ["<RETURN", reqDisplButton]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store.from = "";
                store.to = "";
                CDUAtcDepartReq.ShowPage1(mcdu, store);
            } else if (value) {
                const airports = value.split("/");
                if (airports.length !== 2 || !/^[A-Z0-9]{4}$/.test(airports[0]) || !/^[A-Z0-9]{4}$/.test(airports[1])) {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                } else {
                    mcdu.dataManager.GetAirportByIdent(airports[0]).then((from) => {
                        mcdu.dataManager.GetAirportByIdent(airports[1]).then((to) => {
                            if (from.ident && to.ident) {
                                store.from = from.ident;
                                store.to = to.ident;
                                CDUAtcDepartReq.ShowPage1(mcdu, store);
                            } else {
                                mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                            }
                        });
                    });
                }
            }
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            CDUAtcDepartReq.ShowPage2(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcClearanceReq.ShowPage(mcdu, "GROUND");
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = async (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store.station = "";
            } else if (/^[A-Z0-9]{4}$/.test(value)) {
                mcdu.atsu.isRemoteStationAvailable(value).then((code) => {
                    if (code !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(code);
                    } else {
                        store.station = value;
                        store.stationManual = true;
                    }

                    if (mcdu.page.Current === mcdu.page.ATCDepartReq) {
                        CDUAtcDepartReq.ShowPage1(mcdu, store);
                    }
                });
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcDepartReq.CanSendData(store)) {
                mcdu.atsu.registerMessages([CDUAtcDepartReq.CreateMessage(store)]);
                CDUAtcDepartReq.ShowPage1(mcdu);
            }
        };
    }

    static ShowPage2(mcdu, store) {
        mcdu.clearDisplay();

        const freetextLines = [];
        for (let i = 0; i < 5; ++i) {
            freetextLines.push(new CDU_SingleValueField(mcdu,
                "string",
                store.freetext[i + 1],
                {
                    clearable: store.freetext[i + 1].length !== 0,
                    emptyValue: "{cyan}[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0]{end}",
                    suffix: "[color]white",
                    maxLength: 22
                },
                (value) => {
                    store.freetext[i + 1] = value;
                    CDUAtcDepartReq.ShowPage2(mcdu, store);
                }
            ));
        }

        // define the template
        mcdu.setTemplate([
            ["FREE TEXT"],
            [""],
            [freetextLines[0]],
            [""],
            [freetextLines[1]],
            [""],
            [freetextLines[2]],
            [""],
            [freetextLines[3]],
            [""],
            [freetextLines[4]],
            ["\xa0DEPART REQ"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcDepartReq.ShowPage1(mcdu);
        };
    }
}
