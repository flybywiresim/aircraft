/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
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

import { useState, useEffect } from 'react';
import { getSimVar } from '../../../util.mjs';

export const SimVar = ({
    name, type, frequency, transform = (x) => x,
}) => {
    const [value, updater] = useState(0);

    setInterval(() => getSimVar(name, type) |> transform |> updater, 1000 / frequency);

    return (
        <>{value}</>
    );
};

export const useSimVar = (
    name, type, frequency = 10, transform = (x) => x,
) => {
    const [value, updater] = useState(0);

    useEffect(() => {
        const handler = () => getSimVar(name, type) |> transform |> updater;

        handler();
        setInterval(handler, 1000 / frequency);
    }, []);

    return value;
};
