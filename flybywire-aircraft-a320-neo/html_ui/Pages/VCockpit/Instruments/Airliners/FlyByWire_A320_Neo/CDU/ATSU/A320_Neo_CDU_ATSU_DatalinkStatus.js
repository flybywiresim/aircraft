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

        const vhfStatusCode = mcdu.atsu.getDatalinkStatus('vhf');
        const vhfModeCode = mcdu.atsu.getDatalinkMode('vhf');
        const satcomStatusCode = mcdu.atsu.getDatalinkStatus('satcom');
        const satcomModeCode = mcdu.atsu.getDatalinkMode('satcom');
        const hfStatusCode = mcdu.atsu.getDatalinkStatus('hf');
        const hfModeCode = mcdu.atsu.getDatalinkMode('hf');

        let vhfStatus, satcomStatus, hfStatus;
        let vhfMode, satcomMode, hfMode;

        if (vhfStatusCode === -1) {
            vhfStatus = '{red}INOP{end}';
        } else if (vhfStatusCode === 0) {
            vhfStatus = '{small}NOT INSTALLED{end}';
        } else if (vhfStatusCode === 1) {
            vhfStatus = '{small}DLK NOT AVAIL{end}';
        } else if (vhfStatusCode === 2) {
            vhfStatus = '{green}DLK AVAIL{end}';
        } else {
            vhfStatus = 'ERROR';
        }

        if (vhfModeCode === 1) {
            vhfMode = 'ATC/AOC';
        } else if (vhfModeCode === 2) {
            vhfMode = 'AOC';
        } else if (vhfModeCode === 3) {
            vhfMode = 'ATC';
        } else if (vhfModeCode === 0) {
            vhfMode = '';
        } else {
            vhfMode = 'ERROR';
        }

        if (satcomStatusCode === -1) {
            satcomStatus = '{red}INOP{end}';
        } else if (satcomStatusCode === 0) {
            satcomStatus = '{small}NOT INSTALLED{end}';
        } else if (satcomStatusCode === 1) {
            satcomStatus = '{small}DLK NOT AVAL{end}';
        } else if (satcomStatusCode === 2) {
            satcomStatus = '{green}DLK AVAIL{end}';
        } else {
            satcomStatus = 'ERROR';
        }

        if (satcomModeCode === 1) {
            satcomMode = 'ATC/AOC';
        } else if (satcomModeCode === 2) {
            satcomMode = 'AOC';
        } else if (satcomModeCode === 3) {
            satcomMode = 'ATC';
        } else if (satcomModeCode === 0) {
            satcomMode = '';
        } else {
            satcomMode = 'ERROR';
        }

        if (hfStatusCode === -1) {
            hfStatus = '{red}INOP{end}';
        } else if (hfStatusCode === 0) {
            hfStatus = '{small}NOT INSTALLED{end}';
        } else if (hfStatusCode === 1) {
            hfStatus = '{small}NOT INSTALLED{end}';
        } else if (hfStatusCode === 2) {
            hfStatus = '{green}DLK AVAIL{end}';
        } else {
            hfStatus = 'ERROR';
        }

        if (hfModeCode === 1) {
            hfMode = 'ATC/AOC';
        } else if (hfModeCode === 2) {
            hfMode = 'AOC';
        } else if (hfModeCode === 3) {
            hfMode = 'ATC';
        } else if (hfModeCode === 0) {
            hfMode = '';
        } else {
            hfMode = 'ERROR';
        }

        mcdu.setTemplate([
            ["DATALINK STATUS"],
            [""],
            [`VHF3 : ${vhfStatus}`],
            [`\xa0\xa0\xa0\xa0\xa0\xa0\xa0${vhfMode}`],
            [`SATCOM : ${satcomStatus}`],
            [`\xa0\xa0\xa0\xa0\xa0\xa0\xa0${satcomMode}`],
            [`HF : ${hfStatus}`],
            [`\xa0\xa0\xa0\xa0\xa0\xa0\xa0${hfMode}`],
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
                `HF : ${hfStatus}`,
                `\xa0\xa0\xa0\xa0\xa0\xa0\xa0${hfMode}`,
            ];
            mcdu.printPage(lines);
        };
    }
}
