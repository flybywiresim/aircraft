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

import { useState, useEffect } from 'react';
import Efb from './Efb.tsx';
import { getSimVar, setSimVar } from '../util.js';
import logo from './Assets/fbw-logo.svg';

import './Assets/Reset.scss';
import './Assets/Efb.scss';
import { render } from '../Common/index.tsx';
import { readSettingsFromPersistentStorage } from './Settings/sync.ts';
import { useSimVar } from '../Common/simVars.tsx';

const ScreenBlank = () => {
    const [, setTurnedOn] = useSimVar('L:A32NX_EFB_TURNED_ON', 'number');

    return (
        <div onClick={() => setTurnedOn(1)} style={{ width: '100vw', height: '100vh' }} />
    );
};

const ScreenLoading = () => (
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

const EFBLoad = () => {
    const [content, setContent] = useState('off');
    const [loadingTimeout, setLoadingTimeout] = useState();

    useEffect(() => {
        const interval = setInterval(() => {
            const nowPoweredOn = getSimVar('L:A32NX_EFB_TURNED_ON', 'number');

            switch (nowPoweredOn) {
            case 0:
                setContent('off');
                break;
            case 1:
                setContent('loading');
                if (!loadingTimeout) {
                    setLoadingTimeout(setTimeout(() => {
                        setSimVar('L:A32NX_EFB_TURNED_ON', 2, 'number');
                        setLoadingTimeout(undefined);
                    }, 6000));
                }
                break;
            case 2:
                setContent('loaded');
                break;
            default:
                throw new RangeError();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [loadingTimeout]);

    switch (content) {
    case 'off':
        return <ScreenBlank />;
    case 'loading':
        return <ScreenLoading />;
    case 'loaded':
        return <Efb currentFlight={getSimVar('ATC FLIGHT NUMBER', 'string')} />;
    default:
        throw new Error();
    }
};

readSettingsFromPersistentStorage();

render(<EFBLoad />);
