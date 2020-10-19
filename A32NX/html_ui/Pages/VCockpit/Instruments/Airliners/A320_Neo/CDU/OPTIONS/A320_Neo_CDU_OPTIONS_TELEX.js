class CDU_OPTIONS_TELEX {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedTelexStatus = GetStoredData("A32NX_CONFIG_TELEX_STATUS");
        if (!storedTelexStatus) {
            SetStoredData("A32NX_CONFIG_TELEX_STATUS", "DISABLED");
            CDU_OPTIONS_TELEX.ShowPage(mcdu);
        }

        let telexToggleText;
        switch(storedTelexStatus) {
            case "ENABLED":
                telexToggleText = "DISABLE*[color]blue";
                break;
            default:
                telexToggleText = "ENABLE*[color]blue";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["", "", "AOC FREE TEXT"],
            ["WARNING:[color]red"],
            ["[b-text]ALL MSGS ARE PUBLICLY"],
            ["[s-text]READABLE. IF ENABLED,"],
            ["[b-text]AIRCRAFT POSITION DATA WILL"],
            ["[s-text]ALSO BE PUBLISHED FOR THE"],
            ["[b-text]DURATION OF THE FLIGHT,"],
            ["[s-text]WHILE CONNECTED."],
            ["[b-text]MSGS ARE NOT MODERATED."],
            ["[s-text]USE AT YOUR OWN RISK.[color]red"],
            ["", "CONFIRM[color]blue"],
            ["<RETURN[color]blue", telexToggleText]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        }
        mcdu.onRightInput[5] = () => {
            let reEnter = false;
            switch(storedTelexStatus) {
                case "ENABLED":
                    SetStoredData("A32NX_CONFIG_TELEX_STATUS", "DISABLED");
                    SimVar.SetSimVarValue("L:A32NX_Telex_ID", "Number", 0);
                    mcdu.showErrorMessage("FREE TEXT DISABLED");
                    break;
                default:
                    SetStoredData("A32NX_CONFIG_TELEX_STATUS", "ENABLED");
                    if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") != "") {
                        SimVar.SetSimVarValue("ATC FLIGHT NUMBER", "string", "", "FMC");
                        mcdu.showErrorMessage("RE-ENTER FLIGHT NUM");
                        reEnter = true;
                    } else {
                        mcdu.showErrorMessage("FREE TEXT ENABLED");
                    }
            }
            if (!reEnter) {
                CDU_OPTIONS_TELEX.ShowPage(mcdu);
            } else {
                CDUInitPage.ShowPage1(mcdu);
            }         
        }
    }
}