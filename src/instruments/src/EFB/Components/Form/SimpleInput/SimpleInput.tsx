import { usePersistentNumberProperty } from '@instruments/common/persistence';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardWrapper } from '../../KeyboardWrapper';

type SimpleInputProps = {
    label?: string,
    placeholder?: string,
    labelPosition?: 'col' | 'row';
    value?: any,
    onChange?: (value: string) => void,
    onFocus?: (value: string) => void,
    onBlur?: (value: string) => void
    min?: number,
    max?: number,
    number?: boolean,
    noLeftMargin?: boolean,
    padding?: number,
    decimalPrecision?: number,
    reverse?: boolean, // Flip label/input order,
    className?: string,
    maxLength?: number,
    noLabel?: boolean,
    disabled?: boolean,
};

const SimpleInput = (props: SimpleInputProps) => {
    const [displayValue, setDisplayValue] = useState<string>(props.value?.toString() ?? '');
    const [focused, setFocused] = useState(false);

    const [autoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);

    const keyboard = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [OSKOpen, setOSKOpen] = useState(false);

    useEffect(() => {
        if (keyboard.current) {
            keyboard.current.setInput(displayValue);
        }
    }, [keyboard.current]);

    useEffect(() => {
        if (props.value === undefined || props.value === '') {
            setDisplayValue('');
            return;
        }

        if (focused) return;

        setDisplayValue(getConstrainedValue(props.value));
    }, [props.value]);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (!props.disabled) {
            let originalValue = event.currentTarget.value;

            if (props.number) {
                originalValue = originalValue.replace(/[^\d.-]/g, ''); // Replace all non-numeric characters
            }

            props.onChange?.(originalValue);
            setDisplayValue(originalValue);
        }
    };

    const onFocus = (event: React.FocusEvent<HTMLInputElement>): void => {
        setFocused(true);
        if (!props.disabled) {
            props.onFocus?.(event.target.value);
        }

        if (autoOSK) {
            setOSKOpen(true);
        }
    };

    const onFocusOut = (event: React.FocusEvent<HTMLInputElement>): void => {
        const { value } = event.currentTarget;
        const constrainedValue = getConstrainedValue(value);

        setDisplayValue(constrainedValue);
        setFocused(false);
        setOSKOpen(false);

        if (!props.disabled) {
            props.onBlur?.(event.target.value);
        }
    };

    const getConstrainedValue = (value: string): string => {
        if (!props.number) {
            return value;
        }
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

    useEffect(() => {
        if (!process.env.SIMVAR_DISABLE) {
            if (focused) {
                Coherent.trigger('FOCUS_INPUT_FIELD');
            } else {
                Coherent.trigger('UNFOCUS_INPUT_FIELD');
            }
        }
        return () => {
            Coherent.trigger('UNFOCUS_INPUT_FIELD');
        };
    }, [focused]);

    function onChangeAll(newInput) {
        setDisplayValue(newInput.default);
    }

    const Input = (
        <input
            className={`px-5 py-1.5 text-lg text-white rounded-lg bg-theme-accent
            border-2 border-theme-accent focus-within:outline-none focus-within:border-theme-highlight ${props.className}`}
            value={displayValue}
            placeholder={props.placeholder ?? ''}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onFocusOut}
            maxLength={props.maxLength}
            disabled={props.disabled}
        />
    );

    return (
        <>
            {props.noLabel
                ? (
                    <>
                        {Input}
                    </>
                )
                : (
                    <>
                        <div className={`flex ${props.reverse && props.labelPosition === 'row' ? 'flex-row-reverse' : `flex-${props.labelPosition ?? 'row'}`}`}>
                            <div className={`text-lg flex flex-grow ${props.noLeftMargin ? '' : 'm-2.5'} items-center ${props.reverse ? 'justify-start' : 'justify-end'}`}>{props.label}</div>
                            <div className="flex items-center">
                                {Input}
                            </div>
                        </div>
                    </>
                )}
            {OSKOpen
                && (
                    <div
                        className="absolute inset-x-0 bottom-0 z-50"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <KeyboardWrapper keyboardRef={keyboard} onChangeAll={(v) => onChangeAll(v)} setOpen={setOSKOpen} inputRef={inputRef} />
                    </div>
                )}
        </>
    );
};

export default SimpleInput;
