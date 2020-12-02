class CDUAtcDepartReq {
    static ShowPage(mcdu, store = {"gate": "", "atis": "", "freeText": ""}) {
        mcdu.clearDisplay();

        let flightNo = "______[color]red";
        let fromTo = "____|____[color]red";
        if (store["gate"] == "") {
            store["gate"] = "___[color]red";
        }
        if (store["atis"] == "") {
            store["atis"] = "_[color]red";
        }
        if (store["freeText"] == "") {
            store["freeText"] = "[\xa0\xa0\xa0][color]blue";
        }
        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")) {
            flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") + "[color]green";
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            fromTo = mcdu.flightPlanManager.getOrigin().ident + "/" + mcdu.flightPlanManager.getDestination().ident + "[color]blue";
        }

        mcdu.setTemplate([
            ["DEPART REQUEST"],
            ["ATC FLT NBR", "A/C TYPE"],
            [flightNo, "A20N[color]blue"],
            ["FROM/TO"],
            [fromTo],
            ["GATE", "ATIS"],
            [store["gate"], store["atis"]],
            ["---------FREE TEXT---------"],
            [store["freeText"]],
            [""],
            [""],
            ["\xa0ATC MENU", "ATC DEPART\xa0[color]inop"],
            ["<RETURN", "REQ DISPL\xa0[color]inop"]
        ]);

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value != "") {
                store["gate"] = value + "[color]blue";
            }
            CDUAtcDepartReq.ShowPage(mcdu, store);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value != "") {
                store["atis"] = value + "[color]blue";
            }
            CDUAtcDepartReq.ShowPage(mcdu, store);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (value != "") {
                store["freeText"] = "[" + value + "][color]blue";
            }
            CDUAtcDepartReq.ShowPage(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage2(mcdu);
        };
    }
}
