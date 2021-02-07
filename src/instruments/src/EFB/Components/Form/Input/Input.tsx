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

import React, {useEffect, useState} from "react";

import './Input.scss'

type InputProps = {
    type?: 'text',
    value?: any,
    label?: string,
    leftComponent?: any,
    rightComponent?: any,
    onChange?: (value: string) => any
};

const Input = ({
   type,
   value: propsValue,
   label,
   leftComponent,
   rightComponent,
   onChange: onChangeProps
}: InputProps) => {
    const [focusActive, setFocusActive] = useState(false);
    const [value, setValue] = useState(propsValue);

    const onChange = (value) => {
        if(onChangeProps) {
            onChangeProps(value);
        }

        setValue(value);
    };

    useEffect(() => {
        onChange(propsValue);
    }, [propsValue]);

    return (
        <div className={focusActive ? 'default-input-container focus-active' : 'default-input-container'}>
                {leftComponent}

                <div className="flex-1">
                    {label && value && <span className="text-sm text-blue-light font-light inline-block -mb-2.5 overflow-hidden">{label}</span>}

                    <div className="relative">
                        <input
                            className="w-full h-full bg-transparent text-white text-2xl flex items-center justify-center focus:outline-none"
                            type={type}
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            onFocus={() => setFocusActive(true)}
                            onBlur={() => setFocusActive(false)}
                        />

                        {label && !value && <span className="absolute h-full top-0 flex items-center text-2xl text-gray-medium pointer-events-none">{label}</span>}
                    </div>
                </div>

                {rightComponent}
        </div>
    );
};

export default Input;