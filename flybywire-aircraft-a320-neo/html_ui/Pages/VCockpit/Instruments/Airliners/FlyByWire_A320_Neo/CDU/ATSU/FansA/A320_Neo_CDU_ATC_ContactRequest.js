class CDUAtcContactRequest {
    static CreateDataBlock() {
        return {
            requestContact: false,
        };
    }

    static CanSendData(data) {
        return data.requestContact;
    }

    static CreateRequest(mcdu, type, values = []) {
        const retval = new Atsu.CpdlcMessage();
        retval.Station = mcdu.atsu.atc.currentStation();
        retval.Content.push(Atsu.CpdlcMessagesDownlink[type][1].deepCopy());

        for (let i = 0; i < values.length; ++i) {
            retval.Content[0].Content[i].Value = values[i];
        }

        return retval;
    }

    static CreateRequests(mcdu, data) {
        const retval = [];

        if (data.requestContact) {
            retval.push(CDUAtcContactRequest.CreateRequest(mcdu, "DM20"));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcContactRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let requestContact = "{cyan}{{end}REQ VOICE CONTACT";
        if (data.altitude) {
            requestContact = "{cyan}\xa0REQ VOICE CONTACT{end]";
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcContactRequest.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["CONTACT REQ"],
            [""],
            [requestContact],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0FLIGHT REQ", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.climb = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.climb = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcContactRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.altitude = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.altitude = Atsu.InputValidation.formatScratchpadAltitude(value);
                }
            }
            CDUAtcContactRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcContactRequest.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcContactRequest.CanSendData(data)) {
                const messages = CDUAtcContactRequest.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcContactRequest.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcContactRequest.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcContactRequest.ShowPage(mcdu);
                }
            }
        };
    }
}
