class CDUAtcEmergency {
    static ShowPage(fmc, mcdu, store = {"emergType": 0, "emergAds": 0, "des": "", "div": "", "freq": ""}) {
        mcdu.setCurrentPage(() => {
            CDUAtcEmergency.ShowPage(fmc, mcdu, store);
        });
        let mayday = "<MAYDAY";
        let panpan = "<PANPAN";
        let ads = "EMERG ADS:\xa0";
        let setAds = "SET\xa0";

        if (store["emergType"] == 0) {
            mayday += "[color]cyan";
        } else {
            panpan += "[color]cyan";
        }
        if (store["emergAds"] == 0) {
            ads += "OFF";
            setAds += "ON";
        } else {
            ads += "ON";
            setAds += "OFF";
        }
        if (store["des"] == "") {
            store["des"] = "_____[color]amber";
        }
        if (store["div"] == "") {
            store["div"] = "____/____[color]amber";
        }
        if (store["freq"] == "") {
            store["freq"] = "[121.5][color]cyan";
        }

        mcdu.setTemplate([
            ["EMERGENCY[color]amber"],
            ["", ads + "\xa0"],
            [mayday, setAds + "*[color]cyan"],
            ["", "DESCENDING TO\xa0"],
            [panpan, store["des"]],
            ["", "DIVERTING VIA\xa0"],
            ["", store["div"]],
            ["\xa0VOICE[color]cyan", "FREQ\xa0"],
            ["\xa0CONTACT[color]cyan", store["freq"]],
            ["\xa0ALL FIELDS"],
            ["*ERASE"],
            ["\xa0ATC MENU", "ATC\xa0[color]inop"],
            ["<RETURN", "EMERG DISPL\xa0[color]inop"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            store["emergType"] = 0;
            CDUAtcEmergency.ShowPage(fmc, mcdu, store);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            store["emergType"] = 1;
            CDUAtcEmergency.ShowPage(fmc, mcdu, store);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            store["des"] = "";
            store["div"] = "";
            store["freq"] = "";
            CDUAtcEmergency.ShowPage(fmc, mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(fmc, mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            if (store["emergAds"] == 0) {
                store["emergAds"] = 1;
            } else {
                store["emergAds"] = 0;
            }
            CDUAtcEmergency.ShowPage(fmc, mcdu, store);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value != "") {
                store["des"] = value + "[color]cyan";
            }
            CDUAtcEmergency.ShowPage(fmc, mcdu, store);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value != "") {
                store["div"] = value + "[color]cyan";
            }
            CDUAtcEmergency.ShowPage(fmc, mcdu, store);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value != "") {
                store["freq"] = "[" + value + "][color]cyan";
            }
            CDUAtcEmergency.ShowPage(fmc, mcdu, store);
        };
    }
}
