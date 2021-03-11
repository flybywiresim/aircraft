import React from 'react';
import { lineColors, lineSizes } from '../../Lines/Line';

export enum fieldSides {
    left= 'field-left',
    right= 'field-right',
}

type FieldProps = {
    side?: fieldSides,
    value: string,
    color: lineColors,
    size: lineSizes
}
export const Field: React.FC<FieldProps> = ({ size, side, value, color }) => (
    <span className={`${color} ${side} ${size}`}>{value}</span>
);
