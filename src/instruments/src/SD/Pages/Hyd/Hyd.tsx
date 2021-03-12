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
import React from 'react';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider } from '../../../Common/simVars';

setIsEcamPage('hyd_page');

export const HydPage = () => {
    console.log('Hydraulics page');
    const greenPressure = 2600;
    const bluePressure = 3000;
    const yellowPressure = 2860;

    const greenHydLevel = 14.4;
    const blueHydLevel = 6.4;
    const yellowHydLevel = 12.4;

    return (
        <>
            <svg id="hyd-page" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                <text id="PageTitle" className="PageTitle" x="300" y="10" alignmentBaseline="central">HYD</text>
                <text className="EngineNumber fill-amber" x="160" y="280" alignmentBaseline="central">1</text>
                <text className="EngineNumber fill-amber" x="440" y="280" alignmentBaseline="central">2</text>

                <PTU x={300} y={150} ptuOn={0} />

                <HydSys title="GREEN" pressure={greenPressure} hydLevel={greenHydLevel} x={110} />
                <HydSys title="BLUE" pressure={bluePressure} hydLevel={blueHydLevel} x={300} />
                <HydSys title="YELLOW" pressure={yellowPressure} hydLevel={yellowHydLevel} x={490} />

                <text className="rat-ptu-elec fill-white" x={248} y={198} alignmentBaseline="central">RAT</text>
                <line className="green-line hide" x1={290} y1={198} x2={300} y2={198} />
                <Triangle x={290} y={198} colour="white" fill={0} orientation={90} />

                <text id="ELEC-centre" className="rat-ptu-elec fill-white" x={350} y={265} alignmentBaseline="central">ELEC</text>

                <text id="ELEC-right" className="rat-ptu-elec fill-white" x={548} y={198} alignmentBaseline="central">ELEC</text>
                <Triangle x={500} y={198} colour="green" fill={1} orientation={-90} />
                <line className="green-line" x1={490} y1={198} x2={500} y2={198} />

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
}

const HydSys = ({ title, pressure, hydLevel, x } : HydSysProps) => {
    console.log(`Hyd system ${title}`);

    return (
        <>
            <Triangle x={x} y={35} colour="green" fill={0} orientation={0} />
            <text className="title" x={x} y="78">{title}</text>
            <text className="pressure" x={x} y="110">{pressure}</text>
            <line className="green-line" x1={x} y1="151" x2={x} y2="118" />
            <line className={title === 'GREEN' ? 'amber-line' : 'green-line'} x1={x} y1="199" x2={x} y2="150" />
            <line className={title === 'BLUE' ? 'green-line' : 'amber-line'} x1={x} y1="231" x2={x} y2="198" />
            <HydEngPump system={title} pumpOn={1} x={x} />
            <HydEngValve system={title} valveOpen={1} x={x} />
            {/* Reservoir */}
            <HydReservoir system={title} x={x} fluidLevel={hydLevel} />
        </>
    );
};

type HydEngPumpProps = {
    system: string,
    pumpOn: number;
    x: number
}

const HydEngPump = ({ system, pumpOn, x } : HydEngPumpProps) => {
    const y = 310;
    console.log(`Pump ${system}`);
    if (system === 'GREEN') {
        pumpOn = 1;
    }

    if (system === 'BLUE') {
        return (
            <>
                <line className="green-line" x1={x} y1={y - 32} x2={x} y2={y - 80} />
                <rect className={pumpOn ? 'green-line' : 'amber-line'} x={x - 16} y={y - 32} width={32} height={32} />
                <line className={pumpOn ? 'green-line' : 'green-line hide'} x1={x} y1={y} x2={x} y2={y - 32} />
                <line className={pumpOn ? 'hide' : 'amber-line'} x1={x - 12} y1={y - 16} x2={x + 12} y2={y - 16} />
                <text id="ELEC-centre" className="rat-ptu-elec fill-amber hide" x={x} y={y - 16} alignmentBaseline="central">LO</text>

            </>
        );
    }

    return (
        <>
            <rect className="amber-line" x={x - 16} y={y - 80} width={32} height={32} />
            <line className={pumpOn ? 'green-line hide' : 'green-line hide'} x1={x} y1={y} x2={x} y2={y - 80} />
            <line className={pumpOn ? 'hide' : 'amber-line'} x1={x - 12} y1={y - 64} x2={x + 12} y2={y - 64} />
            <line className="green-line" x1={x} y1={y} x2={x} y2={y - 48} />
            <text id="ELEC-centre" className="rat-ptu-elec fill-amber" x={x} y={y - 64} alignmentBaseline="central">LO</text>

        </>
    );
};

type HydEngValveProps = {
    system: string,
    valveOpen: number;
    x: number
}

const HydEngValve = ({ system, valveOpen, x } : HydEngValveProps) => {
    console.log('Pump');
    // TESTING ONLY REMOVE FOR PRODUCTION
    if (system === 'GREEN') {
        valveOpen = 1;
    }

    if (system === 'BLUE') {
        return (
            <line className="green-line" x1={x} y1="342" x2={x} y2="310" />
        );
    }

    return (
        <>
            <circle className={valveOpen ? 'green-line' : 'amber-line'} cx={x} cy="326" r="16" />
            <line className={valveOpen ? 'green-line' : 'hide'} x1={x} y1="342" x2={x} y2="310" />
            <line className={valveOpen ? 'hide' : 'amber-line'} x1={x - 10} y1="326" x2={x + 10} y2="326" />
        </>
    );
};

type HydReservoirProps = {
    system: string,
    x: number,
    fluidLevel: number
}

const HydReservoir = ({ system, x, fluidLevel } : HydReservoirProps) => {
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

    console.log(`Upper reserve is ${upperReserve} lower norm is ${lowerNorm}`);

    return (
        <>
            <line className="green-line" x1={x} y1="374" x2={x} y2="341" />
            <line className="white-line" x1={x} y1={upperReserve.toFixed(0)} x2={x} y2="374" />
            <line className="green-line" x1={x} y1="374" x2={x + 4} y2="374" strokeLinejoin="miter" />
            <line className="green-line" x1={x + 4} y1={lowerNorm.toFixed(0)} x2={x + 4} y2="374" strokeLinejoin="miter" />
            <line className="green-line" x1={x} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={lowerNorm.toFixed(0)} strokeLinejoin="miter" />
            <rect className="amber-line" x={x} y={upperReserve.toFixed(0)} width={4} height={reserveHeight} />

            {/* Hydraulic level */}
            <line className="green-line" x1={x} y1={470} x2={x - 8} y2={470} strokeLinejoin="miter" />
            <line className="green-line" x1={x - 8} y1={470} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className="green-line" x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className="green-line" x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight - 8} strokeLinejoin="miter" />
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
    console.log(semiCircleD);

    return (
        <>
            <line className="green-line" x1={x - 100} y1={y} x2={x - 16} y2={y} />
            <line className="green-line" x1={x - 100} y1={y} x2={x - 190} y2={y} />
            <path className="green-line" d={semiCircleD} />
            <line className="green-line" x1={x + 16} y1={y} x2={x + 50} y2={y} />
            <line className="green-line" x1={x + 135} y1={y} x2={x + 190} y2={y} />
            <text className="rat-ptu-elec fill-white" x={x + 92} y={y} alignmentBaseline="central">PTU</text>
            <Triangle x={x - 100} y={y} colour="green" fill={1} orientation={-90} />
            <Triangle x={x + 50} y={y} colour="green" fill={1} orientation={-90} />
            <Triangle x={x + 120} y={y} colour="green" fill={1} orientation={-90} />
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
