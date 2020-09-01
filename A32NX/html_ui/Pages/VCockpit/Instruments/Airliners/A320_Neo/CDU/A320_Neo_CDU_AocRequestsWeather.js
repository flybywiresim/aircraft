class CDUAocRequestsWeather {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.clearUserInput();
        let store = {
            "reqType": 0,
            "depIcao": "",
            "arrIcao": "",
            "arpt1": "",
            "arpt2": "",
            "arpt3": ""
        };

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
            store.arpt1 = mcdu.flightPlanManager.getOrigin().ident;
            store.arpt2 = mcdu.flightPlanManager.getDestination().ident;
        }

        const reqTypes = [
            'METAR',
            'TAF LONG',
            'SIGMET',
            'METAR + TAF'
        ];
        mcdu.setTemplate([
            ["AOC WEATHER REQ"],
            [`${reqTypes[0]}[color]green`, "ARPT 1"],
            ["<WX MSG TYPE", `${store.arpt1 != "" ? store.arpt1 : "[ ]"}[color]blue`],
            ["", "ARPT 2"],
            ["", `${store["arpt2"] != "" ? store["arpt2"] : "[ ]"}[color]blue`],
            ["", "ARPT 3"],
            ["", `${store["arpt1"] != "" ? store["arpt1"] : "[ ]"}[color]blue`],
            [""],
            [""],
            [""],
            ["", "SEND*[color]blue"],
            [""],
            ["<RETURN"]
        ]);

        const updateView = (mcdu) => {
            mcdu.setTemplate([
                ["AOC WEATHER REQ"],
                [`${reqTypes[0]}[color]green`, "ARPT 1"],
                ["<WX MSG TYPE", `${store.arpt1 != "" ? store.arpt1 : "[ ]"}[color]blue`],
                ["", "ARPT 2"],
                ["", `${store["arpt2"] != "" ? store["arpt2"] : "[ ]"}[color]blue`],
                ["", "ARPT 3"],
                ["", `${store["arpt3"] != "" ? store["arpt3"] : "[ ]"}[color]blue`],
                [""],
                [""],
                [""],
                ["", "SEND*[color]blue"],
                [""],
                ["<RETURN"]
            ]);
        }

        updateView(mcdu);

        mcdu.onRightInput[0] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            store["arpt1"] = value;
            updateView(mcdu);
        }

        mcdu.onRightInput[1] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            store["arpt2"] = value;
            updateView(mcdu);
        }

        mcdu.onRightInput[2] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            store["arpt3"] = value;
            updateView(mcdu);
        }

        mcdu.onRightInput[4] = async () => {
            const ICAOS = [store["arpt1"], store["arpt2"], store["arpt3"]];
            mcdu.clearUserInput();
            CDUAocRequests.ShowPage(mcdu, ICAOS);

        }

        mcdu.onLeftInput[5] = () => {
            CDUAocRequests.ShowPage(mcdu);
        }
    }
}