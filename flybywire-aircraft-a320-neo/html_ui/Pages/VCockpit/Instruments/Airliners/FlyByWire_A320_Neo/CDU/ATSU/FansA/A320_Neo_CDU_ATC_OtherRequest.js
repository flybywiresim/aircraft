class CDUAtcOtherRequest {
    static CanSendData(data) {
        return data.voiceContact || data.ownSeparation || data.clearance;
    }

    static CanEraseData(data) {
        return data.voiceContact || data.freq || data.ownSeparation || data.clearance;
    }

    static CreateDataBlock() {
        return {
            frequency: null,
            voiceContact: false,
            ownSeparation: false
        };
    }

    static CreateRequest(mcdu, type, values = []) {
        const retval = new Atsu.RequestMessage();
        retval.Station = mcdu.atsu.atc.currentStation();
        retval.Content = Atsu.CpdlcMessagesDownlink[type][1].deepCopy();

        for (let i = 0; i < values.length; ++i) {
            retval.Content.Content[i].Value = values[i];
        }

        return retval;
    }

    static CreateRequests(mcdu, data) {
        const retval = [];

        if (data.voiceContact && data.frequency) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM21", [data.frequency]));
        } else if (data.voiceContact) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM20"));
        }
        if (data.ownSeparation) {
            retval.push(CDUAtcWhenCanWe.CreateRequest(mcdu, "DM74"));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcOtherRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let frequency = "[        ][color]cyan";
        if (data.frequency) {
            frequency = `${data.frequency}[color]cyan`;
        }
        let voice = "\xa0VOICE";
        let contact = "{cyan}{{end}CONTACT------";
        if (data.voiceContact) {
            contact = "\xa0CONTACT------[color]cyan";
            voice = "\xa0VOICE[color]cyan";
        }
        let ownSeparation = "{cyan}{{end}OWN SEPARATION & VMC";
        if (data.ownSeparation) {
            ownSeparation = "\xa0OWN SEPARATION & VMC[color]cyan";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcOtherRequest.CanEraseData(data)) {
            erase = "*ERASE";
        }
        if (CDUAtcOtherRequest.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
        }

        mcdu.setTemplate([
            ["ATC OTHER REQ"],
            [voice, "FREQ\xa0"],
            [contact, frequency],
            [""],
            [ownSeparation],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.voiceContact = false;
                data.frequency = null;
            } else {
                data.voiceContact = true;
            }
            CDUAtcOtherRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.ownSeparation = false;
            } else {
                data.ownSeparation = true;
            }
            CDUAtcOtherRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcOtherRequest.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.frequency = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateVhfFrequency(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewMessage(error);
                } else {
                    data.frequency = value;
                }
            }
            CDUAtcOtherRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcOtherRequest.CanSendData(data)) {
                const messages = CDUAtcOtherRequest.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcOtherRequest.CanSendData(data)) {
                const messages = CDUAtcOtherRequest.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    mcdu.atsu.registerMessages(messages);
                }
                CDUAtcOtherRequest.ShowPage(mcdu);
            }
        };
    }
}
