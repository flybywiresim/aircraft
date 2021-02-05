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

class CDUAocMessagesSent {
    static ShowPage(mcdu, messages = null, offset = 0) {
        if (!messages) {
            messages = mcdu.getSentMessages();
        }
        mcdu.clearDisplay();

        const msgTimeHeaders = [];
        msgTimeHeaders.length = 5;
        for (let i = 0; i < 5; i++) {
            let header = "";
            if (messages[offset + i]) {
                header += messages[offset + i]["time"] + " - SENT[color]green";
            }
            msgTimeHeaders[i] = header;
        }

        mcdu.setTemplate([
            ["AOC SENT MSGS"],
            [msgTimeHeaders[0]],
            [`${messages[offset + 0] ? "<" + messages[offset + 0]["type"] : "NO MESSAGES"}`],
            [msgTimeHeaders[1]],
            [`${messages[offset + 1] ? "<" + messages[offset + 1]["type"] : ""}`],
            [msgTimeHeaders[2]],
            [`${messages[offset + 2] ? "<" + messages[offset + 2]["type"] : ""}`],
            [msgTimeHeaders[3]],
            [`${messages[offset + 3] ? "<" + messages[offset + 3]["type"] : ""}`],
            [msgTimeHeaders[4]],
            [`${messages[offset + 4] ? "<" + messages[offset + 4]["type"] : ""}`],
            [""],
            ["<RETURN"]
        ]);

        if (messages.length > 4) {
            mcdu.onNextPage = () => {
                if (messages[offset + 5]) {
                    offset += 5;
                }
                CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
            };
            mcdu.onPrevPage = () => {
                if (messages[offset - 5]) {
                    offset -= 5;
                }
                CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
            };
        }

        for (let i = 0; i < 5; i++) {
            mcdu.leftInputDelay[i] = () => {
                return mcdu.getDelaySwitchPage();
            };

            mcdu.onLeftInput[i] = (value) => {
                if (messages[offset + i]) {
                    if (value === FMCMainDisplay.clrValue) {
                        mcdu.deleteSentMessage(offset + i);
                        CDUAocMessagesSent.ShowPage(mcdu, messages, offset);
                    } else {
                        CDUAocMessageSentDetail.ShowPage(mcdu, messages[offset + i]);
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
