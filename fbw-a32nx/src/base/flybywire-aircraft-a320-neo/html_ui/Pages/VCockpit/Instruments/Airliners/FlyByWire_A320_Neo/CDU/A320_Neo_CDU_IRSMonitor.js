class CDUIRSMonitor {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IRSMonitor;
        mcdu.setTemplate([
            ["IRS MONITOR"],
            [""],
            ["<IRS1"],
            [`\xa0${CDUIRSMonitor.getAdiruStateMessage(1)}[color]green`],
            ["<IRS2"],
            [`\xa0${CDUIRSMonitor.getAdiruStateMessage(2)}[color]green`],
            ["<IRS3"],
            [`\xa0${CDUIRSMonitor.getAdiruStateMessage(3)}[color]green`],
        ]);
        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUIRSStatus.ShowPage(mcdu, 1);
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUIRSStatus.ShowPage(mcdu, 2);
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDUIRSStatus.ShowPage(mcdu, 3);
        };
    }

    static getAdiruStateMessage(number) {
        const state = SimVar.GetSimVarValue(`L:A32NX_ADIRS_ADIRU_${number}_STATE`, "Enum");
        switch (state) {
            case 1:
                return "ALIGN";
            case 2:
                return "NAV";
            default:
                return "";
        }
    }
}
