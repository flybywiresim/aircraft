const ModifyLookupTable = {
    UM132: [{
        text: "PRESENT POSITION",
        type: Atsu.CpdlcMessageContentType.Position,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 5
    }],
    UM133: [{
        text: "PRESENT LEVEL",
        type: Atsu.CpdlcMessageContentType.Level,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 5
    }],
    UM134: [{
        text: "PRESENT SPEED",
        type: Atsu.CpdlcMessageContentType.Speed,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 4
    }],
    UM135: [{
        text: "ASSIGNED LEVEL",
        type: Atsu.CpdlcMessageContentType.Level,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 5
    }],
    UM136: [{
        text: "ASSIGNED SPEED",
        type: Atsu.CpdlcMessageContentType.Speed,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 4
    }],
    UM137: [{
        text: "ASSIGNED ROUTE",
        type: Atsu.CpdlcMessageContentType.Freetext,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 6
    }],
    UM138: [{
        text: "REPORTED TIME",
        type: Atsu.CpdlcMessageContentType.Time,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 4
    }],
    UM139: [{
        text: "REPORTED WAYPOINT",
        type: Atsu.CpdlcMessageContentType.Position,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 5
    }],
    UM140: [{
        text: "NEXT WAYPOINT",
        type: Atsu.CpdlcMessageContentType.Position,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 5
    }],
    UM141: [{
        text: "NEXT WAYPOINT ETA",
        type: Atsu.CpdlcMessageContentType.Time,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 4
    }],
    UM142: [{
        text: "ENSUING WAYPOINT",
        type: Atsu.CpdlcMessageContentType.Position,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 5
    }],
    UM144: [{
        text: "PRESENT SQUAWK",
        type: Atsu.CpdlcMessageContentType.Squawk,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 4
    }],
    UM145: [{
        text: "PRESENT HEADING",
        type: Atsu.CpdlcMessageContentType.Degree,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 3
    }],
    UM146: [{
        text: "PRESENT GROUND TRACK",
        type: Atsu.CpdlcMessageContentType.Degree,
        textIndex: -1,
        valueIndex: 0,
        emptyLength: 3
    }],
    UM148: [{
        text: "CAN %s AT",
        type: Atsu.CpdlcMessageContentType.Time,
        textIndex: 0,
        valueIndex: 1,
        emptyLength: 5
    }, {
        text: "CAN %s NOW",
        type: Atsu.CpdlcMessageContentType.Unknown,
        textIndex: 0,
        valueIndex: -1,
        emptyLength: 0
    }, {
        text: "CANNOT %s",
        type: Atsu.CpdlcMessageContentType.Unknown,
        textIndex: 0,
        valueIndex: -1,
        emptyLength: 0
    }
    ],
    UM151: [{
        text: "CAN %s AT",
        type: Atsu.CpdlcMessageContentType.Time,
        textIndex: 0,
        valueIndex: 1,
        emptyLength: 5
    }, {
        text: "CAN %s NOW",
        type: Atsu.CpdlcMessageContentType.Unknown,
        textIndex: 0,
        valueIndex: -1,
        emptyLength: 0
    }, {
        text: "CANNOT %s",
        type: Atsu.CpdlcMessageContentType.Unknown,
        textIndex: 0,
        valueIndex: -1,
        emptyLength: 0
    }
    ],
    UM152: [{
        text: "CAN %s AT",
        type: Atsu.CpdlcMessageContentType.Time,
        textIndex: 0,
        valueIndex: 1,
        emptyLength: 5
    }, {
        text: "CAN %s NOW",
        type: Atsu.CpdlcMessageContentType.Unknown,
        textIndex: 0,
        valueIndex: -1,
        emptyLength: 0
    }, {
        text: "CANNOT %s",
        type: Atsu.CpdlcMessageContentType.Unknown,
        textIndex: 0,
        valueIndex: -1,
        emptyLength: 0
    }
    ]
};

// TODO UM131 -> present fuel&people
// TODO UM147 -> request pos-rep

class CDUAtcMessageModify {
    static CreateDataBlock(message) {
        const lutEntry = ModifyLookupTable[message.Content.TypeId];

        return {
            value: message.Response.Content.Content[lutEntry[0].valueIndex].Value,
            modified: false,
            multiSelection: lutEntry.length > 1,
            selectedToggles: [false, false]
        };
    }

    static CreateDescriptionLine(message, entry) {
        if (entry.textIndex >= 0) {
            return entry.text.replace("%s", message.Content.Content[entry.textIndex]);
        }
        return entry.text;
    }

    static CreateToggleBasedField(message, data, entry, index) {
        const text = CDUAtcMessageModify.CreateDescriptionLine(message, entry);

        if (data.selectedToggles[index - 1]) {
            return `{cyan}\xa0${text}{end}`;
        }
        return `{cyan}{{end}{white}${text}{end}`;
    }

    static CreateVisualization(message, data) {
        const lutEntry = ModifyLookupTable[message.Content.TypeId];
        const visualization = [["", ""], "", ""];

        const color = !data.selectedToggles[0] && !data.selectedToggles[1] ? "{cyan}" : "{white}";
        visualization[0][0] = `${color}\xa0${CDUAtcMessageModify.CreateDescriptionLine(message, lutEntry[0])}{end}`;
        if (data.value !== "") {
            const prefix = !data.modified ? "{small}" : "";
            const suffix = !data.modified ? "{end}" : "";
            visualization[0][1] = `{cyan}${prefix}${data.value}${suffix}{end}`;
        } else {
            visualization[0][1] = `{amber}${"_".repeat(lutEntry[0].emptyLength)}{end}`;
        }

        if (lutEntry.length > 1) {
            visualization[1] = CDUAtcMessageModify.CreateToggleBasedField(message, data, lutEntry[1], 1);
            visualization[2] = CDUAtcMessageModify.CreateToggleBasedField(message, data, lutEntry[2], 2);
        }

        return visualization;
    }

    static ValidateScratchpadValue(message, value) {
        const lutEntry = ModifyLookupTable[message.Content.TypeId];

        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Position) {
            return Atsu.InputValidation.validateScratchpadPosition(value);
        }
        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Speed) {
            return Atsu.InputValidation.validateScratchpadSpeed(value);
        }
        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Level) {
            return Atsu.InputValidation.validateScratchpadAltitude(value);
        }
        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Freetext) {
            return Atsu.AtsuStatusCodes.Ok;
        }
        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Squawk) {
            return Atsu.InputValidation.validateScratchpadSquawk(value);
        }
        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Degree) {
            return Atsu.InputValidation.validateScratchpadDegree(value);
        }

        return Atsu.AtsuStatusCodes.UnknownMessage;
    }

    static FormatScratchpadValue(message, value) {
        const lutEntry = ModifyLookupTable[message.Content.TypeId];

        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Position || lutEntry[0].type === Atsu.CpdlcMessageContentType.Freetext || lutEntry[0].type === Atsu.CpdlcMessageContentType.Squawk || lutEntry[0].type === Atsu.CpdlcMessageContentType.Degree) {
            return value;
        }
        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Speed) {
            return Atsu.InputValidation.formatScratchpadSpeed(value);
        }
        if (lutEntry[0].type === Atsu.CpdlcMessageContentType.Level) {
            return Atsu.InputValidation.formatScratchpadAltitude(value);
        }

        return Atsu.AtsuStatusCodes.UnknownMessage;
    }

    static CanUpdateMessage(data) {
        return data.value !== "" || data.selectedToggles[0] || data.selectedToggles[1];
    }

    static UpdateResponseMessage(message, data) {
        const lutEntry = ModifyLookupTable[message.Content.TypeId];

        if (data.selectedToggles[0]) {
            const freetext = "WE CAN ACCEPT %s NOW".replace("%s", message.Content.Content[lutEntry[1].textIndex]);
            message.Response.Content = Atsu.CpdlcMessagesDownlink['DM67'][1].deepCopy();
            message.Response.Content.Content[0] = freetext;
        } else if (data.selectedToggles[1]) {
            Atsu.UplinkMessageInterpretation.AppendSemanticAnswer(mcdu.atsu, false, message);
        } else {
            message.Response.Content.Content[lutEntry[0].valueIndex].Value = data.value;
        }
    }

    static ShowPage(mcdu, message, data = CDUAtcMessageModify.CreateDataBlock(message)) {
        mcdu.page.Current = mcdu.page.ATCModify;

        const visualization = CDUAtcMessageModify.CreateVisualization(message, data);

        let cancel = "\xa0CANCEL";
        let addText = "ADD TEXT\xa0";
        let transfer = "DCDU\xa0";
        if (CDUAtcMessageModify.CanUpdateMessage(data)) {
            cancel = "*CANCEL";
            addText = "ADD TEXT>";
            transfer = "DCDU*";
        }

        mcdu.setTemplate([
            ["MODIFY"],
            [data.multiSelection ? visualization[0][0] : ""],
            [data.multiSelection ? visualization[0][1] : ""],
            [!data.multiSelection ? visualization[0][0] : ""],
            [!data.multiSelection ? visualization[0][1] : ""],
            [""],
            [visualization[1]],
            [""],
            [visualization[2]],
            ["{cyan}\xa0PAGE{end}"],
            [`{cyan}${cancel}{end}`, `{white}${addText}{end}`],
            ["\xa0ATC MENU", "{cyan}XFR TO\xa0{end}"],
            ["<RETURN", `{cyan}${transfer}{end}`]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (data.multiSelection) {
                if (value === FMCMainDisplay.clrValue) {
                    data.modified = true;
                    data.value = "";
                } else if (value) {
                    const error = CDUAtcMessageModify.ValidateScratchpadValue(message, value);
                    if (error === Atsu.AtsuStatusCodes.Ok) {
                        data.value = CDUAtcMessageModify.FormatScratchpadValue(message, value);
                        data.modified = true;
                    } else {
                        mcdu.addNewAtsuMessage(error);
                    }
                }
                CDUAtcMessageModify.ShowPage(mcdu, message, data);
            }
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (!data.multiSelection) {
                if (value === FMCMainDisplay.clrValue) {
                    data.modified = true;
                    data.value = "";
                } else if (value) {
                    const error = CDUAtcMessageModify.ValidateScratchpadValue(message, value);
                    if (error === Atsu.AtsuStatusCodes.Ok) {
                        data.value = CDUAtcMessageModify.FormatScratchpadValue(message, value);
                        data.modified = true;
                    } else {
                        mcdu.addNewAtsuMessage(error);
                    }
                }
                CDUAtcMessageModify.ShowPage(mcdu, message, data);
            }
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = (value) => {
            if (data.multiSelection) {
                if (value === FMCMainDisplay.clrValue) {
                    data.selectedToggles[0] = false;
                } else {
                    data.selectedToggles[0] = true;
                    data.selectedToggles[1] = false;
                }
                CDUAtcMessageModify.ShowPage(mcdu, message, data);
            }
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (data.multiSelection) {
                if (value === FMCMainDisplay.clrValue) {
                    data.selectedToggles[1] = false;
                } else {
                    data.selectedToggles[0] = false;
                    data.selectedToggles[1] = true;
                }
                CDUAtcMessageModify.ShowPage(mcdu, message, data);
            }
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = (value) => {
            if (data.multiSelection) {
                if (value === FMCMainDisplay.clrValue) {
                    data.selectedToggles[1] = false;
                } else {
                    data.selectedToggles[0] = false;
                    data.selectedToggles[1] = true;
                }
                CDUAtcMessageModify.ShowPage(mcdu, message, data);
            }
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            if (CDUAtcMessageModify.CanUpdateMessage(data)) {
                mcdu.atsu.atc.updateMessage(message);
                CDUAtcMenu.ShowPage(mcdu);
            }
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcMessageModify.CanUpdateMessage(data)) {
                CDUAtcMessageModify.UpdateResponseMessage(message, data);
                CDUAtcTextFansA.ShowPage1(mcdu, [message]);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcMessageModify.CanUpdateMessage(data)) {
                CDUAtcMessageModify.UpdateResponseMessage(message, data);
                mcdu.atsu.atc.updateMessage(message);
                CDUAtcMenu.ShowPage(mcdu);
            }
        };
    }
}
