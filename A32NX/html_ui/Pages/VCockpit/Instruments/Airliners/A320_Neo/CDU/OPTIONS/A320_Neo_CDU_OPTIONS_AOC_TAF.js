class CDU_OPTIONS_TAF {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedTafSrc = NXDataStore.get("CONFIG_TAF_SRC", "NOAA");

        let noaa = "*NOAA[color]blue";
        let ivao = "*IVAO[color]blue";

        switch (storedTafSrc) {
            case "IVAO":
                ivao = "IVAO[color]green";
                break;
            default:
                noaa = "NOAA[color]green";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["", "", "TAF UPLINK SRC"],
            [noaa],
            [""],
            [ivao],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[0] = () => {
            if (storedTafSrc != "NOAA") {
                NXDataStore.set("CONFIG_TAF_SRC", "NOAA");
                CDU_OPTIONS_TAF.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[1] = () => {
            if (storedTafSrc != "IVAO") {
                NXDataStore.set("CONFIG_TAF_SRC", "IVAO");
                CDU_OPTIONS_TAF.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}