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

import React from "react";
import classNames from 'classnames';

export enum BUTTON_TYPE {BLUE, BLUE_OUTLINE, GREEN, GREEN_OUTLINE, RED, RED_OUTLINE}

type props = {
    text: string,
    type?: BUTTON_TYPE,
    onClick: () => any,
    className?: any
};

const Button = ({ text, type = BUTTON_TYPE.BLUE, onClick, className, ...props }: props) => {
    return (
        <button
            onClick={onClick}
            className={classNames([
                {
                    'bg-blue-500 border-blue-500': type === BUTTON_TYPE.BLUE,
                    'border-blue-500 text-blue-500': type === BUTTON_TYPE.BLUE_OUTLINE,
                    'bg-green-500 border-green-500': type === BUTTON_TYPE.GREEN,
                    'border-green-500 text-green-500': type === BUTTON_TYPE.GREEN_OUTLINE,
                    'bg-red-500 border-red-500': type === BUTTON_TYPE.RED,
                    'border-red-500 text-red-500': type === BUTTON_TYPE.RED_OUTLINE
                },
                "font-medium text-lg py-2 px-4 text-white flex items-center justify-center rounded-lg focus:outline-none border-4",
                className
            ])}
            {...props}
        >
            {text}
        </button>
    );
};

export default Button;