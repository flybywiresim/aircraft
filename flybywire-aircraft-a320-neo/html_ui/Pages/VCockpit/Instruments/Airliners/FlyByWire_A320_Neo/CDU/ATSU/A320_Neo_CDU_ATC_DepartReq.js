class CDUAtcDepartReq {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCDepartReq;

        if (mcdu.dclMessage === undefined) {
            mcdu.dclMessage = new Atsu.DclMessage();

            if (mcdu.atsuManager.atc.currentStation() === '') {
                mcdu.addNewMessage(NXFictionalMessages.noAtc);
            }
        }

        let flightNo = "______[color]amber";
        let fromTo = "____|____[color]amber";
        const atis = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.dclMessage.Atis,
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
                mcdu.dclMessage.Atis = value;
                CDUAtcDepartReq.ShowPage1(mcdu);
            }
        );
        const gate = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.dclMessage.Gate,
            {
                clearable: true,
                emptyValue: "[\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]cyan",
                maxLength: 4
            },
            (value) => {
                mcdu.dclMessage.Gate = value;
                CDUAtcDepartReq.ShowPage1(mcdu);
            }
        );
        const freetext = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.dclMessage.Freetext0,
            {
                clearable: 0 === mcdu.dclMessage.Freetext1.length,
                emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                mcdu.dclMessage.Freetext0 = value;
                CDUAtcDepartReq.ShowPage1(mcdu);
            }
        );

        if (mcdu.atsuManager.flightNumber().length !== 0 && mcdu.flightPlanManager.getOrigin() !== null) {
            mcdu.pdcMessage.Callsign = mcdu.atsuManager.flightNumber();
            flightNo = mcdu.pdcMessage.Callsign + "[color]green";
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            mcdu.dclMessage.Origin = mcdu.flightPlanManager.getOrigin().ident;
            mcdu.dclMessage.Destination = mcdu.flightPlanManager.getDestination().ident;
            fromTo = mcdu.dclMessage.Origin + "/" + mcdu.dclMessage.Destination + "[color]cyan";

            const atisReports = mcdu.atsuManager.atc.atisReports(mcdu.dclMessage.Origin);
            if (atisReports.length !== 0 && atisReports[0].Information !== '') {
                mcdu.dclMessage.Atis = atisReports[0].Information;
                atis.setValue(mcdu.dclMessage.Atis);
            }
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "REQ DISPL\xa0[color]cyan";
        if ("" !== mcdu.dclMessage.Callsign && "" !== mcdu.dclMessage.Origin && "" !== mcdu.dclMessage.Destination && 1 === mcdu.dclMessage.Atis.length) {
            reqDisplButton = "REQ DISPL*[color]cyan";
        }

        mcdu.setTemplate([
            ["DEPART REQ"],
            ["\xa0ATC FLT NBR", "A/C TYPE\xa0"],
            [flightNo, "A20N[color]cyan"],
            ["\xa0FROM/TO"],
            [fromTo],
            ["\xa0GATE", "ATIS\xa0"],
            [gate, atis],
            ["---------FREE TEXT---------"],
            [freetext],
            ["", "MORE\xa0"],
            ["", "FREE TEXT>[color]white"],
            ["\xa0ATC MENU", "ATC DEPART\xa0[color]cyan"],
            ["<RETURN", reqDisplButton]
        ]);

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (0 !== mcdu.dclMessage.Freetext0.length) {
                CDUAtcDepartReq.ShowPage2(mcdu);
            } else {
                mcdu.addNewMessage(NXSystemMessages.mandatoryFields);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (mcdu.atsuManager.atc.currentStation() === '') {
                mcdu.addNewMessage(NXFictionalMessages.noAtc);
                return;
            }

            if ("" === mcdu.dclMessage.Callsign || "" === mcdu.dclMessage.Origin || "" === mcdu.dclMessage.Destination || 1 !== mcdu.dclMessage.Atis.length) {
                mcdu.addNewMessage(NXSystemMessages.mandatoryFields);
                return;
            }

            // publish the message
            mcdu.atsuManager.registerMessage(mcdu.dclMessage);
            mcdu.dclMessage = undefined;

            CDUAtcDepartReq.ShowPage1(mcdu);
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
        if (0 === mcdu.dclMessage.Freetext5.length) {
            firstEmptyLineIndex = 4;
        }
        if (0 === mcdu.dclMessage.Freetext4.length) {
            firstEmptyLineIndex = 3;
        }
        if (0 === mcdu.dclMessage.Freetext3.length) {
            firstEmptyLineIndex = 2;
        }
        if (0 === mcdu.dclMessage.Freetext2.length) {
            firstEmptyLineIndex = 1;
        }
        if (0 === mcdu.dclMessage.Freetext1.length) {
            firstEmptyLineIndex = 0;
        }

        switch (firstEmptyLineIndex) {
            case -1:
            case 4:
                const line4 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.dclMessage.Freetext5,
                    {
                        clearable: 0 !== mcdu.dclMessage.Freetext5.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.dclMessage.Freetext5 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[10] = [line4];
            case 3:
                const line3 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.dclMessage.Freetext4,
                    {
                        clearable: 0 === mcdu.dclMessage.Freetext5.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.dclMessage.Freetext4 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[8] = [line3];
            case 2:
                const line2 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.dclMessage.Freetext3,
                    {
                        clearable: 0 === mcdu.dclMessage.Freetext4.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.dclMessage.Freetext3 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[6] = [line2];
            case 1:
                const line1 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.dclMessage.Freetext2,
                    {
                        clearable: 0 === mcdu.dclMessage.Freetext3.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.dclMessage.Freetext2 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[4] = [line1];
            default:
                const line0 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.dclMessage.Freetext1,
                    {
                        clearable: 0 === mcdu.dclMessage.Freetext2.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.dclMessage.Freetext1 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
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
            CDUAtcDepartReq.ShowPage1(mcdu);
        };
    }
}
