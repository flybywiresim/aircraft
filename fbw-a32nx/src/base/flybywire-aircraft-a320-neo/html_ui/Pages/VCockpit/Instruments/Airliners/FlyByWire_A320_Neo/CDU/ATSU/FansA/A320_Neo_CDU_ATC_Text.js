class CDUAtcTextFansA {
    static CreateDataBlock() {
        return {
            performance: false,
            weather: false,
            turbulence: false,
            discretion: false,
            icing: false,
            freetext: [ "", "", "", "", "" ]
        };
    }

    static CanSendData(messages, data) {
        if (messages.length !== 0) {
            return true;
        }

        const freetext = data.freetext.filter((n) => n);
        return freetext.length !== 0;
    }

    static CanEraseData(data) {
        if (data.performance || data.weather || data.turbulence || data.discretion || data.icing) {
            return true;
        }
        const freetext = data.freetext.filter((n) => n);
        return freetext.length !== 0;
    }

    static CreateMessages(mcdu, messages, data) {
        const freetextLines = data.freetext.filter((n) => n);
        let freetextElement = null;
        let updateFreetext = true;

        // create the freetext elements
        if (freetextLines.length !== 0) {
            if (mcdu.atsu.atc.fansMode() === Atsu.FansMode.FansB) {
                freetextElement = Atsu.CpdlcMessagesDownlink["DM98"][1].deepCopy();
            } else {
                freetextElement = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            }
            freetextElement.Content[0].Value = freetextLines.join("\n");
        }

        // create the extensions
        let extension = null;
        if (data.performance) {
            extension = Atsu.CpdlcMessagesDownlink["DM66"][1].deepCopy();
        } else if (data.weather) {
            extension = Atsu.CpdlcMessagesDownlink["DM65"][1].deepCopy();
        } else if (data.turbulence) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = 'DUE TO TURBULENCE';
        } else if (data.discretion) {
            extension = Atsu.CpdlcMessagesDownlink["DM75"][1].deepCopy();
        } else if (data.icing) {
            extension = Atsu.CpdlcMessagesDownlink["DM67"][1].deepCopy();
            extension.Content[0].Value = 'DUE TO ICING';
        }

        if (messages.length === 0) {
            // the freetext is set (guaranteed due to CanSendData)
            messages.push(new Atsu.CpdlcMessage());
            messages[0].Content.push(freetextElement);
            messages[0].Station = mcdu.atsu.atc.currentStation();
            updateFreetext = false;
        }

        // update all messages, if needed
        if (extension || (updateFreetext && freetextElement)) {
            messages.forEach((message) => {
                if (message.Content[0].TypeId.includes("UM")) {
                    if (updateFreetext && freetextElement) {
                        message.Response.Content.push(freetextElement);
                    }
                    if (extension) {
                        message.Response.Content.push(extension);
                    }
                } else {
                    if (updateFreetext && freetextElement) {
                        message.Content.push(freetextElement);
                    }
                    if (extension) {
                        message.Content.push(extension);
                    }
                }
            });
        }

        return messages;
    }

    static ShowPage1(mcdu, messages = [], data = CDUAtcTextFansA.CreateDataBlock()) {
        mcdu.clearDisplay();

        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcTextFansA.CanSendData(messages, data)) {
            reqDisplay = "DCDU*[color]cyan";
        }
        if (CDUAtcTextFansA.CanEraseData(data)) {
            erase = "*ERASE";
        }

        const acPerform = ["\xa0DUE TO", "{cyan}{{end}A/C PERFORM"];
        if (data.performance) {
            acPerform[0] += "[color]cyan";
            acPerform[1] = "\xa0A/C PERFORM[color]cyan";
        }
        const weather = ["DUE TO\xa0", "WEATHER{cyan}}{end}"];
        if (data.weather) {
            weather[0] += "[color]cyan";
            weather[1] = "WEATHER\xa0[color]cyan";
        }
        const turbulence = ["DUE TO\xa0", "TURBULENCE{cyan}}{end}"];
        if (data.turbulence) {
            turbulence[0] += "[color]cyan";
            turbulence[1] = "TURBULENCE\xa0[color]cyan";
        }
        const discretion = ["\xa0AT PILOTS", "{cyan}{{end}DISCRETION"];
        if (data.discretion) {
            discretion[0] += "[color]cyan";
            discretion[1] = "\xa0DISCRETION[color]cyan";
        }
        const icing = ["DUE TO\xa0", "ICING{cyan}}{end}"];
        if (data.icing) {
            icing[0] += "[color]cyan";
            icing[1] = "ICING\xa0[color]cyan";
        }
        let freetext = "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan";
        if (data.freetext[0] !== "") {
            freetext = data.freetext[0];
        }

        mcdu.setTemplate([
            ["FREE TEXT", "1", "2"],
            [acPerform[0], weather[0]],
            [acPerform[1], weather[1]],
            [discretion[0], turbulence[0]],
            [discretion[1], turbulence[1]],
            ["", icing[0]],
            ["", icing[1]],
            ["---------FREE TEXT---------"],
            [freetext],
            ["\xa0ALL FIELDS"],
            [erase],
            ["\xa0FLIGHT REQ", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.performance = false;
            } else {
                const oldFreetext = data.freetext;
                data = CDUAtcTextFansA.CreateDataBlock();
                data.performance = true;
                data.freetext = oldFreetext;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.discretion = false;
            } else {
                const oldFreetext = data.freetext;
                data = CDUAtcTextFansA.CreateDataBlock();
                data.discretion = true;
                data.freetext = oldFreetext;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.freetext[0] = "";
            } else if (value) {
                data.freetext[0] = value;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcTextFansA.ShowPage1(mcdu, messages);
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
                data.weather = false;
            } else {
                const oldFreetext = data.freetext;
                data = CDUAtcTextFansA.CreateDataBlock();
                data.weather = true;
                data.freetext = oldFreetext;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.turbulence = false;
            } else {
                const oldFreetext = data.freetext;
                data = CDUAtcTextFansA.CreateDataBlock();
                data.turbulence = true;
                data.freetext = oldFreetext;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.icing = false;
            } else {
                const oldFreetext = data.freetext;
                data = CDUAtcTextFansA.CreateDataBlock();
                data.icing = true;
                data.freetext = oldFreetext;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcTextFansA.CanSendData(messages, data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const prepMessages = CDUAtcTextFansA.CreateMessages(mcdu, messages, data);
                    if (prepMessages && prepMessages[0].Content[0].TypeId.includes("UM")) {
                        mcdu.atsu.atc.updateMessage(prepMessages[0]);
                    } else if (prepMessages) {
                        mcdu.atsu.registerMessages(prepMessages);
                    }
                    CDUAtcTextFansA.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcTextFansA.ShowPage2(mcdu, messages, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcTextFansA.ShowPage2(mcdu, messages, data);
        };
    }

    static ShowPage2(mcdu, messages = [], data = CDUAtcTextFansA.CreateDataBlock()) {
        mcdu.clearDisplay();

        let freetext1 = "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan";
        if (data.freetext[1] !== "") {
            freetext1 = data.freetext[1];
        }
        let freetext2 = "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan";
        if (data.freetext[2] !== "") {
            freetext2 = data.freetext[2];
        }
        let freetext3 = "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan";
        if (data.freetext[3] !== "") {
            freetext3 = data.freetext[3];
        }
        let freetext4 = "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan";
        if (data.freetext[4] !== "") {
            freetext4 = data.freetext[4];
        }

        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcTextFansA.CanSendData(messages, data)) {
            reqDisplay = "DCDU*[color]cyan";
        }
        if (CDUAtcTextFansA.CanEraseData(data)) {
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["FREE TEXT", "2", "2"],
            [""],
            [freetext1],
            [""],
            [freetext2],
            [""],
            [freetext3],
            [""],
            [freetext4],
            ["\xa0ALL FIELDS"],
            [erase],
            ["\xa0FLIGHT REQ", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.freetext[1] = "";
            } else if (value) {
                data.freetext[1] = value;
            }
            CDUAtcTextFansA.ShowPage2(mcdu, messages, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.freetext[2] = "";
            } else if (value) {
                data.freetext[2] = value;
            }
            CDUAtcTextFansA.ShowPage2(mcdu, messages, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.freetext[3] = "";
            } else if (value) {
                data.freetext[3] = value;
            }
            CDUAtcTextFansA.ShowPage2(mcdu, messages, data);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.freetext[4] = "";
            } else if (value) {
                data.freetext[4] = value;
            }
            CDUAtcTextFansA.ShowPage2(mcdu, messages, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcTextFansA.ShowPage2(mcdu, messages);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcTextFansA.CanSendData(messages, data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const prepMessages = CDUAtcTextFansA.CreateMessages(mcdu, messages, data);
                    if (prepMessages && prepMessages[0].Content[0].TypeId.includes("UM")) {
                        mcdu.atsu.atc.updateMessage(prepMessages[0]);
                    } else if (prepMessages) {
                        mcdu.atsu.registerMessages(prepMessages);
                    }
                    CDUAtcTextFansA.ShowPage2(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };
    }
}
