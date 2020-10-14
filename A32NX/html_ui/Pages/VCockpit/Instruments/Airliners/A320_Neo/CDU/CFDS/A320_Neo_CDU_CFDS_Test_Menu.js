class CDUCfdsTestMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            [""],
            ["<AIRCOND", "F/CTL>"],
            [""],
            ["<AFS", "FUEL>"],
            [""],
            ["<COM", "ICE+RAIN>"],
            [""],
            ["<ELEC", "INST>"],
            [""],
            ["<FIRE PROT", "L/G>"],
            [""],
            ["<RETURN[color]blue", "NAV>"]
        ]);

        // INOP BUTTONS
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onRightInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[0] = () => {
            CDUCfdsTestAircond.ShowPage(mcdu);
        }
        mcdu.onLeftInput[2] = () => {
            CDUCfdsTestCom.ShowPage(mcdu);
        }
        mcdu.onLeftInput[3] = () => {
            CDUCfdsTestElec.ShowPage(mcdu);
        }
        mcdu.onLeftInput[4] = () => {
            CDUCfdsTestFire.ShowPage(mcdu);
        }
        mcdu.onRightInput[0] = () => {
            CDUCfdsTestFctl.ShowPage(mcdu);
        }
        mcdu.onRightInput[2] = () => {
            CDUCfdsTestIce.ShowPage(mcdu);
        }
        mcdu.onRightInput[3] = () => {
            CDUCfdsTestInst.ShowPage(mcdu);
        }
        mcdu.onRightInput[4] = () => {
            CDUCfdsTestLG.ShowPage(mcdu);
        }
        mcdu.onRightInput[5] = () => {
            CDUCfdsTestNav.ShowPage(mcdu);
        }
        mcdu.onLeftInput[5] = () => {
            CDUCfdsMainMenu.ShowPage(mcdu);
        }

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestMenu.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestMenu.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            [""],
            ["<PNEU", "ENG>"],
            [""],
            ["<APU", "TOILET>"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

         // INOP BUTTONS
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onRightInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onRightInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[0] = () => {
            CDUCfdsTestPneu.ShowPage(mcdu);
        }
        mcdu.onLeftInput[5] = () => {
            CDUCfdsMainMenu.ShowPage(mcdu);
        }
        mcdu.onRightInput[0] = () => {
            CDUCfdsTestEng.ShowPage(mcdu);
        }

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };
    }
}