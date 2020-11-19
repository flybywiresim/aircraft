class CDU_OPTIONS_TELEX {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedTelexStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "UNKNOWN");
        let firstTime = false;

        let telexToggleText;

        switch (storedTelexStatus) {
            case "ENABLED":
                telexToggleText = "DISABLE*[color]blue";
                break;
            case "UNKNOWN":
                telexToggleText = "ENABLE*[color]blue";
                firstTime = true;
                break;
            case "DISABLED":
                telexToggleText = "ENABLE*[color]blue";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            ["", "", "ONLINE FEATURES"],
            ["WARNING:[color]red"],
            ["[b-text]ENABLES FREE TEXT AND LIVE"],
            ["[s-text]MAP. IF ENABLED,"],
            ["[b-text]AIRCRAFT POSITION DATA WILL"],
            ["[s-text]BE PUBLISHED FOR THE"],
            ["[b-text]DURATION OF THE FLIGHT."],
            ["[s-text]MSGS ARE PUBLIC, NOT MODERATED."],
            [""],
            ["[s-text]USE AT YOUR OWN RISK.[color]red"],
            ["", "CONFIRM[color]blue"],
            firstTime ? ["<LATER[color]blue", telexToggleText] : ["<RETURN[color]blue", telexToggleText]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            if (firstTime) {
                CDUMenuPage.ShowPage(mcdu);
                // Take "LATER" as disabling it
                NXDataStore.set("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED");
            } else {
                CDU_OPTIONS_MainMenu.ShowPage(mcdu);
            }
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            switch (storedTelexStatus) {
                case "ENABLED":
                    NXDataStore.set("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED");
                    mcdu.showErrorMessage("FREE TEXT DISABLED");
                    NXApi.disconnectTelex()
                        .catch((err) => {
                            if (err !== NXApi.disconnectedError) {
                                console.log("TELEX DISCONNECT FAILED");
                            }
                        });
                    break;
                default:
                    NXDataStore.set("CONFIG_ONLINE_FEATURES_STATUS", "ENABLED");
                    mcdu.showErrorMessage("FREE TEXT ENABLED");

                    const flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
                    NXApi.connectTelex(flightNo)
                        .catch((err) => {
                            if (err.status === 409) {
                                mcdu.showErrorMessage("ENABLED. FLT NBR IN USE");
                            }
                        });
            }
            if (firstTime) {
                CDUMenuPage.ShowPage(mcdu);
            } else {
                CDU_OPTIONS_TELEX.ShowPage(mcdu);
            }
        };
    }
}
