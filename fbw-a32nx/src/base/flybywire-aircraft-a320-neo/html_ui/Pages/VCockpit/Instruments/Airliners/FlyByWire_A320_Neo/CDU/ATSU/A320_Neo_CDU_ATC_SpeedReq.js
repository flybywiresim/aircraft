class CDUAtcSpeedRequest {
    static CreateDataBlock() {
        return {
            speed: null,
            whenSpeed: null,
        };
    }

    static CanSendData(data) {
        return data.speed || data.whenSpeed;
    }

    static CanEraseData(data) {
        return data.speed || data.whenSpeed;
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

        if (data.speed) {
            retval.push(CDUAtcSpeedRequest.CreateRequest(mcdu, "DM18", [data.speed]));
        }
        if (data.whenSpeed) {
            retval.push(CDUAtcSpeedRequest.CreateRequest(mcdu, "DM49", [data.whenSpeed]));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcSpeedRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let speed = "[ ][color]cyan";
        if (data.speed) {
            speed = `${data.speed}[color]cyan`;
        }

        let speedWhenSmall = "";
        let speedWhen = "";
        if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
            speedWhenSmall = "\xa0WHEN CAN WE EXPECT SPD";
            speedWhen = "[ ][color]cyan";
            if (data.whenSpeed) {
                speedWhen = `${data.whenSpeed}[color]cyan`;
            }
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcSpeedRequest.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
        }
        if (CDUAtcSpeedRequest.CanEraseData(data)) {
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["ATC SPEED REQ"],
            ["\xa0SPEED[color]white"],
            [speed],
            [speedWhenSmall],
            [speedWhen],
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
                data.speed = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.speed = Atsu.InputValidation.formatScratchpadSpeed(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcSpeedRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansA) {
                if (value === FMCMainDisplay.clrValue) {
                    data.whenSpeed = null;
                } else if (value) {
                    const error = Atsu.InputValidation.validateScratchpadSpeed(value);
                    if (error === Atsu.AtsuStatusCodes.Ok) {
                        data.whenSpeed = Atsu.InputValidation.formatScratchpadSpeed(value);
                    } else {
                        mcdu.addNewAtsuMessage(error);
                    }
                }
                CDUAtcSpeedRequest.ShowPage(mcdu, data);
            }
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcSpeedRequest.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.offset = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadOffset(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.offset = Atsu.InputValidation.formatScratchpadOffset(value);
                    data.offsetStart = null;
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcSpeedRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = async (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.weatherDeviation = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadOffset(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.weatherDeviation = Atsu.InputValidation.formatScratchpadOffset(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcSpeedRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.backOnTrack = false;
            } else {
                data.backOnTrack = true;
            }
            CDUAtcSpeedRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcSpeedRequest.CanSendData(data)) {
                const messages = CDUAtcSpeedRequest.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcSpeedRequest.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcSpeedRequest.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcSpeedRequest.ShowPage(mcdu);
                }
            }
        };
    }
}
