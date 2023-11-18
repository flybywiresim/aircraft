import React, { FC } from 'react';
import { Layer } from './Layer';

type ActiveFrequencyProps = {
    x?: number;
    y?: number;
    value: string;
}

export const ActiveFrequency: FC<ActiveFrequencyProps> = (props) => (
    <text x={props.x} y={props.y} fontFamily="RMP-19" fill="white" fontSize={120} dominantBaseline="middle">{props.value}</text>
);
