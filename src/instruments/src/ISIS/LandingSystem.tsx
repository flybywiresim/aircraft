import React from 'react';

import { useSimVar } from '@instruments/common/simVars';

const DeviationIndicator: React.FC<{ deviation: number, available: boolean }> = ({ deviation, available }) => {
    return <>
        <rect x={0} y={0} width={200} height={20} fill="black" />
        <circle cx={10} cy={10} r={7} fill="white" />
        <circle cx={55} cy={10} r={7} fill="white" />
        <line x1={100} x2={100} y1={2} y2={18} strokeWidth={4} stroke="white" />
        <circle cx={145} cy={10} r={7} fill="white" />
        <circle cx={190} cy={10} r={7} fill="white" />
        { available &&
            <g transform={`rotate3d(0) translate(${(deviation * 50).toFixed(1)} 0)`}>
                <path
                    d="M80,10 L100,2 L120,10 L100,18 L80,10"
                    fill="magenta"
                />
            </g>
        }
    </>;
}

export const LandingSystem: React.FC = () => {
    const gsDeviation = useSimVar('NAV GLIDE SLOPE ERROR:3', 'degrees');
    const gsAvailable = useSimVar('NAV HAS GLIDE SLOPE:3', 'bool');
    const lsDeviation = useSimVar('NAV RADIAL ERROR:3', 'degrees');
    const lsAvailable = useSimVar('NAV HAS LOCALIZER:3', 'bool');

    return <>
        <g transform="translate(156 380)">
            <DeviationIndicator deviation={lsDeviation} available={lsAvailable} />
        </g>
        <g transform="translate(356 156) rotate(90 0 0)">
            <DeviationIndicator deviation={gsDeviation} available={gsAvailable} />
        </g>
    </>;
};
