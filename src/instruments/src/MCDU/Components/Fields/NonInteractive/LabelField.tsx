import React from 'react';
import { lineColors, lineSizes } from '../../Lines/Line';
import { Field, fieldSides } from './Field';

type LabelProps = {
    value: string,
    side?: fieldSides,
    color: lineColors
}
export const LabelField: React.FC<LabelProps> = ({ color, value, side }) => (
    <Field color={color} side={side} size={lineSizes.small} value={value} />
);
