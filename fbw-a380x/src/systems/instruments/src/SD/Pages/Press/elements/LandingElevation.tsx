import React from 'react';
import { Position } from '@instruments/common/types';
import { useArinc429Var } from '@instruments/common/arinc429';


const LandingElevation: React.FC<Position> = ({ x, y }) => {
    // The A380 doesn't have manual landing elevation selector
    // Fixme: this value should come from the pressurization system but for now we can take it directly from the FMS
    const landingElev = useArinc429Var('L:A32NX_FM1_LANDING_ELEVATION', 1000);

    const ldgElevValue = Math.round(landingElev.value / 50) * 50;

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
