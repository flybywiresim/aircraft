class CDU_OPTIONS_MCDU_KB {
    static ShowPage(mcdu, reset = false) {
        mcdu.clearDisplay();

        const mcduInput = NXDataStore.get("MCDU_KB_INPUT", "NONE");

        let all = "*FULL[color]cyan";
        let alt = "*POP-UP ONLY[color]cyan";
        let none = "*NONE[color]cyan";

        let reset_warn = "";
        let reset_txt = "";

        if (reset) {
            mcdu.addNewMessage(NXFictionalMessages.resetMcdu);
            reset_warn = "\xa0{red}WARNING: DATA LOSS{end}";
            reset_txt = "<RESET MCDU";
        }

        switch (mcduInput) {
            case "ALL":
                all = "FULL[color]green";
                break;
            case "RALT":
                alt = "POP-UP ONLY[color]green";
                break;
            default:
                none = "NONE[color]green";
        }

        mcdu.setTemplate([
            ["A32NX OPTIONS REALISM"],
            ["", "", "MCDU KEYBOARD"],
            [all],
            [""],
            [alt],
            [""],
            [none],
            [""],
            [""],
            [reset_warn],
            [reset_txt],
            [""],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (mcduInput !== "ALL") {
                mcdu.clearFocus();
                NXDataStore.set("MCDU_KB_INPUT", "ALL");
                CDU_OPTIONS_MCDU_KB.ShowPage(mcdu, true);
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (mcduInput !== "RALT") {
                NXDataStore.set("MCDU_KB_INPUT", "RALT");
                mcdu.clearFocus();
                if (mcduInput === "ALL") {
                    CDU_OPTIONS_MCDU_KB.ShowPage(mcdu, true);
                } else {
                    CDU_OPTIONS_MCDU_KB.ShowPage(mcdu, reset);
                }
            }
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            if (mcduInput !== "NONE") {
                NXDataStore.set("MCDU_KB_INPUT", "NONE");
                mcdu.clearFocus();
                if (mcduInput === "ALL") {
                    CDU_OPTIONS_MCDU_KB.ShowPage(mcdu, true);
                } else {
                    CDU_OPTIONS_MCDU_KB.ShowPage(mcdu, reset);
                }
            }
        };
        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            if (reset)
                window.document.location.reload(true);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };
    }
}
