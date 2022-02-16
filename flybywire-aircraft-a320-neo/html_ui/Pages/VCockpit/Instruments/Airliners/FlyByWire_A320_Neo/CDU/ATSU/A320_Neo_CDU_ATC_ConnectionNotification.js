class CDUAtcConnectionNotification {
    static ShowPage(mcdu, store = {"atcCenter": "", "logonAllowed": false, "loginState": 0}) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCNotification;

        let flightNo = "______[color]amber";
        let atcStation = "____[color]amber";
        let atcStationAvail = false;
        let flightNoAvail = false;
        let fromToAvail = false;
        let centerTitleLeft = "\xa0ACT CENTER[color]white";
        let centerTitleRight = "";
        let notificationStatus = "";

        if (store["loginState"] === 1) {
            centerTitleLeft = "\xa0ATC CENTER-NOTIFYING[color]white";
        } else if (store["loginState"] === 2) {
            centerTitleLeft = "\xa0ATC-CENTER-[color]white";
            centerTitleRight = "NOTIF FAILED[color]red";
        }
        if (store["atcCenter"] !== "" && store["loginState"] === 0) {
            atcStation = `${store["atcCenter"]}[color]cyan`;
            atcStationAvail = true;
        }
        if (mcdu.flightPlanManager.getOrigin() !== null && mcdu.atsuManager.flightNumber().length !== 0) {
            flightNo = mcdu.atsuManager.flightNumber() + "[color]green";
            flightNoAvail = true;
        }
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            fromToAvail = true;
        }

        let notifyButton;
        if (atcStationAvail && flightNoAvail && fromToAvail && store["loginState"] === 0) {
            notifyButton = "NOTIFY*[color]cyan";
            store["logonAllowed"] = true;
        } else {
            notifyButton = "NOTIFY\xa0[color]cyan";
            store["logonAllowed"] = false;
        }
        if (!flightNoAvail || !fromToAvail) {
            notificationStatus = "NOTIFICATION UNAVAILABLE";
        }

        let linesColor;
        if (atcStationAvail && flightNoAvail && fromToAvail) {
            linesColor = "[color]cyan";
        } else {
            linesColor = "[color]white";
        }

        let notificationMessage = "";
        if (mcdu.atsuManager.atc.logonInProgress()) {
            const seconds = Math.floor(mcdu.atsuManager.atc.nextStationNotificationTime());
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds - hours * 3600) / 60);
            const zeroPad = (num, places) => String(num).padStart(places, 0);

            // check if the page is loaded again
            if (store["atcCenter"] !== mcdu.atsuManager.atc.nextStation()) {
                store["atcCenter"] = mcdu.atsuManager.atc.nextStation();
            }

            notificationMessage = `${store["atcCenter"]} NOTIFIED ${`${zeroPad(hours, 2)}${zeroPad(minutes, 2)}Z`}[color]green`;
        } else if (mcdu.atsuManager.atc.currentStation() !== '') {
            notificationMessage = `${mcdu.atsuManager.atc.currentStation()}[color]green`;
        }

        mcdu.setTemplate([
            ["NOTIFICATION"],
            ["\xa0ATC FLT NBR"],
            [flightNo],
            [centerTitleLeft, centerTitleRight],
            [atcStation, notifyButton, `---------${linesColor}`],
            [""],
            [""],
            [""],
            [notificationMessage],
            [notificationStatus],
            [""],
            ["\xa0ATC MENU", "CONNECTION\xa0"],
            ["<RETURN", "STATUS>"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (store["loginState"] === 1 && mcdu.atsuManager.atc.nextStation() !== store["atcCenter"]) {
                mcdu.addNewMessage(NXSystemMessages.systemBusy);
                return;
            }

            store["loginState"] = 0;
            if (value.length !== 4 || /^[A-Z()]*$/.test(value) === false) {
                mcdu.addNewMessage(NXSystemMessages.formatError);
            } else if (mcdu.atsuManager.flightNumber().length === 0) {
                mcdu.addNewMessage(NXFictionalMessages.fltNbrMissing);
            } else {
                store["atcCenter"] = "";

                mcdu.atsuManager.isRemoteStationAvailable(value).then((code) => {
                    if (code !== Atsu.AtsuStatusCodes.Ok) {
                        mcdu.addNewAtsuMessage(code);
                        store["atcCenter"] = "";
                    } else {
                        store["atcCenter"] = value;
                    }

                    if (mcdu.page.Current === mcdu.page.ATCNotification) {
                        CDUAtcConnectionNotification.ShowPage(mcdu, store);
                    }
                });
            }

            CDUAtcConnectionNotification.ShowPage(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = async () => {
            if (store["logonAllowed"] === true) {
                store["loginState"] = 1;

                mcdu.atsuManager.atc.logon(store["atcCenter"]).then((code) => {
                    if (code === Atsu.AtsuStatusCodes.Ok) {
                        // check if the login was successful
                        const interval = setInterval(() => {
                            if (!mcdu.atsuManager.atc.logonInProgress()) {
                                if (mcdu.atsuManager.atc.currentStation() === store["atcCenter"]) {
                                    store["loginState"] = 0;
                                } else {
                                    store["loginState"] = 2;
                                }

                                store["atcCenter"] = "";
                                clearInterval(interval);
                            }

                            if (mcdu.page.Current === mcdu.page.ATCNotification) {
                                CDUAtcConnectionNotification.ShowPage(mcdu, store);
                            }
                        }, 5000);
                    } else {
                        mcdu.addNewAtsuMessage(code);
                    }
                });
            } else {
                mcdu.addNewMessage(NXSystemMessages.mandatoryFields);
            }

            CDUAtcConnectionNotification.ShowPage(mcdu, store);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            CDUAtcConnectionStatus.ShowPage(mcdu);
        };
    }
}
