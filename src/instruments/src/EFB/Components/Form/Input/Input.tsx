import React, { useContext, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { isNumber, toNumber } from 'lodash';
import { KeyboardInputContext } from '../../../Keyboard/Keyboard';
import { useSimVarSyncedPersistentProperty } from '../../../../Common/persistence';

import './Input.scss';

type InputProps = {
    type?: 'text' | 'number',
    value?: any,
    label?: string,
    leftComponent?: any,
    leftInnerComponent?: any,
    rightComponent?: any,
    rightInnerComponent?: any,
    onChange?: (value: string) => any,
    className?: string,
    disabled?: boolean
};

function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

const Input = ({
    type,
    value: propsValue,
    label,
    leftComponent,
    leftInnerComponent,
    rightComponent,
    rightInnerComponent,
    onChange: onChangeProps,
    className,
    disabled,
    ...props
}: InputProps) => {
    const [focusActive, setFocusActive] = useState(false);
    const [value, setValue] = useState(propsValue);
    const previousValue = usePrevious(value);

    const keyboardContext = useContext(KeyboardInputContext);
    const inputElementRef = useRef<HTMLInputElement>(null);

    const [OSKOnInput] = useSimVarSyncedPersistentProperty('L:A32NX_ONSCREEN_KEYBOARD_ON_INPUT', 'Bool', 'ONSCREEN_KEYBOARD_ON_INPUT');

    useEffect(() => {
        if (inputElementRef.current) {
            keyboardContext.setInputElement(inputElementRef.current);
            keyboardContext.setChangeHandler(onChange);
        }
    }, [focusActive]);

    const onChange = (value) => {
        if (type === 'number' && value !== '') {
            value = toNumber(value);
        }

        if (onChangeProps) {
            onChangeProps(value);
        }

        setValue(value);
    };

    useEffect(() => {
        if (previousValue !== propsValue) {
            onChange(propsValue);
        }
    }, [propsValue]);

    const emptyValue = value === '' || (isNumber(value) && Number.isNaN(value));

    return (
        <div className={classNames('default-input-container', { 'focus-active': focusActive }, className)}>
            {leftComponent}

            <div className="flex-1">
                {!!label && !emptyValue && <span className="text-sm text-white font-light inline-block -mb-2.5 overflow-hidden">{label}</span>}

                <div className={classNames('inner-container', { disabled })}>
                    {leftInnerComponent}

                    <div className="relative flex flex-row">
                        <input
                            ref={inputElementRef}
                            className="w-full h-full bg-transparent text-white text-2xl flex items-center justify-center focus:outline-none"
                            type={type}
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            onFocus={() => {
                                setFocusActive(true);
                                if (OSKOnInput) {
                                    keyboardContext.setIsShown(true);
                                }
                            }}
                            onBlur={() => setFocusActive(false)}
                            {...props}
                        />

                        {!!label && emptyValue && <span className="absolute h-full top-0 flex items-center text-2xl text-gray-medium pointer-events-none">{label}</span>}
                    </div>

                    {rightInnerComponent}
                </div>
            </div>

            {rightComponent}
        </div>
    );
};

export default Input;
