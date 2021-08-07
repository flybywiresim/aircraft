/* eslint-disable no-nested-ternary */
import './Fuel.scss';
import ReactDOM from 'react-dom';
import React, { useEffect } from 'react';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '@instruments/common/defaults';
import { usePersistentProperty } from '../../../Common/persistence';
import { fuelForDisplay, fuelInTanksForDisplay } from '../../Common/FuelFunctions';

setIsEcamPage('fuel_page');

export const FuelPage = () => {
    const [crossFeedPosition] = useSimVar('FUELSYSTEM VALVE OPEN:3', 'number', 500);

    const [pumpLeftInner1] = useSimVar('FUELSYSTEM PUMP ACTIVE:2', 'boolean', 500);
    const [pumpLeftInner2] = useSimVar('FUELSYSTEM PUMP ACTIVE:5', 'boolean', 500);
    const [pumpCenter1] = useSimVar('FUELSYSTEM PUMP ACTIVE:1', 'boolean', 500);
    const [pumpCenter2] = useSimVar('FUELSYSTEM PUMP ACTIVE:4', 'boolean', 500);
    const [pumpRightInner1] = useSimVar('FUELSYSTEM PUMP ACTIVE:3', 'boolean', 500);
    const [pumpRightInner2] = useSimVar('FUELSYSTEM PUMP ACTIVE:6', 'boolean', 500);

    const [tankLeftOuter] = useSimVar('FUEL TANK LEFT AUX QUANTITY', 'gallons', 500);
    const [tankLeftInner] = useSimVar('FUEL TANK LEFT MAIN QUANTITY', 'gallons', 500);
    const [tankCenter] = useSimVar('FUEL TANK CENTER QUANTITY', 'gallons', 500);
    const [tankRightInner] = useSimVar('FUEL TANK RIGHT MAIN QUANTITY', 'gallons', 500);
    const [tankRightOuter] = useSimVar('FUEL TANK RIGHT AUX QUANTITY', 'gallons', 500);

    const [pump1] = useSimVar('FUEL TRANSFER PUMP ON:1', 'bool', 500);
    const [pump2] = useSimVar('FUEL TRANSFER PUMP ON:2', 'bool', 500);
    const [pump3] = useSimVar('FUEL TRANSFER PUMP ON:3', 'bool', 500);
    const [pump5] = useSimVar('FUEL TRANSFER PUMP ON:5', 'bool', 500);
    const [pump7] = useSimVar('FUEL TRANSFER PUMP ON:7', 'bool', 500);
    const [pump4] = useSimVar('FUEL TRANSFER PUMP ON:4', 'bool', 500);
    const [pump6] = useSimVar('FUEL TRANSFER PUMP ON:6', 'bool', 500);
    const [pump8] = useSimVar('FUEL TRANSFER PUMP ON:8', 'bool', 500);
    const [pump9] = useSimVar('FUEL TRANSFER PUMP ON:9', 'bool', 500);
    useEffect(() => {
        console.log(`pump1 valve is ${pump1}`);
        console.log(`pump2 valve is ${pump2}`);
        console.log(`pump3 valve is ${pump3}`);
        console.log(`pump5 valve is ${pump5}`);
        console.log(`pump7 valve is ${pump7}`);
        console.log(`pump4 valve is ${pump4}`);
        console.log(`pump6 valve is ${pump6}`);
        console.log(`pump8 valve is ${pump8}`);
        console.log(`pump9 valve is ${pump9}`);
        console.log(' ----------- ');
    }, [pump1, pump2, pump3, pump5, pump7, pump4, pump6, pump8, pump9]);

    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT');

    const [leftConsumption] = useSimVar('L:A32NX_FUEL_USED:1', 'number', 1000); // Note these values are in KG
    const [rightConsumption] = useSimVar('L:A32NX_FUEL_USED:2', 'number', 1000);

    const leftFuelUsed = fuelForDisplay(leftConsumption, unit);
    const rightFuelUsed = fuelForDisplay(rightConsumption, unit);

    const [fuelWeightPerGallon] = useSimVar('FUEL WEIGHT PER GALLON', 'kilogram', 60_000);

    return (
        // This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM
        <svg id="sd-fuel-page" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
            <text className="PageTitle" x={14} y={16} alignmentBaseline="central">FUEL</text>

            {/* Engines */}
            <>
                <text className="FuelUsed" x={300} y={28}>F.USED</text>
                <text className="FuelUsed" x={300} y={50}>1+2</text>
                <text className="UsedQuantity" x={301} y={76}>{leftFuelUsed + rightFuelUsed}</text>
                <text className="Unit" textAnchor="middle" x={301} y={98}>{unit === '1' ? 'KG' : 'LBS'}</text>

                {/* Left engine */}
                <line className="EngineLine" x1="200" y1="31" x2="250" y2="21" />
                <EngineStatus x={160} y={41} engineNumber={1} fuelUsed={leftFuelUsed} />

                {/* Right engine */}
                <line className="EngineLine" x1="400" y1="31" x2="350" y2="21" />
                <EngineStatus x={440} y={41} engineNumber={2} fuelUsed={rightFuelUsed} />
            </>

            {/* Wings */}
            <Wings />

            {/* APU */}
            <Apu />

            {/* Left */}
            <>
                {/* Main ducts */}
                <line className="FlowShape" x1={160} y1={84} x2={160} y2={76} />

                {/* Left engine LP valve */}
                <EngineLpValve x={160} y={100} engineNumber={1} />

                {/* Ducts to left inner pumps */}
                <line className="FlowShape" x1={160} y1={215} x2={160} y2={116} />
                <line className="FlowShape" x1={160} y1={190} x2={196} y2={190} />
                <line className="FlowShape" x1={195} y1={190} x2={195} y2={215} />

                {/* Pumps */}
                <Pump x={145} y={215} active={!!pumpLeftInner1} />
                <Pump x={180} y={215} onBus="DC_2" active={!!pumpLeftInner2} />

                {/* Quantities */}
                <text className="TankQuantity" x={74} y={285}>{fuelInTanksForDisplay(tankLeftOuter, unit, fuelWeightPerGallon)}</text>
                <text className="TankQuantity" x={190} y={285}>{fuelInTanksForDisplay(tankLeftInner, unit, fuelWeightPerGallon)}</text>

                <text className="UnitTemp" x="70" y="355">°C</text>
            </>

            {/* Center */}
            <>

                {/* CrossFeed valve */}
                <CrossFeedValve x={300} y={150} />

                {/* Side lines */}
                <line className="FlowShape" x1="160" y1="150" x2="275" y2="150" />
                <line className="FlowShape" x1="325" y1="150" x2="440" y2="150" />

                {(crossFeedPosition === 1) && (
                    <>
                        {/* Center valve lines */}
                        <line className="FlowShape" x1="317" y1="150" x2="330" y2="150" />
                        <line className="FlowShape" x1="270" y1="150" x2="283" y2="150" />
                    </>
                )}

                {/* Center pumps lines */}
                <line className="FlowShape" x1="274" y1="150" x2="274" y2="205" />
                <line className="FlowShape" x1="326" y1="150" x2="326" y2="205" />

                {/* Pumps */}
                <Pump x={259} y={205} active={!!pumpCenter1} />
                <Pump x={311} y={205} active={!!pumpCenter2} />

                {/* Quantities */}
                <text className="TankQuantity" x={335} y={275}>{fuelInTanksForDisplay(tankCenter, unit, fuelWeightPerGallon)}</text>
            </>

            {/* Right */}
            <>
                {/* Main duct */}
                <line className="FlowShape" x1={440} y1={84} x2={440} y2={76} />

                {/* Right engine LP valve */}
                <EngineLpValve x={440} y={100} engineNumber={2} />

                {/* Ducts to right inner pumps */}
                <line className="FlowShape" x1={440} y1={215} x2={440} y2={116} />
                <line className="FlowShape" x1={440} y1={190} x2={404} y2={190} />
                <line className="FlowShape" x1={405} y1={190} x2={405} y2={215} />

                {/* Pumps */}
                <Pump x={390} y={215} active={!!pumpRightInner1} />
                <Pump x={425} y={215} onBus="DC_2" active={!!pumpRightInner2} />

                {/* Quantities */}
                <text className="TankQuantity" x={472} y={285}>{fuelInTanksForDisplay(tankRightInner, unit, fuelWeightPerGallon)}</text>
                <text className="TankQuantity" x={579} y={285}>{fuelInTanksForDisplay(tankRightOuter, unit, fuelWeightPerGallon)}</text>

                <text className="UnitTemp" x="510" y="355">°C</text>
            </>

            {/* F. FLOW */}
            <FuelFlow unit={unit} />

            {/* FOB */}
            <FOB unit={unit} />

        </svg>
    );
};

const Apu = () => {
    const apuN = useSimVar('L:A32NX_APU_N', 'percent', 500);
    const apuEmergShutdown = useSimVar('L:A32NX_APU_IS_EMERGENCY_SHUTDOWN', 'boolean', 1000);
    // APU fire P/B out = Amber APU only
    // White APU and triangle only if APU off
    // If APU on and powered green line and triangle

    return (
        <g id="APU">
            <text className="White" x="126" y="150" textAnchor="end" alignmentBaseline="central">APU</text>
            <path className="FlowShape" d="M 132, 150 l 15, 9 l 0,-18 Z" />
            <path id="apuFuelLine" className="FlowShape" d="M147,150 l13,0" />
        </g>
    );
};

type FuelFlowProp = {
    unit: string
};

const FuelFlow = ({ unit }: FuelFlowProp) => {
    const [leftFuelFlow] = useSimVar('L:A32NX_ENGINE_FF:1', 'number', 1000); // KG/HR
    const [rightFuelFlow] = useSimVar('L:A32NX_ENGINE_FF:2', 'number', 1000);

    return (
        <>
            <text className="FuelFlowLabel" x={46} y={443}>F.FLOW</text>
            <text className="FuelFlowLabel" x={46} y={461}>1+2</text>

            <text id="FuelFlowColon" x={83} y={461}>:</text>

            <text id="FuelFlowValue" x={200} y={452}>{fuelForDisplay(leftFuelFlow + rightFuelFlow, unit, 60)}</text>

            <text id="FuelFlowUnit" x={215} y={452}>
                {unit === '1' ? 'KG' : 'LBS'}
                /MIN
            </text>
        </>
    );
};

type FOBProp = {
    unit: string
};

const FOB = ({ unit }:FOBProp) => {
    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 1000);

    return (
        <>
            <path className="ThickShape" d="m 5 499 v -30 h 250 v 30 z" />

            <text id="FobLabel" x={18} y={491}>FOB</text>
            <text id="FobColon" x={83} y={490}>:</text>

            <text id="FobValue" x={200} y={481}>{fuelForDisplay(fob, unit, 1, 2)}</text>

            <text id="FobUnit" x={215} y={483}>{unit === '1' ? 'KG' : 'LBS'}</text>
        </>
    );
};

const Wings = () => (
    <>
        {/* Bottom line */}
        <path className="ThickShape" d="M 15, 255 l 0, 80 l 570, 0 l 0,-80" strokeLinecap="round" />

        {/* Top line */}
        <path className="ThickShape" d="M 585, 255 l -124.2, -21.6" />
        <path className="ThickShape" d="M 15,  255 l 124.2, -21.6" />
        <path className="ThickShape" d="M 245, 215 l 12, 0" />
        <path className="ThickShape" d="M 292, 215 l 16, 0" />
        <path className="ThickShape" d="M 343, 215 l 14, 0" />
        <path className="ThickShape" d="M 245, 215 l -29.9, 5.2" />
        <path className="ThickShape" d="M 355, 215 l 29.9, 5.2" />

        {/* Tank lines */}
        <path className="ThickShape" d="M 80,  244 L 80,  335" />
        <path className="ThickShape" d="M 245, 215 L 230, 335" />
        <path className="ThickShape" d="M 355, 215 L 370, 335" />
        <path className="ThickShape" d="M 520, 244 L 520, 335" />
    </>
);

type EngineStatusProp = {
    x: number,
    y: number,
    engineNumber: number,
    fuelUsed: number
};

const EngineStatus = ({ x, y, engineNumber, fuelUsed }: EngineStatusProp) => {
    const [EngN2] = useSimVar(`TURB ENG N2:${engineNumber}`, 'Percent', 1000);

    return (
        <>
            <text className={EngN2 > 15 ? 'EngineNumber EngineNumberOn' : 'EngineNumber EngineNumberOff'} x={x} y={y}>{engineNumber}</text>
            <text className="UsedQuantity" x={x} y={y + 27}>{fuelUsed}</text>
        </>
    );
};

const EngineLpValveLine = ({ x, y, position }) => {
    if (position === 0) {
        return <line x1={x - 15} y1={y} x2={x + 15} y2={y} />;
    }

    if (position > 0 && position < 100) {
        return <line x1={x - 11} y1={y - 11} x2={x + 11} y2={y + 11} />;
    }

    return <line x1={x} y1={y - 15} x2={x} y2={y + 15} />;
};

const EngineLpValve = ({ x, y, engineNumber }) => {
    const [position] = useSimVar(`FUELSYSTEM VALVE OPEN:${engineNumber}`, 'percent', 500);

    return (
        <g className={`ThickShape ${position < 100 ? 'ValveAmber' : 'ValveGreen'}`}>
            <circle cx={x} cy={y} r={15} />

            <EngineLpValveLine x={x} y={y} position={position} />
        </g>
    );
};

const CrossFeedValveLine = ({ x, y, position }) => {
    if (position === 0) {
        return <line x1={x} y1={y - 15} x2={x} y2={y + 15} />;
    }

    if (position > 0 && position < 100) {
        return <line x1={x - 11} y1={y - 11} x2={x + 11} y2={y + 11} />;
    }

    return <line x1={x - 15} y1={y} x2={x + 15} y2={y} />;
};

const CrossFeedValve = ({ x, y }) => {
    const [position] = useSimVar(
        'FUELSYSTEM VALVE OPEN:3',
        'percent',
        500,
    );

    return (
        <g className={`ThickShape ${(position > 0 && position < 100) ? 'ValveAmber' : 'ValveGreen'}`}>
            <circle cx={x} cy={y} r={15} />

            <CrossFeedValveLine x={x} y={y} position={position} />
        </g>
    );
};

const Pump = ({ x, y, onBus = 'DC_ESS', active = true }) => {
    const [busIsPowered] = useSimVar(`L:A32NX_ELEC_${onBus}_BUS_IS_POWERED`, 'Bool', 1000);

    return (
        <g className={(active && busIsPowered) ? 'ThickShape PumpActive' : 'ThickShape PumpInactive'}>
            <rect x={x} y={y} width="30" height="30" />
            {active
                ? (busIsPowered
                    ? <line x1={x + 15} y1={y} x2={x + 15} y2={y + 30} />
                    : null)
                : (busIsPowered
                    ? <line x1={x + 5} y1={y + 15} x2={x + 25} y2={y + 15} />
                    : null)}
            {busIsPowered
                ? null
                : <text className="LoIndication" x={x + 15} y={y + 20}>LO</text>}
        </g>
    );
};

ReactDOM.render(<SimVarProvider><FuelPage /></SimVarProvider>, getRenderTarget());
