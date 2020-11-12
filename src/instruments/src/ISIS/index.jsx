/* eslint-disable indent */
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
    const seconds = 90;
    return (
        <svg id="SelfTestSVG" viewBox="0 0 600 600">
            <rect id="SpeedTest" className="box" x="8%" y="46.5%" />
            <text id="SpeedTestTxt" className="boxText" x="8.75%" y="52.5%">SPD</text>
            <rect id="AltTest" className="box" x="70%" y="46.5%" />
            <text id="AltTestTxt" className="boxText" x="72.5%" y="52.5%">ALT</text>
            <rect id="TmrTest" className="box" x="30%" y="64%" />
            <text id="TmrTestTxt" className="boxText" x="31%" y="70%">
                INIT
                {` ${seconds}`}
                s
            </text>
        </svg>
    );
}

function WaitingForData() {

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
