class CDUMenuPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        const activeSystem = mcdu.activeSystem;
        let textATSU;
        let textFMGC;
        let selectedFMGC = false;
        let selectedATSU = false;

        const updateView = () => {
            textFMGC = "<FMGC";
            textATSU = "<ATSU";
            if (activeSystem === "FMGC") textFMGC = "<FMGC[color]green";
            if (activeSystem === "ATSU") textATSU = "<ATSU[color]green";
            if (selectedFMGC) textFMGC = "<FMGC (SEL)[color]blue";
            if (selectedATSU) textATSU = "<ATSU (SEL)[color]blue";

            mcdu.setTemplate([
                ["MCDU MENU"],
                [""],
                [textFMGC],
                [""],
                [textATSU],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""],
                [""]
            ]);
        }

        updateView();

        mcdu.showErrorMessage("SELECT DESIRED SYSTEM");

        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("WAIT FOR SYSTEM RESPONSE");
            selectedFMGC = true;
            updateView();
            setTimeout(() => {
                mcdu.showErrorMessage("");
                CDUIdentPage.ShowPage(mcdu);
            }, Math.floor(Math.random() * (2000 - 1000)) + 1000); 
        }

        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("WAIT FOR SYSTEM RESPONSE");
            selectedATSU = true;
            updateView();
            setTimeout(() => {
                mcdu.showErrorMessage("");
                CDUAtsuMenu.ShowPage(mcdu);
            }, Math.floor(Math.random() * (2000 - 1000)) + 1000); 
        }

        mcdu.onDir = () => {
            mcdu.showErrorMessage("");
            CDUDirectToPage.ShowPage(mcdu);
        };
        mcdu.onProg = () => {
            mcdu.showErrorMessage("");
            CDUProgressPage.ShowPage(mcdu);
        };
        mcdu.onPerf = () => {
            mcdu.showErrorMessage("");
            CDUPerformancePage.ShowPage(mcdu);
        };
        mcdu.onInit = () => {
            mcdu.showErrorMessage("");
            CDUInitPage.ShowPage1(mcdu);
        };
        mcdu.onData = () => {
            mcdu.showErrorMessage("");
            CDUDataIndexPage.ShowPage1(mcdu);
        };
        mcdu.onFpln = () => {
            mcdu.showErrorMessage("");
            CDUFlightPlanPage.ShowPage(mcdu);
        };
        mcdu.onRad = () => {
            mcdu.showErrorMessage("");
            CDUNavRadioPage.ShowPage(mcdu);
        };
        mcdu.onFuel = () => {
            mcdu.showErrorMessage("");
            CDUFuelPredPage.ShowPage(mcdu);
        };
    }
}