class CDUAtcTextFansA {
    static CreateDataBlock() {
        return {
            performance: false,
            weather: false,
            turbulence: false,
            medical: false,
            technical: false,
            discretion: false,
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
        if (data.performance || data.weather || data.turbulence || data.medical || data.technical || data.discretion) {
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
        } else if (data.medical) {
            extension = Atsu.CpdlcMessagesDownlink["DM68"][1].deepCopy();
        } else if (data.technical) {
            extension = Atsu.CpdlcMessagesDownlink["DM68"][1].deepCopy();
        } else if (data.discretion) {
            extension = Atsu.CpdlcMessagesDownlink["DM75"][1].deepCopy();
        }

        if (messages.length === 0) {
            // the freetext is set (guaranteed due to CanSendData)
            messages.push(new Atsu.RequestMessage());
            messages[0].Content = freetextElement;
            messages[0].Station = mcdu.atsu.atc.currentStation();
            updateFreetext = false;
        }

        // update all messages, if needed
        if (extension || (updateFreetext && freetextElement)) {
            messages.forEach((message) => {
                if (updateFreetext && freetextElement) {
                    message.Extensions.push(freetextElement);
                }
                if (extension) {
                    message.Extensions.push(extension);
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
        const weather = ["\xa0DUE TO", "{cyan}{{end}WEATHER"];
        if (data.weather) {
            weather[0] += "[color]cyan";
            weather[1] = "\xa0WEATHER[color]cyan";
        }
        const turbulence = ["\xa0DUE TO", "{cyan}{{end}TURBULENCE"];
        if (data.turbulence) {
            turbulence[0] += "[color]cyan";
            turbulence[1] = "\xa0TURBULENCE[color]cyan";
        }
        const medical = ["DUE TO\xa0", "MEDICAL{cyan}}{end}"];
        if (data.medical) {
            medical[0] += "[color]cyan";
            medical[1] = "MEDICAL\xa0[color]cyan";
        }
        const technical = ["DUE TO\xa0", "TECHNICAL{cyan}}{end}"];
        if (data.technical) {
            technical[0] += "[color]cyan";
            technical[1] = "TECHNICAL\xa0[color]cyan";
        }
        const discretion = ["AT PILOT\xa0", "DISCRETION{cyan}}{end}"];
        if (data.discretion) {
            discretion[0] += "[color]cyan";
            discretion[1] = "DISCRETION\xa0[color]cyan";
        }
        let freetext = "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan";
        if (data.freetext[0] !== "") {
            freetext = data.freetext[0];
        }

        mcdu.setTemplate([
            ["TEXT", "1", "2"],
            [acPerform[0], medical[0]],
            [acPerform[1], medical[1]],
            [weather[0], technical[0]],
            [weather[1], technical[1]],
            [turbulence[0], discretion[0]],
            [turbulence[1], discretion[1]],
            ["---------FREE TEXT---------"],
            [freetext],
            ["\xa0ALL FIELDS"],
            [erase],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
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
                data.weather = false;
            } else {
                const oldFreetext = data.freetext;
                data = CDUAtcTextFansA.CreateDataBlock();
                data.weather = true;
                data.freetext = oldFreetext;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
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
            CDUAtcMenu.ShowPage1(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.medical = false;
            } else {
                const oldFreetext = data.freetext;
                data = CDUAtcTextFansA.CreateDataBlock();
                data.medical = true;
                data.freetext = oldFreetext;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.technical = false;
            } else {
                const oldFreetext = data.freetext;
                data = CDUAtcTextFansA.CreateDataBlock();
                data.technical = true;
                data.freetext = oldFreetext;
            }
            CDUAtcTextFansA.ShowPage1(mcdu, messages, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
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

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcTextFansA.CanSendData(messages, data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const prepMessages = CDUAtcTextFansA.CreateMessages(mcdu, messages, data);
                    if (prepMessages) {
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
            ["TEXT", "2", "2"],
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
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
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
            CDUAtcMenu.ShowPage1(mcdu);
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
                    if (prepMessages) {
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
