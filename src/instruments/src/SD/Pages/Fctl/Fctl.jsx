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
        console.log(YCoordW);
        speedbrakeText.push(<text id={`num${index}_left`} className="Warning" x={`${leftX + speedBrakeXArrowChange}`} y={`${YCoordW}`} textAnchor="middle" alignmentBaseline="central">{index}</text>);
        speedbrakeText.push(<text id={`num${index}_right`} className="Warning" x={`${rightX - speedBrakeXArrowChange}`} y={`${YCoordW}`} textAnchor="middle" alignmentBaseline="central">{index}</text>);
    }

    return (
        <>
            <text x={5} y={27} fill="white" fontSize={24}>F/CTL</text>
            <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">

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

                <g id="leftAileronPointer">
                    <path id="leftAileronCursor" className="GreenShape" d="M73,204 l15,-7 l0,14Z" />
                </g>

                <g id="leftAileronAxis">
                    <path className="MainShape" d="M72,164 l-8,0 l0,-20 l8,0 l0,120 l-8,0 l0,-10 l8,0" />
                    <path className="MainShape" d="M72,200 l-7,0" />
                    <path className="MainShape" d="M72,205 l-7,0" />
                    <path className="MainShape" d="M72,210 l-8,0 l0,6 l8,0" />
                </g>

                <g id="leftAileronHyd">
                    <rect className="HydBgShape" x="94" y="233" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="116" y="233" width="18" height="24" rx="2" />
                    <text id="leftAileronHyd1" className="Value" x="103" y="246" textAnchor="middle" alignmentBaseline="central">B</text>
                    <text id="leftAileronHyd2" className="Value" x="125" y="246" textAnchor="middle" alignmentBaseline="central">G</text>
                </g>

                {/* Right ailerons */}

                <g id="rightAileronPointer">
                    <path id="rightAileronCursor" className="GreenShape" d="M527,204 l-15,-7 l0,14Z" />
                </g>

                <g id="rightAileronAxis">
                    <path className="MainShape" d="M528,164 l8,0 l0,-20 l-8,0 l0,120 l8,0 l0,-10 l-8,0" />
                    <path className="MainShape" d="M528,200 l7,0" />
                    <path className="MainShape" d="M528,205 l7,0" />
                    <path className="MainShape" d="M528,210 l8,0 l0,6 l-8,0" />
                </g>

                <g id="rightAileronHyd">
                    <rect className="HydBgShape" x="466" y="233" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="488" y="233" width="18" height="24" rx="2" />
                    <text id="rightAileronHyd1" className="Value" x="475" y="246" textAnchor="middle" alignmentBaseline="central">G</text>
                    <text id="rightAileronHyd2" className="Value" x="497" y="246" textAnchor="middle" alignmentBaseline="central">B</text>
                </g>

                <g id="elac">
                    <path id="elac1" className="MainShape" d="M170,190 l72,0 l0,-26 l-8,0" />
                    <path id="elac2" className="MainShape" d="M194,206 l72,0 l0,-26 l-8,0" />
                    <text id="elacText" className="Note" x="195" y="178" textAnchor="middle" alignmentBaseline="central">ELAC</text>
                    <text id="elacText_1" className="Value" x="232" y="178" textAnchor="middle" alignmentBaseline="central">1</text>
                    <text id="elacText_2" className="Value" x="256" y="194" textAnchor="middle" alignmentBaseline="central">2</text>
                </g>

                <g id="sec">
                    <path id="sec1" className="MainShape" d="M324,190 l72,0 l0,-26 l-8,0" />
                    <path id="sec2" className="MainShape" d="M348,206 l72,0 l0,-26 l-8,0" />
                    <path id="sec3" className="MainShape" d="M372,222 l72,0 l0,-26 l-8,0" />
                    <text id="secText" className="Note" x="350" y="178" textAnchor="middle" alignmentBaseline="central">SEC</text>
                    <text id="secText_1" className="Value" x="385" y="178" textAnchor="middle" alignmentBaseline="central">1</text>
                    <text id="secText_2" className="Value" x="409" y="194" textAnchor="middle" alignmentBaseline="central">2</text>
                    <text id="secText_3" className="Value" x="433" y="210" textAnchor="middle" alignmentBaseline="central">3</text>
                </g>

                {/* Left elevator */}

                <g id="leftElevatorPointer">
                    <path id="leftElevatorCursor" className="GreenShape" d="M169,398 l15,-7 l0,14Z" />
                </g>

                <g id="leftElevatorAxis">
                    <path className="MainShape" d="M168,333 l-8,0 l0,-10 l8,0 l0,116 l-8,0 l0,-10 l8,0" />
                    <path className="MainShape" d="M168,395 l-7,0 l0,5 l7,0" />
                </g>

                <g id="leftElevatorHyd">
                    <rect className="HydBgShape" x="108" y="407" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="130" y="407" width="18" height="24" rx="2" />
                    <text id="leftElevatorHyd1" className="Value" x="117" y="420" textAnchor="middle" alignmentBaseline="central">B</text>
                    <text id="leftElevatorHyd2" className="Value" x="139" y="420" textAnchor="middle" alignmentBaseline="central">G</text>
                </g>

                {/* Right elevator */}

                <g id="rightElevatorPointer">
                    <path id="rightElevatorCursor" className="GreenShape" d="M431,398 l-15,-7 l0,14Z" />
                </g>

                <g id="rightElevatorAxis">
                    <path className="MainShape" d="M432,333 l8,0 l0,-10 l-8,0 l0,116 l8,0 l0,-10 l-8,0" />
                    <path className="MainShape" d="M432,395 l7,0 l0,5 l-7,0" />
                </g>

                <g id="rightElevatorHyd">
                    <rect className="HydBgShape" x="452" y="407" width="18" height="24" rx="2" />
                    <rect className="HydBgShape" x="474" y="407" width="18" height="24" rx="2" />
                    <text id="rightElevatorHyd1" className="Value" x="461" y="420" textAnchor="middle" alignmentBaseline="central">Y</text>
                    <text id="rightElevatorHyd2" className="Value" x="483" y="420" textAnchor="middle" alignmentBaseline="central">B</text>
                </g>

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
                    <text id="pageTitle" className="Title Large" x="45" y="18" textAnchor="middle" alignmentBaseline="central" textDecoration="underline">F/CTL</text>
                    <text id="speedBrakeText" className="Note" x="300" y="107" textAnchor="middle" alignmentBaseline="central">SPD BRK</text>
                    <text id="leftAileronText1" className="Note" x="32" y="153" textAnchor="middle" alignmentBaseline="central">L</text>
                    <text id="leftAileronText2" className="Note" x="32" y="175" textAnchor="middle" alignmentBaseline="central">AIL</text>
                    <text id="rightAileronText1" className="Note" x="568" y="153" textAnchor="middle" alignmentBaseline="central">R</text>
                    <text id="rightAileronText2" className="Note" x="568" y="175" textAnchor="middle" alignmentBaseline="central">AIL</text>

                    <text id="leftElevatorText1" className="Note" x="122" y="328" textAnchor="middle" alignmentBaseline="central">L</text>
                    <text id="leftElevatorText2" className="Note" x="122" y="350" textAnchor="middle" alignmentBaseline="central">ELEV</text>
                    <text id="rightElevatorText1" className="Note" x="478" y="328" textAnchor="middle" alignmentBaseline="central">R</text>
                    <text id="rightElevatorText2" className="Note" x="478" y="350" textAnchor="middle" alignmentBaseline="central">ELEV</text>
                </g>
            </svg>
        </>

    );
};
