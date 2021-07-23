class CDUMenuPage {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(); // no refresh
        mcdu.forceClearScratchpad();

        const activeSystem = mcdu.activeSystem;
        let textATSU;
        let textFMGC;
        let textAIDS;
        let textCFDS;
        let textMaint;
        let textReturn;
        let selectedFMGC = false;
        let selectedATSU = false;
        let selectedAIDS = false;
        let selectedCFDS = false;
        let selectedMaint = false;

        const updateView = () => {
            textFMGC = "<FMGC (REQ)";
            textATSU = "<ATSU";
            textAIDS = "<AIDS";
            textCFDS = "<CFDS";
            textMaint = "MCDU MAINT>";
            textReturn = "RETURN>";
            if (activeSystem === "FMGC") {
                textFMGC = "<FMGC (REQ)[color]green";
            }
            if (activeSystem === "ATSU") {
                textATSU = "<ATSU[color]green";
            }
            if (activeSystem === "AIDS") {
                textAIDS = "<AIDS[color]green";
            }
            if (activeSystem === "CFDS") {
                textCFDS = "<CFDS[color]green";
            }
            if (activeSystem === "MAINT") {
                textMaint = "MCDU MAINT>[color]green";
            }
            if (selectedFMGC) {
                textFMGC = "<FMGC (SEL)[color]cyan";
            }
            if (selectedATSU) {
                textATSU = "<ATSU (SEL)[color]cyan";
            }
            if (selectedAIDS) {
                textAIDS = "<AIDS (SEL)[color]cyan";
            }
            if (selectedCFDS) {
                textCFDS = "<CFDS (SEL)[color]cyan";
            }
            if (selectedMaint) {
                textMaint = "(SEL) MCDU MAINT>[color]cyan";
            }

            mcdu.setTemplate([
                ["MCDU MENU"],
                ["", "SELECT\xa0"],
                [textFMGC, "NAV B/UP>"],
                [""],
                [textATSU],
                [""],
                [textAIDS],
                [""],
                [textCFDS],
                [""],
                ["", "OPTIONS>"],
                [""],
                ["", textReturn]
            ]);
        };

        updateView();

        mcdu.addNewMessage(NXSystemMessages.selectDesiredSystem);

        mcdu.onLeftInput[0] = () => {
            mcdu.addNewMessage(NXSystemMessages.waitForSystemResponse);
            selectedFMGC = true;
            updateView();
            setTimeout(() => {
                mcdu.addNewMessage(NXFictionalMessages.emptyMessage);
                CDUIdentPage.ShowPage(fmc, mcdu);
            }, Math.floor(Math.random() * 400) + 100);
        };

        mcdu.onLeftInput[1] = () => {
            mcdu.addNewMessage(NXSystemMessages.waitForSystemResponse);
            selectedATSU = true;
            updateView();
            setTimeout(() => {
                mcdu.addNewMessage(NXFictionalMessages.emptyMessage);
                CDUAtsuMenu.ShowPage(fmc, mcdu);
            }, Math.floor(Math.random() * 400) + 200);
        };

        mcdu.onLeftInput[2] = () => {
            mcdu.addNewMessage(NXSystemMessages.waitForSystemResponse);
            selectedAIDS = true;
            updateView();
            setTimeout(() => {
                mcdu.addNewMessage(NXFictionalMessages.emptyMessage);
                CDU_AIDS_MainMenu.ShowPage(fmc, mcdu);
            }, Math.floor(Math.random() * 400) + 400);
        };

        mcdu.onLeftInput[3] = () => {
            mcdu.addNewMessage(NXSystemMessages.waitForSystemResponse);
            selectedCFDS = true;
            updateView();
            setTimeout(() => {
                mcdu.addNewMessage(NXFictionalMessages.emptyMessage);
                CDUCfdsMainMenu.ShowPage(fmc, mcdu);
            }, Math.floor(Math.random() * 400) + 400);
        };

        mcdu.onRightInput[4] = () => {
            mcdu.addNewMessage(NXSystemMessages.waitForSystemResponse);
            selectedMaint = true;
            updateView();
            setTimeout(() => {
                mcdu.addNewMessage(NXFictionalMessages.emptyMessage);
                CDU_OPTIONS_MainMenu.ShowPage(fmc, mcdu);
            }, Math.floor(Math.random() * 400) + 200);
        };
    }
}
