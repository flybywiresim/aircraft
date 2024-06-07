import React, { FC } from 'react';
import { Layer } from './Layer';

type TextRowProps = {
    left?: string;
    leftFill?: string;
    center?: string;
    centerFill?: string;
    right?: string;
    rightFill?: string;
}

export const TextRow: FC<TextRowProps> = (props) => (
    <Layer height={157} fontSize={40}>
        <text color={props.leftFill || 'white'}>{props.left || ''}</text>
        <text color={props.centerFill || 'white'}>{props.center || ''}</text>
        <text color={props.rightFill || 'white'}>{props.right || ''}</text>
    </Layer>
);
