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

/* eslint-disable */

const simvars = {
    'ATC FLIGHT NUMBER': 'AB123',
    'GPS POSITION LAT': 0,
    'L:APU_GEN_ONLINE': false,
    'EXTERNAL POWER AVAILABLE:1': false,
    'EXTERNAL POWER ON': false,
    'L:A32NX_COLD_AND_DARK_SPAWN': true,
};

function triggerSimVarUpdate() {
    console.log('New Simvars 🍔', simvars);
    const parent = document.getElementById('parent');
    const event = new CustomEvent('update');
    parent.dispatchEvent(event);
}

Simplane = {
    getEngineActive(_) {
        return false;
    },
};

SimVar = {
    GetSimVarValue(s) {
        const result = simvars[s];
        console.log(`🍙 Returning Simvar ${s} = ${result}`);
        return result;
    },
};

setTimeout(() => {
    simvars['EXTERNAL POWER ON'] = true;
    simvars['EXTERNAL POWER AVAILABLE:1'] = true;
    triggerSimVarUpdate();
}, 500);
