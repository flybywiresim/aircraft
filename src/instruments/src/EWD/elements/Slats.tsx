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
            <g id="Slats">
                <path d={`M${x},${y} l+16,0 l+8,14 l-29,0 l+5,-14`} className="DarkGreyBox" />
                <text className="Large Center Green" x={x + 10} y={y + 60}>{flapText[handleIndex]}</text>
                <text className="Large Center Green" x={x} y={y + 60}>{flapsMoving ? 'MOVING' : ''}</text>
                <text className="Medium Center" x={x - 100} y={y + 10}>S</text>
                <text className="Medium Center" x={x + 100} y={y + 10}>F</text>
                <SlatsIndicator x={x} y={y} css="GreenLine" />
                <FlapsIndicator x={x + 20} y={y} css="GreenLine" />
            </g>
        </>
    );
};

export default Slats;

type IndicatorProps = {
    x: number,
    y: number,
    css: string,
};

const SlatsIndicator: React.FC<IndicatorProps> = ({ x, y, css }) => {
    const d = `M${x},${y} l-22,6 l-5,14 l22,-7 l5,-14`;

    return (
        <path className={css} d={d} />
    );
};

const FlapsIndicator: React.FC<IndicatorProps> = ({ x, y, css }) => {
    const d = `M${x - 4},${y} l25,5 l0,12, l-17,-3 l-8,-15`;

    return (
        <path className={css} d={d} />
    );
};

// this.slatArrowPathD = "m20,-12 l-27,8 l-6,18 l27,-8 l6,-18";
// this.slatDotPositions = [
//     new Vec2(160, 37),
//     new Vec2(110, 52),
//     new Vec2(68, 65),
//     new Vec2(26, 78)
// ];
// this.flapArrowPathD = "m-20,-12 l31,6 l0,19, l-21,-5 l-10,-20";
// this.flapDotPositions = [
//     new Vec2(220, 37),
//     new Vec2(280, 50),
//     new Vec2(327, 61),
//     new Vec2(375, 72),
//     new Vec2(423, 83)
// ];
// this.sTextPos = new Vec2(66, 32);
// this.fTextPos = new Vec2(330, 32);
// this.currentStateTextPos = new Vec2(190, 87);
// this.mainShapeCorners = [
//     new Vec2(180, 25),
//     new Vec2(200, 25),
//     new Vec2(210, 45),
//     new Vec2(174, 43)
// ];

// this.targetSlatsDots.push(A320_Neo_UpperECAM.createSlatParallelogram("targetDot", this.slatDotPositions[1].x, this.slatDotPositions[1].y + 20).getAttribute("points"));
// this.targetSlatsArrowsStrings.push(this.generateArrowPathD(this.slatArrowPathD, null, this.slatDotPositions[0], this.slatDotPositions[1], 0));
