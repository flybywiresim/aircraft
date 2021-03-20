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

import './Hyd.scss';
import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

setIsEcamPage('hyd_page');

export const HydPage = () => {
    // The FADEC SimVars include a test for the fire button.
    const [Eng1N2] = useSimVar('TURB ENG N2:1', 'Percent', 1000);
    const [Eng2N2] = useSimVar('TURB ENG N2:2', 'Percent', 1000);

    const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_PRESSURE', 'psi', 500);
    const [bluePressure] = useSimVar('L:A32NX_HYD_BLUE_PRESSURE', 'psi', 500);
    const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_PRESSURE', 'psi', 500);

    const [greenPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [bluePumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'boolean', 500);
    const [yellowPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'boolean', 500);

    const [yellowElectricPumpStatus] = useSimVar('L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO', 'boolean', 500);

    const [greenHydLevel] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR', 'gallon', 1000);
    const [blueHydLevel] = useSimVar('L:A32NX_HYD_BLUE_RESERVOIR', 'galllon', 1000);
    const [yellowHydLevel] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR', 'gallon', 1000);

    const [greenFireValve] = useSimVar('L:A32NX_HYD_GREEN_FIRE_VALVE_OPENED', 'boolean', 500);
    const [yellowFireValve] = useSimVar('L:A32NX_HYD_YELLOW_FIRE_VALVE_OPENED', 'boolean', 500);

    const [greenPumpActive] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_ACTIVE', 'boolean', 500);
    const [yellowPumpActive] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_ACTIVE', 'boolean', 500);
    const [bluePumpActive] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_ACTIVE', 'boolean', 500);

    const [greenPumpLowPressure] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_LOW_PRESS', 'boolean', 500);
    const [yellowPumpLowPressure] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_LOW_PRESS', 'boolean', 500);
    const [bluePumpLowPressure] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_LOW_PRESS', 'boolean', 500);

    const [engine1Running, setEngine1Running] = useState(0);
    const [engine2Running, setEngine2Running] = useState(0);

    useEffect(() => {
        setEngine1Running(Eng1N2 > 15 && greenFireValve);
        setEngine2Running(Eng2N2 > 15 && yellowFireValve);
    }, [Eng1N2, Eng2N2]);

    // PTU logic
    const [ptuValveOpen] = useSimVar('L:A32NX_HYD_PTU_VALVE_OPENED', 'boolean', 1000);
    const [ptuScenario, setPtuScenario] = useState('normal');
    const [elecRightFormat, setElecRightFormat] = useState('hide');
    const [elecTriangleFill, setElecTriangleFill] = useState(0);
    const [elecTriangleColour, setElecTriangleColour] = useState('white');
    const [low, setLow] = useState('');
    const [lowValue, setLowValue] = useState(0);
    const [higValue, setHighValue] = useState(0);
    const [high, setHigh] = useState(0);
    const [ptu, setPtu] = useState(true);

    // Might need to keep state of ELEC button and then revert if it's status changes.

    // A32NX_HYD_{loop_name}_EDPUMP_LOW_PRESS should help with pump and line above when it is implemented

    function elecButtonToggle(on) {
        console.log(`Toggle with ${on}`);
        if (on) {
            setLow('green');
            setHigh('yellow');
            setLowValue(greenPressure);
            setHighValue(yellowPressure);
            setPtu(true);
            setPtuScenario('elec-pump');
        } else {
            setLow('');
            setHigh('');
            setLowValue(0);
            setHighValue(0);
            setPtu(false);
            setPtuScenario('normal');
        }
    }

    function checkPumpLowPressure(pump) {
        switch (pump) {
        case 'GREEN':
            return (greenPumpLowPressure && greenPumpActive) || !greenPumpActive || !engine1Running;
        case 'BLUE':
            return (bluePumpLowPressure && bluePumpActive) || !bluePumpActive;
        case 'YELLOW':
            return (yellowPumpLowPressure && yellowPumpActive) || !yellowPumpActive || !engine2Running;
        default:
            return 1;
        }
    }

    useEffect(() => {
        if (!ptuValveOpen) {
            // PTU valve closed
            setPtuScenario('PTU-off');
            // setPtuScenario('left-to-right');
            setPtu(false);
        } else if (!yellowElectricPumpStatus) {
            setElecTriangleFill(1);
            setElecTriangleColour(yellowPressure <= 1450 ? 'amber' : 'green');
            setElecRightFormat(yellowPressure <= 1450 ? 'amber-line' : 'green-line');
            elecButtonToggle(1);
        } else {
            setElecTriangleFill(0);
            setElecTriangleColour('white');
            setElecRightFormat('hide');
            elecButtonToggle(0);
        }
    }, [yellowElectricPumpStatus, yellowPressure, ptuValveOpen]);

    useEffect(() => {

    });
    // useEffect(() => {
    //     if (!ptuValveOpen) {
    //         // PTU valve closed
    //         setPtuScenario('PTU-off');
    //         setPtu(false);
    // } else {
    //     setPtuScenario('normal');
    //     setPtu(true);
    // }

    // else if (ptu || ((yellowPressure <= 1450 || greenPressure <= 1450) && (yellowPressure > 1450 || greenPressure > 1450))) {
    // // One system is low or the PTU flag has been set.
    //     setElecTriangleFill(0);
    //     setElecTriangleColour('white');
    //     setElecRightFormat('hide');
    //     if (ptu) {
    //         console.log('PTU has been triggered');
    //     } else if ((yellowPressure > greenPressure) && (yellowPressure - greenPressure > 200)) {
    //         console.log('Transfer Y to G');
    //     } else if ((greenPressure > yellowPressure) && (greenPressure - yellowPressure > 200)) {
    //         console.log('Transfer G to Y');
    //     } else {
    //         console.log('Probably need -300 check here');
    //     }
    // } else {
    // // if(green > yellow && elec pump on then continue left to right)

    //     // else larger > 1450 lowerlevel < 2.5 then show larget to small TransformStream

    //     // if (lower > 1500 and lowerlevel < 2.5 then show largest to smallest)

    //     // Set once larger and lower > 200

    //     // Only reset when lower > larger by 300
    //     console.log('Back to normal');
    //     setPtu(false);
    //     setPtuScenario('normal');
    // }
    // }, [ptuValveOpen, greenPressure, yellowPressure, bluePressure, yellowElectricPumpStatus]);

    const y = 45;

    return (
        <>
            {/* This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM */}
            <svg id="hyd-page" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: '-60px' }}>
                <text id="PageTitle" className="PageTitle" x="300" y="16" alignmentBaseline="central">HYD</text>
                <text className={`EngineNumber ${engine1Running ? 'fill-white' : 'fill-amber'}`} x="160" y={y + 260} alignmentBaseline="central">1</text>
                <text className={`EngineNumber ${engine2Running ? 'fill-white' : 'fill-amber'}`} x="440" y={y + 260} alignmentBaseline="central">2</text>

                <HydSys
                    title="GREEN"
                    pressure={greenPressure}
                    hydLevel={greenHydLevel}
                    x={110}
                    y={y}
                    fireValve={greenFireValve}
                    pumpPBStatus={greenPumpPBStatus}
                    pumpDetectLowPressure={checkPumpLowPressure('GREEN')}
                />
                <HydSys
                    title="BLUE"
                    pressure={bluePressure}
                    hydLevel={blueHydLevel}
                    x={300}
                    y={y}
                    fireValve={0}
                    pumpPBStatus={bluePumpPBStatus}
                    pumpDetectLowPressure={checkPumpLowPressure('BLUE')}
                />
                <HydSys
                    title="YELLOW"
                    pressure={yellowPressure}
                    hydLevel={yellowHydLevel}
                    x={490}
                    y={y}
                    fireValve={yellowFireValve}
                    pumpPBStatus={yellowPumpPBStatus}
                    pumpDetectLowPressure={checkPumpLowPressure('YELLOW')}
                />

                <PTU x={300} y={y + 126} ptuScenario={ptuScenario} />

                <text className="rat-ptu-elec fill-white" x={248} y={y + 180} alignmentBaseline="central">RAT</text>
                <line className="green-line hide" x1={290} y1={y + 180} x2={300} y2={y + 180} />
                <Triangle x={290} y={y + 180} colour="white" fill={0} orientation={90} />

                <text id="ELEC-centre" className="rat-ptu-elec fill-white" x={350} y={y + 245} alignmentBaseline="central">ELEC</text>

                <text id="ELEC-right" className="rat-ptu-elec fill-white" x={548} y={y + 180} alignmentBaseline="central">ELEC</text>
                <Triangle x={500} y={y + 180} colour={elecTriangleColour} fill={elecTriangleFill} orientation={-90} />
                <line className={elecRightFormat} x1={490} y1={y + 180} x2={500} y2={y + 180} />

                <text className="psi" x={205} y={y + 70} alignmentBaseline="central">PSI</text>
                <text className="psi" x={395} y={y + 70} alignmentBaseline="central">PSI</text>

            </svg>
        </>
    );
};

type HydSysProps = {
    title: string,
    pressure: number,
    hydLevel: number,
    x: number,
    y: number,
    fireValve: number,
    pumpPBStatus: number,
    pumpDetectLowPressure: number
}

const HydSys = ({ title, pressure, hydLevel, x, y, fireValve, pumpPBStatus, pumpDetectLowPressure } : HydSysProps) => {
    const [hydLevelLow, setHydLevelLow] = useState(false);
    const lowPressure = 1450;
    const pressureNearest50 = Math.round(pressure / 50) * 50 >= 100 ? Math.round(pressure / 50) * 50 : 0;

    return (
        <>
            <Triangle x={x} y={y} colour={pressureNearest50 <= lowPressure ? 'amber' : 'green'} fill={0} orientation={0} />
            <text className={`title ${pressureNearest50 <= lowPressure ? 'fill-amber' : 'fill-white'}`} x={x} y={y + 43}>{title}</text>
            <text className={`pressure ${pressureNearest50 <= lowPressure ? 'fill-amber' : 'fill-green'}`} x={x} y={y + 75}>{pressureNearest50}</text>

            {/* The colour of these lines will be affected by the yellow electric pump */}
            <line className={pressureNearest50 <= lowPressure ? 'amber-line' : 'green-line'} x1={x} y1={y + 126} x2={x} y2={y + 83} />
            <line className={pressureNearest50 <= lowPressure || (pumpDetectLowPressure && title === 'GREEN') ? 'amber-line' : 'green-line'} x1={x} y1={y + 181} x2={x} y2={y + 125} />
            <line className={pressureNearest50 <= lowPressure || (pumpDetectLowPressure && title !== 'BLUE') ? 'amber-line' : 'green-line'} x1={x} y1={y + 221} x2={x} y2={y + 180} />

            <HydEngPump
                system={title}
                pumpOn={pumpPBStatus}
                x={x}
                y={y + 290}
                hydLevelLow={hydLevelLow}
                fireValve={fireValve}
                pumpDetectLowPressure={pumpDetectLowPressure}
                pressure={pressureNearest50}
            />
            <HydEngValve system={title} x={x} y={y + 290} fireValve={fireValve} hydLevelLow={hydLevelLow} />
            {/* Reservoir */}
            <HydReservoir system={title} x={x} y={495} fluidLevel={hydLevel} setHydLevel={setHydLevelLow} />
        </>
    );
};

type HydEngPumpProps = {
    system: string,
    pumpOn: number,
    x: number,
    y: number,
    hydLevelLow: boolean,
    fireValve: number,
    pumpDetectLowPressure: number
    pressure: number
}

const HydEngPump = ({ system, pumpOn, x, y, hydLevelLow, fireValve, pumpDetectLowPressure, pressure } : HydEngPumpProps) => {
    const lowPressure = 1450;
    if (system === 'BLUE') {
        return (
            <>
                <line className={pressure <= lowPressure ? 'amber-line' : 'green-line'} x1={x} y1={y - 32} x2={x} y2={y - 80} />
                <rect className={pumpDetectLowPressure ? 'amber-line' : 'green-line'} x={x - 16} y={y - 32} width={32} height={32} />
                <line className={!pumpDetectLowPressure ? 'green-line' : 'hide'} x1={x} y1={y} x2={x} y2={y - 32} />
                <line className={pumpOn ? 'hide' : 'amber-line'} x1={x - 12} y1={y - 16} x2={x + 12} y2={y - 16} />
                <text id="ELEC-centre" className={pumpDetectLowPressure && pumpOn ? 'rat-ptu-elec fill-amber' : 'hide'} x={x} y={y - 16} alignmentBaseline="central">LO</text>

            </>
        );
    }

    return (
        <>
            <rect className={pumpDetectLowPressure ? 'amber-line' : 'green-line'} x={x - 16} y={y - 80} width={32} height={32} />
            <line className={!pumpDetectLowPressure ? 'green-line' : 'hide'} x1={x} y1={y} x2={x} y2={y - 80} />
            <line className={pumpOn ? 'hide' : 'amber-line'} x1={x - 12} y1={y - 64} x2={x + 12} y2={y - 64} />
            <line className={hydLevelLow || !fireValve ? 'amber-line' : 'green-line'} x1={x} y1={y} x2={x} y2={y - 48} />
            <text
                id="ELEC-centre"
                className={
                    pumpDetectLowPressure && pumpOn ? 'rat-ptu-elec fill-amber' : 'hide'
                }
                x={x}
                y={y - 64}
                alignmentBaseline="central"
            >
                LO

            </text>

        </>
    );
};

type HydEngValveProps = {
    system: string,
    x: number,
    y: number,
    fireValve: number,
    hydLevelLow: boolean
}

const HydEngValve = ({ system, x, y, fireValve, hydLevelLow } : HydEngValveProps) => {
    if (system === 'BLUE') {
        return (
            <line className={!hydLevelLow ? 'green-line' : 'amber-line'} x1={x} y1={y + 33} x2={x} y2={y} />
        );
    }

    return (
        <>
            <circle className={fireValve ? 'green-line' : 'amber-line'} cx={x} cy={y + 16} r="16" />
            <line className={fireValve ? 'green-line' : 'hide'} x1={x} y1={y + 32} x2={x} y2={y} />
            <line className={fireValve ? 'hide' : 'amber-line'} x1={x - 10} y1={y + 16} x2={x + 10} y2={y + 16} />
        </>
    );
};

type HydReservoirProps = {
    system: string,
    x: number,
    y: number,
    fluidLevel: number,
    setHydLevel: React.Dispatch<React.SetStateAction<boolean>>
}

const HydReservoir = ({ system, x, y, fluidLevel, setHydLevel } : HydReservoirProps) => {
    const levels = [
        { system: 'GREEN', max: 14.5, low: 3.5, norm: 2.6 },
        { system: 'BLUE', max: 6.5, low: 2.4, norm: 1.6 },
        { system: 'YELLOW', max: 12.5, low: 3.5, norm: 2.6 },
    ];
    const fluidLevelInLitres = fluidLevel * 3.79;

    const values = levels.filter((item) => item.system === system);
    const litersPerPixel = 96 / values[0].max;
    const reserveHeight = (litersPerPixel * values[0].low);
    const upperReserve = y - reserveHeight;
    const lowerNorm = y - 96 + (litersPerPixel * values[0].norm);
    const fluidLevelPerPixel = 96 / values[0].max;
    const fluidHeight = y - (fluidLevelPerPixel * fluidLevelInLitres);

    if (fluidLevelInLitres < values[0].low) {
        setHydLevel(true);
    } else {
        setHydLevel(false);
    }

    return (
        <>
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={y - 96} x2={x} y2={y - 128} />
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'white-line'} x1={x} y1={upperReserve.toFixed(0)} x2={x} y2={y - 96} />
            <line className="green-line" x1={x} y1={y - 96} x2={x + 4} y2={y - 96} strokeLinejoin="miter" />
            <line className="green-line" x1={x + 4} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={y - 96} strokeLinejoin="miter" />
            <line className="green-line" x1={x} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={lowerNorm.toFixed(0)} strokeLinejoin="miter" />
            <rect className="amber-line" x={x} y={upperReserve.toFixed(0)} width={4} height={reserveHeight} />

            {/* Hydraulic level */}
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={y} x2={x - 8} y2={y} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x - 8} y1={y} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight - 8} strokeLinejoin="miter" />
        </>
    );
};

type PTUProps = {
    x: number,
    y: number,
    ptuScenario: string
}

const PTU = ({ x, y, ptuScenario } : PTUProps) => {
    const semiCircleD = `M${x - 16},${y} C${x - 16},${y + 24} ${x + 16},${y + 24} ${x + 16},${y}`;

    // Highest to lowest priority
    // 1. PTU valve control off (all amber, no fill)

    const ptuArray = [
        {
            scenario: 'PTU-off',
            format: [
                {
                    id: 'ptu1',
                    className: 'hide',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu2',
                    className: 'amber-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu3',
                    className: 'amber-line no-fill',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu4',
                    className: 'amber-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu5',
                    className: 'hide',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'triangle1',
                    className: '',
                    colour: 'amber',
                    orientation: -90,
                    fill: 0,
                },
                {
                    id: 'triangle2',
                    className: '',
                    colour: 'amber',
                    orientation: -90,
                    fill: 0,
                },
                {
                    id: 'triangle3',
                    className: '',
                    colour: 'amber',
                    orientation: 90,
                    fill: 0,
                },
            ],
        },
        {
            scenario: 'normal',
            format: [
                {
                    id: 'ptu1',
                    className: 'hide',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu2',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu3',
                    className: 'green-line no-fill',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu4',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu5',
                    className: 'green-line hide',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'triangle1',
                    className: '',
                    colour: 'green',
                    orientation: -90,
                    fill: 0,
                },
                {
                    id: 'triangle2',
                    className: '',
                    colour: 'green',
                    orientation: -90,
                    fill: 0,
                },
                {
                    id: 'triangle3',
                    className: '',
                    colour: 'green',
                    orientation: 90,
                    fill: 0,
                },
            ],
        },
        {
            scenario: 'elec-pump',
            format: [
                {
                    id: 'ptu1',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu2',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu3',
                    className: 'green-line no-fill',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu4',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu5',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'triangle1',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: -90,
                    fill: 1,
                },
                {
                    id: 'triangle2',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: -90,
                    fill: 1,
                },
                {
                    id: 'triangle3',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: -90,
                    fill: 1,
                },
            ],
        },
        {
            scenario: 'right-to-left',
            format: [
                {
                    id: 'ptu1',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu2',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu3',
                    className: 'green-line no-fill',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu4',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu5',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'triangle1',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: -90,
                    fill: 1,
                },
                {
                    id: 'triangle2',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: -90,
                    fill: 1,
                },
                {
                    id: 'triangle3',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: -90,
                    fill: 1,
                },
            ],
        },
        {
            scenario: 'left-to-right',
            format: [
                {
                    id: 'ptu1',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu2',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu3',
                    className: 'green-line no-fill',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu4',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'ptu5',
                    className: 'green-line',
                    colour: '',
                    orientation: 0,
                    fill: 0,
                },
                {
                    id: 'triangle1',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: 90,
                    fill: 1,
                },
                {
                    id: 'triangle2',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: 90,
                    fill: 1,
                },
                {
                    id: 'triangle3',
                    className: 'fill-green',
                    colour: 'green',
                    orientation: 90,
                    fill: 1,
                },
            ],
        },
    ];

    const result: any = ptuArray.find(({ scenario }) => scenario === ptuScenario);
    const ptu1 = result.format.find(({ id }) => id === 'ptu1');
    const ptu2 = result.format.find(({ id }) => id === 'ptu2');
    const ptu3 = result.format.find(({ id }) => id === 'ptu3');
    const ptu4 = result.format.find(({ id }) => id === 'ptu4');
    const ptu5 = result.format.find(({ id }) => id === 'ptu5');
    const triangle1 = result.format.find(({ id }) => id === 'triangle1');
    const triangle2 = result.format.find(({ id }) => id === 'triangle2');
    const triangle3 = result.format.find(({ id }) => id === 'triangle3');

    return (
        <>
            <line id="ptu1" className={ptu1.className} x1={x - 100} y1={y} x2={x - 190} y2={y} />
            <line id="ptu2" className={ptu2.className} x1={x - 100} y1={y} x2={x - 16} y2={y} />
            <path id="ptu3" className={ptu3.className} d={semiCircleD} />
            <line id="ptu4" className={ptu4.className} x1={x + 16} y1={y} x2={x + 50} y2={y} />
            <line id="ptu5" className={ptu5.className} x1={x + 135} y1={y} x2={x + 190} y2={y} />
            <text className="rat-ptu-elec fill-white" x={x + 92} y={y} alignmentBaseline="central">PTU</text>
            <Triangle x={triangle1.orientation < 0 ? x - 100 : x - 82} y={y} colour={triangle1.colour} fill={triangle1.fill} orientation={triangle1.orientation} />
            <Triangle x={triangle2.orientation > 0 ? x + 70 : x + 50} y={y} colour={triangle2.colour} fill={triangle2.fill} orientation={triangle2.orientation} />
            <Triangle x={triangle3.orientation > 0 ? x + 135 : x + 117} y={y} colour={triangle3.colour} fill={triangle3.fill} orientation={triangle3.orientation} />
        </>
    );
};

type TriangleProps = {
    x: number,
    y: number,
    colour: string,
    fill: number,
    orientation: number
}

const Triangle = ({ x, y, colour, fill, orientation } : TriangleProps) => {
    // x,y marks the top of the triangle
    // You can rotate this 0, 90, -90 degrees
    const polyPoints = `${x + 9},${y + 18} ${x},${y} ${x - 9},${y + 18}`;
    const transformation = `rotate(${orientation} ${x} ${y})`;
    let classSelector = `${colour}-line`;
    if (fill === 1) {
        classSelector += ` fill-${colour}`;
    }

    return (
        <polygon className={classSelector} points={polyPoints} transform={transformation} />
    );
};

ReactDOM.render(<SimVarProvider><HydPage /></SimVarProvider>, getRenderTarget());
