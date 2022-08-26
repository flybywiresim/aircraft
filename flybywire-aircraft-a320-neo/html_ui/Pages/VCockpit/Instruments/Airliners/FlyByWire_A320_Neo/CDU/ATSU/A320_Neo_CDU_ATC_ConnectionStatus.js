class CDUAtcConnectionStatus {
    static ShowPage(mcdu, store = { "disconnectInProgress": false, "disconnectAvail": false }) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCConnectionStatus;

        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.ATCConnectionStatus) {
                CDUAtcConnectionStatus.ShowPage(mcdu, store);
            }
        }, mcdu.PageTimeout.Default);

        let currentStation = "-----------[color]white";
        let atcDisconnect = "DISCONNECT\xa0[color]cyan";
        if (!store["disconnectInProgress"]) {
            if (mcdu.atsu.atc.currentStation() !== "") {
                currentStation = `${mcdu.atsu.atc.currentStation()}[color]green`;
                atcDisconnect = "DISCONNECT*[color]cyan";
                store["disconnectAvail"] = true;
            } else {
                store["disconnectAvail"] = false;
            }
        }

        let nextStation = "-----------";
        if (mcdu.atsu.atc.nextStation() !== "") {
            nextStation = `${mcdu.atsu.atc.nextStation()}[color]green`;
        }

        mcdu.setTemplate([
            ["CONNECTION STATUS"],
            ["\xa0ACTIVE ATC"],
            [currentStation],
            ["\xa0NEXT ATC", "ALL ATC\xa0[color]cyan"],
            [nextStation, atcDisconnect],
            [""],
            [""],
            ["-------ADS-C: ARMED-------"],
            ["\xa0SET OFF[color]inop"],
            [""],
            ["", "ADS-C DETAIL>[color]inop"],
            ["\xa0CONNECTION", ""],
            ["<RETURN", "NOTIFICATION>"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcConnection.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            if (!store["disconnectAvail"]) {
                mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
            } else if (!store["disconnectInProgress"]) {
                store["disconnectInProgress"] = true;
                store["disconnectAvail"] = false;
                CDUAtcConnectionStatus.ShowPage(mcdu, store);

                mcdu.atsu.atc.logoff().then((code) => {
                    store["disconnectInProgress"] = false;
                    if (code !== Atsu.AtsuStatusCodes.Ok) {
                        store["disconnectAvail"] = true;
                        mcdu.addNewAtsuMessage(code);
                    } else {
                        CDUAtcConnectionStatus.ShowPage(mcdu, store);
                    }
                });
            }
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcConnectionNotification.ShowPage(mcdu);
        };
    }
}
