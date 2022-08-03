class CDUAtcProcedureRequest {
    static CreateDataBlock() {
        return {
            sid: null,
            departureTransition: null,
            star: null,
            arrivalTransition: null,
        };
    }

    static CanSendData(data) {
        return data.sid || data.departureTransition || data.star || data.arrivalTransition;
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

        if (data.sid) {
            retval.push(CDUAtcProcedureRequest.CreateRequest(mcdu, "DM23", [data.sid]));
        }
        if (data.departureTransition) {
            retval.push(CDUAtcProcedureRequest.CreateRequest(mcdu, "DM23", [data.departureTransition]));
        }
        if (data.star) {
            retval.push(CDUAtcProcedureRequest.CreateRequest(mcdu, "DM23", [data.star]));
        }
        if (data.arrivalTransition) {
            retval.push(CDUAtcProcedureRequest.CreateRequest(mcdu, "DM23", [data.arrivalTransition]));
        }

        return retval;
    }

    static ShowPage(mcdu, data = CDUAtcProcedureRequest.CreateDataBlock()) {
        mcdu.clearDisplay();

        let sid = "[   ][color]cyan";
        let star = "[   ][color]cyan";
        let arrivalTransition = "[   ][color]cyan";
        let departureTransition = "[   ][color]cyan";

        if (data.sid) {
            sid = `${data.sid}[color]cyan`;
        }
        if (data.star) {
            star = `${data.star}[color]cyan`;
        }
        if (data.arrivalTransition) {
            arrivalTransition = `${data.arrivalTransition}[color]cyan`;
        }
        if (data.departureTransition) {
            departureTransition = `${data.departureTransition}[color]cyan`;
        }

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcProcedureRequest.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["PROCEDURE REQ"],
            ["\xa0SID--------------TRANS\xa0"],
            [sid, departureTransition],
            ["\xa0STAR---------------VIA\xa0"],
            [star, arrivalTransition],
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
                data.sid = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadPosition(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.sid = value;
                }
            }
            CDUAtcProcedureRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.star = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadPosition(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.star = value;
                }
            }
            CDUAtcProcedureRequest.ShowPage(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcProcedureRequest.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.departureTransition = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadPosition(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.departureTransition = value;
                }
            }
            CDUAtcProcedureRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.arrivalTransition = null;
            } else if (value) {
                const error = Atsu.InputValidation.validateScratchpadPosition(value);
                if (error !== Atsu.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(error);
                } else {
                    data.arrivalTransition = value;
                }
            }
            CDUAtcProcedureRequest.ShowPage(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcProcedureRequest.CanSendData(data)) {
                const messages = CDUAtcProcedureRequest.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcProcedureRequest.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcProcedureRequest.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcProcedureRequest.ShowPage(mcdu);
                }
            }
        };
    }
}
