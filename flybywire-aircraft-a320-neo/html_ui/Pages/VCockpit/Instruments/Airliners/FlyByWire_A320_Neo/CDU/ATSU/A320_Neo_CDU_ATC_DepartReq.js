class CDUAtcDepartReq {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();

        let flightNo = "______[color]amber";
        let fromTo = "____|____[color]amber";
        const atis = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.preDepartureClearance.atis,
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
                mcdu.preDepartureClearance.atis = value;
                CDUAtcDepartReq.ShowPage1(mcdu);
            }
        );
        const gate = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.preDepartureClearance.gate,
            {
                clearable: true,
                emptyValue: "[\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]cyan",
                maxLength: 4
            },
            (value) => {
                mcdu.preDepartureClearance.gate = value;
                CDUAtcDepartReq.ShowPage1(mcdu);
            }
        );
        const freetext = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.preDepartureClearance.freetext0,
            {
                clearable: true,
                emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                mcdu.preDepartureClearance.freetext0 = value;
                CDUAtcDepartReq.ShowPage1(mcdu);
            }
        );

        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]cyan";
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "REQ DISPL\xa0[color]cyan";
        if ("______[color]amber" !== flightNo && "____|____[color]amber" !== fromTo && 0 !== mcdu.preDepartureClearance.atis.length) {
            reqDisplButton = "REQ DISPL*[color]cyan";
        }

        mcdu.setTemplate([
            ["DEPART REQUEST"],
            ["ATC FLT NBR", "A/C TYPE"],
            [flightNo, "A20N[color]cyan"],
            ["FROM/TO"],
            [fromTo],
            ["GATE", "ATIS"],
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
            CDUAtcDepartReq.ShowPage2(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage2(mcdu);
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
        if (0 === mcdu.preDepartureClearance.freetext5.length) {
            firstEmptyLineIndex = 4;
        }
        if (0 === mcdu.preDepartureClearance.freetext4.length) {
            firstEmptyLineIndex = 3;
        }
        if (0 === mcdu.preDepartureClearance.freetext3.length) {
            firstEmptyLineIndex = 2;
        }
        if (0 === mcdu.preDepartureClearance.freetext2.length) {
            firstEmptyLineIndex = 1;
        }
        if (0 === mcdu.preDepartureClearance.freetext1.length) {
            firstEmptyLineIndex = 0;
        }

        switch (firstEmptyLineIndex) {
            case -1:
            case 4:
                const line4 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.preDepartureClearance.freetext5,
                    {
                        clearable: 0 !== mcdu.preDepartureClearance.freetext5.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.preDepartureClearance.freetext5 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[10] = [line4];
            case 3:
                const line3 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.preDepartureClearance.freetext4,
                    {
                        clearable: 0 === mcdu.preDepartureClearance.freetext5.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.preDepartureClearance.freetext4 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[8] = [line3];
            case 2:
                const line2 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.preDepartureClearance.freetext3,
                    {
                        clearable: 0 === mcdu.preDepartureClearance.freetext4.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.preDepartureClearance.freetext3 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[6] = [line2];
            case 1:
                const line1 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.preDepartureClearance.freetext2,
                    {
                        clearable: 0 === mcdu.preDepartureClearance.freetext3.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.preDepartureClearance.freetext2 = value;
                        CDUAtcDepartReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[4] = [line1];
            default:
                const line0 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.preDepartureClearance.freetext1,
                    {
                        clearable: 0 === mcdu.preDepartureClearance.freetext2.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.preDepartureClearance.freetext1 = value;
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
