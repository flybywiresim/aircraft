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

        mcdu.pageRedrawCallback = () => {
            updateView();
        };
        setTimeout(mcdu.requestUpdate.bind(mcdu), 500);
        SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 1);

        const vhfStatusCode = mcdu.atsu.getDatalinkStatus('vhf');
        const vhfModeCode = mcdu.atsu.getDatalinkMode('vhf');
        const satcomStatusCode = mcdu.atsu.getDatalinkStatus('satcom');
        const satcomModeCode = mcdu.atsu.getDatalinkMode('satcom');
        const hfStatusCode = mcdu.atsu.getDatalinkStatus('hf');
        const hfModeCode = mcdu.atsu.getDatalinkMode('hf');

        const statusCodeToString = {
            [-1]: '{red}INOP{end}',
            [0]: '{small}NOT INSTALLED{end}',
            [1]: '{small}DLK NOT AVAIL{end}',
            [2]: '{green}DLK AVAIL{end}'
        };

        const modeCodeToString = {
            [1]: 'ATC/AOC',
            [2]: 'AOC ONLY',
            [3]: 'ATC ONLY',
            [0]: ' '
        };

        const vhfStatus = statusCodeToString[vhfStatusCode] || 'ERROR';
        const vhfMode = modeCodeToString[vhfModeCode] || 'ERROR';
        const satcomStatus = statusCodeToString[satcomStatusCode] || 'ERROR';
        const satcomMode = modeCodeToString[satcomModeCode] || 'ERROR';
        const hfStatus = statusCodeToString[hfStatusCode] || 'ERROR';
        const hfMode = modeCodeToString[hfModeCode] || 'ERROR';

        mcdu.setTemplate([
            ["DATALINK STATUS"],
            [""],
            [`VHF3 : ${vhfStatus}`],
            [`\xa0\xa0\xa0\xa0\xa0\xa0\xa0${vhfMode}`],
            [`SATCOM : ${satcomStatus}`],
            [`\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0${satcomMode}`],
            [`HF : ${hfStatus}`],
            [`\xa0\xa0\xa0\xa0\xa0${hfMode}`],
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
                `VHF3 : ${vhfStatus}`,
                `\xa0\xa0\xa0\xa0\xa0\xa0\xa0${vhfMode}`,
                `SATCOM : ${satcomStatus}`,
                `\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0${satcomMode}`,
                `HF : ${hfStatus}`,
                `\xa0\xa0\xa0\xa0\xa0${hfMode}`,
            ];
            mcdu.printPage(lines);
        };
    }
}
