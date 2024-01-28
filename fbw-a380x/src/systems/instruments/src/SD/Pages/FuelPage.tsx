import React, { FC, useState } from 'react';
import { Position } from '@instruments/common/types';
import { useSimVar } from '@instruments/common/simVars';
import { MoreLabel, PageTitle } from './Generic/PageTitle';

export const FuelPage = () => {
    const [showMore] = useState(true);

    const [eng1FuelUsed] = useSimVar('GENERAL ENG FUEL USED SINCE START:1', 'kg');
    const [eng2FuelUsed] = useSimVar('GENERAL ENG FUEL USED SINCE START:2', 'kg');
    const [eng3FuelUsed] = useSimVar('GENERAL ENG FUEL USED SINCE START:3', 'kg');
    const [eng4FuelUsed] = useSimVar('GENERAL ENG FUEL USED SINCE START:4', 'kg');

    const totalFuelUsed = (eng1FuelUsed + eng2FuelUsed + eng3FuelUsed + eng4FuelUsed);
    const totalFuelUsedDisplayed = Math.floor(totalFuelUsed / 20) * 20;

    const [eng1FuelFlowPph] = useSimVar('ENG FUEL FLOW PPH:1', 'Pounds');
    const [eng2FuelFlowPph] = useSimVar('ENG FUEL FLOW PPH:2', 'Pounds');
    const [eng3FuelFlowPph] = useSimVar('ENG FUEL FLOW PPH:3', 'Pounds');
    const [eng4FuelFlowPph] = useSimVar('ENG FUEL FLOW PPH:4', 'Pounds');

    const allEngFuelFlow = (eng1FuelFlowPph + eng2FuelFlowPph + eng3FuelFlowPph + eng4FuelFlowPph);
    const allEngFuelFlowDisplayed = Math.floor(allEngFuelFlow / 10) * 10;
    // TODO TOTAL FF (+APU)
    // TODO convert to right unit

    const [engine1Valve] = useSimVar('FUELSYSTEM VALVE OPEN:1', 'Percent over 100');
    const [engine2Valve] = useSimVar('FUELSYSTEM VALVE OPEN:2', 'Percent over 100');
    const [engine3Valve] = useSimVar('FUELSYSTEM VALVE OPEN:3', 'Percent over 100');
    const [engine4Valve] = useSimVar('FUELSYSTEM VALVE OPEN:4', 'Percent over 100');

    const [feed1Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:1', 'Bool');
    const [feed1Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:2', 'Bool');

    const [crossFeed1ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:28', 'Percent over 100');

    const [leftOuterTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:1', 'kg');
    const [feed1TankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:2', 'kg');
    const [leftMidTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:3', 'kg');
    const [leftInnerTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:4', 'kg');
    const [feed2TankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:5', 'kg');
    const [feed3TankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:6', 'kg');
    const [rightInnerTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:7', 'kg');
    const [rightMidTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:8', 'kg');
    const [feed4TankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:9', 'kg');
    const [rightOuterTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:10', 'kg');
    const [trimTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:11', 'kg');
    // TODO trim tank

    return (
        <>
            <PageTitle x={6} y={29}>FUEL</PageTitle>

            <MoreLabel x={137} y={28} moreActive={showMore} />

            <text textAnchor="middle" x={384} y={56} className="White T2">FU</text>
            <text textAnchor="middle" x={384} y={79} className="White T2">TOTAL</text>
            <text textAnchor="middle" x={384} y={103} className="Green T3">{totalFuelUsedDisplayed}</text>

            {/* TODO unit switching? */}
            <text textAnchor="middle" x={384} y={126} className="Cyan T2">KG</text>

            <Engine x={74} y={105} index={1} />
            <Valve x={111} y={150} open={engine1Valve >= 0.5} />

            <Engine x={236} y={81} index={2} />
            <Valve x={273} y={123} open={engine2Valve >= 0.5} />

            <Engine x={456} y={81} index={3} />
            <Valve x={493} y={123} open={engine3Valve >= 0.5} />

            <Engine x={618} y={105} index={4} />
            <Valve x={655} y={144} open={engine4Valve >= 0.5} />

            <image x={7} y={168} width={751} height={310} xlinkHref="/Images/SD_FUEL_BG.png" preserveAspectRatio="none" />

            {/* FEED TANK 1 */}
            <TankQuantity x={154} y={300} quantity={feed1TankWeight} />
            {showMore && (
                // FEED TANK 1 collector cell (inop.)
                <TankQuantity x={138} y={268} smallFont quantity={1200} />
            )}
            <Pump x={95} y={227} running={false} />
            {showMore && (
                <Pump x={127} y={227} running={false} normallyOff />
            )}

            {/* Line.9 & Line.10 & Line.17 -> Engine1LPValve (via Junction.1) = ALWAYS ON */}
            <FuelLine x1={111} y1={212} x2={111} y2={164} active displayWhenInactive={showMore} />
            <FuelLine x1={111} y1={179} x2={139} y2={179} active displayWhenInactive={showMore} />

            {/* Crossfeed valve 1 - Pump.28 */}
            <Valve x={154} y={179} horizontal open={crossFeed1ValveOpen >= 0.5} normallyClosed />

            {/* LEFT OUTER/MID/INNER */}
            <TankQuantity x={102} y={434} quantity={leftOuterTankWeight} />
            <TankQuantity x={202} y={430} quantity={leftMidTankWeight} />
            <TankQuantity x={302} y={430} quantity={leftInnerTankWeight} />

            {/* FEED TANK 2 */}
            <TankQuantity x={322} y={288} quantity={feed2TankWeight} />
            {showMore && (
                // FEED TANK 1 collector cell (inop.)
                <TankQuantity x={310} y={252} smallFont quantity={1200} />
            )}

            {/* Line.9 & Line.10 & Line.17 -> Engine1LPValve (via Junction.1) = ALWAYS ON */}
            <FuelLine x1={273} y1={191} x2={273} y2={137} active displayWhenInactive={showMore} />
            <FuelLine x1={273} y1={152} x2={301} y2={152} active displayWhenInactive={showMore} />

            {/* FEED TANK 3 */}
            <TankQuantity x={528} y={288} quantity={feed3TankWeight} />
            {showMore && (
                // FEED TANK 1 collector cell (inop.)
                <TankQuantity x={518} y={252} smallFont quantity={1200} />
            )}

            {/* RIGHT INNER/MID/OUTER */}
            <TankQuantity x={548} y={430} quantity={rightInnerTankWeight} />
            <TankQuantity x={648} y={430} quantity={rightMidTankWeight} />
            <TankQuantity x={748} y={434} quantity={rightOuterTankWeight} />

            {/* FEED TANK 4 */}
            <TankQuantity x={696} y={300} quantity={feed4TankWeight} />
            {showMore && (
                // FEED TANK 1 collector cell (inop.)
                <TankQuantity x={690} y={268} smallFont quantity={1200} />
            )}

            <text x={10} y={620} className="White T2">ALL ENG FF</text>

            <text x={24} y={644} className="Green T2">{allEngFuelFlowDisplayed}</text>
            {/* TODO unit switching? */}
            <text x={68} y={644} className="Cyan T2">KG/MIN</text>

            <image x={269} y={571} width={227} height={80} xlinkHref="/Images/SD_FUEL_BG_TRIM.png" preserveAspectRatio="none" />

            {/* TRIM TANK */}
            <TankQuantity x={418} y={640} quantity={trimTankWeight} />
        </>
    );
};

interface FuelLineProps {
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    startArrow?: 'in' | 'out' | 'break',
    endArrow?: 'in' | 'out' | 'break',
    active: boolean,
    displayWhenInactive: boolean,
}

const FuelLine: FC<FuelLineProps> = ({ x1, y1, x2, y2, startArrow, endArrow, active, displayWhenInactive }) => {
    let color: string;
    if (active) {
        color = 'Green';
    } else {
        color = displayWhenInactive ? 'White' : 'Transparent';
    }

    return (
        <g className={color} strokeWidth={2}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
        </g>
    );
};

interface ValveProps extends Position {
    open: boolean,
    horizontal?: boolean,
    normallyClosed?: boolean,
}

const Valve: FC<ValveProps> = ({ x, y, open, horizontal = false, normallyClosed = false }) => {
    const color = !open && !normallyClosed ? 'Amber' : 'Green';
    const rotation = !open && !horizontal ? 90 : 0;

    return (
        <g className={color} strokeWidth={2} transform={`rotate(${rotation} ${x} ${y})`}>
            <circle cx={x} cy={y} r={14} />

            <line x1={x} y1={y - 14} x2={x} y2={y + 14} />
        </g>
    );
};

interface PumpProps extends Position {
    running: boolean,
    normallyOff?: boolean,
}

const Pump: FC<PumpProps> = ({ x, y, running, normallyOff }) => {
    let color: string;
    if (running) {
        color = 'Green';
    } else {
        color = normallyOff ? 'White' : 'Amber';
    }

    const width = 28;

    return (
        <g className={color} strokeWidth={2}>
            <rect x={x - width / 2} y={y - width / 2} width={width} height={width} />

            {running ? (
                <line x1={x} y1={y - width / 2} x2={x} y2={y + width / 2} />
            ) : (
                <line x1={x - 9} y1={y} x2={x + 9} y2={y} />
            )}
        </g>
    );
};

interface EngineProps extends Position {
    index: number,
}

const Engine: FC<EngineProps> = ({ x, y, index }) => (
    <>
        <image x={x} y={y} width={75} height={96} xlinkHref="/Images/SD_FUEL_ENG_L.png" preserveAspectRatio="none" />

        <text x={x + 8} y={y + 25} className="White T4">{index}</text>
    </>
);

interface TankQuantityProps extends Position {
    smallFont?: boolean,
    quantity: number,
}

const TankQuantity: FC<TankQuantityProps> = ({ x, y, smallFont = false, quantity }) => {
    const displayQuantity = Math.floor(quantity / 20) * 20;

    return (
        <text x={x} y={y} className={`Green ${smallFont ? 'T3' : 'T4'}`} textAnchor="end">{displayQuantity}</text>
    );
};
