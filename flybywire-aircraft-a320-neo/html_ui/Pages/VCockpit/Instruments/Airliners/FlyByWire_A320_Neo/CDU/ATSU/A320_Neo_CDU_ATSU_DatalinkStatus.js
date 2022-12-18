class CDUAtsuDatalinkStatus {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATSUDatalinkStatus;
        mcdu.activeSystem = "ATSU";

        function updateView() {
            if (mcdu.page.Current === mcdu.page.ATSUDatalinkStatus) {
                CDUAtsuDatalinkStatus.ShowPage(mcdu);
            }
        }

        mcdu.refreshPageCallback = () => {
            updateView();
        };
        SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 1);

        mcdu.setTemplate([
            ["DATALINK STATUS"],
            [""],
            [`VHF3 : ${mcdu.atsu.vhfDatalinkStatus()}`],
            [`\xa0\xa0\xa0\xa0\xa0\xa0\xa0${mcdu.atsu.vhfDatalinkMode()}`],
            [`SATCOM : ${mcdu.atsu.satcomDatalinkStatus()}`],
            [`\xa0\xa0\xa0\xa0\xa0\xa0\xa0${mcdu.atsu.satcomDatalinkMode()}`],
            [`HF : ${mcdu.atsu.hfDatalinkStatus()}`],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN", "PRINT*[color]cyan"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[5] = () => {
            const lines = [
                "DATALINK STATUS",
                "VHF3 : DLK AVAIL",
                `\xa0\xa0\xa0\xa0\xa0\xa0\xa0${vhf3Mode}`,
                "SATCOM : NOT INSTALLED",
                "HF : NOT INSTALLED",
            ];
            mcdu.printPage(lines);
        };
    }
}
