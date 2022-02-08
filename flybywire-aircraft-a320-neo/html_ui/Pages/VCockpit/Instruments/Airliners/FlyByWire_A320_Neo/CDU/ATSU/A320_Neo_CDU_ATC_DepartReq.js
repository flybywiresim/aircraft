class CDUAtcDepartReq {
    static CreateDataBlock() {
        return {
            atis: '',
            gate: '',
            freetext: [ '', '', '', '', '', '' ]
        };
    }

    static CanSendData(mcdu, store) {
        if (!SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") || SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC").length === 0) {
            return false;
        }
        if (!mcdu.flightPlanManager.getOrigin() || !mcdu.flightPlanManager.getOrigin().ident) {
            return false;
        }
        if (!mcdu.flightPlanManager.getDestination() || !mcdu.flightPlanManager.getDestination().ident) {
            return false;
        }
        return mcdu.atsuManager.atc.currentStation() !== "" && store.atis !== "";
    }

    static CreateMessage(mcdu, store) {
        const retval = new Atsu.DclMessage();

        retval.Callsign = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC");
        retval.Origin = mcdu.flightPlanManager.getOrigin().ident;
        retval.Destination = mcdu.flightPlanManager.getDestination().ident;
        retval.Atis = store.atis;
        retval.Gate = store.gate;
        retval.Freetext = store.freetext.filter((n) => n);
        retval.Station = mcdu.atsuManager.atc.currentStation();

        return retval;
    }

    static ShowPage1(mcdu, store = CDUAtcDepartReq.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCDepartReq;

        let flightNo = "______[color]amber";
        let fromTo = "____|____[color]amber";
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

        if (mcdu.atsuManager.flightNumber().length !== 0 && mcdu.flightPlanManager.getOrigin() !== null) {
            mcdu.pdcMessage.Callsign = mcdu.atsuManager.flightNumber();
            flightNo = mcdu.pdcMessage.Callsign + "[color]green";
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            fromTo = `${mcdu.flightPlanManager.getOrigin().ident}/${mcdu.flightPlanManager.getDestination().ident}[color]cyan`;

            const atisReports = mcdu.atsuManager.atc.atisReports(mcdu.flightPlanManager.getOrigin().ident);
            if (atisReports.length !== 0 && atisReports[0].Information !== '') {
                store.atis = atisReports[0].Information;
                atis.setValue(mcdu.dclMessage.Atis);
            }
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "REQ DISPL\xa0[color]cyan";
        if (CDUAtcDepartReq.CanSendData(mcdu, store)) {
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
            CDUAtcDepartReq.ShowPage2(mcdu, store);
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
            if (CDUAtcDepartReq.CanSendData(mcdu, store)) {
                mcdu.atsuManager.registerMessage(CDUAtcDepartReq.CreateMessage(mcdu, store));
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
