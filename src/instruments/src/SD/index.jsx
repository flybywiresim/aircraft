import ReactDOM from 'react-dom';
import { useState } from 'react';
import {
    renderTarget,
    useInteractionEvent,
    useUpdate,
    getSimVar,
} from '../util.js';
import './style.scss';
import { PagesContainer } from './PagesContainer.jsx';
import { StatusArea } from './StatusArea/StatusArea.jsx';

function powerAvailable() {
    return getSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'Bool');
}

const SelfTest = () => (
    <svg className="text-wrapper">
        <text x="246" y="170">SELF TEST IN PROGRESS</text>
        <text x="246" y="210">(MAX 10 SECONDS)</text>
    </svg>
);

const Idle = () => {
    const [inop, setInop] = useState(false);

    useInteractionEvent('A32NX_DCDU_BTN_INOP', () => {
        if (!inop) {
            setInop(true);
            setTimeout(() => {
                setInop(false);
            }, 3000);
        }
    });

    return (
        <>
            <svg className="sd-svg" viewBox="0 0 600 600">
                <PagesContainer />
                <StatusArea />
            </svg>
        </>
    );
};

function SD() {
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
            setState('IDLE');
        }
        return <></>;
    case 'OFF':
        return <></>;
    case 'ON':
        setTimeout(() => {
            if (powerAvailable()) {
                setState('IDLE');
            }
        }, 8000);
        return <SelfTest />;
    case 'IDLE':
        return <Idle />;
    default:
        throw new RangeError();
    }
}

ReactDOM.render(<SD />, renderTarget);
