import React, { FC } from 'react';

interface WheelProps {
    x: number,
    y: number,
    number: number | null
    isLeftSide: boolean,
    hasBrake: boolean,
}

export const Wheel: FC<WheelProps> = ({ x, y, number, isLeftSide, hasBrake }) => {
    const negativeSign = isLeftSide ? '-' : '';
    const rightNegativeSign = !isLeftSide ? '-' : '';

    return (
        <g id={`wheel-${number ?? 'nose'}`} transform={`translate(${x} ${y})`}>
            <path
                className="Grey NoFill SW2"
                d={`m${negativeSign}51,-28 v-10 c${rightNegativeSign}10,-6 ${rightNegativeSign}30,-5, ${rightNegativeSign}35,0 v10`}
            />
            <path
                className="Grey NoFill SW2"
                d={`m${negativeSign}51,40 c${rightNegativeSign}10,4 ${rightNegativeSign}30,3, ${rightNegativeSign}35,-1 v-10`}
            />
            {hasBrake && (
                <>
                    <path
                        className="Grey NoFill SW2"
                        d={`m ${negativeSign}15,18 v -36 M ${negativeSign}21,18 v -36 M ${negativeSign}27,18 v -36 M ${negativeSign}33,18 v -36`}
                    />
                    <path className="BackgroundFill" d={`m ${isLeftSide ? -18 : 70},-13 h -50 v -24 h 50 z`} />
                    <text className="F26 Green EndAlign" x={isLeftSide ? -16 : 72} y={-16}>15</text>
                </>
            )}
            <text className="F22 Green EndAlign" x={isLeftSide ? -16 : 65} y={34}>220</text>
            {number && (
                <text className={`F22 White ${isLeftSide ? 'EndAlign' : ''}`} x={isLeftSide ? -38 : 42} y={7}>{number}</text>
            )}
        </g>
    );
};
