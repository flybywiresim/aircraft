class CDUAocDepartReq {
    static CreateDataBlock() {
        return {
            station: '',
            atis: '',
            gate: '',
            freetext: [ '', '', '', '', '', '' ],
            sendStatus: ''
        };
    }

    static CreateMessage(mcdu, data) {
        const retval = new Atsu.PdcMessage();

        retval.Callsign = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC");
        retval.Origin = mcdu.flightPlanManager.getOrigin().ident;
        retval.Destination = mcdu.flightPlanManager.getDestination().ident;
        retval.Atis = data.atis;
        retval.Gate = data.gate;
        retval.Freetext = data.freetext.filter((n) => n);
        retval.Station = data.station;

        return retval;
    }

    static ShowPage1(mcdu, store = CDUAocDepartReq.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AOCDepartRequest;

        const flightNoValid = false;
        let flightNo = "______[color]amber";
        let fromToValid = false;
        let fromTo = "____|____[color]amber";
        let station = "____[color]amber";

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
                CDUAocDepartReq.ShowPage1(mcdu, store);
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
                CDUAocDepartReq.ShowPage1(mcdu, store);
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
                CDUAocDepartReq.ShowPage1(mcdu, store);
            }
        );

        if (mcdu.atsuManager.flightNumber().length !== 0 && mcdu.flightPlanManager.getOrigin() !== null) {
            store.station = mcdu.atsuManager.flightNumber();
            flightNo = mcdu.pdcMessage.Callsign + "[color]green";
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            fromTo = `${mcdu.flightPlanManager.getOrigin().ident}/${mcdu.flightPlanManager.getDestination().ident}[color]cyan`;
            fromToValid = true;
        }
        if (store.station !== "") {
            station = `${store.station}[color]cyan`;
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "SEND\xa0[color]cyan";
        if (flightNoValid && fromToValid && store.atis !== "" && store.station !== "" && (store.sendStatus === "" || store.sendStatus === "FAILED")) {
            reqDisplButton = "SEND*[color]cyan";
        }

        mcdu.setTemplate([
            ["DEPART REQ"],
            ["\xa0ATC FLT NBR", "A/C TYPE\xa0"],
            [flightNo, "A20N[color]cyan"],
            ["\xa0FROM/TO", "ATIS\xa0"],
            [fromTo, atis],
            ["\xa0GATE", "STATION\xa0"],
            [gate, station],
            ["---------FREE TEXT---------"],
            [freetext],
            ["", "MORE\xa0"],
            ["", "FREE TEXT>[color]white"],
            ["\xa0AOC MENU", `${store["sendStatus"]}\xa0`],
            ["<RETURN", reqDisplButton]
        ]);

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value.length !== 4 || /^[A-Z()]*$/.test(value) === false) {
                mcdu.addNewMessage(NXSystemMessages.formatError);
                CDUAocDepartReq.ShowPage1(mcdu, store);
            } else if (mcdu.atsuManager.flightNumber().length === 0) {
                mcdu.addNewMessage(NXFictionalMessages.fltNbrMissing);
                CDUAocDepartReq.ShowPage1(mcdu, store);
            } else {
                mcdu.atsuManager.isRemoteStationAvailable(value).then((code) => {
                    if (code !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(code);
                        store.station = "";
                    } else {
                        store.station = value;
                    }

                    if (mcdu.page.Current === mcdu.page.AOCDepartRequest) {
                        CDUAocDepartReq.ShowPage1(mcdu, store);
                    }
                });
            }
        };
        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            CDUAocDepartReq.ShowPage2(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (flightNoValid && fromToValid && store.atis !== "" && store.station !== "" && (store.sendStatus === "" || store.sendStatus === "FAILED")) {
                store.sendStatus = "SENDING";
                CDUAocDepartReq.ShowPage1(mcdu, store);

                // publish the message
                mcdu.atsuManager.sendMessage(CDUAocDepartReq.CreateMessage(mcdu, store)).then((code) => {
                    if (code === Atsu.AtsuStatusCodes.Ok) {
                        mcdu.pdcMessage = undefined;
                        store.sendStatus = "SENT";
                        CDUAocDepartReq.ShowPage1(mcdu, store);

                        setTimeout(() => {
                            if (mcdu.page.Current === mcdu.page.AOCDepartRequest) {
                                CDUAocDepartReq.ShowPage1(mcdu);
                            }
                        }, 5000);
                    } else {
                        mcdu.addNewAtsuMessage(code);
                        store.sendStatus = "FAILED";
                        CDUAocDepartReq.ShowPage1(mcdu, store);
                    }
                });
            };
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
                    CDUAocDepartReq.ShowPage2(mcdu, store);
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
            CDUAocDepartReq.ShowPage1(mcdu, store);
        };
    }
}
