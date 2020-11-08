class CDUIRSMonitor {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IRSMonitor;
        const checkAligned = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Number") || 2;
        let IRSStatus;
        switch (checkAligned) {
            case 0:
                IRSStatus = "";
                break;
            case 1:
                IRSStatus = "ALIGN";
                break;
            case 2:
                IRSStatus = "NAV";
                break;
            default:
                IRSStatus = "NAV";
        }
        mcdu.setTemplate([
            ["IRS MONITOR"],
            [""],
            ["<IRS1"],
            [`${IRSStatus}[color]green`],
            ["<IRS2"],
            [`${IRSStatus}[color]green`],
            ["<IRS3"],
            [`${IRSStatus}[color]green`],
        ]);

        mcdu.onLeftInput[0] = () => {
            CDUIRSStatus.ShowPage(mcdu, 1);
        };
        mcdu.onLeftInput[1] = () => {
            CDUIRSStatus.ShowPage(mcdu, 2);
        };
        mcdu.onLeftInput[2] = () => {
            CDUIRSStatus.ShowPage(mcdu, 3);
        };
    }
}