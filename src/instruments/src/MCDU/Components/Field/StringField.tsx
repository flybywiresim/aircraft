import React, { useContext } from 'react';
import { lineColors, lineSides, lineSizes } from '../Lines/Line';
import { lineSelectKeys } from '../Buttons';
import { useInteractionEvent } from '../../../Common/hooks';
import { RootContext } from '../../RootContext';

type StringFieldProps = {
    value: string,
    nullValue: string,
    color?: lineColors,
    side: lineSides,
    size?: lineSizes,
    isInput?: boolean,
    selectedCallback?: (value?: string) => any,
    selectedValidation?: (value?: string) => boolean,
    lsk?: lineSelectKeys
}
export const StringField: React.FC<StringFieldProps> = (
    {
        value,
        nullValue,
        color,
        side,
        size,
        selectedCallback,
        selectedValidation,
        lsk,
        isInput,
    },
) => {
    const [scratchpad, setScratchpad, , ] = useContext(RootContext); // eslint-disable-line array-bracket-spacing
    if (selectedCallback) {
        if (lsk) {
            useInteractionEvent(lsk, () => {
                if (isInput) {
                    if (selectedValidation) {
                        if (selectedValidation(scratchpad)) {
                            selectedCallback(scratchpad);
                        } else {
                            setScratchpad('FORMAT ERROR');
                        }
                    }
                } else {
                    selectedCallback();
                }
            });
        }
    }

    return (
        <span className={`${color} ${side} ${size}`}>{value === '' ? nullValue : value}</span>
    );
};

const DefaultStringFieldProps: StringFieldProps = {
    value: '',
    nullValue: '',
    color: lineColors.white,
    isInput: false,
    side: lineSides.left,
};
StringField.defaultProps = DefaultStringFieldProps;
