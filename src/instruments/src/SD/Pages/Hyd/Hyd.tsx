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

    return (
        <>
            <svg id="hyd-page" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                <text id="PageTitle" className="Title" x="300" y="10" textAnchor="middle" alignmentBaseline="central" textDecoration="underline">HYD</text>

                <HydSys title="GREEN" pressure={3000} hydLevel={13.5} x={100} />
                <HydSys title="BLUE" pressure={3000} hydLevel={13.5} x={300} />
                <HydSys title="YELLOW" pressure={3000} hydLevel={13.5} x={500} />

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

    const polyPoints = `${x + 9},53 ${x},35 ${x - 9},53`;

    return (
        <>
            <polygon className="triangle" points={polyPoints} />
            <text className="title" x={x} y="78">{title}</text>
            <text className="pressure" x={x} y="110">{pressure}</text>
            <line className="white-line" x1={x} y1="150" x2={x} y2="118" />
            <line className="green-line" x1={x} y1="198" x2={x} y2="150" />
            <line className="white-line" x1={x} y1="230" x2={x} y2="198" />
            <HydEngPump system={title} pumpOn={0} x={x} />
            <HydEngValve system={title} valveOpen={0} x={x} />
            {/* Reservoir */}
            <HydReservoir system={title} x={x} />
        </>
    );
};

type HydReservoirProps = {
    system: string,
    x: number
}

const HydReservoir = ({ system, x } : HydReservoirProps) => {
    console.log(`Reservoir${system}`);
    const levels = [
        { system: 'GREEN', max: 14.5, low: 3.5, norm: 2.6 },
        { system: 'YELLOW', max: 12.5, low: 3.5, norm: 2.6 },
        { system: 'BLUE', max: 6.5, low: 2.4, norm: 1.6 },
    ];

    const values = levels.filter((item) => item.system === system);
    const litersPerPixel = 96 / values[0].max;
    const reserveHeight = (litersPerPixel * values[0].low);
    const upperReserve = 470 - reserveHeight;
    const lowerNorm = 374 + (litersPerPixel * values[0].norm);

    console.log(`Upper reserve is ${upperReserve} lower norm is ${lowerNorm}`);

    return (
        <>
            <line className="green-line" x1={x} y1="374" x2={x} y2="342" />
            <line className="white-line" x1={x} y1={upperReserve.toFixed(0)} x2={x} y2="374" />
            <line className="green-line" x1={x} y1="374" x2={x + 6} y2="374" />
            <line className="green-line" x1={x + 6} y1={lowerNorm.toFixed(0)} x2={x + 6} y2="374" />
            <line className="green-line" x1={x} y1={lowerNorm.toFixed(0)} x2={x + 6} y2={lowerNorm.toFixed(0)} />
            <rect className="amber-line" x={x} y={upperReserve.toFixed(0)} width={4} height={reserveHeight} />
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
            </>
        );
    }

    return (
        <>
            <rect className={pumpOn ? 'green-line' : 'amber-line'} x={x - 16} y={y - 80} width={32} height={32} />
            <line className={pumpOn ? 'green-line' : 'green-line hide'} x1={x} y1={y} x2={x} y2={y - 80} />
            <line className={pumpOn ? 'hide' : 'amber-line'} x1={x - 12} y1={y - 64} x2={x + 12} y2={y - 64} />
            <line className="green-line" x1={x} y1={y} x2={x} y2={y - 48} />
        </>
    );
};

ReactDOM.render(<SimVarProvider><HydPage /></SimVarProvider>, getRenderTarget());
