import React, { FC } from 'react';

const SCALE_HEIGHT = -35;

export enum SpoilerSide {
    Left,
    Right,
}

interface SpoilerProps {
    x: number,
    y: number,
    side: SpoilerSide,
    position: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
}

export function deflectionToYOffset(deflection: number, maxDeflection: number): number {
    const normalizedDeflection = deflection / maxDeflection;

    return normalizedDeflection * SCALE_HEIGHT;
}

export const Spoiler: FC<SpoilerProps> = ({ x, y, side, position }) => {
    const deflectionInfoValid = true;
    const spoilerDeflection = 0;
    const maxDeflection = position >= 3 ? 50 : 30;

    const deflectionYVal = deflectionToYOffset(spoilerDeflection, maxDeflection);

    const powerSource1Avail = true;
    const powerSource2Avail = true;

    let yOffset: number;
    if (position <= 2) {
        yOffset = 0;
    } else if (position <= 4) {
        yOffset = -4;
    } else if (position <= 6) {
        yOffset = -8;
    } else {
        yOffset = -12;
    }

    const onGround = true;

    const powerAvail = powerSource1Avail || powerSource2Avail;

    const maxDeflectionVisible = onGround && deflectionInfoValid && powerAvail && position >= 3;

    const powerAvailableClass = powerAvail ? 'Green' : 'Amber';

    return (
        <g id={`spoiler-${side}-${position}`} transform={`translate(${x} ${y + yOffset})`}>
            <path className='Grey Fill' d='m0,0 v -35 h15 v35 z' />

            {/* The max deflection line needs to be at the 45° deflection position, as this is the maximum deflection for roll spoilers.
            The 2px offset is because of the line width, the deflection indication should reach the lower border of the line. */}
            <path className={`Green SW2 ${maxDeflectionVisible ? '' : 'Hide'}`} d={`m0,${deflectionToYOffset(45, maxDeflection) - 2} h 15`} />

            <path className={`${powerAvailableClass} Fill ${deflectionInfoValid ? '' : 'Hide'}`} d={`m0,0 h15 v${deflectionYVal} h-16 z`} />

            <path className={`Amber SW4 LineRound ${!deflectionInfoValid ? '' : 'Hide'}`} d='m1,-2 v-31 M14,-2 v-31' />

            <text
                x={-1}
                y={0}
                className={`Amber F32 ${!deflectionInfoValid ? '' : 'Hide'}`}
            >
                X
            </text>
        </g>
    );
};
