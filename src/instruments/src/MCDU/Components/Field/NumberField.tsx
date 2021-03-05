import React, { useContext } from 'react';
import { lineColors, lineSides, lineSizes } from '../Lines/Line';
import { lineSelectKeys } from '../Buttons';
import { RootContext } from '../../RootContext';
import { useInteractionEvent } from '../../../Common/hooks';

type NumberFieldProps = {
    value: number | string,
    nullValue: string,
    min: number,
    max: number,
    float?: boolean
    color?: lineColors,
    side: lineSides,
    size?: lineSizes,
    selectedCallback?: (value: number) => any,
    lsk?: lineSelectKeys
}
export const NumberField: React.FC<NumberFieldProps> = (
    {
        value,
        nullValue,
        min,
        max,
        color,
        side,
        size,
        float,
        selectedCallback,
        lsk,
    },
) => {
    const [scratchpad, setScratchpad, , ] = useContext(RootContext); // eslint-disable-line array-bracket-spacing
    if (selectedCallback) {
        if (lsk) {
            useInteractionEvent(lsk, () => {
                const value = float === true ? parseFloat(scratchpad) : parseInt(scratchpad);
                if (!Number.isNaN(value)) {
                    if (value >= min && value <= max) {
                        selectedCallback(value);
                    } else {
                        setScratchpad('ENTRY OUT OF RANGE');
                    }
                } else {
                    setScratchpad('FORMAT ERROR');
                }
            });
        }
    }

    return (
        <span className={`${color} ${side} ${size}`}>{value === 0 ? nullValue : value}</span>
    );
};

const DefaultNumberFieldProps: NumberFieldProps = {
    value: 0,
    nullValue: '',
    min: 0,
    max: 100,
    color: lineColors.white,
    side: lineSides.left,
    size: lineSizes.regular,
};
NumberField.defaultProps = DefaultNumberFieldProps;
