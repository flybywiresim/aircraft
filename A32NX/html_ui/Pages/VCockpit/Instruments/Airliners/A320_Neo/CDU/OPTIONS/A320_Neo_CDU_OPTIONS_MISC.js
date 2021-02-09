class CDU_OPTIONS_MISC {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedPilotVis = parseInt(NXDataStore.get("CONFIG_PILOT_VISIBILITY", "0"));
        const storedCoPilotVis = parseInt(NXDataStore.get("CONFIG_COPILOT_VISIBILITY", "0"));

        const displayCurrentPilotOption = storedPilotVis ? `{cyan}*{end}{green}SHOW{end}{cyan}/{small}HIDE{end}` : `{cyan}*{small}SHOW{end}{cyan}/{green}HIDE{end}`;
        const displayCurrentCoPilotOption = storedCoPilotVis ? `{green}SHOW{end}{cyan}/{small}HIDE{end}{cyan}*{end}` : `{cyan}{small}SHOW{end}{cyan}/{green}HIDE{end}{cyan}*{end}`;

        mcdu.setTemplate([
            ["A32NX OPTIONS MISC"],
            ["\xa0PILOT", "COPILOT\xa0"],
            [`${displayCurrentPilotOption}`, `${displayCurrentCoPilotOption}`],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[0] = (value) => {
            if (value !== "") {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                const newPVOption = storedPilotVis ? "0" : "1";
                NXDataStore.set("CONFIG_PILOT_VISIBILITY", newPVOption);
                SimVar.SetSimVarValue("L:A32NX_VIS_PILOT_0", "Number", parseInt(newPVOption));
            }
            CDU_OPTIONS_MISC.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[0] = (value) => {
            if (value !== "") {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                const newCPVOption = storedCoPilotVis ? "0" : "1";
                NXDataStore.set("CONFIG_COPILOT_VISIBILITY", newCPVOption);
                SimVar.SetSimVarValue("L:A32NX_VIS_PILOT_1", "Number", parseInt(newCPVOption));
            }
            CDU_OPTIONS_MISC.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
    }
}
