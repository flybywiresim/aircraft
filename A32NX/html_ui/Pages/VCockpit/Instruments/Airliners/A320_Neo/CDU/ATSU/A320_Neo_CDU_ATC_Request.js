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

class CDUAtcRequest {
    static ShowPage(mcdu, store = {"dirTo": "", "flAlt": "", "spdMach": "", "dueTo": 0}) {
        mcdu.clearDisplay();

        if (store["dirTo"] == "") {
            store["dirTo"] = "[\xa0\xa0\xa0][color]cyan";
        }
        if (store["flAlt"] == "") {
            store["flAlt"] = "[\xa0\xa0\xa0][color]cyan";
        }
        if (store["spdMach"] == "") {
            store["spdMach"] = "[\xa0][color]cyan";
        }

        mcdu.setTemplate([
            ["REQUEST"],
            ["\xa0DIR TO", "FL/ALT\xa0"],
            [store["dirTo"], store["flAlt"]],
            ["", "SPD/MACH\xa0"],
            ["", store["spdMach"]],
            [""],
            [""],
            ["\xa0DUE TO", "DUE TO\xa0"],
            ["{cyan}{{end}WEATHER", "A/C PERF{cyan}}{end}"],
            [""],
            [""],
            ["\xa0ATC MENU", "XFR TO\xa0[color]inop"],
            ["<RETURN", "DCDU\xa0[color]inop"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value != "") {
                store["dirTo"] = "[" + value + "][color]cyan";
            }
            CDUAtcRequest.ShowPage(mcdu, store);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = (value) => {
            if (value != "") {
                store["flAlt"] = "[" + value + "][color]cyan";
            }
            CDUAtcRequest.ShowPage(mcdu, store);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = (value) => {
            if (value != "") {
                store["spdMach"] = "[" + value + "][color]cyan";
            }
            CDUAtcRequest.ShowPage(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
