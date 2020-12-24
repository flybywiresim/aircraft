class CDU_OPTIONS_TRANSITION {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedTransAltSettings = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        const storedDepartTransAlt = NXDataStore.get("CONFIG_DEPART_TRANSALT", "10000");
        const storedArrivalTransAlt = NXDataStore.get("CONFIG_ARRIVAL_TRANSALT", "10000");

        let Auto = "*AUTO[color]cyan";
        let Manual = "*MANUAL[color]cyan";

        switch (storedTransAltSettings) {
            case "MANUAL":
                Manual = "MANUAL[color]green";
                break;
            default:
                Auto = "AUTO[color]green";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS REALISM"],
            ["", "", "TRANS ALT MODE"],
            [Auto],
            [""],
            [Manual],
            ["", "", "DEFAULT MANUAL TA"],
            [""],
            ["{sp}DEPARTURE", "ARRIVAL{sp}"],
            [`{cyan}*[${storedDepartTransAlt}]{end}`, `{cyan}[${storedArrivalTransAlt}]*{end}`],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (storedTransAltSettings != "AUTO") {
                NXDataStore.set("CONFIG_TRANSALT", "AUTO");
                CDU_OPTIONS_TRANSITION.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (storedTransAltSettings != "MANUAL") {
                NXDataStore.set("CONFIG_TRANSALT", "MANUAL");
                CDU_OPTIONS_TRANSITION.ShowPage(mcdu);
            }
        };

        mcdu.onLeftInput[3] = (value) => {
            if (isNaN(value) || parseInt(value) > 50000 || parseInt(value) < 3000) {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                NXDataStore.set("CONFIG_DEPART_TRANSALT", value);
            }
            CDU_OPTIONS_TRANSITION.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[3] = (value) => {
            if (isNaN(value) || parseInt(value) > 50000 || parseInt(value) < 3000) {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                NXDataStore.set("CONFIG_ARRIVAL_TRANSALT", value);
            }
            CDU_OPTIONS_TRANSITION.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };
    }
}
