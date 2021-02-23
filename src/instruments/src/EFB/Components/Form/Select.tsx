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

import React from 'react';

export type SelectProps = { selected?: boolean, onSelect?: () => void, classNames?: string };

export const Select: React.FC<SelectProps> = (props) => (
    <div onClick={props.onSelect || (() => {})} className={`${props.selected ? 'bg-blue-light-contrast' : 'bg-blue-dark'} ml-1.5 px-5 py-1.5 rounded-lg flex flex-row justify-between`}>
        <span className={`${props.classNames} text-lg text-white mt-0.5`}>{props.children}</span>
    </div>
);

export type SelectItemProps = { selected?: boolean, onSelect?: () => void, classNames?: string };

export const SelectItem: React.FC<SelectItemProps> = (props) => (
    <span onClick={props.onSelect || (() => {})} className={`text-lg font-medium ${props.selected ? 'bg-blue-light-contrast text-blue-darkest' : 'text-white'} py-2 px-3.5 rounded-lg`}>
        {props.children}
    </span>
);

export const SelectGroup: React.FC = (props) => (
    <div className="bg-blue-dark flex flex-row justify-between rounded-lg">
        {props.children}
    </div>
);

export const VerticalSelectGroup: React.FC = (props) => (
    <div className="bg-gray-800 flex flex-col justify-between rounded-lg">
        {props.children}
    </div>
);
