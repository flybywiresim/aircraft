import React, { FC, useEffect, useState } from 'react';

type SimpleInputProps = {
    label?: string,
    placeholder?: string,
    value?: any,
    onChange?: (value: string) => void,
    min?: number,
    max?: number,
    number?: boolean,
    noLeftMargin?: boolean,
    padding?: number,
    decimalPrecision?: number,
    reverse?: boolean, // Flip label/input order,
    className?: string,
};

const SimpleInput: FC<SimpleInputProps> = (props) => {
    const [displayValue, setDisplayValue] = useState<string>(props.value?.toString() ?? '');
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (props.value === undefined || props.value === '') {
            setDisplayValue('');
            return;
        }
        if (focused) return;
        setDisplayValue(getConstrainedValue(props.value));
    }, [props.value]);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let originalValue = event.currentTarget.value;

        if (props.number) {
            originalValue = originalValue.replace(/[^\d.-]/g, ''); // Replace all non-numeric characters
        }

        props.onChange?.(originalValue);
        setDisplayValue(originalValue);
    };

    const onFocus = (): void => {
        setFocused(true);
    };

    const onFocusOut = (event: React.FocusEvent<HTMLInputElement>): void => {
        const { value } = event.currentTarget;
        const constrainedValue = getConstrainedValue(value);

        setDisplayValue(constrainedValue);
        setFocused(true);
    };

    const getConstrainedValue = (value: string): string => {
        let constrainedValue = value;
        let numericValue = parseFloat(value);

        if (!Number.isNaN(numericValue)) {
            if (props.min !== undefined && numericValue < props.min) {
                numericValue = props.min;
            } else if (props.max !== undefined && numericValue > props.max) {
                numericValue = props.max;
            }

            if (props.decimalPrecision !== undefined) {
                const fixed = numericValue.toFixed(props.decimalPrecision);
                constrainedValue = parseFloat(fixed).toString(); // Have to re-parse to remove trailing 0s
            } else {
                constrainedValue = numericValue.toString();
            }
            constrainedValue = pad(constrainedValue);
        }
        return constrainedValue;
    };

    const pad = (value: string): string => {
        if (props.padding === undefined) return value;
        const split = value.split('.');
        while (split[0].length < props.padding) {
            split[0] = `0${split[0]}`;
        }
        return split.join('.');
    };

    return (
        <div className={`flex ${props.className} ${props.reverse ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex flex-grow ${props.noLeftMargin ? '' : 'm-2.5'} items-center ${props.reverse ? 'justify-start' : 'justify-end'}`}>{props.label}</div>
            <div className="flex items-center">
                <input
                    className="w-28 text-lg bg-gray-900 px-3 py-1.5 rounded"
                    value={displayValue}
                    placeholder={props.placeholder ?? ''}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onFocusOut}
                />
            </div>
        </div>
    );
};

export default SimpleInput;
