import React from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';

export enum fieldSides {
    left= 'field-left',
    right= 'field-right',
}

type FieldProps = {
    textSide?: fieldSides,
    lineSide: lineSides
    value: string,
    color: lineColors,
    size: lineSizes
}
export const Field: React.FC<FieldProps> = ({ size, textSide: side, value, color, lineSide }) => (
    <p className={`line ${lineSide}`}>
        <span className={`${color} ${side} ${size}`}>{value}</span>
    </p>

);
