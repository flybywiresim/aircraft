class CDU_OPTIONS_ADIRS {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedAlignTime = NXDataStore.get("CONFIG_ALIGN_TIME", "REAL");

        let instant = "*INSTANT[color]blue";
        let fast = "*FAST[color]blue";
        let real = "*REAL[color]blue";

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
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[0] = () => {
            if (storedAlignTime != "INSTANT") {
                NXDataStore.set("CONFIG_ALIGN_TIME", "INSTANT");
                CDU_OPTIONS_ADIRS.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[1] = () => {
            if (storedAlignTime != "FAST") {
                NXDataStore.set("CONFIG_ALIGN_TIME", "FAST");
                CDU_OPTIONS_ADIRS.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[2] = () => {
            if (storedAlignTime != "REAL") {
                NXDataStore.set("CONFIG_ALIGN_TIME", "REAL");
                CDU_OPTIONS_ADIRS.ShowPage(mcdu);
            }
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}