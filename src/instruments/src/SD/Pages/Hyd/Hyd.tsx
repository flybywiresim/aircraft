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
    console.log('Hydraulics page');
    const [Eng1Running] = useSimVar('ENG N1 RPM:1', 'Percent', 1000);
    const [Eng2Running] = useSimVar('ENG N1 RPM:2', 'Percent', 1000);
    console.log(`Eng1 is ${Eng1Running}`);

    const greenPressure = 2980;
    const bluePressure = 1420;
    const yellowPressure = 3000;

    const [greenPumpStatus] = useSimVar('L:A32NX_HYD_ENG1PUMP_TOGGLE', 'boolean', 1000);
    const [bluePumpStatus] = useSimVar('L:A32NX_HYD_ELECPUMP_TOGGLE', 'boolean', 1000);
    const [yellowPumpStatus] = useSimVar('L:A32NX_HYD_ENG2PUMP_TOGGLE', 'boolean', 1000);

    const greenHydLevel = 1.4;
    const blueHydLevel = 4.4;
    const yellowHydLevel = 10.4;

    const [greenFireValve] = useSimVar('L:A32NX_FIRE_GUARD_ENG1', 'boolean', 1000);
    const [yellowFireValve] = useSimVar('L:A32NX_FIRE_GUARD_ENG2', 'boolean', 1000);

    return (
        <>
            <svg id="hyd-page" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                <text id="PageTitle" className="PageTitle" x="300" y="10" alignmentBaseline="central">HYD</text>
                <text className={`EngineNumber ${Eng1Running > 15 ? 'fill-white' : 'fill-amber'}`} x="160" y="280" alignmentBaseline="central">1</text>
                <text className={`EngineNumber ${Eng2Running > 15 ? 'fill-white' : 'fill-amber'}`} x="440" y="280" alignmentBaseline="central">2</text>

                <PTU x={300} y={150} ptuOn={0} />

                <HydSys title="GREEN" pressure={greenPressure} hydLevel={greenHydLevel} x={110} fireValve={greenFireValve} pumpStatus={greenPumpStatus} />
                <HydSys title="BLUE" pressure={bluePressure} hydLevel={blueHydLevel} x={300} fireValve={0} pumpStatus={bluePumpStatus} />
                <HydSys title="YELLOW" pressure={yellowPressure} hydLevel={yellowHydLevel} x={490} fireValve={yellowFireValve} pumpStatus={yellowPumpStatus} />

                <text className="rat-ptu-elec fill-white" x={248} y={198} alignmentBaseline="central">RAT</text>
                <line className="green-line hide" x1={290} y1={198} x2={300} y2={198} />
                <Triangle x={290} y={198} colour="white" fill={0} orientation={90} />

                <text id="ELEC-centre" className="rat-ptu-elec fill-white" x={350} y={265} alignmentBaseline="central">ELEC</text>

                <text id="ELEC-right" className="rat-ptu-elec fill-white" x={548} y={198} alignmentBaseline="central">ELEC</text>
                <Triangle x={500} y={198} colour="white" fill={0} orientation={-90} />
                <line className="green-line hide" x1={490} y1={198} x2={500} y2={198} />

                <text className="psi" x={205} y={103} alignmentBaseline="central">PSI</text>
                <text className="psi" x={395} y={103} alignmentBaseline="central">PSI</text>

            </svg>
        </>
    );
};

type HydSysProps = {
    title: string,
    pressure: number,
    hydLevel: number,
    x: number,
    fireValve: number,
    pumpStatus: number
}

const HydSys = ({ title, pressure, hydLevel, x, fireValve, pumpStatus } : HydSysProps) => {
    console.log(`Hyd system ${title}`);
    const [hydLevelLow, setHydLevelLow] = useState(false);
    const lowPressure = 1450;
    const pressureNearest50 = Math.round(pressure / 50) * 50 >= 100 ? Math.round(pressure / 50) * 50 : 0;

    return (
        <>
            <Triangle x={x} y={35} colour={pressureNearest50 <= lowPressure ? 'amber' : 'green'} fill={0} orientation={0} />
            <text className={`title ${pressureNearest50 <= lowPressure ? 'fill-amber' : 'fill-white'}`} x={x} y="78">{title}</text>
            <text className={`pressure ${pressureNearest50 <= lowPressure ? 'fill-amber' : 'fill-green'}`} x={x} y="110">{pressureNearest50}</text>
            <line className={pressureNearest50 <= lowPressure ? 'amber-line' : 'green-line'} x1={x} y1="151" x2={x} y2="118" />
            <line className={pressureNearest50 <= lowPressure ? 'amber-line' : 'green-line'} x1={x} y1="199" x2={x} y2="150" />
            <line className={pressureNearest50 <= lowPressure ? 'amber-line' : 'green-line'} x1={x} y1="231" x2={x} y2="198" />
            <HydEngPump system={title} pressure={pressure} pumpOn={pumpStatus} x={x} hydLevelLow={hydLevelLow} fireValve={fireValve} />
            <HydEngValve system={title} x={x} fireValve={fireValve} />
            {/* Reservoir */}
            <HydReservoir system={title} x={x} fluidLevel={hydLevel} setHydLevel={setHydLevelLow} />
        </>
    );
};

type HydEngPumpProps = {
    system: string,
    pressure: number,
    pumpOn: number,
    x: number,
    hydLevelLow: boolean,
    fireValve: number,
}

const HydEngPump = ({ system, pressure, pumpOn, x, hydLevelLow, fireValve } : HydEngPumpProps) => {
    const y = 310;
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
            <line className={hydLevelLow || fireValve ? 'amber-line' : 'green-line'} x1={x} y1={y} x2={x} y2={y - 48} />
            <text id="ELEC-centre" className={(pressure > lowPressure && pumpOn) || !pumpOn ? 'hide' : 'rat-ptu-elec fill-amber'} x={x} y={y - 64} alignmentBaseline="central">LO</text>

        </>
    );
};

type HydEngValveProps = {
    system: string,
    x: number,
    fireValve: number
}

const HydEngValve = ({ system, x, fireValve } : HydEngValveProps) => {
    console.log('Pump');

    if (system === 'BLUE') {
        return (
            <line className="green-line" x1={x} y1="342" x2={x} y2="310" />
        );
    }

    return (
        <>
            <circle className={!fireValve ? 'green-line' : 'amber-line'} cx={x} cy="326" r="16" />
            <line className={!fireValve ? 'green-line' : 'hide'} x1={x} y1="342" x2={x} y2="310" />
            <line className={!fireValve ? 'hide' : 'amber-line'} x1={x - 10} y1="326" x2={x + 10} y2="326" />
        </>
    );
};

type HydReservoirProps = {
    system: string,
    x: number,
    fluidLevel: number,
    setHydLevel: React.Dispatch<React.SetStateAction<boolean>>
}

const HydReservoir = ({ system, x, fluidLevel, setHydLevel } : HydReservoirProps) => {
    console.log(`Reservoir${system}`);
    const levels = [
        { system: 'GREEN', max: 14.5, low: 3.5, norm: 2.6 },
        { system: 'BLUE', max: 6.5, low: 2.4, norm: 1.6 },
        { system: 'YELLOW', max: 12.5, low: 3.5, norm: 2.6 },
    ];

    const values = levels.filter((item) => item.system === system);
    const litersPerPixel = 96 / values[0].max;
    const reserveHeight = (litersPerPixel * values[0].low);
    const upperReserve = 470 - reserveHeight;
    const lowerNorm = 374 + (litersPerPixel * values[0].norm);
    const fluidLevelPerPixel = 96 / values[0].max;
    const fluidHeight = 470 - (fluidLevelPerPixel * fluidLevel);

    if (fluidLevel < values[0].low) {
        setHydLevel(true);
    } else {
        setHydLevel(false);
    }

    return (
        <>
            <line className={fluidLevel < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1="374" x2={x} y2="341" />
            <line className={fluidLevel < values[0].low ? 'amber-line' : 'white-line'} x1={x} y1={upperReserve.toFixed(0)} x2={x} y2="374" />
            <line className="green-line" x1={x} y1="374" x2={x + 4} y2="374" strokeLinejoin="miter" />
            <line className="green-line" x1={x + 4} y1={lowerNorm.toFixed(0)} x2={x + 4} y2="374" strokeLinejoin="miter" />
            <line className="green-line" x1={x} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={lowerNorm.toFixed(0)} strokeLinejoin="miter" />
            <rect className="amber-line" x={x} y={upperReserve.toFixed(0)} width={4} height={reserveHeight} />

            {/* Hydraulic level */}
            <line className={fluidLevel < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={470} x2={x - 8} y2={470} strokeLinejoin="miter" />
            <line className={fluidLevel < values[0].low ? 'amber-line' : 'green-line'} x1={x - 8} y1={470} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevel < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevel < values[0].low ? 'amber-line' : 'green-line'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight - 8} strokeLinejoin="miter" />
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
            <path className="green-line" d={semiCircleD} />
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
