import React from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import { LINESELECT_KEYS } from '../../Buttons';
import { useInteractionEvent } from '../../../../Common/hooks';
import { fieldSides } from '../NonInteractive/Field';

type LineSelectFieldProps = {
    /** The value of the field */
    value: string,
    /** the color of the field */
    color: lineColors,
    /** Optional alignment for the text within the field.
     * @example
     * [     {text}] //right side
     * [{text}     ] // left side
     */
    textSide?: fieldSides,
    /** Optional alignment for the field */
    lineSide: lineSides,
    /** The size of the text in the field */
    size: lineSizes,
    /** The LSK To be pressed */
    lsk: LINESELECT_KEYS,
    /** The callback function called when the LSK has been pressed */
    selectedCallback: () => any;
}

/**
 * A field that contains LSK interactivety but who's values is not adjusted by the scratchpad
 * // TODO should this print NOT ALLOWED when the scratchpad has entry?
 */
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
