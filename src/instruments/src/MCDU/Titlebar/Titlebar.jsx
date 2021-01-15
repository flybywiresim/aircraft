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

import './styles.scss';
import { useContext } from 'react';
import { RootContext } from '../RootContext.jsx';

const Titlebar = () => {
    const [, , title] = useContext(RootContext);

    return (
        <g id="title" transform="translate(512 100)">
            <text className="title"><tspan className="green">{title}</tspan></text>
            <g id="arrow" transform="translate(512 0)">
                <text opacity={100} className="arrow"><tspan className="white">{'{}'}</tspan></text>
            </g>
        </g>
    );
};

export default Titlebar;
