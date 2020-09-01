class CDUMenuPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["MCDU MENU"],
            [""],
            ["<FMGC[color]green"],
            [""],
            ["<ATSU"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);

        mcdu.showErrorMessage("SELECT DESIRED SYSTEM");

        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("WAIT FOR SYSTEM RESPONSE");
            mcdu.setTemplate([
                ["MCDU MENU"],
                [""],
                ["<FMGC (SEL)[color]blue"],
                [""],
                ["<ATSU"],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""]
            ]);
            setTimeout(() => {
                mcdu.showErrorMessage("");
                CDUIdentPage.ShowPage(mcdu);
            }, Math.floor(Math.random() * (1000 - 500)) + 500); 
        }

        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("WAIT FOR SYSTEM RESPONSE");
            mcdu.setTemplate([
                ["MCDU MENU"],
                [""],
                ["<FMGC"],
                [""],
                ["<ATSU (SEL)[color]blue"],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""]
            ]);
            setTimeout(() => {
                mcdu.showErrorMessage("");
                CDUAtsuMenu.ShowPage(mcdu);
            }, Math.floor(Math.random() * (1000 - 500)) + 500); 
        }
    }
}