class CDU_OPTIONS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'MAINT';

 
        const storedTelexStatus = GetStoredData("A32NX_CONFIG_TELEX_STATUS");
        if (!storedTelexStatus) {
            SetStoredData("A32NX_CONFIG_TELEX_STATUS", "DISABLED");
            CDU_OPTIONS_TELEX.ShowPage(mcdu);
        }
        let telexStatus;
        if (storedTelexStatus == "ENABLED") {
            telexStatus = "<DISABLE";
        } else {
            telexStatus = "<ENABLE";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["AOC[color]green", "ADIRS[color]green"],
            ["<ATIS SRC", "ALIGN TIME>"],
            ["AOC[color]green", "THR REDC[color]green"],
            ["<METAR SRC", "SET ALT>"],
            ["AOC[color]green", "DMC SELF-TEST[color]green"],
            ["<SIGMET SRC", "SET TIME>"],
            ["AOC[color]green"],
            ["<TAF SRC"],
            ["FREE TEXT[color]green"],
            [telexStatus],
            [""],
            ["<RETURN[color]blue"]
        ]);

        
        mcdu.onLeftInput[0] = () => {
            CDU_OPTIONS_ATIS.ShowPage(mcdu);
        }
        mcdu.onLeftInput[1] = () => {
            CDU_OPTIONS_METAR.ShowPage(mcdu);
        }
        mcdu.onLeftInput[3] = () => {
            CDU_OPTIONS_TAF.ShowPage(mcdu);
        }
        mcdu.onLeftInput[4] = () => {
            CDU_OPTIONS_TELEX.ShowPage(mcdu);
        }
        mcdu.onLeftInput[5] = () => {
            CDUMenuPage.ShowPage(mcdu);
        }

        mcdu.onRightInput[0] = () => {
            CDU_OPTIONS_ADIRS.ShowPage(mcdu);
        }       
    }
}