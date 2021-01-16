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

import './Apu.scss';

export const ApuPage = () => (
    <>
        <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            {/* Texts */}
            <g id="texts">
                <text id="PageTitle" className="Title" x="300" y="16" textAnchor="middle" alignmentBaseline="central" textDecoration="underline">APU</text>
            </g>
        </svg>
    </>
);
