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

var A320_Neo_BAT;
(function (A320_Neo_BAT) {
    class Display extends BaseAirliners {
        constructor() {
            super();
            this.batTexts = new Array(null, null);
            this.batValues = new Array(0, 0);
            this.updateThrottler = new UpdateThrottler(500);
        }
        get templateID() {
            return "A320_Neo_BAT";
        }
        connectedCallback() {
            super.connectedCallback();
            this.batTexts[0] = this.querySelector("#BAT1");
            this.batTexts[1] = this.querySelector("#BAT2");
        }
        onUpdate(_deltaTime) {
            super.onUpdate(_deltaTime);
            if (this.updateThrottler.canUpdate(_deltaTime) === -1) {
                return;
            }
            const lightsTest = SimVar.GetSimVarValue("L:XMLVAR_LTS_Test", "Bool");
            this.lightsTest = lightsTest;

            if (lightsTest) {
                for (let i = 0; i < 2; ++i) {
                    this.batTexts[i].textContent = "88.8";
                }
            } else {
                for (let i = 0; i < 2; ++i) {
                    const batValue = SimVar.GetSimVarValue("ELECTRICAL BATTERY BUS VOLTAGE", "Volts");
                    this.batValues[i] = batValue;
                    this.batTexts[i].textContent = this.batValues[i].toFixed(1);
                }
            }
        }
    }
    A320_Neo_BAT.Display = Display;
})(A320_Neo_BAT || (A320_Neo_BAT = {}));
registerInstrument("a320-neo-bat", A320_Neo_BAT.Display);
