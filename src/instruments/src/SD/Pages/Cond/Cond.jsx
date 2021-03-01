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

import './Cond.scss';
import ReactDOM from 'react-dom';
import React from 'react';
import { renderTarget } from '../../../Common/defaults';

export const CondPage = () => {
    console.log('cond page');

    return (
        <>
            <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                {/* Title and unit */}
                <g id="titleAndWarnings">
                    <text className="PageTitle" x="5" y="27">COND</text>
                    <text className="tempText" x="500" y="27">TEMP</text>
                    <text className="tempText" x="553" y="27">:</text>
                    <text id="CondTempUnit" className="UnitText" x="564" y="27">°C</text>
                    { /* Not yet implemented
                    <text id="LeftFanWarning" className="warningText" x="170" y="60">FAN</text>
                    <text id="RightFanWarning" className="warningText" x="350" y="60">FAN</text>
                    <text id="AltnMode" className="valueText" x="225" y="35">ALTN MODE</text>
                    */}
                </g>

                {/* Plane shape */}
                {/* eslint-disable-next-line max-len */}
                <path id="PlaneSymbol" className="CondPlane" d="m213.8428,68.36133l0,83.97584l55.55171,0m31.00094,0l51.73732,0l0,-50.70766m0,50.70766l55.55173,0m34.81534,0l22.46143,0.14881l14.27533,-10.61944m-265.3938,10.47063l-43.25439,0.17314m-31.10621,0.0111c-48.43094,0.21796 -46.00225,-7.78263 -67.15623,-15.92789m407.68806,-58.64412l-15.47207,-9.94078c-116.67487,0.0387 -207.24004,-0.30086 -323.91504,-0.12489c-20.94778,1.56194 -28.42552,8.14482 -31.50305,11.74302l-9.3201,10.8969l-27.55615,9.99176" />

            </svg>
        </>
    );
};

ReactDOM.render(<CondPage />, renderTarget);
