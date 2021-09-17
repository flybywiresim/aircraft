import React from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import { Field, fieldSides } from './Field';

type LabelProps = {
    /** The value of the label */
    value: string,
    /** The alignment of the text */
    textSide?: fieldSides,
    /** The color of the label */
    color: lineColors
    /**  The alignment of the label */
    lineSide: lineSides,
}

/** A helper component to build labels with the text size set to small */
export const LabelField: React.FC<LabelProps> = ({ lineSide, color, value, textSide }) => (
    <Field lineSide={lineSide} color={color} textSide={textSide} size={lineSizes.small} value={value} />
);
