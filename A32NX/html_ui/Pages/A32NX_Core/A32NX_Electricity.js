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
        /**
         * Initialises the infinite battery to which buses that are powered are connected
         * to simulate availability of electricity.
         *
         * This function cannot be called on init, as the sim's default ELEC state seemingly hasn't
         * fully initialised by that point.
         *
         * Internally the function ensures it's cheap to execute by only retrieving sim variables
         * the first time it is called.
         */
        this.initialiseInfiniteBattery = () => {
            const infiniteBatteryNumber = 1;
            if (!SimVar.GetSimVarValue("A:ELECTRICAL MASTER BATTERY:" + infiniteBatteryNumber, "Bool")) {
                SimVar.SetSimVarValue("K:TOGGLE_MASTER_BATTERY", "Number", infiniteBatteryNumber);
            }

            this.initialiseInfiniteBattery = () => {};
        };
    }

    update() {
        this.initialiseInfiniteBattery();
    }
}
