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
        <svg id="ApuSd" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            {/* Texts */}
            <g id="texts">
                <text id="PageTitle" className="Title" x="300" y="16" textAnchor="middle" alignmentBaseline="central" textDecoration="underline">APU</text>
                <text id="APUAvail" className="APUInfo" textAnchor="middle" alignmentBaseline="central" x="300" y="70">AVAIL</text>
                <text id="APUFlapOpen" className="APUInfo" x="340" y="375">FLAP OPEN</text>
            </g>

            <g id="shapes">
                <rect className="WhiteBox" width="91" height="100" x="115" y="104" />
                <rect className="WhiteBox" width="100" height="55" x="400" y="150" />
                <path className="GreenLine" d="M160 103 l0 -15 l-10 0 l10 -20 l10 20 l-10 0" />
                <circle className="GreenLine" cx="450" cy="120" r="15" />
                <path className="Separator" d="M90 275 l0 -25 l420 0 l0 25" />
                <path id="APUBleedClosed" className="GreenLine" d="M435 120 l30 0" />
                <path className="GreenLine" d="M450 150 l0 -15" />
                <path id="APUBleedOpen" className="GreenLine" d="M450 135 l0 -30" />
                <path className="GreenLine" d="M450 149 l0 -15 m0 -30 l0 -10 l-10 0 l10 -20 l10 20 l-10 0" />
            </g>

            {/* APU Gen Parameters */}
            <g id="APUGenInfo_On">
                <text id="APUGenParams" className="APUGen" x="119" y="125">APU GEN</text>
                <text id="APUGenLoad" className="APUGenParamValue" x="168" y="150">XX</text>
                <text className="APUGenParamUnit" x="175" y="150">%</text>

                <text id="APUGenVoltage" className="APUGenParamValue" x="168" y="175">XXX</text>
                <text className="APUGenParamUnit" x="175" y="175">V</text>

                <text id="APUGenFrequency" className="APUGenParamValue" x="168" y="200">XXX</text>
                <text className="APUGenParamUnit" x="175" y="200">HZ</text>
            </g>

            {/* APU Bleed Air Pressure */}
            <g id="APUBleedAirPress">
                <text id="APUBleed" className="APUBleed" x="416" y="172">BLEED</text>
                <text id="APUBleedAirPressure" className="APUGenParamValue" x="450" y="197">XX</text>
                <text className="APUGenParamUnit" x="455" y="197">PSI</text>
            </g>
        </svg>
    </>
);
