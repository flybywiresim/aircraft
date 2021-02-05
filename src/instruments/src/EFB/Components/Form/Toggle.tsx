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

import React, { useEffect, useState } from "react";

export type ToggleProps = { value: boolean, onToggle: (value: boolean) => void; };

export const Toggle: React.FC<ToggleProps> = (props) => {
    const [on, setOn] = useState(props.value);

    useEffect(() => props.onToggle(on), [on]);

    return (
        <div onClick={() => setOn(on => !on)} className={`w-12 h-6 px-1 ${on ? "bg-blue-darker" : "bg-blue-dark"} rounded-full flex flex-row items-center`}>
            <div className={`w-5 h-5 ${on ? "bg-blue-light-contrast" : "bg-gray-400"} rounded-full transition-colors transition-transform ${on ? "transform translate-x-5" : ""}`} />
        </div>
    );
}
