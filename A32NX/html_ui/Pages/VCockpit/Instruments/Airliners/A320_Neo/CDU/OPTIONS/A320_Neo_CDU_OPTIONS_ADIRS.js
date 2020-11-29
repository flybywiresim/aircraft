class CDU_OPTIONS_ADIRS {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedAlignTime = NXDataStore.get("CONFIG_ALIGN_TIME", "REAL");

        let instant = "*INSTANT[color]cyan";
        let fast = "*FAST[color]cyan";
        let real = "*REAL[color]cyan";

        switch (storedAlignTime) {
            case "INSTANT":
                instant = "INSTANT[color]green";
                break;
            case "FAST":
                fast = "FAST[color]green";
                break;
            default:
                real = "REAL[color]green";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["", "", "IRS ALIGN TIME"],
            [instant],
            [""],
            [fast],
            [""],
            [real],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (storedAlignTime != "INSTANT") {
                NXDataStore.set("CONFIG_ALIGN_TIME", "INSTANT");
                CDU_OPTIONS_ADIRS.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (storedAlignTime != "FAST") {
                NXDataStore.set("CONFIG_ALIGN_TIME", "FAST");
                CDU_OPTIONS_ADIRS.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            if (storedAlignTime != "REAL") {
                NXDataStore.set("CONFIG_ALIGN_TIME", "REAL");
                CDU_OPTIONS_ADIRS.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
