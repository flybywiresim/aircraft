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
            switch (storedTelexStatus) {
                case "ENABLED":
                    NXDataStore.set("CONFIG_TELEX_STATUS", "DISABLED");
                    mcdu.showErrorMessage("FREE TEXT DISABLED");
                    NXApi.updateTelex()
                        .catch((err) => {
                            if (err !== NXApi.disconnectedError) {
                                console.log("TELEX PING FAILED");
                            }
                        });
                    break;
                default:
                    NXDataStore.set("CONFIG_TELEX_STATUS", "ENABLED");
                    mcdu.showErrorMessage("FREE TEXT ENABLED");

                    const flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
                    NXApi.connectTelex(flightNo)
                        .catch(() => {
                            // ignored: Flight number in use would mean that we already set one
                        });
            }
            CDU_OPTIONS_TELEX.ShowPage(mcdu);
        };
    }
}
