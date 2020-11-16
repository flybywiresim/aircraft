/* eslint-disable max-classes-per-file */
/* eslint-disable react/prop-types */
/* eslint-disable indent */
import ReactDOM from 'react-dom';
import React, { useState } from 'react';
import {
    renderTarget,
    useInteractionEvent,
    useUpdate,
    getSimVar,
    setSimVar,
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
class SelfTest extends React.Component {
    constructor() {
        const selfTestLen = 90;
        super();
        this.state = {
            seconds: selfTestLen,
        };
    }

    componentDidMount() {
        this.testTimer = setInterval(() => {
            const { seconds } = this.state;

            if (seconds > 0) {
                this.setState(() => ({
                    seconds: seconds - 1,
                }));
            }
            if (seconds === 0) {
                clearInterval(this.testTimer);
            }
        }, 990);
    }

    componentWillUnmount() {
        clearInterval(this.testTimer);
    }

    render() {
        let { seconds } = this.state;
        if (seconds < 10) {
            seconds = `0${seconds}`;
        }
        return (
            <svg id="SelfTestSVG" viewBox="0 0 600 600">
                <rect id="SpeedTest" className="box" x="8%" y="46.5%" />
                <text id="SpeedTestTxt" className="boxText" x="8.75%" y="52.5%">SPD</text>
                <rect id="AttTest" className="box" x="36%" y="32.5%" />
                <text id="AltTestTxt" className="boxText" x="38%" y="38.5%">ATT</text>
                <rect id="AltTest" className="box" x="70%" y="46.5%" />
                <text id="AltTestTxt" className="boxText" x="72.5%" y="52.5%">ALT</text>
                <rect id="TmrTest" className="box" x="29%" y="64%" />
                <text id="TmrTestTxt" className="boxText" x="30%" y="70%">
                    INIT
                    {` ${seconds}`}
                    s
                </text>
            </svg>
        );
    }
}

// TODO: Remove workaround component when plane model can be changed
function Brightness(props) {
    const { status } = props;
    const [brightness, setBrightness] = useState(getSimVar('L:A32NX_BARO_BRIGHTNESS', 'number'));
    const max = 1;
    const min = 0.15;

    if (status !== 'BUGS') {
        useInteractionEvent('A320_Neo_SAI_BTN_BARO_PLUS', () => {
            if (brightness <= max - 0.05) {
                setBrightness(brightness + 0.05);
                setSimVar('L:A32NX_BARO_BRIGHTNESS', brightness);
            }
        });

        useInteractionEvent('A320_Neo_SAI_BTN_BARO_MINUS', () => {
            if (brightness - 0.05 >= min) {
                setBrightness(brightness - 0.05);
                setSimVar('L:A32NX_BARO_BRIGHTNESS', brightness);
            }
        });
    }
    return (
        <svg id="BrightnessSVG" viewBox="0 0 600 600" opacity={1 - brightness} />
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
        <svg />
    );
}

function ISIS() {
    const [state, setState] = useState('DEFAULT');

    useUpdate((_deltaTime) => {
        if (state === 'OFF') {
            if (powerAvailable()) {
                setState('SELFTEST');
            }
        } else if (!powerAvailable()) {
            const airspeed = Simplane.getTrueSpeed();
            if (airspeed < 50.0) {
                setState('OFF');
            }
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
    case 'SELFTEST':
        setTimeout(() => {
            if (powerAvailable()) {
                setState('IDLE');
            }
        }, 90000);
        // TODO: Remove <Brightness> component once plane model can be modified
        return (
            <div>
                <Brightness status={state} />
                <SelfTest status={state} />
            </div>
        );
    case 'IDLE':
        return (
            <div>
                <Brightness status={state} />
                <Idle />
            </div>
        );
    default:
        throw new RangeError();
    }
}

ReactDOM.render(<ISIS />, renderTarget);
