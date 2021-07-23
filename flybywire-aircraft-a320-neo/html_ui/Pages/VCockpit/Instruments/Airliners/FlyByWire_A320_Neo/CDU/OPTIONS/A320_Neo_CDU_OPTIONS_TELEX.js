class CDU_OPTIONS_TELEX {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDU_OPTIONS_TELEX.ShowPage(fmc, mcdu);
        });

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

        // Due to the ',' missing in the font this template does not contain commas.
        mcdu.setTemplate([
            ["A32NX OPTIONS AOC"],
            ["", "", "ONLINE FEATURES"],
            ["WARNING:[color]amber"],
            ["{small}ENABLES FREE TEXT AND{end}"],
            ["{small}LIVE MAP. IF ENABLED{end}"],
            ["{small}AIRCRAFT POSITION DATA{end}"],
            ["{small}IS PUBLISHED FOR THE{end}"],
            ["{small}DURATION OF THE FLIGHT.{end}"],
            ["{small}MSGS ARE PUBLIC AND{end}"],
            ["{small}NOT MODERATED.{end}"],
            ["{small}USE AT YOUR OWN RISK.{end}[color]amber"],
            ["", "CONFIRM[color]cyan"],
            firstTime ? ["<LATER[color]cyan", telexToggleText] : ["<RETURN", telexToggleText]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            if (firstTime) {
                CDU_OPTIONS_AOC.ShowPage(fmc, mcdu);
                // Take "LATER" as disabling it
                NXDataStore.set("CONFIG_ONLINE_FEATURES_STATUS", "DISABLED");
            } else {
                CDU_OPTIONS_AOC.ShowPage(fmc, mcdu);
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
                CDU_OPTIONS_AOC.ShowPage(fmc, mcdu);
            } else {
                CDU_OPTIONS_TELEX.ShowPage(fmc, mcdu);
            }
        };
    }
}
