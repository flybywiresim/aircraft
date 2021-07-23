class CDUAtcDepartReq {
    static ShowPage(fmc, mcdu, store = {"gate": "", "atis": "", "freeText": ""}) {
        mcdu.setCurrentPage(() => {
            CDUAtcDepartReq.ShowPage(fmc, mcdu, store);
        });

        let flightNo = "______[color]amber";
        let fromTo = "____|____[color]amber";
        if (store["gate"] == "") {
            store["gate"] = "___[color]amber";
        }
        if (store["atis"] == "") {
            store["atis"] = "_[color]amber";
        }
        if (store["freeText"] == "") {
            store["freeText"] = "[\xa0\xa0\xa0][color]cyan";
        }
        if (fmc.flightNumber) {
            flightNo = fmc.flightNumber + "[color]green";
        }
        if (fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getDestination().ident) {
            fromTo = fmc.flightPlanManager.getOrigin().ident + "/" + fmc.flightPlanManager.getDestination().ident + "[color]cyan";
        }

        mcdu.setTemplate([
            ["DEPART REQUEST"],
            ["ATC FLT NBR", "A/C TYPE"],
            [flightNo, "A20N[color]cyan"],
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
                store["gate"] = value + "[color]cyan";
            }
            CDUAtcDepartReq.ShowPage(fmc, mcdu, store);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value != "") {
                store["atis"] = value + "[color]cyan";
            }
            CDUAtcDepartReq.ShowPage(fmc, mcdu, store);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (value != "") {
                store["freeText"] = "[" + value + "][color]cyan";
            }
            CDUAtcDepartReq.ShowPage(fmc, mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage2(fmc, mcdu);
        };
    }
}
