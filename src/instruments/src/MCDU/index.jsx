import ReactDOM from 'react-dom';
import { useState } from 'react';
import {
    renderTarget,
    useInteractionEvent,
    useUpdate,
    getSimVar,
} from '../util.mjs';
import './style.scss';
import { Titlebar } from './Titlebar/Titlebar.jsx';
import { PagesContainer } from './PagesContainer.jsx';
import { Scratchpad } from './Scratchpad/Scratchpad.jsx';
import NXDataStore from '../../../../A32NX/html_ui/Pages/A32NX_Utils/NXDataStore';

function createTemplateData() {
    const data = {
        flightPlanManager: {
            origin: {
                ident: '',
            },
            destination: {
                ident: '',
            },
            alternate: {
                ident: '',
            },
        },
        booleans: {
            fromToEntered: true,
            cruiseEntered: true,
        },
        cruiseFlightLevel: 0,
        costIndex: 0,
    };
    NXDataStore.set('FMGC_DATA', data);
    NXDataStore.set('ACTIVE_SYS', 'FMGC');
}

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

function SelfTest() {
    return (
        <svg className="text-wrapper">
            <text x="246" y="170">SELF TEST IN PROGRESS</text>
            <text x="246" y="210">(MAX 10 SECONDS)</text>
        </svg>
    );
}

function Idle() {
    const [inop, setInop] = useState(false);
    createTemplateData();

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
            <svg className="mcdu-svg" viewBox="0 0 600 600">
                <Titlebar />
                <PagesContainer />
                <Scratchpad />
            </svg>
        </>
    );
}

function MCDU() {
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
        }, 5000);
        return <SelfTest />;
    case 'IDLE':
        return <Idle />;
    default:
        throw new RangeError();
    }
}

ReactDOM.render(<MCDU />, renderTarget);
