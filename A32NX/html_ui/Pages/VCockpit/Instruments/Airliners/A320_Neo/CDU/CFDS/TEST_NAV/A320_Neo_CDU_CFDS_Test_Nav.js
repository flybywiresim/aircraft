class CDUCfdsTestNav {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            ["", "", "NAV"],
            ["<ADR 1", "IR 3>"],
            [""],
            ["<IR 1", "RA 1>"],
            [""],
            ["<ADR 2", "RA 2>"],
            [""],
            ["<IR 2", "DME 1>"],
            [""],
            ["<ADR 3", "DME 2>"],
            [""],
            ["<RETURN[color]blue", "MMR 1>"]
        ]);

        // INOP BUTTONS
        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[4] = () => {
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
        mcdu.onRightInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onRightInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onRightInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onRightInput[5] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        }

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestNav.ShowPage3(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestNav.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            ["", "", "NAV"],
            ["<MMR 2", "ADF 1>"],
            [""],
            ["<VOR 1", "ADF 2>"],
            [""],
            ["<VOR 2", "ATC 1>"],
            [""],
            ["<RADAR 1", "ATC 2>"],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        // INOP BUTTONS
        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[3] = () => {
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
        mcdu.onRightInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onRightInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
 

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        }

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestNav.ShowPage(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestNav.ShowPage3(mcdu);
        };
    }

    static ShowPage3(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            ["", "", "NAV"],
            ["<HUD"],
            [""],
            ["<GPWC"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<TCAS"],
            [""],
            ["<RETURN[color]blue"]
        ]);

        // INOP BUTTONS
        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        }

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestNav.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestNav.ShowPage(mcdu);
        };
    }
}