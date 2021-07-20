import React from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import { Field, fieldSides } from './Field';

type LabelProps = {
    value: string,
    textSide?: fieldSides,
    color: lineColors
    lineSide: lineSides,
}
export const LabelField: React.FC<LabelProps> = ({ lineSide, color, value, textSide }) => (
    <Field lineSide={lineSide} color={color} textSide={textSide} size={lineSizes.small} value={value} />
);
