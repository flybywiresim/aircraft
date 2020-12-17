import React from 'react';
import { lineColors, lineSides, lineSizes } from './Line';

type LabelProps = {
    value: string,
    side: lineSides,
    size?: lineSizes
    color?: lineColors
}
export const Label: React.FC<LabelProps> = ({ color, size, value, side }) => (
    <span className={`${size} ${side} ${color}`}>
        {value}
    </span>
);

const DefaultLabelProps:LabelProps = {
    value: '',
    side: lineSides.left,
    size: lineSizes.small,
    color: lineColors.white,
};
Label.defaultProps = DefaultLabelProps;
