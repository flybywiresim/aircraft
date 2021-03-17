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
import React, { useState } from 'react';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

setIsEcamPage('hyd_page');

export const HydPage = () => {
    const [Eng1Running] = useSimVar('ENG N1 RPM:1', 'Percent', 1000);
    const [Eng2Running] = useSimVar('ENG N1 RPM:2', 'Percent', 1000);

    const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_PRESSURE', 'psi', 500);
    const [bluePressure] = useSimVar('L:A32NX_HYD_BLUE_PRESSURE', 'psi', 500);
    const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_PRESSURE', 'psi', 500);

    const [greenPumpStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'boolean', 1000);
    const [bluePumpStatus] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'boolean', 1000);
    const [yellowPumpStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'boolean', 1000);

    const [yelloElectricPumpStatus] = useSimVar('L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO', 'boolean', 1000);

    const [greenHydLevel] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR', 'gallon', 1000);
    const [blueHydLevel] = useSimVar('L:A32NX_HYD_BLUE_RESERVOIR', 'galllon', 1000);
    const [yellowHydLevel] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR', 'gallon', 1000);

    const [greenFireValve] = useSimVar('L:A32NX_HYD_GREEN_FIRE_VALVE_OPENED', 'boolean', 1000);
    const [yellowFireValve] = useSimVar('L:A32NX_HYD_YELLOW_FIRE_VALVE_OPENED', 'boolean', 1000);

    const y = 45;

    return (
        <>
            {/* This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM */}
            <svg id="hyd-page" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: '-60px' }}>
                <text id="PageTitle" className="PageTitle" x="300" y="16" alignmentBaseline="central">HYD</text>
                <text className={`EngineNumber ${Eng1Running > 15 ? 'fill-white' : 'fill-amber'}`} x="160" y={y + 260} alignmentBaseline="central">1</text>
                <text className={`EngineNumber ${Eng2Running > 15 ? 'fill-white' : 'fill-amber'}`} x="440" y={y + 260} alignmentBaseline="central">2</text>

                <HydSys title="GREEN" pressure={greenPressure} hydLevel={greenHydLevel} x={110} y={y} fireValve={greenFireValve} pumpStatus={greenPumpStatus} elecPump={yelloElectricPumpStatus} />
                <HydSys title="BLUE" pressure={bluePressure} hydLevel={blueHydLevel} x={300} y={y} fireValve={0} pumpStatus={bluePumpStatus} elecPump={1} />
                <HydSys title="YELLOW" pressure={yellowPressure} hydLevel={yellowHydLevel} x={490} y={y} fireValve={yellowFireValve} pumpStatus={yellowPumpStatus} elecPump={yelloElectricPumpStatus} />

                <PTU x={300} y={y + 126} ptuOn={0} />

                <text className="rat-ptu-elec fill-white" x={248} y={y + 180} alignmentBaseline="central">RAT</text>
                <line className="green-line hide" x1={290} y1={y + 180} x2={300} y2={y + 180} />
                <Triangle x={290} y={y + 180} colour="white" fill={0} orientation={90} />

                <text id="ELEC-centre" className="rat-ptu-elec fill-white" x={350} y={y + 245} alignmentBaseline="central">ELEC</text>

                <text id="ELEC-right" className="rat-ptu-elec fill-white" x={548} y={y + 180} alignmentBaseline="central">ELEC</text>
                <Triangle x={500} y={y + 180} colour="white" fill={0} orientation={-90} />
                <line className={yelloElectricPumpStatus ? 'hide' : 'green-line'} x1={490} y1={y + 180} x2={500} y2={y + 180} />

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
    pumpStatus: number,
    elecPump: number
}

const HydSys = ({ title, pressure, hydLevel, x, y, fireValve, pumpStatus, elecPump } : HydSysProps) => {
    console.log(`Hyd system ${title}`);
    const [hydLevelLow, setHydLevelLow] = useState(false);
    const lowPressure = 1450;
    const pressureNearest50 = Math.round(pressure / 50) * 50 >= 100 ? Math.round(pressure / 50) * 50 : 0;

    return (
        <>
            <Triangle x={x} y={y} colour={pressureNearest50 <= lowPressure ? 'amber' : 'green'} fill={0} orientation={0} />
            <text className={`title ${pressureNearest50 <= lowPressure ? 'fill-amber' : 'fill-green'}`} x={x} y={y + 43}>{title}</text>
            <text className={`pressure ${pressureNearest50 <= lowPressure ? 'fill-amber' : 'fill-green'}`} x={x} y={y + 75}>{pressureNearest50}</text>

            {/* The colour of these lines will be affected by the yellow electric pump */}
            <line className={pressureNearest50 <= lowPressure ? 'amber-line' : 'green-line'} x1={x} y1={y + 126} x2={x} y2={y + 83} />
            <line className={pressureNearest50 <= lowPressure ? 'amber-line' : 'green-line'} x1={x} y1={y + 181} x2={x} y2={y + 125} />
            <line className={pressureNearest50 <= lowPressure ? 'amber-line' : 'green-line'} x1={x} y1={y + 221} x2={x} y2={y + 180} />

            <HydEngPump system={title} pressure={pressureNearest50} pumpOn={pumpStatus} x={x} y={y + 290} hydLevelLow={hydLevelLow} fireValve={fireValve} />
            <HydEngValve system={title} x={x} y={y + 290} fireValve={fireValve} />
            {/* Reservoir */}
            <HydReservoir system={title} x={x} y={y + 300} fluidLevel={hydLevel} setHydLevel={setHydLevelLow} />
        </>
    );
};

type HydEngPumpProps = {
    system: string,
    pressure: number,
    pumpOn: number,
    x: number,
    y: number,
    hydLevelLow: boolean,
    fireValve: number,
}

const HydEngPump = ({ system, pressure, pumpOn, x, y, hydLevelLow, fireValve } : HydEngPumpProps) => {
    const lowPressure = 1450;

    if (system === 'BLUE') {
        return (
            <>
                <line className={!pumpOn || pressure < lowPressure ? 'amber-line' : 'green-line'} x1={x} y1={y - 32} x2={x} y2={y - 80} />
                <rect className={!pumpOn || pressure < lowPressure ? 'amber-line' : 'green-line'} x={x - 16} y={y - 32} width={32} height={32} />
                <line className={pumpOn && pressure > lowPressure ? 'green-line' : 'hide'} x1={x} y1={y} x2={x} y2={y - 32} />
                <line className={pumpOn ? 'hide' : 'amber-line'} x1={x - 12} y1={y - 16} x2={x + 12} y2={y - 16} />
                <text id="ELEC-centre" className={(pressure > lowPressure && pumpOn) || !pumpOn ? 'hide' : 'rat-ptu-elec fill-amber'} x={x} y={y - 16} alignmentBaseline="central">LO</text>

            </>
        );
    }

    return (
        <>
            <rect className={!pumpOn || pressure <= lowPressure ? 'amber-line' : 'green-line'} x={x - 16} y={y - 80} width={32} height={32} />
            <line className={pumpOn && pressure > lowPressure ? 'green-line' : 'hide'} x1={x} y1={y} x2={x} y2={y - 80} />
            <line className={pumpOn ? 'hide' : 'amber-line'} x1={x - 12} y1={y - 64} x2={x + 12} y2={y - 64} />
            <line className={hydLevelLow || !fireValve ? 'amber-line' : 'green-line'} x1={x} y1={y} x2={x} y2={y - 48} />
            <text id="ELEC-centre" className={(pressure > lowPressure && pumpOn) || !pumpOn ? 'hide' : 'rat-ptu-elec fill-amber'} x={x} y={y - 64} alignmentBaseline="central">LO</text>

        </>
    );
};

type HydEngValveProps = {
    system: string,
    x: number,
    y: number,
    fireValve: number
}

const HydEngValve = ({ system, x, y, fireValve } : HydEngValveProps) => {
    console.log('Pump');
    if (system === 'BLUE') {
        return (
            <line className="green-line" x1={x} y1={y + 32} x2={x} y2={y} />
        );
    }

    return (
        <>
            <circle className={fireValve ? 'green-line' : 'amber-line'} cx={x} cy={y + 16} r="16" />
            <line className={fireValve ? 'green-line' : 'hide'} x1={x} y1={y + 32} x2={x} y2={y} />
            <line className={fireValve ? 'hide' : 'amber-line'} x1={x - 10} y1={y + 6} x2={x + 10} y2={y + 6} />
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
    console.log(`Reservoir${system}`);
    const levels = [
        { system: 'GREEN', max: 14.5, low: 3.5, norm: 2.6 },
        { system: 'BLUE', max: 6.5, low: 2.4, norm: 1.6 },
        { system: 'YELLOW', max: 12.5, low: 3.5, norm: 2.6 },
    ];
    const fluidLevelInLitres = fluidLevel * 3.79;

    const values = levels.filter((item) => item.system === system);
    const litersPerPixel = 96 / values[0].max;
    const reserveHeight = (litersPerPixel * values[0].low);
    const upperReserve = 495 - reserveHeight;
    const lowerNorm = 399 + (litersPerPixel * values[0].norm);
    const fluidLevelPerPixel = 96 / values[0].max;
    const fluidHeight = 495 - (fluidLevelPerPixel * fluidLevelInLitres);

    if (fluidLevelInLitres < values[0].low) {
        setHydLevel(true);
    } else {
        setHydLevel(false);
    }

    return (
        <>
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1="399" x2={x} y2="361" />
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'white-line'} x1={x} y1={upperReserve.toFixed(0)} x2={x} y2="399" />
            <line className="green-line" x1={x} y1="399" x2={x + 4} y2="399" strokeLinejoin="miter" />
            <line className="green-line" x1={x + 4} y1={lowerNorm.toFixed(0)} x2={x + 4} y2="399" strokeLinejoin="miter" />
            <line className="green-line" x1={x} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={lowerNorm.toFixed(0)} strokeLinejoin="miter" />
            <rect className="amber-line" x={x} y={upperReserve.toFixed(0)} width={4} height={reserveHeight} />

            {/* Hydraulic level */}
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={495} x2={x - 8} y2={495} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x - 8} y1={495} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight - 8} strokeLinejoin="miter" />
        </>
    );
};

type PTUProps = {
    x: number,
    y: number,
    ptuOn: number
}

const PTU = ({ x, y, ptuOn } : PTUProps) => {
    console.log(`PTU status is ${ptuOn}`);
    const semiCircleD = `M${x - 16},${y} C${x - 16},${y + 24} ${x + 16},${y + 24} ${x + 16},${y}`;

    // Right triangle facing right + 120
    // Right triangle pointing left + 135

    return (
        <>
            <line className="green-line hide" x1={x - 100} y1={y} x2={x - 190} y2={y} />
            <line className="green-line" x1={x - 100} y1={y} x2={x - 16} y2={y} />
            <path className="green-line no-fill" d={semiCircleD} />
            <line className="green-line" x1={x + 16} y1={y} x2={x + 50} y2={y} />
            <line className="green-line hide" x1={x + 135} y1={y} x2={x + 190} y2={y} />
            <text className="rat-ptu-elec fill-white" x={x + 92} y={y} alignmentBaseline="central">PTU</text>
            <Triangle x={x - 100} y={y} colour="green" fill={0} orientation={-90} />
            <Triangle x={x + 50} y={y} colour="green" fill={0} orientation={-90} />
            <Triangle x={x + 135} y={y} colour="green" fill={0} orientation={90} />
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
