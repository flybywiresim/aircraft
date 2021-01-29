/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

class CDUAocMessagesReceived {
    static ShowPage(mcdu, messages = null, page = 0) {
        if (!messages) {
            messages = mcdu.getMessages();
        }
        mcdu.clearDisplay();

        page = Math.min(Math.floor((messages.length - 1) / 5), page);

        mcdu.refreshPageCallback = () => {
            this.ShowPage(mcdu, null, page);
        };

        const offset = 5 + page * 5;

        const msgTimeHeaders = [];
        msgTimeHeaders.length = 6;
        for (let i = 5; i > 0; i--) {
            let header = "";
            if (messages[offset - i]) {
                header += messages[offset - i]["time"];
                if (messages[offset - i]["opened"]) {
                    header += " - VIEWED[color]green";
                } else {
                    header += " - NEW[color]green";
                }
            }
            msgTimeHeaders[i] = header;
        }

        mcdu.setTemplate([
            ["AOC RCVD MSGS"],
            [msgTimeHeaders[5]],
            [`${messages[offset - 5] ? "<" + messages[offset - 5]["type"] : "NO MESSAGES"}`],
            [msgTimeHeaders[4]],
            [`${messages[offset - 4] ? "<" + messages[offset - 4]["type"] : ""}`],
            [msgTimeHeaders[3]],
            [`${messages[offset - 3] ? "<" + messages[offset - 3]["type"] : ""}`],
            [msgTimeHeaders[2]],
            [`${messages[offset - 2] ? "<" + messages[offset - 2]["type"] : ""}`],
            [msgTimeHeaders[1]],
            [`${messages[offset - 1] ? "<" + messages[offset - 1]["type"] : ""}`],
            [""],
            ["<RETURN"]
        ]);

        if (messages.length > ((page + 1) * 5)) {
            mcdu.onNextPage = () => {
                CDUAocMessagesReceived.ShowPage(mcdu, messages, page + 1);
            };
        }
        if (page > 0) {
            mcdu.onPrevPage = () => {
                CDUAocMessagesReceived.ShowPage(mcdu, messages, page - 1);
            };
        }

        for (let i = 0; i < 5; i++) {
            mcdu.leftInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };

            mcdu.onLeftInput[i] = (value) => {
                if (messages[offset - 5 + i]) {
                    if (value === FMCMainDisplay.clrValue) {
                        mcdu.deleteMessage(offset - 5 + i);
                        CDUAocMessagesReceived.ShowPage(mcdu, messages, page);
                    } else {
                        CDUAocRequestsMessage.ShowPage(mcdu, messages[offset - 5 + i]);
                    }
                }
            };
        }

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}
