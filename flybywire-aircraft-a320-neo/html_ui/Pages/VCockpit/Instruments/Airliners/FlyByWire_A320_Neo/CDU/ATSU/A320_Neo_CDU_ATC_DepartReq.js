class CDUAtcDepartReq {
    static CreateDataBlock() {
        return {
            firstCall: true,
            callsign: "",
            station: "",
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
        retval.Atis = store.atis;
        retval.Gate = store.gate;
        retval.Freetext = store.freetext.filter((n) => n);
        retval.Station = store.station;

        return retval;
    }

    static ShowPage1(mcdu, store = CDUAtcDepartReq.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCDepartReq;

        if (store.firstCall && store.callsign === "") {
            if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") && SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC").length !== 0) {
                store.callsign = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC");
            }
        }
        if (store.firstCall && store.from === "") {
            if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getOrigin().ident) {
                store.from = mcdu.flightPlanManager.getOrigin().ident;
                store.to = mcdu.flightPlanManager.getDestination().ident;
            }
        }
        store.firstCall = false;

        let flightNo = "--------[color]white";
        let fromTo = "____/____[color]amber";
        const atis = new CDU_SingleValueField(mcdu,
            "string",
            store.atis,
            {
                clearable: true,
                emptyValue: "_[color]amber",
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
                emptyValue: "[\xa0\xa0\xa0\xa0][color]cyan",
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
                emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                store.freetext[0] = value;
                CDUAtcDepartReq.ShowPage1(mcdu, store);
            }
        );

        if (store.callsign) {
            flightNo = `${store.callsign}[color]green`;
        }
        if (store.from !== "" && store.to !== "") {
            fromTo = `${store.from}/${store.to}[color]cyan`;

            const atisReports = mcdu.atsuManager.atc.atisReports(store.from);
            if (atisReports.length !== 0 && atisReports[0].Information !== "") {
                store.atis = atisReports[0].Information;
                atis.setValue(mcdu.dclMessage.Atis);
            }
        }

        let station = "____[color]amber";
        if (store.station !== "") {
            station = `${store.station}[color]cyan`;
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "REQ DISPL\xa0[color]cyan";
        if (CDUAtcDepartReq.CanSendData(store)) {
            reqDisplButton = "REQ DISPL*[color]cyan";
        }

        mcdu.setTemplate([
            ["DEPART REQ"],
            ["\xa0ATC FLT NBR", "A/C TYPE\xa0"],
            [flightNo, "A20N[color]cyan"],
            ["\xa0FROM/TO", "STATION\xa0"],
            [fromTo, station],
            ["\xa0GATE", "ATIS CODE\xa0"],
            [gate, atis],
            ["------FREE TEXT---------"],
            [freetext],
            ["", "MORE\xa0"],
            ["", "FREE TEXT>[color]white"],
            ["\xa0ATC MENU", "ATC DEPART\xa0[color]cyan"],
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
                    mcdu.addNewMessage(NXSystemMessages.formatError);
                } else {
                    mcdu.dataManager.GetAirportByIdent(airports[0]).then((airport) => {
                        if (airport) {
                            mcdu.dataManager.GetAirportByIdent(airports[1]).then((airport) => {
                                if (airport) {
                                    store.from = airports[0];
                                    store.to = airports[1];
                                    CDUAtcDepartReq.ShowPage1(mcdu, store);
                                } else {
                                    mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                                }
                            });
                        } else {
                            mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                        }
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
            CDUAtcMenu.ShowPage2(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = async (value) => {
            if (mcdu.atsuManager.atc.currentStation() === "") {
                if (value === FMCMainDisplay.clrValue) {
                    store.station = "";
                } else if (/^[A-Z0-9]{4}$/.test(value)) {
                    mcdu.atsuManager.isRemoteStationAvailable(value).then((code) => {
                        if (code !== Atsu.AtsuStatusCodes.Ok) {
                            mcdu.addNewAtsuMessage(code);
                        } else {
                            store.station = value;
                        }

                        if (mcdu.page.Current === mcdu.page.ATCDepartReq) {
                            CDUAtcDepartReq.ShowPage1(mcdu, store);
                        }
                    });
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcDepartReq.CanSendData(store)) {
                mcdu.atsuManager.registerMessage(CDUAtcDepartReq.CreateMessage(store));
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
                    emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
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

        // define the template
        mcdu.setTemplate(addionalLineTemplate);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcDepartReq.ShowPage1(mcdu);
        };
    }
}
