import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Position } from '@instruments/common/types';


const LandingElevation: React.FC<Position> = ({ x, y }) => {
    const [landingElev] = useSimVar('L:A32NX_FM1_LANDING_ELEVATION', 'feet', 100);

    const ldgElevValue = Math.round(landingElev / 50) * 50;

    return (
        <>
            <g id="LandingElevation">
                <text className="F25 White LS1" x={x} y={y}>LDG ELEVN</text>

                <text id="LandingElevation" className="F28 Green EndAlign" x={x + 260} y={y}>{ldgElevValue}</text>
                <text className="F24 Cyan" x={x + 268} y={y}>FT</text>
            </g>
        </>
    );
};

export default LandingElevation;
