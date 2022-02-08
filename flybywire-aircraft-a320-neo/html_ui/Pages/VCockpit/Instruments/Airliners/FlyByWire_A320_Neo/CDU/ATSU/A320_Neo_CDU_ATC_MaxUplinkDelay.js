class CDUAtcMaxUplinkDelay {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        let activeAtc = "----";
        if (mcdu.atsuManager.atc.currentStation() !== "") {
            activeAtc = mcdu.atsuManager.atc.currentStation();
        }

        mcdu.setTemplate([
            ["MAX UPLINK DELAY"],
            [""],
            [""],
            ["\xa0MODIFY ONLY ON DEMAND OF"],
            [`ACTIVE ATC : ${activeAtc}`],
            [""],
            [""],
            ["\xa0MAX UPLINK DELAY"],
            ["\xa0NONE[color]inop"],
            [""],
            [""],
            ["\xa0ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
