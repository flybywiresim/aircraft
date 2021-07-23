class CDUCfdsTestMenu {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsTestMenu.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            [""],
            ["<AIRCOND", "F/CTL>"],
            [""],
            ["<AFS[color]inop", "FUEL>[color]inop"],
            [""],
            ["<COM", "ICE&RAIN>"],
            [""],
            ["<ELEC", "INST>"],
            [""],
            ["<FIRE PROT", "L/G>"],
            [""],
            ["<RETURN[color]cyan", "NAV>"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUCfdsTestAircond.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDUCfdsTestCom.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            CDUCfdsTestElec.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUCfdsTestFire.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDUCfdsTestFctl.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            CDUCfdsTestIce.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            CDUCfdsTestInst.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            CDUCfdsTestLG.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUCfdsTestNav.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsMainMenu.ShowPage(fmc, mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestMenu.ShowPage2(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestMenu.ShowPage2(fmc, mcdu);
        };
    }

    static ShowPage2(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsTestMenu.ShowPage2(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            [""],
            ["<PNEU", "ENG>"],
            [""],
            ["<APU[color]inop", "TOILET>[color]inop"],
            [""],
            ["<INFO SYS[color]inop", "INERTING>[color]inop"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDUCfdsTestPneu.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsMainMenu.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDUCfdsTestEng.ShowPage(fmc, mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestMenu.ShowPage(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestMenu.ShowPage(fmc, mcdu);
        };
    }
}
