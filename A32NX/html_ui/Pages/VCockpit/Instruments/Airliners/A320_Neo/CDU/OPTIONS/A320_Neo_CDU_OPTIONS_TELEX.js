class CDU_OPTIONS_TELEX {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedTelexStatus = NXDataStore.get("CONFIG_ONLINE_FEATURES_STATUS", "UNKNOWN");
        let firstTime = false;

        let telexToggleText;

        switch (storedTelexStatus) {
            case "ENABLED":
                telexToggleText = "DISABLE*[color]cyan";
                break;
            case "UNKNOWN":
                telexToggleText = "ENABLE*[color]cyan";
                firstTime = true;
                break;
            case "DISABLED":
                telexToggleText = "ENABLE*[color]cyan";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS AOC"],
            ["", "", "ONLINE FEATURES"],
            ["WARNING:[color]amber"],
            ["[b-text]ENABLES FREE TEXT AND LIVE"],
            ["[s-text]MAP. IF ENABLED,"],
            ["[b-text]AIRCRAFT POSITION DATA WILL"],
            ["[s-text]BE PUBLISHED FOR THE"],
            ["[b-text]DURATION OF THE FLIGHT."],
            ["[s-text]MSGS ARE PUBLIC, NOT MODERATED."],
            [""],
            ["[s-text]USE AT YOUR OWN RISK.[color]amber"],
            ["", "CONFIRM[color]cyan"],
            firstTime ? ["<LATER[color]cyan", telexToggleText] : ["<RETURN", telexToggleText]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            if (firstTime) {
                CDU_OPTIONS_AOC.ShowPage(mcdu);
                // Take "LATER" as disabling it
                NXDataStore.set("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED");
            } else {
                CDU_OPTIONS_AOC.ShowPage(mcdu);
            }
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            switch (storedTelexStatus) {
                case "ENABLED":
                    NXDataStore.set("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED");
                    mcdu.addNewMessage(NXFictionalMessages.freeTextDisabled);
                    NXApi.disconnectTelex()
                        .catch((err) => {
                            if (err !== NXApi.disconnectedError) {
                                console.log("TELEX DISCONNECT FAILED");
                            }
                        });
                    break;
                default:
                    NXDataStore.set("CONFIG_ONLINE_FEATURES_STATUS", "ENABLED");
                    mcdu.addNewMessage(NXFictionalMessages.freetextEnabled);

                    const flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
                    NXApi.connectTelex(flightNo)
                        .catch((err) => {
                            if (err.status === 409) {
                                mcdu.addNewMessage(NXFictionalMessages.enabledFltNbrInUse);
                            }
                        });
            }
            if (firstTime) {
                CDU_OPTIONS_AOC.ShowPage(mcdu);
            } else {
                CDU_OPTIONS_TELEX.ShowPage(mcdu);
            }
        };
    }
}
