/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState } from 'react';
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
        onChange(propsValue);
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
                            className="w-full h-full bg-transparent text-white text-2xl flex items-center justify-center focus:outline-none"
                            type={type}
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            onFocus={() => setFocusActive(true)}
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
