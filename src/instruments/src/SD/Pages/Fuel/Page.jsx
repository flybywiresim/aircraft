/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
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

import { useState, useEffect } from 'react';
import { PageTitle } from '../Graphics/PageTitle.jsx';
import './index.scss';
import { useSimVar } from '../Graphics/SimVar.jsx';

export const FuelPage = () => {
    const leftValveOpen = useSimVar('FUELSYSTEM VALVE SWITCH:1', 'boolean');
    const centerValveOpen = useSimVar('FUELSYSTEM VALVE SWITCH:3', 'boolean');
    const rightValveOpen = useSimVar('FUELSYSTEM VALVE SWITCH:2', 'boolean');

    const pumpLeftInner1 = useSimVar('FUELSYSTEM PUMP ACTIVE:2', 'boolean');
    const pumpLeftInner2 = useSimVar('FUELSYSTEM PUMP ACTIVE:5', 'boolean');
    const pumpCenter1 = useSimVar('FUELSYSTEM PUMP ACTIVE:1', 'boolean');
    const pumpCenter2 = useSimVar('FUELSYSTEM PUMP ACTIVE:4', 'boolean');
    const pumpRightInner1 = useSimVar('FUELSYSTEM PUMP ACTIVE:3', 'boolean');
    const pumpRightInner2 = useSimVar('FUELSYSTEM PUMP ACTIVE:6', 'boolean');
    // const pumpApu = useSimVar('FUELSYSTEM PUMP ACTIVE:7', 'boolean');

    const tankLeftOuter = useSimVar('FUEL TANK LEFT AUX QUANTITY', 'gallons', 10, Math.round);
    const tankLeftInner = useSimVar('FUEL TANK LEFT MAIN QUANTITY', 'gallons', 10, Math.round);
    const tankCenter = useSimVar('FUEL TANK CENTER QUANTITY', 'gallons', 10, Math.round);
    const tankRightInner = useSimVar('FUEL TANK RIGHT MAIN QUANTITY', 'gallons', 10, Math.round);
    const tankRightOuter = useSimVar('FUEL TANK RIGHT AUX QUANTITY', 'gallons', 10, Math.round);

    const leftFuelUsed = useSimVar('GENERAL ENG FUEL USED SINCE START:1', 'kg', 10, Math.round);
    const rightFuelUsed = useSimVar('GENERAL ENG FUEL USED SINCE START:2', 'kg', 10, Math.round);

    const [totalFuelUsed, setTotalFuelUsed] = useState(0);

    useEffect(() => {
        setTotalFuelUsed(leftFuelUsed + rightFuelUsed);
    }, [leftFuelUsed, rightFuelUsed]);

    const fob = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 2, (q) => q - (q % 10));

    const fuelWeightPerGallon = useSimVar('FUEL WEIGHT PER GALLON', 'kilogram', 0);

    const leftFuelFlow = useSimVar('ENG FUEL FLOW GPH:1', 'gallons per hour', 10, (f) => f / 60);
    const rightFuelFlow = useSimVar('ENG FUEL FLOW GPH:2', 'gallons per hour', 10, (f) => f / 60);

    const [totalFuelFlow, setTotalFuelFlow] = useState(0);

    useEffect(() => {
        setTotalFuelFlow((fuelWeightPerGallon * (leftFuelFlow + rightFuelFlow)) |> Math.round);
    }, [leftFuelFlow, rightFuelFlow]);

    return (
        <g id="sd-fuel-page">
            <PageTitle x={20} y={30}>FUEL</PageTitle>

            <g id="engines">
                <text className="FuelUsed" x={300} y={28}>F.USED</text>
                <text className="FuelUsed" x={300} y={47}>1+2</text>
                <text className="UsedQuantity" x={300} y={72}>{totalFuelUsed}</text>

                {/* Left engine */}
                <text className="EngineNumber" x={160} y={41}>1</text>
                <line className="EngineLine" x1="200" y1="31" x2="250" y2="21" />
                <text className="UsedQuantity" x={160} y={66}>{leftFuelUsed}</text>

                {/* Right engine */}
                <text className="EngineNumber" x={440} y={41}>2</text>
                <line className="EngineLine" x1="400" y1="31" x2="350" y2="21" />
                <text className="UsedQuantity" x={440} y={66}>{rightFuelUsed}</text>
            </g>

            {/* Wings */}
            <g id="wings">
                {/* Bottom line */}
                <path className="ThickShape" d="M 15, 255 l 0, 80 l 570, 0 l 0,-80" strokeLinecap="round" />

                {/* Top line */}
                <path className="ThickShape" d="M 585, 255 l -124.2, -21.6" />
                <path className="ThickShape" d="M 15,  255 l 124.2, -21.6" />
                <path className="ThickShape" d="M 245, 215 l 14, 0" />
                <path className="ThickShape" d="M 288, 215 l 23, 0" />
                <path className="ThickShape" d="M 341, 215 l 14, 0" />
                <path className="ThickShape" d="M 245, 215 l -29.9, 5.2" />
                <path className="ThickShape" d="M 355, 215 l 29.9, 5.2" />

                {/* Tank lines */}
                <path className="ThickShape" d="M 80,  244 L 80,  335" />
                <path className="ThickShape" d="M 245, 215 L 230, 335" />
                <path className="ThickShape" d="M 355, 215 L 370, 335" />
                <path className="ThickShape" d="M 520, 244 L 520, 335" />
            </g>

            {/* Quantities */}
            <Quantity x={74} y={285}>{tankLeftOuter}</Quantity>
            <Quantity x={190} y={285}>{tankLeftInner}</Quantity>
            <Quantity x={335} y={275}>{tankCenter}</Quantity>
            <Quantity x={472} y={285}>{tankRightInner}</Quantity>
            <Quantity x={579} y={285}>{tankRightOuter}</Quantity>

            {/* APU */}
            <g id="APU">
                <text x="126" y="150" textAnchor="end" alignmentBaseline="central">APU</text>
                <path className="FlowShape" d="M 132, 150 l 15, 9 l 0,-18 Z" />
                <path id="apuFuelLine" className="FlowShape" d="M147,150 l13,0" />
            </g>

            {/* Left */}

            <g id="leftPipes" className="FlowShape">
                <Line x1="160" y1="84" x2="160" y2="76" />
                <Line x1="160" y1="215" x2="160" y2="107" />
                <path d="M 160, 190 l 35, 0 l 0, 25" />
            </g>

            <Valve x={160} y={100} open={leftValveOpen} />

            <Pump x={145} y={215} active={pumpLeftInner1} />
            <Pump x={180} y={215} active={pumpLeftInner2} />

            {/* Center */}

            <g id="centerPipes">
                {/* Side lines */}
                <Line x1="160" y1="150" x2="270" y2="150" />
                <Line x1="330" y1="150" x2="440" y2="150" />

                {/* Center valve lines */}
                <Line x1="270" y1="150" x2="283" y2="150" />
                <Line x1="317" y1="150" x2="330" y2="150" />

                {/* Center pumps lines */}
                <Line x1="274" y1="150" x2="274" y2="210" />
                <Line x1="326" y1="150" x2="326" y2="210" />
            </g>

            <Valve x={300} y={150} open={centerValveOpen} crossFeed />

            <Pump x={259} y={205} active={pumpCenter1} />
            <Pump x={311} y={205} active={pumpCenter2} />

            {/* Right */}

            <g id="rightPipes" className="FlowShape">
                <Line x1="440" y1="84" x2="440" y2="76" />
                <line x1="440" y1="215" x2="440" y2="107" />
                <path d="M440, 190 l-35, 0 l0, 25" />
            </g>

            <Valve x={440} y={100} open={rightValveOpen} />

            <Pump x={390} y={215} active={pumpRightInner1} />
            <Pump x={425} y={215} active={pumpRightInner2} />

            {/* F. FLOW / FOB */}

            <g id="fuel-flow">
                <text className="FuelFlowLabel" x={46} y={443}>F.FLOW</text>
                <text className="FuelFlowLabel" x={46} y={461}>1+2</text>

                <text id="FuelFlowColon" x={83} y={461}>:</text>

                <text id="FuelFlowValue" x={200} y={452}>{totalFuelFlow}</text>

                <text id="FuelFlowUnit" x={215} y={452}>KG/MIN</text>
            </g>

            <g id="fob">
                <path className="ThickShape" d="m 5 499 v -30 h 250 v 30 z" />

                <text id="FobLabel" x={18} y={491}>FOB</text>
                <text id="FobColon" x={83} y={490}>:</text>

                <text id="FobValue" x={200} y={481}>{fob}</text>

                <text id="FobUnit" x={215} y={483}>KG</text>
            </g>
        </g>
    );
};

const Quantity = ({ x, y, children }) => (
    <text className="TankQuantity" x={x} y={y}>{children}</text>
);

const Line = ({
    x1, y1, x2, y2, displayed = true,
}) => (
    displayed
        ? <line className="FlowShape" x1={x1} y1={y1} x2={x2} y2={y2} /> : null
);

const Valve = ({
    x, y, open = true, crossFeed = false,
}) => {
    const verticalLine = crossFeed ? !open : open;

    return (
        <g className="ThickShape ValveActive">
            <circle cx={x} cy={y} r={15} />
            {verticalLine
                ? <line x1={x} y1={y - 15} x2={x} y2={y + 15} />
                : <line x1={x - 15} y1={y} x2={x + 15} y2={y} />}
        </g>
    );
};

const Pump = ({ x, y, active = true }) => (
    <g className={active ? 'ThickShape PumpActive' : 'ThickShape PumpInactive'}>
        <rect x={x} y={y} width="30" height="30" />
        {active
            ? <line x1={x + 15} y1={y} x2={x + 15} y2={y + 30} />
            : <line x1={x} y1={y + 15} x2={x + 30} y2={y + 15} />}
    </g>
);
