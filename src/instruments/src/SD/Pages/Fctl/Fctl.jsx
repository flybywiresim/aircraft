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

import './Fctl.scss';
// import { useState } from 'react';
// import { getSimVar, useUpdate } from '../../../util.mjs';
import { StatefulSimVar } from '../../../StatefulSimVar.mjs';

export const FctlPage = () => {
    console.log('FCTL');
    const speedBrakeY = 104;
    const leftSpeedBrakeX = 103;
    const rightSpeedBrakeX = 497;
    const speedBrakeXChange = 38;
    const speedBrakeXArrowChange = 8;
    // 38
    // 5
    const speedbrakes = [];
    const speedbrakesArrows = [];
    const speedbrakeText = [];
    for (let i = 0; i < 5; i += 1) {
        const YCoord = speedBrakeY - (i * 5);
        const YCoordW = YCoord - 9;
        const leftX = leftSpeedBrakeX + (i * speedBrakeXChange);
        const rightX = rightSpeedBrakeX - (i * speedBrakeXChange);
        speedbrakes.push(<path className="GreenShapeThick" d={`M ${leftX} ${YCoord} l 15 0`} />);
        speedbrakes.push(<path className="GreenShapeThick" d={`M ${rightX} ${YCoord} l -15 0`} />);
        // Speedbrake arrows
        const index = 5 - i;
        speedbrakesArrows.push(<path id={`arrow${index}_left`} className="GreenShape" d={`M ${leftX + speedBrakeXArrowChange} ${YCoord} l 0 -22 l -6 0 l 6 -12 l 6 12 l -6 0`} />);
        speedbrakesArrows.push(<path id={`arrow${index}_right`} className="GreenShape" d={`M ${rightX - speedBrakeXArrowChange} ${YCoord} l 0 -22 l -6 0 l 6 -12 l 6 12 l -6 0`} />);
        // console.log(YCoordW);
        speedbrakeText.push(<text id={`num${index}_left`} className="Warning" x={`${leftX + speedBrakeXArrowChange}`} y={`${YCoordW}`} textAnchor="middle" alignmentBaseline="central">{index}</text>);
        speedbrakeText.push(<text id={`num${index}_right`} className="Warning" x={`${rightX - speedBrakeXArrowChange}`} y={`${YCoordW}`} textAnchor="middle" alignmentBaseline="central">{index}</text>);
    }

    const aileronLeftDeflectionStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'AILERON LEFT DEFLECTION PCT',
        simVarUnit: 'percent over 100',
        refreshRate: 50,
    });

    const aileronRightDeflectionStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'AILERON RIGHT DEFLECTION PCT',
        simVarUnit: 'percent over 100',
        refreshRate: 50,
    });

    const elevatorDeflectionStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'ELEVATOR DEFLECTION PCT',
        simVarUnit: 'percent over 100',
        refreshRate: 50,
    });

    const elac1SwitchStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE ELAC SWITCH:1',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const elac1FailStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE ELAC FAILED:1',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const elac2SwitchStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE ELAC SWITCH:2',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const elac2FailStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE ELAC FAILED:2',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const sec1SwitchStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE SEC SWITCH:1',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const sec1FailStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE SEC FAILED:1',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const sec2SwitchStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE SEC SWITCH:2',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const sec2FailStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE SEC FAILED:2',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const sec3SwitchStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE SEC SWITCH:3',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    const sec3FailStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'FLY BY WIRE SEC FAILED:3',
        simVarUnit: 'boolean',
        refreshRate: 1000,
    });

    // Update hydraulics available state
    // const hydraulicsShouldBeAvailable = SimVar.GetSimVarValue("ENG COMBUSTION:1", "Bool") === 0 && SimVar.GetSimVarValue("ENG COMBUSTION:2", "Bool") === 0;
    // let rawPitchTrim = SimVar.GetSimVarValue("ELEVATOR TRIM INDICATOR", "Position 16k") / 1213.6296;
    // const rudderDeflectPct = SimVar.GetSimVarValue("RUDDER DEFLECTION PCT", "percent over 100");
    // const IndicatedAirspeed = SimVar.GetSimVarValue("AIRSPEED INDICATED", "knots");
    // const spoilersArmed = SimVar.GetSimVarValue("SPOILERS ARMED", "boolean");
    // const leftSpoilerDeflectPct = SimVar.GetSimVarValue("SPOILERS LEFT POSITION", "percent over 100");
    // const rightSpoilerDeflectPct = SimVar.GetSimVarValue("SPOILERS RIGHT POSITION", "percent over 100");
    // const planeOnGround = SimVar.GetSimVarValue("SIM ON GROUND", "boolean");
    // const eng1_mode = SimVar.GetSimVarValue("GENERAL ENG THROTTLE MANAGED MODE:1", "number");
    // const eng2_mode = SimVar.GetSimVarValue("GENERAL ENG THROTTLE MANAGED MODE:2", "number");
    // const gspeed = SimVar.GetSimVarValue("SURFACE RELATIVE GROUND SPEED", "feet_per_second");

    // const [aileron, setAileron] = useState({
    //     leftAileronDeflectPct: 0,
    //     rightAileronDeflectPct: 0,
    // });

    return (
        <>
            <svg id="ecam-fctl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                <text id="pageTitle" className="PageTitle" x="45" y="18" textAnchor="middle" alignmentBaseline="central">F/CTL</text>

                {/* Speedbrakes */}
                <g id="speedbrakes">
                    {speedbrakes}
                </g>

                <g id="speedbrake_arrows">
                    {speedbrakesArrows}
                </g>

                <g id="speedbrake_text">
                    {speedbrakeText}
                </g>

                <g id="leftSpeedbrakeGroup">
                    <path className="MainShape" d="M98,61 l0,-5 l140,-23 l0,5" />
                    <path className="MainShape" d="M135,110 l0,5 l105,-12 l0,-5" />
                </g>

                <g id="rightSpeedbrakeGroup">
                    <path className="MainShape" d="M502,61 l0,-5 l-140,-23 l0,5" />
                    <path className="MainShape" d="M465,110 l0,5 l-105,-12 l0,-5" />
                </g>

                <g id="speedbrakeHyd">
                    <rect className="HydBgShape" x="269" y="14" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="291" y="14" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="313" y="14" width="18" height="24" rx="2" />
                    <text id="speedbrakeHyd1" className="Value" x="278" y="27" textAnchor="middle" alignmentBaseline="central">G</text>
                    <text id="speedbrakeHyd2" className="Value" x="300" y="27" textAnchor="middle" alignmentBaseline="central">B</text>
                    <text id="speedbrakeHyd3" className="Value" x="322" y="27" textAnchor="middle" alignmentBaseline="central">Y</text>
                </g>

                {/* Left ailerons */}

                <Aileron leftorright="left" x="72" aileronDeflection={aileronLeftDeflectionStatefulSimVar.value} hydArray={['B', 'G']} />

                {/* Right ailerons */}

                <Aileron leftorright="right" x="528" aileronDeflection={aileronRightDeflectionStatefulSimVar.value} hydArray={['G', 'B']} />

                <g id="elac">
                    <text id="elacText" className="Note" x="195" y="178" textAnchor="middle" alignmentBaseline="central">ELAC</text>
                    <ElacSecShape id="elac1" x="170" y="190" number="1" fail={elac1FailStatefulSimVar.value} on={elac1SwitchStatefulSimVar.value} />
                    <ElacSecShape id="elac1" x="194" y="206" number="2" fail={elac2FailStatefulSimVar.value} on={elac2SwitchStatefulSimVar.value} />
                </g>

                <g id="sec">
                    <text id="secText" className="Note" x="350" y="178" textAnchor="middle" alignmentBaseline="central">SEC</text>
                    <ElacSecShape id="sec1" x="324" y="190" number="1" fail={sec1FailStatefulSimVar.value} on={sec1SwitchStatefulSimVar.value} />
                    <ElacSecShape id="sec2" x="348" y="206" number="2" fail={sec2FailStatefulSimVar.value} on={sec2SwitchStatefulSimVar.value} />
                    <ElacSecShape id="sec3" x="372" y="222" number="3" fail={sec3FailStatefulSimVar.value} on={sec3SwitchStatefulSimVar.value} />
                </g>

                {/* Left elevator */}

                <Elevator leftorright="left" x="168" elevatorDeflection={elevatorDeflectionStatefulSimVar.value} hydArray={['B', 'G']} />

                {/* Right elevator */}

                <Elevator leftorright="right" x="432" elevatorDeflection={elevatorDeflectionStatefulSimVar.value} hydArray={['B', 'Y']} />

                {/* Pitch trim */}

                <g id="pitchTrim">
                    <text id="pitchTrimText" className="Note" x="280" y="296" textAnchor="middle" alignmentBaseline="central">PITCH TRIM</text>
                    <rect className="HydBgShape" x="360" y="283" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="382" y="283" width="18" height="24" rx="2" />
                    <text id="pitchTrimLeadingDecimal" className="Value" x="269" y="318" textAnchor="middle" alignmentBaseline="central">-</text>
                    <text id="pitchTrimDecimalPoint" className="Value" x="281" y="318" textAnchor="middle" alignmentBaseline="central">.</text>
                    <text id="pitchTrimTrailingDecimal" className="Value12" x="292" y="318" textAnchor="middle" alignmentBaseline="central">-</text>
                    <circle id="pitchTrimDegreePoint" className="MainShape" cx="310" cy="313" r="3" textAnchor="middle" alignmentBaseline="central">°</circle>
                    <text id="pitchTrimDirection" className="Value" x="335" y="318" textAnchor="middle" alignmentBaseline="central">UP</text>
                    <text id="pitchTrimHyd1" className="Value" x="369" y="296" textAnchor="middle" alignmentBaseline="central">G</text>
                    <text id="pitchTrimHyd2" className="Value" x="391" y="296" textAnchor="middle" alignmentBaseline="central">Y</text>
                </g>

                {/* Stabilizer */}

                <g id="stabilizer">
                    <text id="pitchTrimText" className="Note" x="300" y="356" textAnchor="middle" alignmentBaseline="central">RUD</text>
                    <path id="stabLeft" className="MainShape" d="M268,357 l-55,4 l0,-18 l30,-15" />
                    <path id="stabRight" className="MainShape" d="M332,357 l55,4 l0,-18 l-30,-15" />
                    <rect className="HydBgShape" x="269" y="373" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="291" y="373" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="313" y="373" width="18" height="24" rx="2" />
                    <text id="stabHyd1" className="Value" x="278" y="386" textAnchor="middle" alignmentBaseline="central">G</text>
                    <text id="stabHyd2" className="Value" x="300" y="386" textAnchor="middle" alignmentBaseline="central">B</text>
                    <text id="stabHyd3" className="Value" x="322" y="386" textAnchor="middle" alignmentBaseline="central">Y</text>
                </g>

                {/* Rudder */}

                <g id="rudderAxis">
                    <path id="rudderPath" className="MainShape" d="M 350 469 A 100 100 0 0 1 250 469" />
                    <path id="rudderCenter" className="MainShape" d="m302 482-6e-3 6-4 0.01 0.05-6" />
                    <path id="rudderRightBorder" className="MainShape" d="m343 472 2 5-7 3-2-5" />
                    <path id="rudderLeftBorder" className="MainShape" d="m257 472-2 5 7 3 2-5" />
                </g>

                <g id="rudderLeftMaxAngle">
                    <path id="rudderLeftLimitGreen" className="GreenShape" d="m250 484 6 3" />
                    <path id="rudderLeftLimitWhite" className="GreenShape" d="m257 472-7 13" />
                </g>

                <g id="rudderRightMaxAngle">
                    <path id="rudderRightLimitGreen" className="GreenShape" d="m350 484-6 3" />
                    <path id="rudderRightLimitWhite" className="GreenShape" d="m343 472 7 13" />
                </g>

                <g id="rudderCursor">
                    <path id="rudderCircle" className="GreenShape" d="M 292 434 A 8 8 0 0 1 308 434" />
                    <path id="rudderTail" className="GreenShape" d="M292,434 l8,48 l8,-48" />
                </g>
                v

                {/* Texts */}

                <g id="texts">
                    <text id="speedBrakeText" className="Note" x="300" y="107" textAnchor="middle" alignmentBaseline="central">SPD BRK</text>
                </g>
            </svg>
        </>

    );
};

const Aileron = ({
    leftorright, x, aileronDeflection, hydArray,
}) => {
    const textPositionX = leftorright === 'left' ? x - 40 : Number(x) + 40;
    const textLetter = leftorright === 'left' ? 'L' : 'R';
    const hydPositionX1 = leftorright === 'left' ? Number(x) + 22 : x - 62;
    const hydPositionX2 = leftorright === 'left' ? Number(x) + 44 : x - 40;

    const aileronDeflectPctNormalized = aileronDeflection * 54;
    const cursorPath = `M${leftorright === 'left' ? Number(x) + 1 : Number(x) - 1},${leftorright === 'left' ? 204 + aileronDeflectPctNormalized : 204 - aileronDeflectPctNormalized} l${leftorright === 'right' ? '-' : ''}15,-7 l0,14Z`;

    return (
        <>
            <text id={`${leftorright}AileronText1`} className="Note" x={textPositionX} y="153" textAnchor="middle" alignmentBaseline="central">{textLetter}</text>
            <text id={`${leftorright}AileronText2`} className="Note" x={textPositionX} y="175" textAnchor="middle" alignmentBaseline="central">AIL</text>

            <g id={`${leftorright}AileronPointer`}>
                <path id={`${leftorright}AileronCursor`} className="GreenShape" d={cursorPath} />
            </g>

            <AileronAxis leftorright={leftorright} x={x} />

            <g id="leftAileronHyd">
                <HydraulicIndicator id={`${leftorright}AileronHyd1`} x={hydPositionX1} y="246" letter={hydArray[0]} />
                <HydraulicIndicator id={`${leftorright}AileronHyd2`} x={hydPositionX2} y="246" letter={hydArray[1]} />
            </g>
        </>
    );
};

const HydraulicIndicator = ({
    id, x, y, letter,
}) => {
    const textPositionX = Number(x) + 9;
    const textPositionY = Number(y) + 13;
    return (
        <>
            <rect className="HydBgShape" x={x} y={y} width="18" height="24" rx="2" />
            <text id={id} className="Value" x={textPositionX} y={textPositionY} textAnchor="middle" alignmentBaseline="central">{letter}</text>
        </>
    );
};

const ElacSecShape = ({
    id, x, y, number, on = true, fail = false,
}) => {
    const textPositionX = Number(x) + 61;
    const textPositionY = Number(y) - 12;
    console.log(`This on status is ${on} and fail status is ${fail}`);
    return (
        <>
            <path className={on && !fail ? 'MainShape' : 'MainShapeWarning'} d={`M${x},${y} l72,0 l0,-26 l-8,0`} />
            <text id={id} className={on && !fail ? 'Value' : 'ValueWarning'} x={textPositionX} y={textPositionY} textAnchor="middle" alignmentBaseline="central">{number}</text>
        </>
    );
};

const AileronAxis = ({ leftorright, x }) => {
    const d1 = `M${x},164 l${leftorright === 'left' ? '-' : ''}8,0 l0,-20 l${leftorright === 'right' ? '-' : ''}8,0 l0,120 l${leftorright === 'left' ? '-' : ''}8,0 l0,-10 l${leftorright === 'right' ? '-' : ''}8,0`;
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

const Elevator = ({
    leftorright, x, elevatorDeflection, hydArray,
}) => {
    console.log(`Inside aileron and LR is ${leftorright}`);

    const textPositionX = leftorright === 'left' ? x - 42 : Number(x) + 42;
    const textLetter = leftorright === 'left' ? 'L' : 'R';
    const hydPositionX1 = leftorright === 'left' ? Number(x) - 60 : Number(x) + 40;
    const hydPositionX2 = leftorright === 'left' ? Number(x) - 38 : Number(x) + 18;

    const elevatorDeflectPctNormalized = elevatorDeflection * (elevatorDeflection > 0 ? 70 : 52);
    const cursorPath = `M${leftorright === 'left' ? Number(x) + 1 : Number(x) - 1},${398 - elevatorDeflectPctNormalized} l${leftorright === 'right' ? '-' : ''}15,-7 l0,14Z`;
    console.log(cursorPath);
    console.log(elevatorDeflection);

    return (
        <>
            <text id={`${leftorright}AileronText1`} className="Note" x={textPositionX} y="328" textAnchor="middle" alignmentBaseline="central">{textLetter}</text>
            <text id={`${leftorright}AileronText2`} className="Note" x={textPositionX} y="350" textAnchor="middle" alignmentBaseline="central">ELEV</text>

            <g id={`${leftorright}ElevatorPointer`}>
                <path id={`${leftorright}ElevatorCursor`} className="GreenShape" d={cursorPath} />
            </g>

            <ElevatorAxis leftorright={leftorright} x={x} />

            <g id="leftElevatorHyd">
                <HydraulicIndicator id={`${leftorright}ElevatorHyd1`} x={hydPositionX1} y="407" letter={hydArray[0]} />
                <HydraulicIndicator id={`${leftorright}ElevatorHyd2`} x={hydPositionX2} y="407" letter={hydArray[1]} />
            </g>
        </>
    );
};

const ElevatorAxis = ({ leftorright, x }) => {
    const d1 = `M${x},333 l${leftorright === 'left' ? '-' : ''}8,0 l0,-10 l${leftorright === 'right' ? '-' : ''}8,0 l0,116 l${leftorright === 'left' ? '-' : ''}8,0 l0,-10 l${leftorright === 'right' ? '-' : ''}8,0`;
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
