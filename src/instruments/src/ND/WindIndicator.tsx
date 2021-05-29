import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

export const WindIndicator: FC = () => {
    const [windDirection] = useSimVar('AMBIENT WIND DIRECTION', 'degrees', 500);
    const [windSpeed] = useSimVar('AMBIENT WIND VELOCITY', 'knots', 500);
    const [planeHeading] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees', 500);
    const windDirectionArrow = mod(windDirection - planeHeading + 180, 360);

    return (
        <Layer x={17} y={50}>
            <text x={25} y={0} fontSize={20} textAnchor="end" className="Green">{Math.round(windDirection)}</text>
            <text x={30} y={0} fontSize={20} className="White">/</text>
            <text x={46} y={0} fontSize={20} className="Green">{Math.round(windSpeed)}</text>

            {windSpeed > 0 && (
                <path className="Green" strokeWidth={2.25} strokeLinecap="round" d="M 0 30 v -20 m -7 8 l 7 -8 l 7 8" transform={`rotate(${windDirectionArrow} 0 20)`} />
            )}
        </Layer>
    );
};
