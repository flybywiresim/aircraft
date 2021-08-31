import ReactDOM from 'react-dom';
import { useState } from 'react';
import {
    renderTarget,
    useInteractionEvent,
    useUpdate,
    getSimVar,
} from '../util.js';
import './style.scss';

function powerAvailable() {
    // Each DCDU is powered by a different DC BUS. Sadly the cockpit only contains a single DCDU emissive.
    // Once we have two DCDUs running, the capt. DCDU should be powered by DC 1, and F/O by DC 2.
    return getSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'Bool') || getSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool');
}

const SelfTest = () => (
    <svg className="text-wrapper">
        <text x="246" y="170">SELF TEST IN PROGRESS</text>
        <text x="246" y="210">(MAX 10 SECONDS)</text>
    </svg>
);

const WaitingForData = () => (
    <svg className="text-wrapper">
        <text x="246" y="170">WAITING FOR DATA</text>
        <text x="246" y="210">(MAX 30 SECONDS)</text>
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
};

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
        return (
            <>
                <div className="BacklightBleed" />
                <SelfTest />
            </>
        );

    case 'WAITING':
        setTimeout(() => {
            if (powerAvailable()) {
                setState('IDLE');
            }
        }, 12000);
        return (
            <>
                <div className="BacklightBleed" />
                <WaitingForData />
            </>
        );
    case 'IDLE':
        return (
            <>
                <div className="BacklightBleed" />
                <Idle />
            </>
        );
    default:
        throw new RangeError();
    }
}

ReactDOM.render(<DCDU />, renderTarget);
