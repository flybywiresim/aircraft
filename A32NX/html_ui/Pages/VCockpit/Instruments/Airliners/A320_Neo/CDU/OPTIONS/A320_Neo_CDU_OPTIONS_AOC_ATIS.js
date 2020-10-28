class CDU_OPTIONS_ATIS {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedAtisSrc = NXDataStore.get("CONFIG_ATIS_SRC", "FAA");

        let faa = "*FAA (US ONLY)[color]blue";
        let vatsim = "*VATSIM[color]blue";
        let pilotedge = "*PILOTEDGE[color]blue";
        let ivao = "*IVAO[color]blue";

        switch (storedAtisSrc) {
            case "VATSIM":
                vatsim = "VATSIM[color]green";
                break;
            case "PILOTEDGE":
                pilotedge = "PILOTEDGE[color]green";
                break;
            case "IVAO":
                ivao = "IVAO[color]green";
                break;
            default:
                faa = "FAA (US ONLY)[color]green";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["", "", "ATIS UPLINK SRC"],
            [faa],
            [""],
            [vatsim],
            [""],
            [pilotedge],
            [""],
            [ivao],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[0] = () => {
            if (storedAtisSrc != "FAA") {
                NXDataStore.set("CONFIG_ATIS_SRC", "FAA");
                CDU_OPTIONS_ATIS.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[1] = () => {
            if (storedAtisSrc != "VATSIM") {
                NXDataStore.set("CONFIG_ATIS_SRC", "VATSIM");
                CDU_OPTIONS_ATIS.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[2] = () => {
            if (storedAtisSrc != "PILOTEDGE") {
                NXDataStore.set("CONFIG_ATIS_SRC", "PILOTEDGE");
                CDU_OPTIONS_ATIS.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[3] = () => {
            if (storedAtisSrc != "IVAO") {
                NXDataStore.set("CONFIG_ATIS_SRC", "IVAO");
                CDU_OPTIONS_ATIS.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}