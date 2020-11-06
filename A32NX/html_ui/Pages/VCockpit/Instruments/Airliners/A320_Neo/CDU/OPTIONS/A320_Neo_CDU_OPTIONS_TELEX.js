class CDU_OPTIONS_TELEX {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedTelexStatus = NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED");

        let telexToggleText;
        switch (storedTelexStatus) {
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
        };
        mcdu.onRightInput[5] = () => {
            let reEnter = false;
            switch (storedTelexStatus) {
                case "ENABLED":
                    NXDataStore.set("CONFIG_TELEX_STATUS", "DISABLED");
                    mcdu.showErrorMessage("FREE TEXT DISABLED");
                    NXApi.disconnectTelex()
                        .catch(() => {
                            console.log('TELEX DISCONNECT ISSUE');
                        });
                    break;
                default:
                    NXDataStore.set("CONFIG_TELEX_STATUS", "ENABLED");
                    SimVar.SetSimVarValue("ATC FLIGHT NUMBER", "string", "", "FMC");
                    mcdu.showErrorMessage("RE-ENTER FLIGHT NUM");
                    reEnter = true;
            }
            if (!reEnter) {
                CDU_OPTIONS_TELEX.ShowPage(mcdu);
            } else {
                CDUInitPage.ShowPage1(mcdu, true);
            }
        };
    }
}