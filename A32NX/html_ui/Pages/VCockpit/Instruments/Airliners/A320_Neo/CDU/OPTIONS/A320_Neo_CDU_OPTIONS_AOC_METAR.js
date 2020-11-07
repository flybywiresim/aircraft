class CDU_OPTIONS_METAR {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedMetarSrc = NXDataStore.get("CONFIG_METAR_SRC", "MSFS");

        let msfs = "*METEOBLUE (MSFS)[color]blue";
        let avwx = "*AVWX (UNREAL WEATHER)[color]blue";
        let vatsim = "*VATSIM[color]blue";
        let pilotedge = "*PILOTEDGE[color]blue";
        let ivao = "*IVAO[color]blue";

        switch (storedMetarSrc) {
            case "AVWX":
                avwx = "AVWX (UNREAL WEATHER)[color]green";
                break;
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
                msfs = "METEOBLUE (MSFS)[color]green";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["", "", "METAR UPLINK SRC"],
            [msfs],
            [""],
            [avwx],
            [""],
            [vatsim],
            [""],
            [pilotedge],
            [""],
            [ivao],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[0] = () => {
            if (storedMetarSrc != "MSFS") {
                NXDataStore.set("CONFIG_METAR_SRC", "MSFS");
                CDU_OPTIONS_METAR.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        };
        mcdu.onLeftInput[2] = () => {
            if (storedMetarSrc != "VATSIM") {
                NXDataStore.set("CONFIG_METAR_SRC", "VATSIM");
                CDU_OPTIONS_METAR.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[3] = () => {
            if (storedMetarSrc != "PILOTEDGE") {
                NXDataStore.set("CONFIG_METAR_SRC", "PILOTEDGE");
                CDU_OPTIONS_METAR.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[4] = () => {
            if (storedMetarSrc != "IVAO") {
                NXDataStore.set("CONFIG_METAR_SRC", "IVAO");
                CDU_OPTIONS_METAR.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}