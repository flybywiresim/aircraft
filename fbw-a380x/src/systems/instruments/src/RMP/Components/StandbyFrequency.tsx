import React, { FC } from 'react';
import { Layer } from './Layer';

type FrequencyLabelProps = {
    valid?: boolean;
    value?: string;
}

type StandbyFrequencyProps = {
    x: number;
    y: number;
    selected?: boolean;
    valid?: boolean;
    label?: string;
    value?: string;
}

const FrequencyLabel: FC<FrequencyLabelProps> = (props) => (
    <text fontSize={100} x={110} y={150} fontFamily="RMP-13" dominantBaseline="middle" fill={props.valid ? 'white' : 'cyan'}>{props.value}</text>
);

export const StandbyFrequency: FC<StandbyFrequencyProps> = (props) => (
    <Layer x={props.x} y={props.y}>
        {props.selected && <text x={145} y={50} fontSize={60} dominantBaseline="middle" fill="white" fontFamily="RMP-11">STBY</text>}
        {props.selected && <rect y={0} width="550" height="225" fill="transparent" strokeWidth={5} stroke={"cyan"} />}
        <FrequencyLabel value={props.value} valid={!props.selected || props.valid} />
    </Layer>
);
