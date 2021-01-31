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
import { useEffect } from 'react';
// import { getSimVar, useUpdate } from '../../../util.mjs';
import { StatefulSimVar } from '../../../StatefulSimVar.mjs';

export const FctlPage = () => {
    console.log('FCTL');

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

    const pitchTrimStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'ELEVATOR TRIM INDICATOR',
        simVarUnit: 'Position 16k',
        refreshRate: 50,
    });

    let rawPitchTrim = pitchTrimStatefulSimVar.value / 1213.6296;
    console.log(rawPitchTrim);
    // Cap pitch trim at 13.5 up, 4 down
    if (rawPitchTrim > 16384.0) {
        rawPitchTrim = 16384.0;
    } else if (rawPitchTrim < -4854) {
        rawPitchTrim = -4854;
    }

    const pitchValueArray = Math.abs(rawPitchTrim).toFixed(1).toString().split('.');
    const pitchTrimSign = Math.sign(rawPitchTrim);

    const rudderDeflectionStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'RUDDER DEFLECTION PCT',
        simVarUnit: 'percent over 100',
        refreshRate: 50,
    });

    const rudderAngle = -rudderDeflectionStatefulSimVar.value * 25;

    // Update rudder limits
    const indicatedAirspeednStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'AIRSPEED INDICATED',
        simVarUnit: 'knots',
        refreshRate: 500,
    });

    let MaxAngleNorm = 1;
    if (indicatedAirspeednStatefulSimVar.value > 380) {
        MaxAngleNorm = 3.4 / 25;
    } else if (indicatedAirspeednStatefulSimVar.value > 160) {
        MaxAngleNorm = (69.2667 - 0.351818 * indicatedAirspeednStatefulSimVar.value
            + 0.00047 * indicatedAirspeednStatefulSimVar.value ** 2) / 25;
    }

    // Check Hydraulics state
    // Will probably need changing once hydraulics fully implemented.

    const engine1StatefulSimVar = new StatefulSimVar({
        simVarGetter: 'ENG COMBUSTION:1',
        simVarUnit: 'bool',
        refreshRate: 1000,
    });

    const engine2StatefulSimVar = new StatefulSimVar({
        simVarGetter: 'ENG COMBUSTION:2',
        simVarUnit: 'bool',
        refreshRate: 1000,
    });

    const hydraulicGAvailable = engine1StatefulSimVar.value && engine2StatefulSimVar.value;
    const hydraulicYAvailable = hydraulicGAvailable;
    const hydraulicBAvailable = hydraulicGAvailable;

    const leftSpoilerStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'SPOILERS LEFT POSITION',
        simVarUnit: 'percent over 100',
        refreshRate: 50,
    });

    const rightSpoilerStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'SPOILERS RIGHT POSITION',
        simVarUnit: 'percent over 100',
        refreshRate: 50,
    });

    const groundSpeedStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'SURFACE RELATIVE GROUND SPEED',
        simVarUnit: 'feet_per_second',
        refreshRate: 50,
    });

    const spoilersArmedStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'SPOILERS ARMED',
        simVarUnit: 'boolean',
        refreshRate: 500,
    });

    const onGroundStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'SIM ON GROUND',
        simVarUnit: 'boolean',
        refreshRate: 500,
    });

    const engine1ModeStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'GENERAL ENG THROTTLE MANAGED MODE:1',
        simVarUnit: 'number',
        refreshRate: 1000,
    });

    const engine2ModeStatefulSimVar = new StatefulSimVar({
        simVarGetter: 'GENERAL ENG THROTTLE MANAGED MODE:2',
        simVarUnit: 'number',
        refreshRate: 1000,
    });

    const spoilersArmed = !!(spoilersArmedStatefulSimVar.value
        && onGroundStatefulSimVar.value
        && groundSpeedStatefulSimVar.value > 45
        && engine1ModeStatefulSimVar.value <= 2
        && engine2ModeStatefulSimVar.value <= 2);

    const speedBrakeY = 104;
    const leftSpeedBrakeX = 103;
    const rightSpeedBrakeX = 497;
    const speedBrakeXChange = 38;
    const spoilers = [];
    for (let i = 0; i < 5; i += 1) {
        const YCoord = speedBrakeY - (i * 5);
        const YCoordW = YCoord - 9;
        const leftX = leftSpeedBrakeX + (i * speedBrakeXChange);
        const rightX = rightSpeedBrakeX - (i * speedBrakeXChange);
        const index = 5 - i;
        spoilers.push(<Spoiler leftorright="left" index={index} x={leftX} y={YCoord} yw={YCoordW} hydAvail={hydraulicGAvailable || hydraulicBAvailable || hydraulicYAvailable} spoilerpos={leftSpoilerStatefulSimVar.value} ailpos={aileronLeftDeflectionStatefulSimVar.value} spoilersArmed={spoilersArmed} />);
        spoilers.push(<Spoiler leftorright="right" index={index} x={rightX} y={YCoord} yw={YCoordW} hydAvail={hydraulicGAvailable || hydraulicBAvailable || hydraulicYAvailable} spoilerpos={rightSpoilerStatefulSimVar.value} ailpos={aileronRightDeflectionStatefulSimVar} spoilersArmed={spoilersArmed} />);
    }

    return (
        <>
            <svg id="ecam-fctl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                <text id="pageTitle" className="PageTitle" x="45" y="18" textAnchor="middle" alignmentBaseline="central">F/CTL</text>

                {/* Speedbrakes */}
                <text id="speedBrakeText" className="Note" x="300" y="107" textAnchor="middle" alignmentBaseline="central">SPD BRK</text>

                <g id="speedbrakeHyd">
                    <HydraulicIndicator id="pitchTrimHyd1" x="269" y="14" letter="G" hydAvail={hydraulicGAvailable} />
                    <HydraulicIndicator id="pitchTrimHyd1" x="291" y="14" letter="B" hydAvail={hydraulicBAvailable} />
                    <HydraulicIndicator id="pitchTrimHyd1" x="313" y="14" letter="Y" hydAvail={hydraulicYAvailable} />
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

                <Aileron leftorright="left" x="72" aileronDeflection={aileronLeftDeflectionStatefulSimVar.value} hydArray={['B', 'G']} hydAvail={[hydraulicBAvailable, hydraulicGAvailable]} />

                {/* Right ailerons */}

                <Aileron leftorright="right" x="528" aileronDeflection={aileronRightDeflectionStatefulSimVar.value} hydArray={['G', 'B']} hydAvail={[hydraulicGAvailable, hydraulicBAvailable]} />

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

                <Elevator leftorright="left" x="168" elevatorDeflection={elevatorDeflectionStatefulSimVar.value} hydArray={['B', 'G']} hydAvail={[hydraulicBAvailable, hydraulicGAvailable]} />

                {/* Right elevator */}

                <Elevator leftorright="right" x="432" elevatorDeflection={elevatorDeflectionStatefulSimVar.value} hydArray={['B', 'Y']} hydAvail={[hydraulicBAvailable, hydraulicYAvailable]} />

                {/* Pitch trim */}

                <g id="pitchTrim">
                    <text id="pitchTrimText" className="Note" x="280" y="296" textAnchor="middle" alignmentBaseline="central">PITCH TRIM</text>

                    <text id="pitchTrimLeadingDecimal" className={hydraulicGAvailable || hydraulicYAvailable ? 'Value' : 'Warning'} x="269" y="318" textAnchor="middle" alignmentBaseline="central">{pitchValueArray[0]}</text>
                    <text id="pitchTrimDecimalPoint" className={hydraulicGAvailable || hydraulicYAvailable ? 'Value' : 'Warning'} x="281" y="318" textAnchor="middle" alignmentBaseline="central">.</text>
                    <text id="pitchTrimTrailingDecimal" className={hydraulicGAvailable || hydraulicYAvailable ? 'Value' : 'Warning'} x="292" y="318" textAnchor="middle" alignmentBaseline="central">{pitchValueArray[1]}</text>

                    <circle id="pitchTrimDegreePoint" className="MainShape" cx="310" cy="313" r="3" textAnchor="middle" alignmentBaseline="central">°</circle>
                    <text id="pitchTrimDirection" className={hydraulicGAvailable || hydraulicYAvailable ? 'Value' : 'Warning'} x="335" y="318" textAnchor="middle" alignmentBaseline="central">{pitchTrimSign === -1 ? 'DN' : 'UP'}</text>

                    <HydraulicIndicator id="pitchTrimHyd1" x="360" y="283" letter="G" hydAvail={hydraulicGAvailable} />
                    <HydraulicIndicator id="pitchTrimHyd2" x="382" y="283" letter="Y" hydAvail={hydraulicYAvailable} />
                </g>

                {/* Stabilizer */}

                <g id="stabilizer">
                    <path id="stabLeft" className="MainShape" d="M268,357 l-55,4 l0,-18 l30,-15" />
                    <path id="stabRight" className="MainShape" d="M332,357 l55,4 l0,-18 l-30,-15" />
                    <HydraulicIndicator id="stabHyd1" x="269" y="373" letter="G" hydAvail={hydraulicGAvailable} />
                    <HydraulicIndicator id="stabHyd1" x="291" y="373" letter="B" hydAvail={hydraulicBAvailable} />
                    <HydraulicIndicator id="stabHyd1" x="313" y="373" letter="Y" hydAvail={hydraulicYAvailable} />
                </g>

                {/* Rudder */}

                <g id="rudderAxis">
                    <text id="pitchTrimText" className="Note" x="300" y="356" textAnchor="middle" alignmentBaseline="central">RUD</text>
                    <path id="rudderPath" className="MainShape" d="M 350 469 A 100 100 0 0 1 250 469" />
                    <path id="rudderCenter" className="MainShape" d="m302 482-6e-3 6-4 0.01 0.05-6" />
                    <path id="rudderRightBorder" className="MainShape" d="m343 472 2 5-7 3-2-5" />
                    <path id="rudderLeftBorder" className="MainShape" d="m257 472-2 5 7 3 2-5" />
                </g>

                <g id="rudderLeftMaxAngle" transform={`rotate(${-26.4 * (1 - MaxAngleNorm)} 300 385)`}>
                    <path id="rudderLeftLimitGreen" className="GreenShape" d="m250 484 6 3" />
                    <path id="rudderLeftLimitWhite" className="GreenShape" d="m257 472-7 13" />
                </g>

                <g id="rudderRightMaxAngle" transform={`rotate(${26.4 * (1 - MaxAngleNorm)} 300 385)`}>
                    <path id="rudderRightLimitGreen" className="GreenShape" d="m350 484-6 3" />
                    <path id="rudderRightLimitWhite" className="GreenShape" d="m343 472 7 13" />
                </g>

                <g id="rudderCursor" transform={`rotate(${rudderAngle} 300 380)`}>
                    <path id="rudderCircle" className={hydraulicGAvailable || hydraulicBAvailable || hydraulicYAvailable ? 'GreenShape' : 'WarningShape'} d="M 292 434 A 8 8 0 0 1 308 434" />
                    <path id="rudderTail" className={hydraulicGAvailable || hydraulicBAvailable || hydraulicYAvailable ? 'GreenShape' : 'WarningShape'} d="M292,434 l8,48 l8,-48" />
                </g>
            </svg>
        </>

    );
};

const Aileron = ({
    leftorright, x, aileronDeflection, hydArray, hydAvail,
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
                <path id={`${leftorright}AileronCursor`} className={hydAvail[0] || hydAvail[1] ? 'GreenShape' : 'WarningShape'} d={cursorPath} />
            </g>

            <AileronAxis leftorright={leftorright} x={x} />

            <g id="leftAileronHyd">
                <HydraulicIndicator id={`${leftorright}AileronHyd1`} x={hydPositionX1} y="246" letter={hydArray[0]} hydAvail={hydAvail[0]} />
                <HydraulicIndicator id={`${leftorright}AileronHyd2`} x={hydPositionX2} y="246" letter={hydArray[1]} hydAvail={hydAvail[1]} />
            </g>
        </>
    );
};

const HydraulicIndicator = ({
    id, x, y, letter, hydAvail,
}) => {
    const textPositionX = Number(x) + 9;
    const textPositionY = Number(y) + 13;
    return (
        <>
            <rect className="HydBgShape" x={x} y={y} width="18" height="24" rx="2" />
            <text id={id} className={hydAvail ? 'Value' : 'Warning'} x={textPositionX} y={textPositionY} textAnchor="middle" alignmentBaseline="central">{letter}</text>
        </>
    );
};

const ElacSecShape = ({
    id, x, y, number, on = true, fail = false,
}) => {
    const textPositionX = Number(x) + 61;
    const textPositionY = Number(y) - 12;
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
    leftorright, x, elevatorDeflection, hydArray, hydAvail,
}) => {
    const textPositionX = leftorright === 'left' ? x - 42 : Number(x) + 42;
    const textLetter = leftorright === 'left' ? 'L' : 'R';
    const hydPositionX1 = leftorright === 'left' ? Number(x) - 60 : Number(x) + 40;
    const hydPositionX2 = leftorright === 'left' ? Number(x) - 38 : Number(x) + 18;

    const elevatorDeflectPctNormalized = elevatorDeflection * (elevatorDeflection > 0 ? 70 : 52);
    const cursorPath = `M${leftorright === 'left' ? Number(x) + 1 : Number(x) - 1},${398 - elevatorDeflectPctNormalized} l${leftorright === 'right' ? '-' : ''}15,-7 l0,14Z`;

    return (
        <>
            <text id={`${leftorright}AileronText1`} className="Note" x={textPositionX} y="328" textAnchor="middle" alignmentBaseline="central">{textLetter}</text>
            <text id={`${leftorright}AileronText2`} className="Note" x={textPositionX} y="350" textAnchor="middle" alignmentBaseline="central">ELEV</text>

            <g id={`${leftorright}ElevatorPointer`}>
                <path id={`${leftorright}ElevatorCursor`} className={hydAvail[0] || hydAvail[1] ? 'GreenShape' : 'WarningShape'} d={cursorPath} />
            </g>

            <ElevatorAxis leftorright={leftorright} x={x} />

            <g id="leftElevatorHyd">
                <HydraulicIndicator id={`${leftorright}ElevatorHyd1`} x={hydPositionX1} y="407" letter={hydArray[0]} hydAvail={hydAvail[0]} />
                <HydraulicIndicator id={`${leftorright}ElevatorHyd2`} x={hydPositionX2} y="407" letter={hydArray[1]} hydAvail={hydAvail[1]} />
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

const Spoiler = ({
    index, leftorright, x, y, yw, hydAvail, spoilerpos, ailpos, spoilersArmed,
}) => {
    let showspoiler = false;
    if (spoilerpos > 0.07 && index > 1) {
        showspoiler = true;
        if (index === 5) {
            if ((leftorright === 'left' && ailpos < -0.05) || (leftorright === 'right' && ailpos > 0.05)) {
                showspoiler = true;
            } else {
                showspoiler = false;
            }
        }
    }

    if (spoilersArmed && ailpos > 0.0625 && (index === 1 || index === 5)) {
        showspoiler = true;
    }

    return (
        <>
            <path className={hydAvail === 1 ? 'GreenShapeThick' : 'WarningShapeThick'} d={`M ${x} ${y} l ${leftorright === 'right' ? '-' : ''}15 0`} />
            <path id={`arrow${index}_${leftorright}`} visibility={showspoiler && hydAvail === 1 ? 'visible' : 'hidden'} className="GreenShape" d={`M ${leftorright === 'left' ? Number(x) + 8 : Number(x) - 8} ${y} l 0 -22 l -6 0 l 6 -12 l 6 12 l -6 0`} />
            <text id={`num${index}_${leftorright}`} visibility={hydAvail === 0 ? 'visible' : 'hidden'} className="Warning" x={`${leftorright === 'left' ? Number(x) + 8 : Number(x) - 8}`} y={`${yw}`} textAnchor="middle" alignmentBaseline="central">{index}</text>
        </>
    );
};
