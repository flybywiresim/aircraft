import React from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/Line';

type FieldProps = {
    side: lineSides,
    value: string,
    color: lineColors,
    size: lineSizes
}
export const Field: React.FC<FieldProps> = ({ size, side, value, color }) => (
    <span className={`${color} ${side} ${size}`}>{value}</span>
);
