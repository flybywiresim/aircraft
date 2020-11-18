/* eslint-disable max-classes-per-file */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/jsx-indent-props */
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
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
                <rect id="SpeedTest" className="box" width="15%" x="8%" y="46.5%" />
                <text id="SpeedTestTxt" className="boxText" x="8.75%" y="52.5%">SPD</text>
                <rect id="AttTest" className="box" width="18%" x="36%" y="32.5%" />
                <text id="AltTestTxt" className="boxText" x="38%" y="38.5%">ATT</text>
                <rect id="AltTest" className="box" width="18%" x="70%" y="46.5%" />
                <text id="AltTestTxt" className="boxText" x="72.5%" y="52.5%">ALT</text>
                <rect id="TmrTest" className="box" width="36%" x="29%" y="64%" />
                <text id="TmrTestTxt" className="boxText" x="30%" y="70%">
                    INIT
                    {` ${seconds}`}
                    s
                </text>
            </svg>
        );
    }
}

class Attitude extends React.Component {
    componentDidMount() {
        this.testTimer = setInterval(() => {
        }, 66);
    }

    render() {
        const backgroundVisible = true;
        const bankSizeRatioFactor = 0.62;
        const pitchRatioFactor = 1.6;

        const horizonTopColor = '#19A0E0';
        const horizonBottomColor = '#8B3D18';

        const topBG = (backgroundVisible) ? horizonTopColor : 'transparent';
        const bottomBG = (backgroundVisible) ? horizonBottomColor : 'transparent';

        const smallDashesAngle = [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60];
        const smallDashesHeight = 19;
        const radius = 160;

        const smallDashes = smallDashesAngle.map((dash) => (
            <line className="dashLine" x1="0" y1={-radius} x2="0" y2={-radius - smallDashesHeight} transform={`rotate(${dash},0,-15)`} />
        ));

        return (
            <div id="AttitudeComponent">
                <svg id="HorizonRoot" viewBox="-200 -200 400 300" x="-100" y="-100" width="100%" height="100%" overflow="visible" transform="translate(0, 100)">
                    <rect id="HorizonTop" x="-1000" y="-1000" width="2000" height="2000" fill={topBG} />
                    <g id="BottomPart">
                        <rect id="HorizonBottom" x="-1500" y="10" width="3000" height="3000" fill={bottomBG} />
                        <rect id="Seperator" x="-1500" y="10" width="3000" height="5" fill="#e0e0e0" />
                    </g>
                </svg>
                <div id="Pitch">
                    <svg id="PitchRoot" viewBox="-200 -200 400 300" width="100%" height="100%" overflow="visible">
                        <g id="PitchRootGroup">
                            <svg id="PitchContainer" viewBox="-115 -122 230 295" x="-115" y="-122" width="230" height="295" overflow="hidden">
                                {/* <AttitudePitch /> */}
                            </svg>
                        </g>
                    </svg>
                </div>
                <div id="Attitude">
                    <svg id="AttitudeRoot" viewBox="-200 -200 400 300" width="100%" height="100%" overflow="visible">
                        <g id="AttitudeBank">
                            {smallDashes}
                            <path id="Arc" d="M-73 -140 q73 -40 146 0" fill="transparent" stroke="white" strokeWidth="2.5" />
                        </g>
                        <g id="AttitudeCursors">
                            <path id="LeftUpper" d="M-85 -15 l0 -10 l50 0 l0 16 l-11 0 l0 -6 l-24 0 Z" fill="url(#SAIBacklight)" stroke="yellow" strokeWidth="4" strokeOpacity="1.0" />
                            <path id="RightUpper" d="M85 -15 l0 -10 l-50 0 l0 16 l11 0 l0 -6 l24 0 Z" fill="url(#SAIBacklight)" stroke="yellow" strokeWidth="4" strokeOpacity="1.0" />
                            <rect id="Center" x="-7" y="-25" height="14" width="14" stroke="yellow" strokeWidth="4" />
                        </g>
                        <path id="SlipSkidTriangle" d="M0 -161 l-11 18 l22 0 Z" fill="url(#SAIBacklight)" stroke="white" strokeWidth="2" />
                        <path id="SlipSkid" d="M-17 -134 l5 -8 l23 0 l5 8 Z" fill="url(#SAIBacklight)" stroke="white" strokeWidth="2" />
                    </svg>
                </div>
            </div>
        );
    }
}

class AttitudePitch extends React.Component {
    constructor() {
        super();
        this.state = {
            nextAngle: 0,
            width: 0,
            height: 0,
            text: 0,
        };
    }

    render() {
        const bankSizeRatio = -7;
        const maxDash = 80;
        const fullPrecisionLowerLimit = -30;
        const fullPrecisionUpperLimit = 30;
        const halfPrecisionLowerLimit = -30;
        const halfPrecisionUpperLimit = 30;
        const unusualAttitudeLowerLimit = -30;
        const unusualAttitudeUpperLimit = 30;
        const bigWidth = 52;
        const bigHeight = 2.5;
        const mediumWidth = 28;
        const mediumHeight = 2.5;
        const smallWidth = 15;
        const smallHeight = 2.5;
        const fontSize = 20;
        let angle = -maxDash;
        let nextAngle;
        let width;
        let height;
        let text;

        while (angle <= maxDash) {
            if (angle % 10 === 0) {
                width = bigWidth;
                height = bigHeight;
                text = true;
                if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                    nextAngle = angle + 2.5;
                } else if (angle >= halfPrecisionLowerLimit && angle < halfPrecisionUpperLimit) {
                    nextAngle = angle + 5;
                } else {
                    nextAngle = angle + 10;
                }
            } else if (angle % 5 === 0) {
                width = mediumWidth;
                height = mediumHeight;
                text = false;
                if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                    nextAngle = angle + 2.5;
                } else {
                    nextAngle = angle + 5;
                }
            } else {
                width = smallWidth;
                height = smallHeight;
                nextAngle = angle + 2.5;
                text = false;
            }
            angle = nextAngle;
        }

        return (
            <g id="AttitudePitch">
                {(() => {
                    if (angle !== 0) {
                        return <rect x={-width / 2 - 10} y={bankSizeRatio * angle - height / 2} width={width} height={height} fill="white" />;
                    }
                    return <></>;
                })()}
                {(() => {
                    if (angle !== 0 && text) {
                        return (
                            <text
                                id="LeftText"
                                x={(-width / 2) - 10}
                                y={bankSizeRatio * angle - height / 2 + fontSize / 2}
                                textAnchor="end"
                                fontSize={fontSize * 1.2}
                                fontFamily="ECAMFontRegular"
                                fill="white"
                            >
                                {Math.abs(angle)}
                            </text>
                        );
                    }
                    return <></>;
                })()}
                {(() => {
                    if (angle !== 0 && angle < unusualAttitudeLowerLimit) {
                        let path = `M${-smallWidth / 2} ${bankSizeRatio * angle - bigHeight / 2} l${smallWidth}  0 `;
                        path += `L${bigWidth / 2} ${bankSizeRatio * nextAngle + bigHeight / 2} l${-smallWidth} 0 `;
                        path += `L0 ${bankSizeRatio * angle - 20} `;
                        path += `L${-bigWidth / 2 + smallWidth} ${bankSizeRatio * nextAngle + bigHeight / 2} l${-smallWidth} 0 Z`;
                        return <path d={path} fill="red" />;
                    }
                    return <></>;
                })()}
                {(() => {
                    if (angle !== 0 && angle >= unusualAttitudeUpperLimit) {
                        let path = `M${-smallWidth / 2} ${bankSizeRatio * angle - bigHeight / 2} l${smallWidth}  0 `;
                        path += `L${bigWidth / 2} ${bankSizeRatio * nextAngle + bigHeight / 2} l${-smallWidth} 0 `;
                        path += `L0 ${bankSizeRatio * angle - 20} `;
                        path += `L${-bigWidth / 2 + smallWidth} ${bankSizeRatio * nextAngle + bigHeight / 2} l${-smallWidth} 0 Z`;
                        return <path d={path} fill="red" />;
                    }
                    return <></>;
                })()}
            </g>
        );
    }
}

function AirSpeed() {
    const width = 50;
    const height = 250;
    const posX = width * 0.5;
    const posY = 5;
    const _top = 0;
    const _left = 0;
    const _width = width;
    const _height = height;
    // const _arcWidth = 18;
    // const _arcPosX = _left + _width + 3;
    // const _arcStartPosY = _top + _height * 0.5;
    // const arcHeight = this.arcToSVG(this.airspeeds.greenEnd - this.airspeeds.greenStart);
    // const arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.greenStart) - arcHeight;

    const cursorPosX = _left + _width;
    const cursorPosY = _top + _height * 0.5 + 5;
    const cursorWidth = 13;
    const cursorHeight = 18;

    const bgWidth = 125;
    const bgHeight = 50;
    const bgFill = 'url(#SAIBacklight)';

    return (
        <svg id="ViewBox" viewBox="0 0 250 500">
            <g id="Airspeed">
                <path id="topMask" d="M134 0 l0 45 l -20 0 q-105 4 -75 40 l0 -85 Z" fill={bgFill} />
                <path id="bottomMask" d="M134 250 l0 -48 l -20 0 q-105 -4 -75 -40 l0 88 Z" fill={bgFill} />

                <svg
                    id="CenterGroup"
                    viewBox={`0 0 ${width} ${height}`}
                    x={posX - width * 0.5}
                    y={posY}
                    width={width}
                    height={height}
                >
                    <rect id="bg" x={_left} y={_top} width={_width} height={_height} fill={bgFill} />
                    <g id="Arcs">
                        {/*
                        <rect
                            id="gArc"
                            x={_arcPosX}
                            y={arcPosY}
                            width={_arcWidth}
                          height={arcHeight}
                        />

                        ARCS + GRADUATIONS

                        */}
                    </g>
                </svg>
                <svg
                    id="CursorGroup"
                    x={cursorPosX}
                    y={cursorPosY - cursorHeight * 0.5}
                    width={cursorWidth}
                    height={cursorHeight}
                    viewBox={`0 0 ${cursorWidth} ${cursorHeight}`}
                >
                    <rect x="-1" y="0" width={cursorWidth} height={cursorHeight} fill={bgFill} />
                    <path d={`M 1 ${cursorHeight * 0.5} L${cursorWidth - 2} 1 L${cursorWidth - 2} ${cursorHeight} Z`} fill="yellow" />
                </svg>
            </g>
            <rect id="topBG" x={_left} y={_top - 5} width={bgWidth} height={bgHeight} fill={bgFill} />
            <rect id="bottomBG" x={_left} y={_top + _height - 48} width={bgWidth} height={bgHeight} fill={bgFill} />
        </svg>
    );
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
Brightness.propTypes = {
    status: PropTypes.string,
};
Brightness.defaultProps = {
    status: 'ON',
};

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
            setState('SELFTEST');
        }
        return <></>;
    case 'OFF':
        return <></>;
    case 'SELFTEST':
        setTimeout(() => {
            if (powerAvailable()) {
                setState('IDLE');
            }
        }, 5000);
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
                <AirSpeed />
                <Attitude />
                <Brightness status={state} />
                {/*
                <Idle />
                 */}
            </div>
        );
    default:
        throw new RangeError();
    }
}

ReactDOM.render(<ISIS />, renderTarget);
