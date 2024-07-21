import React, { FC, useState } from 'react';
import { Position, TwoDimensionalSize } from '@instruments/common/types';
import { useSimVar } from '@instruments/common/simVars';
import { MoreLabel, PageTitle } from './Generic/PageTitle';


export const FuelPage = () => {
    const CROSS_FEED_VALVE_CLOSED_THRESHOLD = 0.1;
    const TRANSFER_VALVE_CLOSED_THRESHOLD = 0.1;

    const [showMore] = useState(false);

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

    // LP valves
    const [engine1Valve] = useSimVar('FUELSYSTEM VALVE OPEN:1', 'Percent over 100');
    const [engine2Valve] = useSimVar('FUELSYSTEM VALVE OPEN:2', 'Percent over 100');
    const [engine3Valve] = useSimVar('FUELSYSTEM VALVE OPEN:3', 'Percent over 100');
    const [engine4Valve] = useSimVar('FUELSYSTEM VALVE OPEN:4', 'Percent over 100');

    // Feed pumps
    const [feed1Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:1', 'Bool');
    const [feed1Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:2', 'Bool');
    const [feed2Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:3', 'Bool');
    const [feed2Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:4', 'Bool');
    const [feed3Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:5', 'Bool');
    const [feed3Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:6', 'Bool');
    const [feed4Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:7', 'Bool');
    const [feed4Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:8', 'Bool');

    // Transfer pumps
    const [isLeftOuterTankPumpActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:9', 'Bool');
    const [isLeftMidTankPumpFwdActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:10', 'Bool');
    const [isLeftMidTankPumpAftActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:11', 'Bool');
    const [isLeftInnerTankPumpFwdActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:12', 'Bool');
    const [isRightInnerTankPumpFwdActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:13', 'Bool');
    const [isRightOuterTankPumpActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:14', 'Bool');
    const [isRightMidTankPumpFwdActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:15', 'Bool');
    const [isRightMidTankPumpAftActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:16', 'Bool');
    const [isLeftInnerTankPumpAftActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:17', 'Bool');
    const [isRightInnerTankPumpAftActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:18', 'Bool');

    // Crossfeed valves
    const [crossFeed1ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:46', 'Percent over 100');
    const [crossFeed2ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:47', 'Percent over 100');
    const [crossFeed3ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:48', 'Percent over 100');
    const [crossFeed4ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:49', 'Percent over 100');

    const isAnyCrossFeedValveNotClosed = crossFeed1ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD || crossFeed2ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD || crossFeed3ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD || crossFeed4ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD;

    // Into tank transfer valves
    //  FWD
    //      Feed tanks
    const [feedTank1FwdTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:5', 'Percent over 100');
    const [feedTank1FwdTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:11', 'Percent over 100');
    const isAnyFeedTank1FwdTransferValveOpen = true || feedTank1FwdTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || feedTank1FwdTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [feedTank2FwdTransferValve1_1Open] = useSimVar('FUELSYSTEM VALVE OPEN:6', 'Percent over 100');
    const [feedTank2FwdTransferValve1_2Open] = useSimVar('FUELSYSTEM VALVE OPEN:8', 'Percent over 100');
    const [feedTank2FwdTransferValve2_1Open] = useSimVar('FUELSYSTEM VALVE OPEN:12', 'Percent over 100');
    const [feedTank2FwdTransferValve2_2Open] = useSimVar('FUELSYSTEM VALVE OPEN:14', 'Percent over 100');
    const isAnyFeedTank2FwdTransferValveOpen = true || feedTank2FwdTransferValve1_1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || feedTank2FwdTransferValve1_2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || feedTank2FwdTransferValve2_1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || feedTank2FwdTransferValve2_2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [feedTank3FwdTransferValve1_1Open] = useSimVar('FUELSYSTEM VALVE OPEN:7', 'Percent over 100');
    const [feedTank3FwdTransferValve1_2Open] = useSimVar('FUELSYSTEM VALVE OPEN:9', 'Percent over 100');
    const [feedTank3FwdTransferValve2_1Open] = useSimVar('FUELSYSTEM VALVE OPEN:13', 'Percent over 100');
    const [feedTank3FwdTransferValve2_2Open] = useSimVar('FUELSYSTEM VALVE OPEN:15', 'Percent over 100');
    const isAnyFeedTank3FwdTransferValveOpen = true || feedTank3FwdTransferValve1_1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || feedTank3FwdTransferValve1_2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || feedTank3FwdTransferValve2_1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || feedTank3FwdTransferValve2_2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [feedTank4FwdTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:10', 'Percent over 100');
    const [feedTank4FwdTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:16', 'Percent over 100');
    const isAnyFeedTank4FwdTransferValveOpen = true || feedTank4FwdTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || feedTank4FwdTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    //     Transfer tanks
    const [leftInnerFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:17', 'Percent over 100');
    const [leftMidFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:18', 'Percent over 100');
    const [leftOuterFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:19', 'Percent over 100');
    const [rightInnerFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:20', 'Percent over 100');
    const [rightMidFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:21', 'Percent over 100');
    const [rightOuterFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:22', 'Percent over 100');
    const isAnyFwdTransferValveOpen = leftInnerFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || leftMidFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || leftOuterFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || rightInnerFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || rightMidFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD
        || rightOuterFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    //  AFT
    //     Feed tanks
    const [feedTank1AftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:23', 'Percent over 100');
    const [feedTank1AftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:27', 'Percent over 100');
    const isAnyFeedTank1AftTransferValveOpen = feedTank1AftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || feedTank1AftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [feedTank2AftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:24', 'Percent over 100');
    const [feedTank2AftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:28', 'Percent over 100');
    const isAnyFeedTank2AftTransferValveOpen = feedTank2AftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || feedTank2AftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [feedTank3AftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:25', 'Percent over 100');
    const [feedTank3AftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:29', 'Percent over 100');
    const isAnyFeedTank3AftTransferValveOpen = feedTank3AftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || feedTank3AftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [feedTank4AftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:26', 'Percent over 100');
    const [feedTank4AftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:30', 'Percent over 100');
    const isAnyFeedTank4AftTransferValveOpen = feedTank4AftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || feedTank4AftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    //    Transfer tanks
    const [leftOuterAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:33', 'Percent over 100');
    const [leftOuterAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:39', 'Percent over 100');
    const isAnyLeftOuterAftTransferValveOpen = leftOuterAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || leftOuterAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [leftMidAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:32', 'Percent over 100');
    const [leftMidAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:38', 'Percent over 100');
    const isAnyLeftMidAftTransferValveOpen = leftMidAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || leftMidAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [leftInnerAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:31', 'Percent over 100');
    const [leftInnerAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:37', 'Percent over 100');
    const isAnyLeftInnerAftTransferValveOpen = leftInnerAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || leftInnerAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [rightInnerAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:34', 'Percent over 100');
    const [rightInnerAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:40', 'Percent over 100');
    const isAnyRightInnerAftTransferValveOpen = rightInnerAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || rightInnerAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [rightMidAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:35', 'Percent over 100');
    const [rightMidAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:41', 'Percent over 100');
    const isAnyRightMidAftTransferValveOpen = rightMidAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || rightMidAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    const [rightOuterAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:36', 'Percent over 100');
    const [rightOuterAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:42', 'Percent over 100');
    const isAnyRightOuterAftTransferValveOpen = rightOuterAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD || rightOuterAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

    // Tanks
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

            <text textAnchor='middle' x={384} y={56} className='White T2'>FU</text>
            <text textAnchor='middle' x={384} y={79} className='White T2'>TOTAL</text>
            <text textAnchor='middle' x={384} y={103} className='Green T3'>{totalFuelUsedDisplayed}</text>

            {/* TODO unit switching? */}
            <text textAnchor='middle' x={384} y={126} className='Cyan T2'>KG</text>

            {/* Engines and LP valves */}
            <Engine x={74} y={105} index={1} />
            <Valve x={111} y={150} open={engine1Valve >= 0.5} />

            <Engine x={236} y={81} index={2} />
            <Valve x={273} y={123} open={engine2Valve >= 0.5} />

            <Engine x={456} y={81} index={3} />
            <Valve x={493} y={123} open={engine3Valve >= 0.5} />

            <Engine x={618} y={105} index={4} />
            <Valve x={655} y={150} open={engine4Valve >= 0.5} />

            <image x={7} y={168} width={751} height={310} xlinkHref='/Images/SD_FUEL_BG.png' preserveAspectRatio='none' />

            {/* FEED TANK 1 */}
            <TankQuantity x={154} y={300} quantity={feed1TankWeight} />
            {showMore && (
                // FEED TANK 1 collector cell (inop.)
                <TankQuantity x={138} y={268} smallFont quantity={1200} />
            )}
            <Pump x={95} y={227} running={feed1Pump1Active} />
            {(showMore || !(feed1Pump1Active && !feed1Pump2Active)) && (
                <Pump x={127} y={227} running={feed1Pump2Active} normallyOff={feed1Pump1Active} />
            )}

            {/* Line.9 & Line.10 & Line.17 -> Engine1LPValve (via Junction.1) = ALWAYS ON */}
            <FuelLine x1={111} y1={212} x2={111} y2={164} active displayWhenInactive={showMore} />
            {/* Line.128 */}
            <FuelLine x1={111} y1={179} x2={139} y2={179} active displayWhenInactive={showMore} />

            {/* Crossfeed valve 1 - Valve.46 */}
            <Valve x={154} y={179} horizontal open={crossFeed1ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD} normallyClosed />

            {/* LEFT OUTER/MID/INNER */}
            <TankQuantity x={102} y={434} quantity={leftOuterTankWeight} />
            <TankQuantity x={202} y={430} quantity={leftMidTankWeight} />
            <TankQuantity x={302} y={430} quantity={leftInnerTankWeight} />

            {/* FEED TANK 2 */}
            <TankQuantity x={322} y={288} quantity={feed2TankWeight} />
            {showMore && (
                // FEED TANK 2 collector cell (inop.)
                <TankQuantity x={310} y={252} smallFont quantity={1200} />
            )}
            <Pump x={258} y={208} running={feed2Pump1Active} />
            {(showMore || !(feed2Pump1Active && !feed2Pump2Active)) && (
                <Pump x={290} y={208} running={feed2Pump2Active} normallyOff={feed2Pump1Active} />
            )}

            {/* Line.11 & Line.12 & Line.18 -> Engine2LPValve (via Junction.2) = ALWAYS ON */}
            <FuelLine x1={273} y1={191} x2={273} y2={137} active displayWhenInactive={showMore} />
            {/* Line.129 */}
            <FuelLine x1={273} y1={152} x2={301} y2={152} active displayWhenInactive={showMore} />

            {/* Crossfeed valve 2 - Valve.47 */}
            <Valve x={316} y={152} horizontal open={crossFeed2ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD} normallyClosed />

            {/* FEED TANK 3 */}
            <TankQuantity x={528} y={288} quantity={feed3TankWeight} />
            {showMore && (
                // FEED TANK 3 collector cell (inop.)
                <TankQuantity x={518} y={252} smallFont quantity={1200} />
            )}
            <Pump x={476} y={208} running={feed3Pump1Active} />
            {(showMore || !(feed3Pump1Active && !feed3Pump2Active)) && (
                <Pump x={508} y={208} running={feed3Pump2Active} normallyOff={feed3Pump1Active} />
            )}

            {/* Line.13 & Line.14 & Line.19 -> Engine3LPValve (via Junction.3) = ALWAYS ON */}
            <FuelLine x1={493} y1={191} x2={493} y2={137} active displayWhenInactive={showMore} />
            {/* Line.130 */}
            <FuelLine x1={475} y1={152} x2={493} y2={152} active displayWhenInactive={showMore} />

            {/* Crossfeed valve 3 - Valve.48 */}
            <Valve x={460} y={152} horizontal open={crossFeed3ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD} normallyClosed />

            {/* RIGHT INNER/MID/OUTER */}
            <TankQuantity x={548} y={430} quantity={rightInnerTankWeight} />
            <TankQuantity x={648} y={430} quantity={rightMidTankWeight} />
            <TankQuantity x={748} y={434} quantity={rightOuterTankWeight} />

            {/* FEED TANK 4 */}
            <TankQuantity x={696} y={300} quantity={feed4TankWeight} />
            {showMore && (
                // FEED TANK 4 collector cell (inop.)
                <TankQuantity x={690} y={268} smallFont quantity={1200} />
            )}
            <Pump x={639} y={227} running={feed4Pump1Active} />
            {(showMore || !(feed4Pump1Active && !feed4Pump2Active)) && (
                <Pump x={671} y={227} running={feed4Pump2Active} normallyOff={feed4Pump1Active} />
            )}

            {/* Line.15 & Line.16 & Line.20 -> Engine4LPValve (via Junction.4) = ALWAYS ON */}
            <FuelLine x1={655} y1={212} x2={655} y2={164} active displayWhenInactive={showMore} />
            {/* Line.131 */}
            <FuelLine x1={637} y1={179} x2={655} y2={179} active displayWhenInactive={showMore} />

            {/* Crossfeed valve 4 - Valve.49 */}
            <Valve x={622} y={179} horizontal open={crossFeed4ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD} normallyClosed />

            <text x={10} y={620} className='White T2'>ALL ENG FF</text>

            <text x={24} y={644} className='Green T2'>{allEngFuelFlowDisplayed}</text>
            {/* TODO unit switching? */}
            <text x={68} y={644} className='Cyan T2'>KG/MIN</text>

            <image x={269} y={571} width={227} height={80} xlinkHref='/Images/SD_FUEL_BG_TRIM.png' preserveAspectRatio='none' />

            {/* Crossfeed lines */}
            <g>
                {/* Line.132 & Line.134 & Line.136 */}
                <g>
                    {/* Horizontal line */}
                    <FuelLine x1={169} y1={179} x2={265} y2={179} active={isAnyCrossFeedValveNotClosed} displayWhenInactive={showMore} />
                    {/* Diagonal lines */}
                    <FuelLine x1={262} y1={173} x2={268} y2={185} active={isAnyCrossFeedValveNotClosed} displayWhenInactive={showMore} />
                    {/* Horizontal line */}
                    <FuelLine x1={281} y1={179} x2={485} y2={179} active={isAnyCrossFeedValveNotClosed} displayWhenInactive={showMore} />
                    {/* Diagonal lines */}
                    <FuelLine x1={278} y1={173} x2={284} y2={185} active={isAnyCrossFeedValveNotClosed} displayWhenInactive={showMore} />
                    <FuelLine x1={482} y1={173} x2={488} y2={185} active={isAnyCrossFeedValveNotClosed} displayWhenInactive={showMore} />
                    {/* Horizontal line */}
                    <FuelLine x1={501} y1={179} x2={607} y2={179} active={isAnyCrossFeedValveNotClosed} displayWhenInactive={showMore} />
                    {/* Diagonal lines */}
                    <FuelLine x1={498} y1={173} x2={504} y2={185} active={isAnyCrossFeedValveNotClosed} displayWhenInactive={showMore} />
                </g>

                {/* Line.133 */}
                <g>
                    <FuelLine x1={331} y1={152} x2={346} y2={152} active={crossFeed2ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD} displayWhenInactive={showMore} />
                    <FuelLine x1={346} y1={152} x2={346} y2={179} active={crossFeed2ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD} displayWhenInactive={showMore} />
                </g>

                {/* Line.135 */}
                <g>
                    <FuelLine x1={445} y1={152} x2={430} y2={152} active={crossFeed3ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD} displayWhenInactive={showMore} />
                    <FuelLine x1={430} y1={152} x2={430} y2={179} active={crossFeed3ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD} displayWhenInactive={showMore} />
                </g>
            </g>

            {/* FWD transfer gallery */}
            <g>
                {/* Pump.9 */}
                <Pump x={84} y={384} running={isLeftOuterTankPumpActive}/>
                {/* Pump.10*/}
                <Pump x={140} y={384} running={isLeftMidTankPumpFwdActive}/>
                {/* Pump.12*/}
                <Pump x={232} y={384} running={isLeftInnerTankPumpFwdActive}/>
                {/* Pump.13*/}
                <Pump x={482} y={384} running={isRightInnerTankPumpFwdActive}/>
                {/* Pump.15*/}
                <Pump x={584} y={384} running={isRightMidTankPumpFwdActive}/>
                {/* Pump.14*/}
                <Pump x={680} y={384} running={isRightOuterTankPumpActive}/>

                {/* Horizontal lines */}
                <FuelLine x1={84} y1={362} x2={164} y2={362} active displayWhenInactive={showMore} />
                <FuelLine x1={164} y1={362} x2={174} y2={346} active displayWhenInactive={showMore} />
                <FuelLine x1={174} y1={346} x2={592} y2={346} active displayWhenInactive={showMore} />
                <FuelLine x1={592} y1={346} x2={602} y2={362} active displayWhenInactive={showMore} />
                <FuelLine x1={602} y1={362} x2={680} y2={362} active displayWhenInactive={showMore} />

                {/* Small vertical lines connecting to pumps */}
                <FuelLine x1={84} y1={370} x2={84} y2={362} active={isLeftOuterTankPumpActive} displayWhenInactive={showMore} />
                <FuelLine x1={140} y1={370} x2={140} y2={362} active={isLeftMidTankPumpFwdActive} displayWhenInactive={showMore} />
                <FuelLine x1={232} y1={370} x2={232} y2={346} active={isLeftInnerTankPumpFwdActive} displayWhenInactive={showMore} />
                <FuelLine x1={482} y1={370} x2={482} y2={346} active={isRightInnerTankPumpFwdActive} displayWhenInactive={showMore} />
                <FuelLine x1={584} y1={370} x2={584} y2={346} active={isRightMidTankPumpFwdActive} displayWhenInactive={showMore} />
                <FuelLine x1={680} y1={370} x2={680} y2={362} active={isRightOuterTankPumpActive} displayWhenInactive={showMore} />

                {/* Valves */}
                {(showMore || isAnyFeedTank1FwdTransferValveOpen) && <TransferValve x={140} y={362} isOpen={isAnyFeedTank1FwdTransferValveOpen} />}
                {(showMore || isAnyFeedTank2FwdTransferValveOpen) && <TransferValve x={284} y={346} isOpen={isAnyFeedTank2FwdTransferValveOpen} />}
                {(showMore || isAnyFeedTank3FwdTransferValveOpen) && <TransferValve x={520} y={346} isOpen={isAnyFeedTank3FwdTransferValveOpen} />}
                {(showMore || isAnyFeedTank4FwdTransferValveOpen) && <TransferValve x={622} y={362} isOpen={isAnyFeedTank4FwdTransferValveOpen} />}
            </g>

            {/* AFT transfer gallery */}
            <g>
                {/* Pump.11*/}
                <Pump x={182} y={452} running={isLeftMidTankPumpAftActive} />
                {/* Pump.16*/}
                <Pump x={274} y={452} running={isLeftInnerTankPumpAftActive} />
                {/* Pump.17*/}
                <Pump x={524} y={452} running={isRightInnerTankPumpAftActive} />
                {/* Pump.18*/}
                <Pump x={626} y={452} running={isRightMidTankPumpAftActive} />

                {/* Horizontal lines */}
                <FuelLine x1={602} y1={362} x2={680} y2={362} active displayWhenInactive={showMore} />
            </g>

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
        <g className={`${color} LineJoinRound`} strokeWidth={3}>
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
    const radius = 16;

    return (
        <g className={`${color} NoFill`} strokeWidth={2.8} transform={`rotate(${rotation} ${x} ${y})`}>
            <circle cx={x} cy={y} r={radius} />

            <line x1={x} y1={y - radius} x2={x} y2={y + radius} />
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
        <g className={`${color} LineJoinRound`} strokeWidth={2.8}>
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

const Engine: FC<EngineProps> = ({ x, y, index }) => {
    const [engineState] = useSimVar(`L:A32NX_ENGINE_N3:${index}`, 'number', 500);
    const isRunning = engineState > 50;

    return (<>
        <image x={x} y={y} width={75} height={96} xlinkHref='/Images/SD_FUEL_ENG_L.png' preserveAspectRatio='none' />

        <text x={x + 8} y={y + 25} className={`${isRunning ? "White" : "Amber"} T4`}>{index}</text>
    </>
)};

interface TankQuantityProps extends Position {
    smallFont?: boolean,
    quantity: number,
}

const TankQuantity: FC<TankQuantityProps> = ({ x, y, smallFont = false, quantity }) => {
    const displayQuantity = Math.floor(quantity / 20) * 20;

    return (
        <text x={x} y={y} className={`Green ${smallFont ? 'T3' : 'T4'}`} textAnchor='end'>{displayQuantity}</text>
    );
};

interface TriangleProps extends Position, TwoDimensionalSize {
    fill?: boolean,
}

const Triangle: FC<TriangleProps> = ({ x, y, width, height, fill }) => {
    return (
        <polygon className={`T4 ${fill ? "Fill" : "NoFill"} LineJoinRound`} strokeWidth={3} points={`${x - width / 2},${y} ${x + width / 2},${y} ${x},${y - height}`} />
    );
}

interface TransferValveProps extends Position {
    isOpen?: boolean,
    isManual?: boolean,
    isAbnormal?: boolean,
}

const TransferValve: FC<TransferValveProps> = ({ x, y, isOpen, isManual, isAbnormal }) => {
    const width = 10;
    const height = 10;
    const lineLength = 20;

    let color = "White";
    if (isOpen) {
        if (isAbnormal) {
            color = "Amber";
        } else {
            color = "Green";
        }
    }

    return (
        <g strokeWidth={3} className={color}>
            <Triangle x={x} y={y - lineLength} width={width} height={height} fill={isManual} />
            <line x1={x} y1={y} x2={x} y2={y - lineLength} />
        </g>
    );
}
