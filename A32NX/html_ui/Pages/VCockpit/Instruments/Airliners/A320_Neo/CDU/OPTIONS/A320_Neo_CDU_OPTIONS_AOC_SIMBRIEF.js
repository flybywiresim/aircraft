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

class CDU_OPTIONS_SIMBRIEF {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const simbriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "").replace(/_/g, ' ');

        const simbriefUsernameString = simbriefUsername ? `{green}[${simbriefUsername}]{end}` : "{cyan}*[\xa0\xa0\xa0\xa0\xa0]{end}";

        const simbriefUserId = NXDataStore.get("CONFIG_SIMBRIEF_USERID", "");

        const simbriefUserIdString = simbriefUserId ? `{green}[${simbriefUserId}]{end}` : "{cyan}*[\xa0\xa0\xa0\xa0\xa0]{end}";

        mcdu.setTemplate([
            ["A32NX OPTIONS AOC"],
            ["", "", "SIMBRIEF PROFILE"],
            [""],
            ["\xa0USERNAME"],
            [simbriefUsernameString],
            ["\xa0USER ID"],
            [simbriefUserIdString],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelayBasic();
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SIMBRIEF_USERNAME", "");
            } else {
                NXDataStore.set("CONFIG_SIMBRIEF_USERNAME", value.replace(/ /g, '_'));
                NXDataStore.set("CONFIG_SIMBRIEF_USERID", "");
            }
            CDU_OPTIONS_SIMBRIEF.ShowPage(mcdu);
        };

        mcdu.onLeftInput[2] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SIMBRIEF_USERID", "");
            } else if (!/^\d+$/.test(value)) {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                NXDataStore.set("CONFIG_SIMBRIEF_USERID", value);
                NXDataStore.set("CONFIG_SIMBRIEF_USERNAME", "");
            }
            CDU_OPTIONS_SIMBRIEF.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_AOC.ShowPage(mcdu);
        };
    }
}
