class CDUAtcDepartReq {
    static ShowPage(mcdu) {
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
            mcdu.preDepartureClearance.freetext,
            {
                clearable: true,
                emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                mcdu.preDepartureClearance.freetext = value;
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
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };
    }
}
