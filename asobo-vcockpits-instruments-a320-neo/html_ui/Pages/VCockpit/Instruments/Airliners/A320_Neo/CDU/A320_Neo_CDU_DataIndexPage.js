class CDUDataIndexPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["DATA INDEX", "1", "2"],
            ["POSITION"],
            ["<MONITOR"],
            ["IRS"],
            ["<MONITOR"],
            ["GPS"],
            ["<MONITOR"],
            [""],
            ["<A/C STATUS"],
            ["CLOSEST", "PRINT"],
            ["<AIRPORTS", "FUNCTION>"],
            ["EQUITIME"],
            ["<POINT"]
        ]);
        mcdu.onLeftInput[0] = () => {
            CDUPositionMonitorPage.ShowPage(mcdu);
        };
        mcdu.onLeftInput[3] = () => {
            CDUIdentPage.ShowPage(mcdu);
        };
    }
}
//# sourceMappingURL=A320_Neo_CDU_DataIndexPage.js.map