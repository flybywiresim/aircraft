class CDU_OPTIONS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'MAINT';
        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["ADIRS"],
            ["<ALIGN TIME"],
            ["AOC"],
            ["<METAR SRC"],
            ["AOC"],
            ["<D-ATIS SRC"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[2] = () => {
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