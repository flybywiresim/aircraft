/* eslint-disable no-nested-ternary */
import './Fuel.scss';
import ReactDOM from 'react-dom';
import React from 'react';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '@instruments/common/defaults';
import { usePersistentProperty } from '../../../Common/persistence';

setIsEcamPage('fuel_page');

export const FuelPage = () => {
    const [crossFeedPosition] = useSimVar('FUELSYSTEM VALVE OPEN:3', 'number', 500);

    const [Eng1N2] = useSimVar('TURB ENG N2:1', 'Percent', 1000);
    const [Eng2N2] = useSimVar('TURB ENG N2:2', 'Percent', 1000);

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

    // const [leftFuelUsed] = useSimVar('GENERAL ENG FUEL USED SINCE START:1', 'kg', 200);
    // const [rightFuelUsed] = useSimVar('GENERAL ENG FUEL USED SINCE START:2', 'kg', 200);

    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT');
    console.log(`unit is ${unit}`);

    const fuelForDisplay = (fuelValue, unitsC, timeUnit = 1, fobMultiplier = 1) => {
        const fuelWeight = unitsC === '1' ? fuelValue / timeUnit : fuelValue / timeUnit * 2.20462;
        const roundValue = unitsC === '1' ? 10 * fobMultiplier : 20 * fobMultiplier;
        return Math.round(fuelWeight / roundValue) * roundValue;
    };

    const [leftConsumption] = useSimVar('L:A32NX_FUEL_USED:1', 'number', 1000); // Note these values are in KG
    const [rightConsumption] = useSimVar('L:A32NX_FUEL_USED:2', 'number', 1000);

    const leftFuelUsed = fuelForDisplay(leftConsumption, unit);
    const rightFuelUsed = fuelForDisplay(rightConsumption, unit);

    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 1000);

    const [fuelWeightPerGallon] = useSimVar('FUEL WEIGHT PER GALLON', 'kilogram', 60_000);

    const fuelInTanksForDisplay = (fuelValue, unitsC, gallon2Kg) => {
        const weightInKg = fuelValue * gallon2Kg;
        const fuelWeight = unitsC === '1' ? weightInKg : weightInKg * 2.20462;
        const roundValue = unitsC === '1' ? 10 : 20;
        return Math.round(fuelWeight / roundValue) * roundValue;
    };

    const [leftFuelFlow] = useSimVar('L:A32NX_ENGINE_FF:1', 'number', 1000); // KG/HR
    const [rightFuelFlow] = useSimVar('L:A32NX_ENGINE_FF:2', 'number', 1000);

    return (
        // This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM
        <svg id="sd-fuel-page" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
            <text className="PageTitle" x={14} y={16} alignmentBaseline="central">FUEL</text>

            {/* Engines */}
            <>
                <text className="FuelUsed" x={300} y={28}>F.USED</text>
                <text className="FuelUsed" x={300} y={47}>1+2</text>
                <text className="UsedQuantity" x={301} y={74}>{leftFuelUsed + rightFuelUsed}</text>
                <text className="Unit" textAnchor="middle" x={301} y={98}>{unit === '1' ? 'KG' : 'LBS'}</text>

                {/* Left engine */}
                <text className={Eng1N2 > 15 ? 'EngineNumber EngineNumberOn' : 'EngineNumber EngineNumberOff'} x={160} y={41}>1</text>
                <line className="EngineLine" x1="200" y1="31" x2="250" y2="21" />
                <text className="UsedQuantity" x={160} y={68}>{leftFuelUsed}</text>

                {/* Right engine */}
                <text className={Eng2N2 > 15 ? 'EngineNumber EngineNumberOn' : 'EngineNumber EngineNumberOff'} x={440} y={41}>2</text>
                <line className="EngineLine" x1="400" y1="31" x2="350" y2="21" />
                <text className="UsedQuantity" x={440} y={68}>{rightFuelUsed}</text>
            </>

            {/* Wings */}
            <>
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
            </>

            {/* APU */}
            <g id="APU">
                <text x="126" y="150" textAnchor="end" alignmentBaseline="central">APU</text>
                <path className="FlowShape" d="M 132, 150 l 15, 9 l 0,-18 Z" />
                <path id="apuFuelLine" className="FlowShape" d="M147,150 l13,0" />
            </g>

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
            </>

            {/* Center */}
            <>
                {/* Side lines */}
                <line className="FlowShape" x1="160" y1="150" x2="275" y2="150" />
                <line className="FlowShape" x1="325" y1="150" x2="440" y2="150" />

                {/* Center valve lines */}
                {(crossFeedPosition === 100) && (
                    <>
                        <line className="FlowShape" x1="317" y1="150" x2="330" y2="150" />
                        <line className="FlowShape" x1="270" y1="150" x2="283" y2="150" />
                    </>
                )}

                {/* CrossFeed valve */}
                <CrossFeedValve x={300} y={150} />

                {/* Center pumps lines */}
                <line className="FlowShape" x1="274" y1="150" x2="274" y2="210" />
                <line className="FlowShape" x1="326" y1="150" x2="326" y2="210" />

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
            </>

            {/* F. FLOW */}
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

            {/* FOB */}
            <>
                <path className="ThickShape" d="m 5 499 v -30 h 250 v 30 z" />

                <text id="FobLabel" x={18} y={491}>FOB</text>
                <text id="FobColon" x={83} y={490}>:</text>

                <text id="FobValue" x={200} y={481}>{fuelForDisplay(fob, unit, 1, 2)}</text>

                <text id="FobUnit" x={215} y={483}>{unit === '1' ? 'KG' : 'LBS'}</text>
            </>
        </svg>
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
    const [position] = useSimVar(
        engineNumber === 1
            ? 'FUELSYSTEM VALVE OPEN:1'
            : 'FUELSYSTEM VALVE OPEN:2',
        'percent',
        150,
    );

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
        150,
    );

    return (
        <g className={`ThickShape ${(position > 0 && position < 100) ? 'ValveAmber' : 'ValveGreen'}`}>
            <circle cx={x} cy={y} r={15} />

            <CrossFeedValveLine x={x} y={y} position={position} />
        </g>
    );
};

const Pump = ({ x, y, onBus = 'DC_ESS', active = true }) => {
    const [busIsPowered] = useSimVar(`L:A32NX_ELEC_${onBus}_BUS_IS_POWERED`, 'Bool');

    return (
        <g className={(active && busIsPowered) ? 'ThickShape PumpActive' : 'ThickShape PumpInactive'}>
            <rect x={x} y={y} width="30" height="30" />
            {active
                ? (busIsPowered
                    ? <line x1={x + 15} y1={y} x2={x + 15} y2={y + 30} />
                    : null)
                : (busIsPowered
                    ? <line x1={x} y1={y + 15} x2={x + 30} y2={y + 15} />
                    : null)}
            {busIsPowered
                ? null
                : <text className="LoIndication" x={x + 15} y={y + 20}>LO</text>}
        </g>
    );
};

ReactDOM.render(<SimVarProvider><FuelPage /></SimVarProvider>, getRenderTarget());
