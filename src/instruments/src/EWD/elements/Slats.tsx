import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, useState } from 'react';

type SlatsProps = {
    x: number,
    y: number,
};

const Slats: React.FC<SlatsProps> = ({ x, y }) => {
    const [slatsAngle] = useSimVar('L:A32NX_LEFT_SLATS_ANGLE', 'degrees', 100);
    const [targetSlatsAngle] = useSimVar('L:A32NX_LEFT_SLATS_TARGET_ANGLE', 'degrees', 500);
    const [flapsAngle] = useSimVar('L:A32NX_LEFT_FLAPS_ANGLE', 'degrees', 100);
    const [targetFlapsAngle] = useSimVar('L:A32NX_LEFT_FLAPS_TARGET_ANGLE', 'degrees', 500);
    const [handleIndex] = useSimVar('L:A32NX_FLAPS_CONF_INDEX', 'number', 1000);
    const [greenPress] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE', 'number', 1000);
    const [yellowPress] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE', 'number', 1000);
    const [bluePress] = useSimVar('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE', 'number', 1000);

    const flapsPowered = greenPress > 1450 || yellowPress > 1450;
    const slatsPowered = greenPress > 1450 || bluePress > 1450;
    const flapsMoving = flapsAngle !== targetFlapsAngle && flapsPowered;
    const slatsMoving = slatsAngle !== targetSlatsAngle && slatsPowered;

    const flapText = ['0', '1', '1+F', '2', '3', 'FULL'];

    const [slatPos, setSlatPos] = useState([x - 16, y]);
    const [deltaSlatsAngle, setDeltaSlatsAngle] = useState(slatsAngle);

    const [flapsPos, setFlapsPos] = useState([x, y]);
    const [deltaFlapsAngle, setDeltaFlapsAngle] = useState(flapsAngle);

    useEffect(() => {
        const xVal = 34;
        const yVal = 12;

        const currX = slatPos[0];
        const currY = slatPos[1];
        console.log(`SlatsAngle is ${slatsAngle}`);

        switch (true) {
        case (slatsAngle > 22):
            console.log('Inside 22');
            setSlatPos(
                [
                    currX - ((xVal / 5) * (slatsAngle - deltaSlatsAngle)),
                    currY + ((yVal / 5) * (slatsAngle - deltaSlatsAngle)),
                ],
            );
            break;
        case (slatsAngle > 18):
            console.log('Inside 18');
            setSlatPos(
                [
                    currX - ((xVal / 4) * (slatsAngle - deltaSlatsAngle)),
                    currY + ((yVal / 4) * (slatsAngle - deltaSlatsAngle)),
                ],
            );
            break;
        default:
            console.log('Less than 18');
            setSlatPos(
                [
                    currX - ((xVal / 18) * (slatsAngle - deltaSlatsAngle)),
                    currY + ((yVal / 18) * (slatsAngle - deltaSlatsAngle)),
                ],
            );
        }
        setDeltaSlatsAngle(slatsAngle);
    }, [slatsAngle]);

    useEffect(() => {
        const xVal = 43;
        const yVal = 9;

        const currX = flapsPos[0];
        const currY = flapsPos[1];
        console.log(`flapsAngle is ${flapsAngle}`);

        switch (true) {
        case (flapsAngle > 20):
            console.log('Inside 20');
            setFlapsPos(
                [
                    currX + ((xVal / 20) * (flapsAngle - deltaFlapsAngle)),
                    currY + ((yVal / 20) * (flapsAngle - deltaFlapsAngle)),
                ],
            );
            break;
        case (flapsAngle > 10):
            console.log('Inside 10');
            setFlapsPos(
                [
                    currX + ((xVal / 5) * (flapsAngle - deltaFlapsAngle)),
                    currY + ((yVal / 5) * (flapsAngle - deltaFlapsAngle)),
                ],
            );
            break;
        default:
            console.log('Less than 10');
            setFlapsPos(
                [
                    currX + ((xVal / 10) * (flapsAngle - deltaFlapsAngle)),
                    currY + ((yVal / 10) * (flapsAngle - deltaFlapsAngle)),
                ],
            );
        }
        setDeltaFlapsAngle(flapsAngle);
    }, [flapsAngle]);

    useEffect(() => {
        console.log(`SlatPos is ${slatPos[0]} ${slatPos[1]}`);
        console.log(`FlapsPos is ${flapsPos[0]} ${flapsPos[1]}`);
    }, [slatPos, flapsPos]);

    return (
        <>
            <path d={`M ${x},${y} l -16,0 l -4,13 l 26,0 Z`} className="DarkGreyBox" />
            <text
                className={`Large Center
                ${flapsMoving || slatsMoving ? 'Cyan' : 'Green'}
                ${flapsPowered && !flapsMoving && !slatsMoving && handleIndex === 0 ? 'Hide' : 'Show'}`}
                x={x - 5}
                y={y + 60}
            >
                {flapText[handleIndex]}

            </text>
            <text className="Medium Center" x={x - 100} y={y + 15}>S</text>
            <text className="Medium Center" x={x + 110} y={y + 15}>F</text>
            <path className="Slats" d={`M ${slatPos[0]},${slatPos[1]} l -19,7 l -4,13 l 19,-7 Z`} />
            <line className="GreenLine" x1={x - 16} y1={y} x2={slatPos[0]} y2={slatPos[1]} />
            <g id="SlatsPositionIndicators" className={`${slatsPowered && handleIndex > 0 ? 'Show' : 'Hide'}`}>
                <path d={`M ${x - 59},${y + 19} l -7,2 l -1,4 l 7,-2 Z`} className="SlatsSmallWhite" />
                <path d={`M ${x - 92},${y + 31} l -7,2 l -1,4 l 7,-2 Z`} className="SlatsSmallWhite" />
                <path d={`M ${x - 127},${y + 43} l -7,2 l -1,4 l 7,-2 Z`} className="SlatsSmallWhite" />
            </g>
            <path d={`M${flapsPos[0]},${flapsPos[1]} l25,5 l0,12, l-17,-3 l-8,-15`} className="Flaps" />
            <line className="GreenLine" x1={x} y1={y} x2={flapsPos[0]} y2={flapsPos[1]} />
            <g id="Flaps" className={`${flapsPowered && handleIndex > 0 ? 'Show' : 'Hide'}`} />
        </>
    );
};

export default Slats;

/*

  .cls-2 {
    stroke: red;
  }

  .cls-3 {
    stroke: #f05a24; orange
  }

  .cls-4 {
    stroke: #009145; green
  }
</style>
</defs>
<polygon class="cls-2" points="197 1 171 1 165 19 206 20 197 1"/>   / Main body thing
<polygon class="cls-3" points="129 33 136 13 105 23 98 43 129 33"/>   Slats
<polygon class="cls-4" points="197 1 209 24 235 28 235 8 197 1"/>
<polygon class="cls-3" points="12 65 15 58 3 62 1 69 12 65"/>
<polygon class="cls-3" points="60 49 62 42 51 46 48 53 60 49"/>
<polygon class="cls-3" points="106 33 109 26 97 30 95 37 106 33"/>
<polygon class="cls-4" points="283 22 287 30 295 31 295 25 283 22"/>  Flaps
<polygon class="cls-4" points="341 35 344 42 353 44 353 37 341 35"/>
<polygon class="cls-4" points="399 47 402 54 411 56 411 49 399 47"/>
<polygon class="cls-4" points="458 59 462 66 470 68 470 61 458 59"/>
*/
