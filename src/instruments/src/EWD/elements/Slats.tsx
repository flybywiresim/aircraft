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

    const moving = slatsAngle !== targetSlatsAngle || flapsAngle !== targetFlapsAngle;
    const flapText = ['0', '1', '1+F', '2', '3', 'FULL'];

    return (
        <>
            <g id="Slats">
                <text className="Large Center Green" x={x} y={y}>{flapText[handleIndex]}</text>
                <text className="Large Center Green" x={x} y={y + 20}>{moving ? 'MOVING' : ''}</text>
            </g>
        </>
    );
};

export default Slats;
