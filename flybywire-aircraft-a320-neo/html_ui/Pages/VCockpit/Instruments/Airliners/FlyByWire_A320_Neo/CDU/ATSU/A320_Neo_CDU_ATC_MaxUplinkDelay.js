class CDUAtcMaxUplinkDelay {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        let activeAtc = "----";
        if (mcdu.atsu.atc.currentStation() !== "") {
            activeAtc = mcdu.atsu.atc.currentStation();
        }

        let currentDelay = "\xa0NONE[color]cyan";
        if (mcdu.atsu.atc.maxUplinkDelay !== -1) {
            currentDelay = `\xa0${mcdu.atsu.atc.maxUplinkDelay}[color]cyan`;
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
            if (mcdu.atsu.atc.currentStation() === "") {
                mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
            } else {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.atsu.atc.maxUplinkDelay = -1;
                    CDUAtcMaxUplinkDelay.ShowPage(mcdu);
                } else if (value) {
                    if (/^[0-9]{3}(S)*$/.test(value)) {
                        const delay = parseInt(value.replace("S", ""));
                        if (delay < 5 || delay > 999) {
                            mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                        } else {
                            mcdu.atsu.atc.maxUplinkDelay = delay;
                            CDUAtcMaxUplinkDelay.ShowPage(mcdu);
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
