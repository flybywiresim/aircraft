class CDUAtcEmergencyFansA {
    static CanSendData(data) {
        return data.mayday || data.panpan || data.descendingTo || data.personsOnBoard || data.endurance || data.cancelEmergency || data.deviating || data.climbingTo || data.diverting || data.divertingVia || data.voiceContact;
    }

    static CanEraseData(data) {
        return data.mayday || data.panpan || data.descendingTo || data.personsOnBoard || data.endurance || data.cancelEmergency || data.deviating || data.climbingTo || data.diverting || data.divertingVia || data.voiceContact;
    }

    static CreateDataBlock() {
        return {
            mayday: false,
            panpan: false,
            descendingTo: null,
            personsOnBoard: null,
            endurance: null,
            cancelEmergency: false,
            deviating: null,
            climbingTo: null,
            diverting: null,
            divertingVia: null,
            voiceContact: false
        };
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

        if (data.mayday === true) {
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM56"));
        }
        if (data.panpan === true) {
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM55"));
        }
        if (data.descendingTo) {
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM55", [data.descendingTo]));
        }
        if (data.personsOnBoard && data.endurance) {
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM57", [data.endurance, data.personsOnBoard]));
        }
        if (data.cancelEmergency === true) {
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM58"));
        }
        if (data.deviating) {
            const elements = Atsu.InputValidation.expandLateralOffset(data.deviating).split(" ");
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM80", [elements[0], elements[1]]));
        }
        if (data.climbingTo) {
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM29", [data.climbingTo]));
        }
        if (data.diverting && data.divertingVia) {
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM59", [data.diverting, data.divertingVia]));
        }
        if (data.voiceContact === true) {
            retval.push(CDUAtcEmergencyFansA.CreateRequest(mcdu, "DM20"));
        }

        return retval;
    }

    static ShowPage1(mcdu, data = CDUAtcEmergencyFansA.CreateDataBlock()) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCEmergency;

        let mayday = "{cyan}{{end}{red}MAYDAY{end}";
        let panpan = "{cyan}{{end}{amber}PANPAN{end}";
        if (data.panpan === true) {
            panpan = "\xa0{amber}PANPAN{end}";
        }
        if (data.mayday === true) {
            mayday = "\xa0{red}MAYDAY{end}";
        }

        let descendingTo = "{cyan}[   ]{end}";
        if (data.descendingTo) {
            descendingTo = `{cyan}${data.descendingTo}{end}`;
        }

        let personsOnBoard = "{cyan}[ ]{end}";
        let endurance = "{cyan}[   ]{end}";
        if (data.personsOnBoard) {
            personsOnBoard = `{cyan}${data.personsOnBoard}{end}`;
        }
        if (data.endurance) {
            endurance = `{cyan}${data.endurance}{end}`;
        }

        let cancelEmergency = "{amber}CANCEL EMERGENCY{end}{cyan}}{end}";
        if (data.cancelEmergency === true) {
            cancelEmergency = "{amber}CANCEL EMERGENCY{end}\xa0";
        }

        let addText = "ADD TEXT\xa0";
        let eraseData = "\xa0ERASE";
        let sendData = "DCDU\xa0[color]cyan";
        if (CDUAtcEmergencyFansA.CanEraseData(data)) {
            eraseData = "*ERASE";
            addText = "ADD TEXT>";
        }
        if (CDUAtcEmergencyFansA.CanSendData(data)) {
            sendData = "DCDU*[color]cyan";
        }

        mcdu.setTemplate([
            ["EMERGENCY[color]amber", "1", "2"],
            ["", "EMERG ADS-C:OFF\xa0"],
            [mayday, "SET ON*[color]inop"],
            ["", "DESCENDING TO\xa0"],
            [panpan, descendingTo],
            ["\xa0POB", "ENDURANCE\xa0"],
            [personsOnBoard, endurance],
            [""],
            ["", cancelEmergency],
            ["\xa0ALL FIELDS"],
            [eraseData, addText],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
            ["<RETURN", sendData]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.mayday = false;
            } else {
                data.panpan = false;
                data.mayday = true;
            }
            CDUAtcEmergencyFansA.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.panpan = false;
            } else {
                data.panpan = true;
                data.mayday = false;
            }
            CDUAtcEmergencyFansA.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.personsOnBoard = null;
            } else {
                const error = Atsu.InputValidation.validateScratchpadPersonsOnBoard(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.personsOnBoard = parseInt(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcEmergencyFansA.ShowPage1(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcEmergencyFansA.ShowPage1(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.descendingTo = null;
            } else {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.descendingTo = Atsu.InputValidation.formatScratchpadAltitude(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcEmergencyFansA.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.endurance = null;
            } else {
                const error = Atsu.InputValidation.validateScratchpadEndurance(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.endurance = Atsu.InputValidation.formatScratchpadEndurance(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcEmergencyFansA.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.cancelEmergency = false;
            } else {
                data.cancelEmergency = true;
            }
            CDUAtcEmergencyFansA.ShowPage1(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcEmergencyFansA.CanSendData(data)) {
                const messages = CDUAtcEmergencyFansA.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcEmergencyFansA.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.addNewMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcEmergencyFansA.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcEmergencyFansA.ShowPage1(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcEmergencyFansA.ShowPage2(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcEmergencyFansA.ShowPage2(mcdu, data);
        };
    }

    static ShowPage2(mcdu, data = CDUAtcEmergencyFansA.CreateDataBlock()) {
        mcdu.clearDisplay();

        let deviating = "{cyan}[ ]{end}";
        let climbingTo = "{cyan}[   ]{end}";
        if (data.deviating) {
            deviating = `{cyan}${data.deviating}{end}`;
        }
        if (data.climbingTo) {
            climbingTo = `{cyan}${data.climbingTo}{end}`;
        }

        let diverting = "{cyan}[  ]/[  ]{end}";
        if (data.diverting && data.divertingVia) {
            diverting = `{cyan}${data.diverting}/${data.divertingVia}{end}`;
        }

        let reqVoice = "{cyan}{{end}REQ VOICE CONTACT";
        if (data.voiceContact) {
            reqVoice = "{cyan}\xa0REQ VOICE CONTACT{end}";
        }

        let addText = "ADD TEXT\xa0";
        let eraseData = "\xa0ERASE";
        let sendData = "DCDU\xa0[color]cyan";
        if (CDUAtcEmergencyFansA.CanEraseData(data)) {
            eraseData = "*ERASE";
            addText = "ADD TEXT>";
        }
        if (CDUAtcEmergencyFansA.CanSendData(data)) {
            sendData = "DCDU*[color]cyan";
        }

        mcdu.setTemplate([
            ["EMERGENCY[color]amber", "2", "2"],
            ["\xa0DEVIATING", "CLIMBING TO\xa0"],
            [deviating, climbingTo],
            ["\xa0DIVERTING/VIA"],
            [diverting],
            [""],
            [reqVoice],
            [""],
            [""],
            ["\xa0ALL FIELDS"],
            [eraseData, addText],
            ["\xa0ATC MENU", "XFR TO\xa0[color]cyan"],
            ["<RETURN", sendData]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.deviating = null;
            } else {
                const error = Atsu.InputValidation.validateScratchpadOffset(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.deviating = Atsu.InputValidation.formatScratchpadOffset(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcEmergencyFansA.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.diverting = null;
                data.divertingVia = null;
            } else if (value.length !== 0) {
                const split = value.split("/");
                if (split.length === 2) {
                    if (split[0].length !== 0) {
                        const error = Atsu.InputValidation.validateScratchpadPosition(split[0]);
                        if (error === Atsu.AtsuStatusCodes.Ok) {
                            data.diverting = split[0];
                        } else {
                            mcdu.addNewAtsuMessage(error);
                            return;
                        }
                    }

                    const error = Atsu.InputValidation.validateScratchpadPosition(split[1]);
                    if (error === Atsu.AtsuStatusCodes.Ok) {
                        data.divertingVia = split[1];
                    } else {
                        mcdu.addNewAtsuMessage(error);
                    }
                } else if (split.length === 1) {
                    const error = Atsu.InputValidation.validateScratchpadPosition(value);
                    if (error === Atsu.AtsuStatusCodes.Ok) {
                        if (data.diverting) {
                            data.divertingVia = value;
                        } else {
                            data.diverting = value;
                            data.divertingVia = value;
                        }
                    } else {
                        mcdu.addNewAtsuMessage(error);
                    }
                } else {
                    mcdu.addNewAtsuMessage(Atsu.AtsuStatusCodes.FormatError);
                }
            }
            CDUAtcEmergencyFansA.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.voiceContact = false;
            } else {
                data.voiceContact = true;
            }
            CDUAtcEmergencyFansA.ShowPage2(mcdu, data);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcEmergencyFansA.ShowPage2(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                data.climbingTo = null;
            } else {
                const error = Atsu.InputValidation.validateScratchpadAltitude(value);
                if (error === Atsu.AtsuStatusCodes.Ok) {
                    data.climbingTo = Atsu.InputValidation.formatScratchpadAltitude(value);
                } else {
                    mcdu.addNewAtsuMessage(error);
                }
            }
            CDUAtcEmergencyFansA.ShowPage2(mcdu, data);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcEmergencyFansA.CanSendData(data)) {
                const messages = CDUAtcEmergencyFansA.CreateRequests(mcdu, data);
                if (messages.length !== 0) {
                    CDUAtcTextFansA.ShowPage1(mcdu, messages);
                }
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcEmergencyFansA.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.addNewMessage(NXSystemMessages.noAtc);
                } else {
                    const messages = CDUAtcEmergencyFansA.CreateRequests(mcdu, data);
                    if (messages.length !== 0) {
                        mcdu.atsu.registerMessages(messages);
                    }
                    CDUAtcEmergencyFansA.ShowPage2(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcEmergencyFansA.ShowPage1(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcEmergencyFansA.ShowPage1(mcdu, data);
        };
    }
}
