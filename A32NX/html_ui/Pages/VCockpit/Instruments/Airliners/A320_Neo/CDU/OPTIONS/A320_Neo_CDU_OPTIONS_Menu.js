class CDU_OPTIONS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'MAINT';

        let storedAlignTime = GetStoredData("A32NX_CONFIG_ALIGN_TIME");
        if (!storedAlignTime) {
            storedAlignTime = "REAL";
            SetStoredData("A32NX_CONFIG_ALIGN_TIME", "REAL");
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["ADIRU[color]green"],
            ["<IRS ALIGN TIME"],
            ["AOC[color]green"],
            ["<METAR UPLINK SRC"],
            ["AOC[color]green"],
            ["<D-ATIS UPLINK SRC"],
            ["DMC[color]green"],
            ["<DISPLAY SELF-TEST TIME"],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[0] = () => {
            CDU_OPTIONS_ADIRS.ShowPage(mcdu);
        }
        mcdu.onLeftInput[1] = () => {
            CDU_OPTIONS_METAR.ShowPage(mcdu);
        }
        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUMenuPage.ShowPage(mcdu);
        }
    }
}