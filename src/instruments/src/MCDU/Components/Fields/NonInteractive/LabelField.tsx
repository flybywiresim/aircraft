import React from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/Line';
import { Field } from './Field';

type LabelProps = {
    value: string,
    side: lineSides,
    color: lineColors
}
export const LabelField: React.FC<LabelProps> = ({ color, value, side }) => (
    <Field color={color} side={side} size={lineSizes.small} value={value} />
);
