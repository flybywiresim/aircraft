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

class A32NX_Electricity {
    constructor() {
        console.log('A32NX_Electricity constructed');
    }
    init() {
        console.log('A32NX_Electricity init');
    }
    update(_deltaTime, _core) {
        if (_core.ACPowerStateChange) {
            const ACPowerAvailable = SimVar.GetSimVarValue("L:ACPowerAvailable","Bool");
            const screenBlueLightsCircuitOn = SimVar.GetSimVarValue("A:CIRCUIT ON:79","Bool");
            if (ACPowerAvailable) {
                if (!screenBlueLightsCircuitOn) {
                    SimVar.SetSimVarValue("K:ELECTRICAL_CIRCUIT_TOGGLE", "number", 79);
                }
            } else {
                if (screenBlueLightsCircuitOn) {
                    SimVar.SetSimVarValue("K:ELECTRICAL_CIRCUIT_TOGGLE", "number", 79);
                }
            }
        }
    }
}
