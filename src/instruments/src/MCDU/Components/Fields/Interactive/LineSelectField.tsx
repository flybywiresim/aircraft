import React from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/Line';
import { lineSelectKeys } from '../../Buttons';
import { useInteractionEvent } from '../../../../Common/hooks';

type LineSelectFieldProps = {
    value: string,
    color: lineColors,
    side: lineSides,
    size: lineSizes,
    lsk: lineSelectKeys,
    selectedCallback: () => any;
}

export const LineSelectField: React.FC<LineSelectFieldProps> = ({ value, color, side, size, selectedCallback, lsk }) => {
    useInteractionEvent(lsk, () => {
        selectedCallback();
    });
    return (
        <span className={`${color} ${side} ${size}`}>{value}</span>
    );
};
