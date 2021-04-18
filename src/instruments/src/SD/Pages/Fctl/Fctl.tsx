import './Fctl.scss';
import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

setIsEcamPage('fctl_page');

export const FctlPage = () => {
    const [aileronLeftDeflectionState] = useSimVar('AILERON LEFT DEFLECTION PCT', 'percent over 100', 50);
    const [aileronRightDeflectionState] = useSimVar('AILERON RIGHT DEFLECTION PCT', 'percent over 100', 50);

    const [elevatorDeflectionState] = useSimVar('ELEVATOR DEFLECTION PCT', 'percent over 100', 50);

    const [elac1SwitchState] = useSimVar('FLY BY WIRE ELAC SWITCH:1', 'boolean', 1000);
    const [elac1FailState] = useSimVar('FLY BY WIRE ELAC FAILED:1', 'boolean', 1000);

    const [elac2SwitchState] = useSimVar('FLY BY WIRE ELAC SWITCH:2', 'boolean', 1000);
    const [elac2FailState] = useSimVar('FLY BY WIRE ELAC FAILED:2', 'boolean', 1000);

    const [sec1SwitchState] = useSimVar('FLY BY WIRE SEC SWITCH:1', 'boolean', 1000);
    const [sec1FailState] = useSimVar('FLY BY WIRE SEC FAILED:1', 'boolean', 1000);

    const [sec2SwitchState] = useSimVar('FLY BY WIRE SEC SWITCH:2', 'boolean', 1000);
    const [sec2FailState] = useSimVar('FLY BY WIRE SEC FAILED:2', 'boolean', 1000);

    const [sec3SwitchState] = useSimVar('FLY BY WIRE SEC SWITCH:3', 'boolean', 1000);
    const [sec3FailState] = useSimVar('FLY BY WIRE SEC FAILED:3', 'boolean', 1000);

    const [pitchTrimState] = useSimVar('ELEVATOR TRIM INDICATOR', 'Position 16k', 50);

    const [rawPitchTrim, setRawPitchTrim] = useState(0);
    const [rudderAngle, setRudderAngle] = useState(0);
    const [rudderTrimAngle, setRudderTrimAngle] = useState(0);
    const [maxAngleNorm, setMaxAngleNorm] = useState(1);

    useEffect(() => {
        let rPT = pitchTrimState / 1213.6296;
        // Cap pitch trim at 13.5 up, 4 down
        if (rPT > 16384.0) {
            rPT = 16384.0;
        } else if (rPT < -4854) {
            rPT = -4854;
        }
        setRawPitchTrim(rPT);
    }, [pitchTrimState]);

    const pitchValueArray = Math.abs(rawPitchTrim).toFixed(1).toString().split('.');
    const pitchTrimSign = Math.sign(rawPitchTrim);

    const [rudderDeflectionState] = useSimVar('RUDDER DEFLECTION PCT', 'percent over 100', 50);

    useEffect(() => {
        setRudderAngle(-rudderDeflectionState * 25);
    }, [rudderDeflectionState]);

    // Update rudder limits
    const [indicatedAirspeedState] = useSimVar('AIRSPEED INDICATED', 'knots', 500);

    useEffect(() => {
        if (indicatedAirspeedState > 380) {
            setMaxAngleNorm(3.4 / 25);
        } else if (indicatedAirspeedState > 160) {
            setMaxAngleNorm((69.2667 - 0.351818 * indicatedAirspeedState
                + 0.00047 * indicatedAirspeedState ** 2) / 25);
        }
    }, [indicatedAirspeedState]);

    // Rudder trim

    const [rudderTrimState] = useSimVar('RUDDER TRIM PCT', 'percent over 100', 500);

    useEffect(() => {
        setRudderTrimAngle(-rudderTrimState * 25);
    }, [rudderTrimState]);

    // Check Hydraulics state

    // const [greenPumpActive] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_ACTIVE', 'boolean', 500);
    // const [yellowPumpActive] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_ACTIVE', 'boolean', 500);
    // const [bluePumpActive] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_ACTIVE', 'boolean', 500);

    // const [greenPumpLowPressure] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_LOW_PRESS', 'boolean', 500);
    // const [yellowPumpLowPressure] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_LOW_PRESS', 'boolean', 500);
    // const [bluePumpLowPressure] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_LOW_PRESS', 'boolean', 500);

    // function checkPumpLowPressure(pump) {
    //     switch (pump) {
    //     case 'GREEN':
    //         return (greenPumpLowPressure && greenPumpActive) || !greenPumpActive;
    //     case 'BLUE':
    //         return (bluePumpLowPressure && bluePumpActive) || !bluePumpActive;
    //     case 'YELLOW':
    //         return (yellowPumpLowPressure && yellowPumpActive) || !yellowPumpActive;
    //     default:
    //         return 1;
    //     }
    // }

    // const [hydraulicGAvailable] = checkPumpLowPressure('GREEN');
    // const [hydraulicYAvailable] = checkPumpLowPressure('YELLOW');
    // const [hydraulicBAvailable] = checkPumpLowPressure('BLUE');

    const [engine1State] = useSimVar('TURB ENG N2:1', 'Percent', 1000);
    const [engine2State] = useSimVar('TURB ENG N2:2', 'Percent', 1000);

    const hydraulicGAvailable = engine1State > 15;
    const hydraulicYAvailable = engine2State > 15;
    const hydraulicBAvailable = engine1State > 15 || engine2State > 15;

    const [leftSpoilerState] = useSimVar('SPOILERS LEFT POSITION', 'percent over 100', 50);
    const [rightSpoilerState] = useSimVar('SPOILERS RIGHT POSITION', 'percent over 100', 50);
    const [spoilerHandleState] = useSimVar('SPOILERS HANDLE POSITION', 'percent over 100', 100);

    const [spoilersArmedState] = useSimVar('SPOILERS ARMED', 'boolean', 500);

    const speedBrakeY = 104;
    const leftSpeedBrakeX = 103;
    const rightSpeedBrakeX = 497;
    const speedBrakeXChange = 38;
    const spoilers: Array<any> = [];
    for (let i = 0; i < 5; i += 1) {
        const YCoord = speedBrakeY - (i * 5);
        const YCoordW = YCoord - 9;
        const leftX = leftSpeedBrakeX + (i * speedBrakeXChange);
        const rightX = rightSpeedBrakeX - (i * speedBrakeXChange);
        const index = 5 - i;
        spoilers.push(<Spoiler
            leftorright="left"
            index={index}
            x={leftX}
            y={YCoord}
            yw={YCoordW}
            hydAvail={[hydraulicGAvailable, hydraulicBAvailable, hydraulicYAvailable]}
            speedbrake={spoilerHandleState}
            spoilerpos={leftSpoilerState}
            ailpos={aileronLeftDeflectionState}
            spoilerArmedState={spoilersArmedState}
        />);
        spoilers.push(<Spoiler
            leftorright="right"
            index={index}
            x={rightX}
            y={YCoord}
            yw={YCoordW}
            hydAvail={[hydraulicGAvailable, hydraulicBAvailable, hydraulicYAvailable]}
            speedbrake={spoilerHandleState}
            spoilerpos={rightSpoilerState}
            ailpos={aileronRightDeflectionState}
            spoilerArmedState={spoilersArmedState}
        />);
    }

    return (
        <>
            <svg id="ecam-fctl" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
                <text
                    id="pageTitle"
                    className="PageTitle"
                    x="45"
                    y="18"
                    textAnchor="middle"
                    alignmentBaseline="central"
                >
                    F/CTL
                </text>

                {/* Speedbrakes */}
                <text
                    id="speedBrakeText"
                    className="Note"
                    x="300"
                    y="107"
                    textAnchor="middle"
                    alignmentBaseline="central"
                >
                    SPD BRK
                </text>

                <g id="speedbrakeHyd">
                    <HydraulicIndicator id="pitchTrimHyd1" x={269} y={14} letter="G" hydAvail={hydraulicGAvailable} />
                    <HydraulicIndicator id="pitchTrimHyd1" x={291} y={14} letter="B" hydAvail={hydraulicBAvailable} />
                    <HydraulicIndicator id="pitchTrimHyd1" x={313} y={14} letter="Y" hydAvail={hydraulicYAvailable} />
                </g>

                <g id="spoilers">
                    {spoilers}
                </g>

                <g id="leftSpeedbrakeGroup">
                    <path className="MainShape" d="M98,61 l0,-5 l140,-23 l0,5" />
                    <path className="MainShape" d="M135,110 l0,5 l105,-12 l0,-5" />
                </g>

                <g id="rightSpeedbrakeGroup">
                    <path className="MainShape" d="M502,61 l0,-5 l-140,-23 l0,5" />
                    <path className="MainShape" d="M465,110 l0,5 l-105,-12 l0,-5" />
                </g>

                {/* Left ailerons */}

                <Aileron
                    leftorright="left"
                    x={72}
                    aileronDeflection={aileronLeftDeflectionState}
                    hydArray={['B', 'G']}
                    hydAvail={[hydraulicBAvailable, hydraulicGAvailable]}
                />

                {/* Right ailerons */}

                <Aileron
                    leftorright="right"
                    x={528}
                    aileronDeflection={aileronRightDeflectionState}
                    hydArray={['G', 'B']}
                    hydAvail={[hydraulicGAvailable, hydraulicBAvailable]}
                />

                <g id="elac">
                    <text
                        id="elacText"
                        className="Note"
                        x="195"
                        y="178"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        ELAC
                    </text>
                    <ElacSecShape
                        id="elac1"
                        x={170}
                        y={190}
                        number={1}
                        fail={elac1FailState}
                        on={elac1SwitchState}
                    />
                    <ElacSecShape
                        id="elac1"
                        x={194}
                        y={206}
                        number={2}
                        fail={elac2FailState}
                        on={elac2SwitchState}
                    />
                </g>

                <g id="sec">
                    <text
                        id="secText"
                        className="Note"
                        x="350"
                        y="178"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        SEC
                    </text>
                    <ElacSecShape
                        id="sec1"
                        x={324}
                        y={190}
                        number={1}
                        fail={sec1FailState}
                        on={sec1SwitchState}
                    />
                    <ElacSecShape
                        id="sec2"
                        x={348}
                        y={206}
                        number={2}
                        fail={sec2FailState}
                        on={sec2SwitchState}
                    />
                    <ElacSecShape
                        id="sec3"
                        x={372}
                        y={222}
                        number={3}
                        fail={sec3FailState}
                        on={sec3SwitchState}
                    />
                </g>

                {/* Left elevator */}

                <Elevator
                    leftorright="left"
                    x={168}
                    elevatorDeflection={elevatorDeflectionState}
                    hydArray={['B', 'G']}
                    hydAvail={[hydraulicBAvailable, hydraulicGAvailable]}
                />

                {/* Right elevator */}

                <Elevator
                    leftorright="right"
                    x={432}
                    elevatorDeflection={elevatorDeflectionState}
                    hydArray={['B', 'Y']}
                    hydAvail={[hydraulicBAvailable, hydraulicYAvailable]}
                />

                {/* Pitch trim */}

                <g id="pitchTrim">
                    <text
                        id="pitchTrimText"
                        className="Note"
                        x="280"
                        y="296"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        PITCH TRIM
                    </text>

                    <text
                        id="pitchTrimLeadingDecimal"
                        className={hydraulicGAvailable || hydraulicYAvailable ? 'Value Standard' : 'Warning Standard'}
                        x="281"
                        y="318"
                        textAnchor="end"
                        alignmentBaseline="central"
                    >
                        {pitchValueArray[0]}
                    </text>
                    <text
                        id="pitchTrimDecimalPoint"
                        className={hydraulicGAvailable || hydraulicYAvailable ? 'Value Standard' : 'Warning Standard'}
                        x="285"
                        y="318"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        .
                    </text>
                    <text
                        id="pitchTrimTrailingDecimal"
                        className={hydraulicGAvailable || hydraulicYAvailable ? 'Value Small' : 'Warning Small'}
                        x="294"
                        y="320"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        {pitchValueArray[1]}
                    </text>
                    <text
                        id="pitchTrimDecimalPoint"
                        className="ValueCyan Standard"
                        x="308"
                        y="318"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        °
                    </text>
                    <text
                        id="pitchTrimDirection"
                        className={hydraulicGAvailable || hydraulicYAvailable ? 'Value Small' : 'Warning Small'}
                        x="328"
                        y="320"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        {pitchTrimSign === -1 ? 'DN' : 'UP'}
                    </text>

                    <HydraulicIndicator id="pitchTrimHyd1" x={360} y={283} letter="G" hydAvail={hydraulicGAvailable} />
                    <HydraulicIndicator id="pitchTrimHyd2" x={382} y={283} letter="Y" hydAvail={hydraulicYAvailable} />
                </g>

                {/* Stabilizer */}

                <g id="stabilizer">
                    <path id="stabLeft" className="MainShape" d="M268,357 l-55,4 l0,-18 l30,-15" />
                    <path id="stabRight" className="MainShape" d="M332,357 l55,4 l0,-18 l-30,-15" />
                    <HydraulicIndicator id="stabHyd1" x={269} y={373} letter="G" hydAvail={hydraulicGAvailable} />
                    <HydraulicIndicator id="stabHyd1" x={291} y={373} letter="B" hydAvail={hydraulicBAvailable} />
                    <HydraulicIndicator id="stabHyd1" x={313} y={373} letter="Y" hydAvail={hydraulicYAvailable} />
                </g>

                {/* Rudder */}

                <g id="rudderAxis">
                    <text
                        id="pitchTrimText"
                        className="Note"
                        x="300"
                        y="356"
                        textAnchor="middle"
                        alignmentBaseline="central"
                    >
                        RUD
                    </text>
                    <path id="rudderPath" className="MainShape" d="M 350 469 A 100 100 0 0 1 250 469" />
                    <path id="rudderCenter" className="MainShape" d="m297 484 v 4 h 6 v-4" />
                    <path id="rudderRightBorder" className="MainShape" d="m344 474 1 4 -7 3 -2 -4" />
                    <path id="rudderLeftBorder" className="MainShape" d="m256 474 -1 4 7 3 2 -4" />
                </g>

                <g id="rudderLeftMaxAngle" transform={`rotate(${-26.4 * (1 - maxAngleNorm)} 300 385)`}>
                    <path className="GreenShape" d="m255 473 -6 13 4 2" />
                </g>

                <g id="rudderRightMaxAngle" transform={`rotate(${26.4 * (1 - maxAngleNorm)} 300 385)`}>
                    <path className="GreenShape" d="m345 473 6 13 -4 2" />
                </g>

                <g id="rudderCursor" transform={`rotate(${rudderAngle} 300 380)`}>
                    <path
                        id="rudderCircle"
                        className={hydraulicGAvailable || hydraulicBAvailable || hydraulicYAvailable ? 'GreenShape' : 'WarningShape'}
                        d="M 292 434 A 8 8 0 0 1 308 434"
                    />
                    <path
                        id="rudderTail"
                        className={hydraulicGAvailable || hydraulicBAvailable || hydraulicYAvailable ? 'GreenShape' : 'WarningShape'}
                        d="M292,434 l8,48 l8,-48"
                    />
                </g>
                <g id="rudderTrimCursor" transform={`rotate(${rudderTrimAngle} 300 380)`}>
                    <path id="rudderTrimCursor" className="RudderTrim" d="m300 490 v 8" />
                </g>
            </svg>
        </>
    );
};

type AileronProps = {
    leftorright: string,
    x: number,
    aileronDeflection: number,
    hydArray: [string, string],
    hydAvail: [boolean, boolean]
}

const Aileron = ({ leftorright, x, aileronDeflection, hydArray, hydAvail } : AileronProps) => {
    const textPositionX = leftorright === 'left' ? x - 40 : x + 40;
    const textLetter = leftorright === 'left' ? 'L' : 'R';
    const hydPositionX1 = leftorright === 'left' ? x + 22 : x - 62;
    const hydPositionX2 = leftorright === 'left' ? x + 44 : x - 40;

    const aileronDeflectPctNormalized = aileronDeflection * 54;
    const cursorPath = `M${leftorright === 'left' ? x + 1 : x - 1},${leftorright === 'left' ? 204 + aileronDeflectPctNormalized
        : 204 - aileronDeflectPctNormalized} l${leftorright === 'right' ? '-' : ''}15,-7 l0,14Z`;

    return (
        <>
            <text
                id={`${leftorright}AileronText1`}
                className="Note"
                x={textPositionX}
                y="153"
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {textLetter}
            </text>
            <text
                id={`${leftorright}AileronText2`}
                className="Note"
                x={textPositionX}
                y="175"
                textAnchor="middle"
                alignmentBaseline="central"
            >
                AIL
            </text>

            <g id={`${leftorright}AileronPointer`}>
                <path
                    id={`${leftorright}AileronCursor`}
                    className={hydAvail[0] || hydAvail[1] ? 'GreenShape' : 'WarningShape'}
                    d={cursorPath}
                />
            </g>

            <AileronAxis leftorright={leftorright} x={x} />

            <g id="leftAileronHyd">
                <HydraulicIndicator
                    id={`${leftorright}AileronHyd1`}
                    x={hydPositionX1}
                    y={246}
                    letter={hydArray[0]}
                    hydAvail={hydAvail[0]}
                />
                <HydraulicIndicator
                    id={`${leftorright}AileronHyd2`}
                    x={hydPositionX2}
                    y={246}
                    letter={hydArray[1]}
                    hydAvail={hydAvail[1]}
                />
            </g>
        </>
    );
};

type HydraulicIndicatorProps = {
    id: string,
    x: number,
    y: number,
    letter: string,
    hydAvail: boolean
}

const HydraulicIndicator = ({ id, x, y, letter, hydAvail } : HydraulicIndicatorProps) => {
    const textPositionX = x + 9;
    const textPositionY = y + 11;
    return (
        <>
            <rect className="HydBgShape" x={x} y={y} width="18" height="24" rx="0" />
            <text
                id={id}
                className={hydAvail ? 'Value Standard' : 'Warning Standard'}
                x={textPositionX}
                y={textPositionY}
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {letter}
            </text>
        </>
    );
};

type ElacSecShapeProps = {
    id: string,
    x: number,
    y: number,
    number: number,
    on: boolean,
    fail: boolean
}

const ElacSecShape = ({ id, x, y, number, on = true, fail = false } : ElacSecShapeProps) => {
    const textPositionX = x + 61;
    const textPositionY = y - 12;
    return (
        <>
            <path className={on && !fail ? 'MainShape' : 'MainShapeWarning'} d={`M${x},${y} l72,0 l0,-26 l-8,0`} />
            <text
                id={id}
                className={on && !fail ? 'Value Standard' : 'Warning Standard'}
                x={textPositionX}
                y={textPositionY}
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {number}
            </text>
        </>
    );
};

type AileronAxisProps = {
    leftorright: string,
    x: number
}

const AileronAxis = ({ leftorright, x } : AileronAxisProps) => {
    const d1 = `M${x},164 l${
        leftorright === 'left' ? '-' : ''}8,0 l0,-20 l${
        leftorright === 'right' ? '-' : ''}8,0 l0,120 l${leftorright === 'left' ? '-' : ''}8,0 l0,-10 l${leftorright === 'right' ? '-' : ''}8,0`;
    const d2 = `M${x},200 l${leftorright === 'left' ? '-' : ''}7,0`;
    const d3 = `M${x},205 l${leftorright === 'left' ? '-' : ''}7,0`;
    const d4 = `M${x},210 l${leftorright === 'left' ? '-' : ''}8,0 l0,6 l${leftorright === 'right' ? '-' : ''}8,0`;

    return (
        <>
            <g id={`${leftorright}AileronAxis`}>
                <path className="MainShape" d={d1} />
                <path className="MainShape" d={d2} />
                <path className="MainShape" d={d3} />
                <path className="MainShape" d={d4} />
            </g>
        </>
    );
};

type ElevatorProps = {
    leftorright: string,
    x: number,
    elevatorDeflection: number,
    hydArray: [string, string],
    hydAvail: [boolean, boolean]
}

const Elevator = ({ leftorright, x, elevatorDeflection, hydArray, hydAvail } : ElevatorProps) => {
    const textPositionX = leftorright === 'left' ? x - 42 : x + 42;
    const textLetter = leftorright === 'left' ? 'L' : 'R';
    const hydPositionX1 = leftorright === 'left' ? x - 60 : x + 40;
    const hydPositionX2 = leftorright === 'left' ? x - 38 : x + 18;

    const elevatorDeflectPctNormalized = elevatorDeflection * (elevatorDeflection > 0 ? 70 : 52);
    const cursorPath = `M${leftorright === 'left' ? x + 1 : x - 1},${398 - elevatorDeflectPctNormalized} l${leftorright === 'right' ? '-' : ''}15,-7 l0,14Z`;

    return (
        <>
            <text
                id={`${leftorright}AileronText1`}
                className="Note"
                x={textPositionX}
                y="328"
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {textLetter}
            </text>
            <text
                id={`${leftorright}AileronText2`}
                className="Note"
                x={textPositionX}
                y="350"
                textAnchor="middle"
                alignmentBaseline="central"
            >
                ELEV
            </text>

            <g id={`${leftorright}ElevatorPointer`}>
                <path
                    id={`${leftorright}ElevatorCursor`}
                    className={hydAvail[0] || hydAvail[1] ? 'GreenShape' : 'WarningShape'}
                    d={cursorPath}
                />
            </g>

            <ElevatorAxis leftorright={leftorright} x={x} />

            <g id="leftElevatorHyd">
                <HydraulicIndicator
                    id={`${leftorright}ElevatorHyd1`}
                    x={hydPositionX1}
                    y={407}
                    letter={hydArray[0]}
                    hydAvail={hydAvail[0]}
                />
                <HydraulicIndicator
                    id={`${leftorright}ElevatorHyd2`}
                    x={hydPositionX2}
                    y={407}
                    letter={hydArray[1]}
                    hydAvail={hydAvail[1]}
                />
            </g>
        </>
    );
};

type ElevatorAxisProps = {
    leftorright: string,
    x: number
}

const ElevatorAxis = ({ leftorright, x } : ElevatorAxisProps) => {
    const d1 = `M${x},333 l${
        leftorright === 'left' ? '-' : ''}8,0 l0,-10 l${
        leftorright === 'right' ? '-' : ''}8,0 l0,116 l${leftorright === 'left' ? '-' : ''}8,0 l0,-10 l${leftorright === 'right' ? '-' : ''}8,0`;
    const d2 = `M${x},395 l${leftorright === 'left' ? '-' : ''}7,0 l0,5 l${leftorright === 'right' ? '-' : ''}7,0`;

    return (
        <>
            <g id={`${leftorright}ElevatorAxis`}>
                <path className="MainShape" d={d1} />
                <path className="MainShape" d={d2} />
            </g>
        </>
    );
};

type SpoilerProps = {
    index: number,
    leftorright: string,
    x: number,
    y: number,
    yw: number,
    hydAvail: [boolean, boolean, boolean],
    speedbrake: number,
    spoilerpos: number,
    ailpos: number,
    spoilerArmedState: boolean,
}

const Spoiler = ({ index, leftorright, x, y, yw, hydAvail, speedbrake, spoilerpos, ailpos, spoilerArmedState } : SpoilerProps) => {
    let showspoiler = false;
    let hydraulicsAvailable = false;
    if (index === 1) {
        showspoiler = !!(spoilerArmedState && spoilerpos > 0.1);
    } else if (index === 5) {
        console.log(`Speed brake is ${speedbrake}`);
        console.log(`Spoiler position is ${spoilerpos}`);
        showspoiler = spoilerArmedState && spoilerpos > 0.1 ? true : showspoiler;
        showspoiler = ((leftorright === 'left' && ailpos < -0.5) || (leftorright === 'right' && ailpos > 0.5)) ? true : showspoiler;
    } else {
        showspoiler = spoilerpos > 0.1 ? true : showspoiler;
        showspoiler = speedbrake > 0.1 ? true : showspoiler;
    }

    // hydraulics
    showspoiler = !hydAvail[0] && (index === 5 || index === 1) ? false : showspoiler; // Green
    showspoiler = !hydAvail[1] && index === 3 ? false : showspoiler; // Blue
    showspoiler = !hydAvail[2] && (index === 2 || index === 4) ? false : showspoiler; // Yellow

    hydraulicsAvailable = hydAvail[0] && (index === 5 || index === 1) ? true : hydraulicsAvailable;
    hydraulicsAvailable = hydAvail[1] && index === 3 ? true : hydraulicsAvailable;
    hydraulicsAvailable = hydAvail[2] && (index === 2 || index === 4) ? true : hydraulicsAvailable;

    return (
        <>
            <path
                className={hydraulicsAvailable ? 'GreenShapeThick' : 'WarningShapeThick'}
                d={`M ${x} ${y} l ${leftorright === 'right' ? '-' : ''}15 0`}
            />
            <path
                id={`arrow${index}_${leftorright}`}
                visibility={showspoiler ? 'visible' : 'hidden'}
                className="GreenShape"
                d={`M ${leftorright === 'left' ? x + 8 : x - 8} ${y} l 0 -22 l -6 0 l 6 -12 l 6 12 l -6 0`}
            />
            <text
                id={`num${index}_${leftorright}`}
                visibility={hydraulicsAvailable ? 'hidden' : 'visible'}
                className="Warning Medium"
                x={`${leftorright === 'left' ? x + 8 : x - 8}`}
                y={`${yw}`}
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {index}
            </text>
        </>
    );
};

ReactDOM.render(<SimVarProvider><FctlPage /></SimVarProvider>, getRenderTarget());
