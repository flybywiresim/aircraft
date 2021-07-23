class CDU_CFDS_Test_Common_GroundScanning {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDU_CFDS_Test_Common_GroundScanning.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["ECAM-1"],
            ["", "", "FWC1/2-SDAC1/2-ECP"],
            ["<LAST LEG REPORT[color]inop"],
            [""],
            ["<PREVIOUS LEGS REPORT[color]inop"],
            [""],
            ["<LRU IDENTIFICATION[color]inop"],
            [""],
            ["<GROUND SCANNING[color]inop"],
            [""],
            ["<CLASS 3 FAULTS[color]inop"],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        // IMPLEMENTED BUTTONS
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(fmc, mcdu);
        };

    }
}
