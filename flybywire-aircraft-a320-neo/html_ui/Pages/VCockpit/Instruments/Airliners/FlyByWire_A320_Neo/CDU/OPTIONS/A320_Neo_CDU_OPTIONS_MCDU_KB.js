class CDU_OPTIONS_MCDU_KB {
    static ShowPage(mcdu) {

        mcdu.clearDisplay();

        const mcduInput = NXDataStore.get("MCDU_KB_INPUT", "NONE");

        let all = "*ALLOW INPUT[color]cyan";
        let none = "*NO INPUT[color]cyan";

        switch (mcduInput) {
            case "ALL":
                all = "ALLOW INPUT[color]green";
                break;
            default:
                none = "NO INPUT[color]green";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS REALISM"],
            ["", "", "MCDU KEYBOARD"],
            [all],
            [""],
            [none],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (mcduInput !== "ALL") {
                mcdu.clearFocus();
                //NXDataStore.set("MCDU_KB_INPUT", "ALL");
                CDU_OPTIONS_MCDU_RESET.ShowPage(mcdu, "ALL");
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (mcduInput !== "NONE") {
                mcdu.clearFocus();
                //NXDataStore.set("MCDU_KB_INPUT", "NONE");
                CDU_OPTIONS_MCDU_RESET.ShowPage(mcdu, "NONE");
            }
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };
    }
}
