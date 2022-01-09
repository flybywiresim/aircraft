class CDUAocDepartReq {
    static resetStation(mcdu) {
        console.log('RESET');
        mcdu.pdcMessage.Station = "";
        mcdu.scratchpad.setText("NO ACTIVE ATC");
        CDUAocDepartReq.ShowPage1(mcdu);
    }

    static errorStation(mcdu) {
        console.log('ERROR');
        mcdu.pdcMessage.Station = "";
        mcdu.scratchpad.setText("COM UNAVAILABLE");
        CDUAocDepartReq.ShowPage1(mcdu);
    }

    static ShowPage1(mcdu) {
        mcdu.clearDisplay();

        if (undefined === mcdu.pdcMessage) {
            mcdu.pdcMessage = new Atsu.PreDepartureClearance();
        }

        let flightNo = "______[color]amber";
        let fromTo = "____|____[color]amber";
        const atis = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.pdcMessage.Atis,
            {
                clearable: true,
                emptyValue: "_[color]amber",
                suffix: "[color]cyan",
                maxLength: 1,
                isValid: ((value) => {
                    return true === isNaN(value) && "+" !== value && "-" !== value && "/" !== value;
                })
            },
            (value) => {
                mcdu.pdcMessage.Atis = value;
                CDUAocDepartReq.ShowPage1(mcdu);
            }
        );
        const station = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.pdcMessage.Station,
            {
                clearable: true,
                emptyValue: "____[color]amber",
                suffix: "[color]cyan",
                length: 4,
                isValid: ((value) => {
                    if (value.length !== 4) {
                        return false;
                    }

                    return /^[A-Z()]*$/.test(value);
                })
            },
            (value) => {
                if (value.length === 4 && /^[A-Z()]*$/.test(value) === true) {
                    mcdu.atsuManager.getConnector().isStationAvailable(value, mcdu, CDUAocDepartReq.resetStation, CDUAocDepartReq.errorStation);
                    mcdu.pdcMessage.Station = value;
                }
                CDUAocDepartReq.ShowPage1(mcdu);
            }
        );
        const gate = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.pdcMessage.Gate,
            {
                clearable: true,
                emptyValue: "[\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]cyan",
                maxLength: 4
            },
            (value) => {
                mcdu.pdcMessage.Gate = value;
                CDUAocDepartReq.ShowPage1(mcdu);
            }
        );
        const freetext = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.pdcMessage.Freetext0,
            {
                clearable: 0 === mcdu.pdcMessage.Freetext1.length,
                emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                mcdu.pdcMessage.Freetext0 = value;
                CDUAocDepartReq.ShowPage1(mcdu);
            }
        );

        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            mcdu.pdcMessage.Callsign = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC");
            flightNo = mcdu.pdcMessage.Callsign + "[color]green";
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            mcdu.pdcMessage.Origin = mcdu.flightPlanManager.getOrigin().ident;
            mcdu.pdcMessage.Destination = mcdu.flightPlanManager.getDestination().ident;

            fromTo = mcdu.pdcMessage.Origin + "/" + mcdu.pdcMessage.Destination + "[color]cyan";
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "REQ DISPL\xa0[color]cyan";
        if (mcdu.pdcMessage.Callsign !== "" && mcdu.pdcMessage.Origin !== "" && mcdu.pdcMessage.Destination !== "" && mcdu.pdcMessage.Atis !== "" && mcdu.pdcMessage.Station !== "") {
            reqDisplButton = "REQ DISPL*[color]cyan";
        }

        mcdu.setTemplate([
            ["DEPART REQUEST"],
            ["ATC FLT NBR", "A/C TYPE"],
            [flightNo, "A20N[color]cyan"],
            ["FROM/TO", "ATIS"],
            [fromTo, atis],
            ["GATE", "STATION"],
            [gate, station],
            ["---------FREE TEXT---------"],
            [freetext],
            ["", "MORE\xa0"],
            ["", "FREE TEXT>[color]white"],
            ["\xa0AOC MENU", "AOC DEPART\xa0[color]cyan"],
            ["<RETURN", reqDisplButton]
        ]);

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = (value, scratchpadCallback) => {
            if (0 !== mcdu.pdcMessage.Freetext0.length) {
                CDUAocDepartReq.ShowPage2(mcdu);
            } else {
                mcdu.scratchpad.setText("ENTER MANDATORY FIELDS");
                scratchpadCallback();
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage2(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = (value, scratchpadCallback) => {
            if (mcdu.pdcMessage.Callsign === "" || mcdu.pdcMessage.Origin === "" || mcdu.pdcMessage.Destination === "" || mcdu.pdcMessage.Atis === "" || mcdu.pdcMessage.Station === "") {
                mcdu.scratchpad.setText("ENTER MANDATORY FIELDS");
                scratchpadCallback();
                return;
            }

            // publish the message
            const errorMsg = mcdu.atsuManager.registerPdcMessage(mcdu.pdcMessage);
            if (0 !== errorMsg.length) {
                mcdu.scratchpad.setText(errorMsg);
                scratchpadCallback();
                return;
            }
            mcdu.pdcMessage = undefined;

            CDUAocDepartReq.ShowPage1(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();

        const addionalLineTemplate = [
            ["FREE TEXT"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0DEPART REQUEST"],
            ["<RETURN"]
        ];

        // find the first empty line
        let firstEmptyLineIndex = -1;
        if (0 === mcdu.pdcMessage.Freetext5.length) {
            firstEmptyLineIndex = 4;
        }
        if (0 === mcdu.pdcMessage.Freetext4.length) {
            firstEmptyLineIndex = 3;
        }
        if (0 === mcdu.pdcMessage.Freetext3.length) {
            firstEmptyLineIndex = 2;
        }
        if (0 === mcdu.pdcMessage.Freetext2.length) {
            firstEmptyLineIndex = 1;
        }
        if (0 === mcdu.pdcMessage.Freetext1.length) {
            firstEmptyLineIndex = 0;
        }

        switch (firstEmptyLineIndex) {
            case -1:
            case 4:
                const line4 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.pdcMessage.Freetext5,
                    {
                        clearable: 0 !== mcdu.pdcMessage.Freetext5.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.pdcMessage.Freetext5 = value;
                        CDUAocDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[10] = [line4];
            case 3:
                const line3 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.pdcMessage.Freetext4,
                    {
                        clearable: 0 === mcdu.pdcMessage.Freetext5.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.pdcMessage.Freetext4 = value;
                        CDUAocDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[8] = [line3];
            case 2:
                const line2 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.pdcMessage.Freetext3,
                    {
                        clearable: 0 === mcdu.pdcMessage.Freetext4.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.pdcMessage.Freetext3 = value;
                        CDUAocDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[6] = [line2];
            case 1:
                const line1 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.pdcMessage.Freetext2,
                    {
                        clearable: 0 === mcdu.pdcMessage.Freetext3.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.pdcMessage.Freetext2 = value;
                        CDUAocDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[4] = [line1];
            default:
                const line0 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.pdcMessage.Freetext1,
                    {
                        clearable: 0 === mcdu.pdcMessage.Freetext2.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.pdcMessage.Freetext1 = value;
                        CDUAocDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[2] = [line0];
                break;
        }

        // define the template
        mcdu.setTemplate(addionalLineTemplate);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAocDepartReq.ShowPage1(mcdu);
        };
    }
}
