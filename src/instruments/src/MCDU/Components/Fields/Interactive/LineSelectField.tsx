import React from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import { LINESELECT_KEYS } from '../../Buttons';
import { useInteractionEvent } from '../../../../Common/hooks';
import { fieldSides } from '../NonInteractive/Field';

type LineSelectFieldProps = {
    value: string,
    color: lineColors,
    textSide?: fieldSides,
    lineSide: lineSides,
    size: lineSizes,
    lsk: LINESELECT_KEYS,
    selectedCallback: () => any;
}

export const LineSelectField: React.FC<LineSelectFieldProps> = ({ lineSide, value, color, textSide, size, selectedCallback, lsk }) => {
    useInteractionEvent(lsk, () => {
        selectedCallback();
    });
    return (
        <p className={`line ${lineSide}`}>
            <span className={`${color} ${textSide} ${size}`}>{value}</span>
        </p>
    );
};
