import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { isNumber, toNumber } from 'lodash';

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
                {!!label && !emptyValue && <span className="inline-block overflow-hidden -mb-2.5 text-sm font-light">{label}</span>}

                <div className={classNames('inner-container', { disabled })}>
                    {leftInnerComponent}

                    <div className="flex relative flex-row">
                        <input
                            className="flex justify-center items-center w-full h-full text-2xl bg-transparent focus:outline-none"
                            type={type}
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            onFocus={() => setFocusActive(true)}
                            onBlur={() => setFocusActive(false)}
                            {...props}
                        />

                        {!!label && emptyValue && <span className="flex absolute top-0 items-center h-full text-2xl pointer-events-none text-gray-medium">{label}</span>}
                    </div>

                    {rightInnerComponent}
                </div>
            </div>

            {rightComponent}
        </div>
    );
};

export default Input;
