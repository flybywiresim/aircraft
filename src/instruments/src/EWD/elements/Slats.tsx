import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type SlatsProps = {
    x: number,
    y: number,
};

const Slats: React.FC<SlatsProps> = ({ x, y }) => {
    const [slatsAngle] = useSimVar('L:A32NX_LEFT_SLATS_ANGLE', 'degrees', 500);
    const [targetSlatsAngle] = useSimVar('L:A32NX_LEFT_SLATS_TARGET_ANGLE', 'degrees', 500);
    const [flapsAngle] = useSimVar('L:A32NX_LEFT_FLAPS_ANGLE', 'degrees', 500);
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

    return (
        <>
            <path d={`M ${x},${y} l -16,0 l -3,12 l 26,0 Z`} className="DarkGreyBox" />
            <text className="Large Center Green" x={x + 0} y={y + 60}>{flapText[handleIndex]}</text>
            <text className="Large Center Green" x={x} y={y + 60}>{flapsMoving ? 'MOVING' : ''}</text>
            <text className="Medium Center" x={x - 100} y={y + 15}>S</text>
            <text className="Medium Center" x={x + 110} y={y + 15}>F</text>
            <g id="Slats">
                <SlatsIndicator x={x - 16} y={y} css="Slats" />
                <SlatsIndicator x={x + 152} y={y + 87} css="SlatsSmallWhite" />
                <SlatsIndicator x={x + 130} y={y + 75} css="SlatsSmallWhite" />
                <SlatsIndicator x={x - 55} y={y + 125} css="SlatsSmallWhite" />
                <SlatsIndicator x={x - 110} y={y + 135} css="SlatsSmallWhite" />

            </g>
            <g id="Flaps">
                {/* <FlapsIndicator x={x + 20} y={y} css="GreenLine" /> */}
            </g>
        </>
    );
};

export default Slats;

type IndicatorProps = {
    x: number,
    y: number,
    css: string,
    visible?: boolean
};

const SlatsIndicator: React.FC<IndicatorProps> = ({ x, y, css, visible = true }) => {
    const d = `M ${x},${y} l -19,6 l -4,12 l 19,-6 Z`;

    return (
        <path className={visible ? css : 'Hide'} d={d} />
    );
};

const FlapsIndicator: React.FC<IndicatorProps> = ({ x, y, css }) => {
    const d = `M${x - 4},${y} l25,5 l0,12, l-17,-3 l-8,-15`;

    return (
        <path className={css} d={d} />
    );
};

const SlatsPosition: React.FC<IndicatorProps> = ({ x, y, css, visible = true }) => {
    const d = `M${x},${y} l0,5 l-5,5, l0,-5 l+5,-5`;

    return (
        <path className={visible ? css : 'Hide'} d={d} />
    );
};

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
