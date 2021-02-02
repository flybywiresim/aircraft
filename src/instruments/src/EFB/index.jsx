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

import ReactDOM from 'react-dom';
import { useState } from 'react';
import Efb from './Efb.tsx';
import { renderTarget, useUpdate, getSimVar } from '../util.mjs';
import logo from './Assets/fbw-logo.svg';

import './Assets/Boot.scss';

// TODO: Move anything dependent on ac power change to A32NX_Core
function powerAvailable() {
    // These are inlined so they're only evaluated if prior conditions return false.
    return (
        Simplane.getEngineActive(0) === 1 || Simplane.getEngineActive(1) === 1
    ) || (
        getSimVar('L:APU_GEN_ONLINE')
    ) || (
        getSimVar('EXTERNAL POWER AVAILABLE:1') && getSimVar('EXTERNAL POWER ON')
    );
}

function ScreenLoading() {
    return (
        <div className="loading-screen">
            <div className="center">
                <div className="placeholder">
                    <img src={logo} className="fbw-logo" alt="logo" />
                    {' '}
                    flyPad
                </div>
                <div className="loading-bar">
                    <div className="loaded" />
                </div>
            </div>
        </div>
    );
}

function EFBLoad() {
    const [state, setState] = useState('DEFAULT');

    useUpdate((_deltaTime) => {
        if (state === 'OFF') {
            if (powerAvailable()) {
                setState('ON');
            }
        } else if (!powerAvailable()) {
            setState('OFF');
        }
    });

    switch (state) {
    case 'DEFAULT':
        if (getSimVar('L:A32NX_COLD_AND_DARK_SPAWN')) {
            setState('OFF');
        } else {
            setState('START');
        }
        return <></>;
    case 'OFF':
        return <></>;
    case 'ON':
        setTimeout(() => {
            if (powerAvailable()) {
                setState('START');
            }
        }, 6000);
        return <ScreenLoading />;
    case 'START':
        const currentFlight = getSimVar('ATC FLIGHT NUMBER', 'string');

        return <Efb currentFlight={currentFlight} logo={logo} />;
    default:
        throw new RangeError();
    }
}

ReactDOM.render(<EFBLoad />, renderTarget);
