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

class CDU_OPTIONS_FMGC {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedAccelAlt = parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500"));
        const storedInitBaroUnit = NXDataStore.get("CONFIG_INIT_BARO_UNIT", "IN HG");
        const storedUsingMetric = parseInt(NXDataStore.get("CONFIG_USING_METRIC_UNIT", "1"));

        mcdu.setTemplate([
            ["A32NX OPTIONS FMGC"],
            ["\xa0DEFAULT BARO", "ACCEL ALT\xa0"],
            [`*${storedInitBaroUnit}[color]cyan`, `{small}[FT]{end}{cyan}[${storedAccelAlt}]*{end}`],
            ["\xa0WEIGHT UNIT", "THR RED ALT\xa0"],
            [`*${storedUsingMetric === 1 ? "KG" : "LBS"}[color]cyan`, "{small}[FT]{end}{inop}[1500]*{end}"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_ACCEL_ALT", "1500");
            } else if (isNaN(value) || parseInt(value) < 1000 || parseInt(value) > 5000) {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                NXDataStore.set("CONFIG_ACCEL_ALT", value);
            }
            CDU_OPTIONS_FMGC.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[0] = (value) => {
            if (value !== "") {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                // We'll go from AUTO -> HPA -> IN HG -> AUTO.
                const newInitBaroUnit = storedInitBaroUnit === "AUTO" ? "HPA" :
                    storedInitBaroUnit === "HPA" ? "IN HG" : "AUTO";
                NXDataStore.set("CONFIG_INIT_BARO_UNIT", newInitBaroUnit);
            }
            CDU_OPTIONS_FMGC.ShowPage(mcdu);
        };
        mcdu.onLeftInput[1] = (value) => {
            if (value !== "") {
                mcdu.addNewMessage(NXSystemMessages.notAllowed);
            } else {
                NXDataStore.set("CONFIG_USING_METRIC_UNIT", storedUsingMetric === 1 ? "2.20462" : "1");
                mcdu.addNewMessage(NXFictionalMessages.weightUnitChanged);
            }
            CDU_OPTIONS_FMGC.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.leftInputDelay[1] = () => {
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
