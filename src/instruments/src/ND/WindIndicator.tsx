import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';
import { AdirsTasDrivenIndicatorProps } from './index';

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

export const WindIndicator: FC<AdirsTasDrivenIndicatorProps> = ({ adirsState, tas }) => {
    const [windDirection] = useSimVar('AMBIENT WIND DIRECTION', 'degrees', 500);
    const [windSpeed] = useSimVar('AMBIENT WIND VELOCITY', 'knots', 500);
    const [planeHeading] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees', 500);

    const windInfoShown = adirsState === 2 && tas > 100 && windSpeed > 2;

    return (
        <Layer x={17} y={52}>
            <text x={25} y={0} fontSize={22} textAnchor="end" className="Green">
                {windInfoShown ? (
                    Math.round(windDirection).toString().padStart(3, '0')
                ) : (
                    '---'
                )}
            </text>
            <text x={30} y={0} fontSize={22} className="White">/</text>
            <text x={48} y={0} fontSize={22} className="Green">
                {windInfoShown ? (
                    Math.round(windSpeed).toString().padStart(2, '0')
                ) : (
                    '---'
                )}
            </text>

            <path
                className="Green"
                strokeWidth={2.25}
                strokeLinecap="round"
                d="M 0 30 v -20 m -7 8 l 7 -8 l 7 8"
                transform={`rotate(${(mod(Math.round(windDirection) - Math.round(planeHeading) + 180, 360))} 0 20)`}
                visibility={windInfoShown ? 'visible' : 'hidden'}
            />

        </Layer>
    );
};
