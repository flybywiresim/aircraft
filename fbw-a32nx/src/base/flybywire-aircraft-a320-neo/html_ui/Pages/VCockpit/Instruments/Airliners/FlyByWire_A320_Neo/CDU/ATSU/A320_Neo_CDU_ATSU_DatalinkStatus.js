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

        const vhfStatusCode = mcdu.atsu.getDatalinkStatus(AtsuCommon.DatalinkCommunicationSystems.VHF);
        const vhfModeCode = mcdu.atsu.getDatalinkMode(AtsuCommon.DatalinkCommunicationSystems.VHF);
        const satcomStatusCode = mcdu.atsu.getDatalinkStatus(AtsuCommon.DatalinkCommunicationSystems.SATCOM);
        const satcomModeCode = mcdu.atsu.getDatalinkMode(AtsuCommon.DatalinkCommunicationSystems.SATCOM);
        const hfStatusCode = mcdu.atsu.getDatalinkStatus(AtsuCommon.DatalinkCommunicationSystems.HF);
        const hfModeCode = mcdu.atsu.getDatalinkMode(AtsuCommon.DatalinkCommunicationSystems.HF);

        const statusCodeToString = {
            [AtsuCommon.DatalinkStatusCode.Inop]: '{red}INOP{end}',
            [AtsuCommon.DatalinkStatusCode.NotInstalled]: '{small}NOT INSTALLED{end}',
            [AtsuCommon.DatalinkStatusCode.DlkNotAvail]: '{small}DLK NOT AVAIL{end}',
            [AtsuCommon.DatalinkStatusCode.DlkAvail]: '{green}DLK AVAIL{end}',
        };

        const modeCodeToString = {
            [AtsuCommon.DatalinkModeCode.None]: ' ',
            [AtsuCommon.DatalinkModeCode.AtcAoc]: 'ATC/AOC',
            [AtsuCommon.DatalinkModeCode.Aoc]: 'AOC ONLY',
            [AtsuCommon.DatalinkModeCode.Atc]: 'ATC ONLY',
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
