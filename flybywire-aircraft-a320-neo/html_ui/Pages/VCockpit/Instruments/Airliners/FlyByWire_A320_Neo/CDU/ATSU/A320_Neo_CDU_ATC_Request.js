class CDUAtcRequest {
    static ShowPage(fmc, mcdu, store = {"dirTo": "", "flAlt": "", "spdMach": "", "dueTo": 0}) {
        mcdu.setCurrentPage(() => {
            CDUAtcRequest.ShowPage(fmc, mcdu, store);
        });

        if (store["dirTo"] == "") {
            store["dirTo"] = "[\xa0\xa0\xa0][color]cyan";
        }
        if (store["flAlt"] == "") {
            store["flAlt"] = "[\xa0\xa0\xa0][color]cyan";
        }
        if (store["spdMach"] == "") {
            store["spdMach"] = "[\xa0][color]cyan";
        }

        mcdu.setTemplate([
            ["REQUEST"],
            ["\xa0DIR TO", "FL/ALT\xa0"],
            [store["dirTo"], store["flAlt"]],
            ["", "SPD/MACH\xa0"],
            ["", store["spdMach"]],
            [""],
            [""],
            ["\xa0DUE TO", "DUE TO\xa0"],
            ["{cyan}{{end}WEATHER", "A/C PERF{cyan}}{end}"],
            [""],
            [""],
            ["\xa0ATC MENU", "XFR TO\xa0[color]inop"],
            ["<RETURN", "DCDU\xa0[color]inop"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value != "") {
                store["dirTo"] = "[" + value + "][color]cyan";
            }
            CDUAtcRequest.ShowPage(fmc, mcdu, store);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value != "") {
                store["flAlt"] = "[" + value + "][color]cyan";
            }
            CDUAtcRequest.ShowPage(fmc, mcdu, store);
        };

        mcdu.onRightInput[1] = (value) => {
            if (value != "") {
                store["spdMach"] = "[" + value + "][color]cyan";
            }
            CDUAtcRequest.ShowPage(fmc, mcdu, store);
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(fmc, mcdu);
        };
    }
}
