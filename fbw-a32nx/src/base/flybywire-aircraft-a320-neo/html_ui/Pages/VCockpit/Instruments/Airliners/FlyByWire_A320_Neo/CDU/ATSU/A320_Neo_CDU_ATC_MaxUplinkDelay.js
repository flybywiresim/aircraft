class CDUAtcMaxUplinkDelay {
    static ShowPage(mcdu, updateInProgress = false) {
        mcdu.clearDisplay();

        let activeAtc = "----";
        if (mcdu.atsu.currentStation() !== "") {
            activeAtc = mcdu.atsu.currentStation();
        }

        let currentDelay = "\xa0NONE[color]cyan";
        if (mcdu.atsu.maxUplinkDelay !== -1) {
            currentDelay = `\xa0${mcdu.atsu.maxUplinkDelay}[color]cyan`;
        }

        mcdu.setTemplate([
            ["MAX UPLINK DELAY"],
            [""],
            [""],
            ["MODIFY ONLY ON DEMAND OF"],
            [`ACTIVE ATC : {green}${activeAtc}{end}`],
            [""],
            [""],
            ["\xa0MAX UPLINK DELAY"],
            [currentDelay],
            [""],
            [""],
            ["\xa0ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (mcdu.atsu.currentStation() === "") {
                mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
            } else if (updateInProgress === false) {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.atsu.setMaxUplinkDelay(-1).then((status) => {
                        if (status !== AtsuCommon.AtsuStatusCodes.Ok) {
                            mcdu.addNewAtsuMessage(status);
                        }
                        CDUAtcMaxUplinkDelay.ShowPage(mcdu);
                    });
                    CDUAtcMaxUplinkDelay.ShowPage(mcdu, true);
                } else if (value) {
                    if (/^[0-9]{3}(S)*$/.test(value)) {
                        const delay = parseInt(value.replace("S", ""));
                        if (delay < 5 || delay > 999) {
                            mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                        } else {
                            mcdu.atsu.setMaxUplinkDelay(delay).then((status) => {
                                if (status !== AtsuCommon.AtsuStatusCodes.Ok) {
                                    mcdu.addNewAtsuMessage(status);
                                }
                                CDUAtcMaxUplinkDelay.ShowPage(mcdu);
                            });
                            CDUAtcMaxUplinkDelay.ShowPage(mcdu, true);
                        }
                    } else {
                        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                    }
                }
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };
    }
}
