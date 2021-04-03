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

class CDU_OPTIONS_REALISM {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedDMCTestTime = parseInt(NXDataStore.get("CONFIG_SELF_TEST_TIME", "15"));

        mcdu.setTemplate([
            ["A32NX OPTIONS REALISM"],
            ["\xa0ADIRS", "DMC SELF-TEST\xa0"],
            ["<ALIGN TIME", `{small}[S]{end}{cyan}${storedDMCTestTime}*{end}`],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[0] = () => {
            CDU_OPTIONS_ADIRS.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SELF_TEST_TIME", "15");
            } else if (isNaN(value) || parseInt(value) < 5 || parseInt(value) > 40) {
                mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
            } else {
                NXDataStore.set("CONFIG_SELF_TEST_TIME", value);
            }
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
