import ReactDOM from 'react-dom';
import { useState } from 'react';
import {
    renderTarget,
    useInteractionEvent,
    useUpdate,
    getSimVar,
} from '../util.mjs';
import './style.scss';

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

function WaitingForData() {
    return (
        <svg className="text-wrapper">
            <text x="246" y="170">WAITING FOR DATA</text>
            <text x="246" y="210">(MAX 30 SECONDS)</text>
        </svg>
    );
}

function Idle() {
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
            <svg className="dcdu-lines">
                <g>
                    <path d="m 21 236 h 450" />
                    <path d="m 130 246 v 124" />
                    <path d="m 362 246 v 124" />
                </g>
            </svg>

            <svg className="inop-wrapper" style={{ visibility: inop ? 'visible' : 'hidden' }}>
                <text x="246" y="170">INOP.</text>
            </svg>
        </>
    );
}

function DCDU() {
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
                setState('WAITING');
            }
        }, 8000);
        return <SelfTest />;
    case 'WAITING':
        setTimeout(() => {
            if (powerAvailable()) {
                setState('IDLE');
            }
        }, 12000);
        return <WaitingForData />;
    case 'IDLE':
        return <Idle />;
    default:
        throw new RangeError();
    }
}

ReactDOM.render(<DCDU />, renderTarget);
