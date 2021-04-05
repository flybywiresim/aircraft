class CDU_OPTIONS_TAF {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedTafSrc = NXDataStore.get("CONFIG_TAF_SRC", "NOAA");

        let noaa = "*NOAA[color]cyan";
        let ivao = "*IVAO[color]cyan";

        switch (storedTafSrc) {
            case "IVAO":
                ivao = "IVAO[color]green";
                break;
            default:
                noaa = "NOAA[color]green";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS AOC"],
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
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (storedTafSrc != "NOAA") {
                NXDataStore.set("CONFIG_TAF_SRC", "NOAA");
                CDU_OPTIONS_TAF.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (storedTafSrc != "IVAO") {
                NXDataStore.set("CONFIG_TAF_SRC", "IVAO");
                CDU_OPTIONS_TAF.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_AOC.ShowPage(mcdu);
        };
    }
}
