import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { render } from '@instruments/common/index';
import { store } from './redux/configureStore';
import { useUpdate, getSimVar } from '../util.js';
import MCDU from './Mcdu';

function powerAvailable() {
    return getSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'Bool');
}

const MCDULoad = () => {
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
            setState('ON');
        }
        return <></>;
    case 'OFF':
        return <></>;
    case 'ON':
        return (
            <Provider store={store}>
                <MCDU />
            </Provider>
        );
    default:
        throw new RangeError();
    }
};

render(<MCDULoad />);
