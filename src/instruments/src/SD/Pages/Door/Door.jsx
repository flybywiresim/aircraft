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

import './Door.scss';
// import { useGlobalVar, useSimVar } from '../../../util.mjs';

export const DoorPage = () => (

    <>
        <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            <g id="fuselage">
                <path className="MainShape" d="M 267 473 l -5 -13 l 0 -340 C 260,102 276,52 300,40" />
                <path className="MainShape" d="M 333 473 l 5 -13 l 0 -340 C 340,102 324,52 300,40" />
                <line className="MainShape" x1="262" y1="275" x2="160" y2="308" />
                <line className="MainShape" x1="338" y1="275" x2="440" y2="308" />
            </g>

            <g id="hatches">
                <path className="DoorShape" d="M292 73 l0 -9 l16 0 l0 9Z" />
                <path className="DoorShape" d="M283 102 l0 -15 l9 0 l0 15Z" />
                <path className="DoorShape" d="M317 102 l0 -15 l-9 0 l0 15Z" />

                <path className="DoorShape" d="M300 181 l0 10 l16 0 l0 -10Z" />
                <path id="DoorFwdCargo" d="M336 221 l0 -20 l-18 0 l0 20Z" />
                <path className="DoorShape" d="M336 384 l0 -20 l-18 0 l0 20Z" />
                <path className="DoorShape" d="M328 414 l0 -22 l-8 0 l0 22Z" />
            </g>

            <g id="slides">
                <path id="DoorFrontLeft" d="M264 145 l0 -20 l12 0 l0 20Z" />
                <path className="DoorShape" d="M336 145 l0 -20 l-12 0 l0 20Z" />

                <path className="DoorShape" d="M264 310 l0 -20 l12 0 l0 20Z" />
                <path className="DoorShape" d="M336 310 l0 -20 l-12 0 l0 20Z" />
                <path className="DoorShape" d="M264 344 l0 -20 l12 0 l0 20Z" />
                <path className="DoorShape" d="M336 344 l0 -20 l-12 0 l0 20Z" />

                <path className="DoorShape" d="M264 445 l0 -20 l12 0 l0 20Z" />
                <path id="DoorBackRight" d="M336 445 l0 -20 l-12 0 l0 20Z" />
            </g>

            <g id="dashes">
                <path id="cabin1dash" className="WarningShape" strokeDasharray="7,4" d="M138, 136 l121 0" />
                <path id="cabin4dash" className="WarningShape" strokeDasharray="7,4" d="M346, 438 l77 0" />
                <path id="cargo1dash" className="WarningShape" strokeDasharray="7,4" d="M346, 210 l77 0" />
            </g>

            {/* Texts */}
            <g id="texts">
                <text id="PageTitle" className="Title" x="300" y="16" textAnchor="middle" alignmentBaseline="central" textDecoration="underline">DOOR/OXY</text>
                <text id="slide1" className="Slide" x="232" y="136" textAnchor="middle" alignmentBaseline="central">SLIDE</text>
                <text id="slide2" className="Slide" x="368" y="136" textAnchor="middle" alignmentBaseline="central">SLIDE</text>
                <text id="slide3" className="Slide" x="232" y="320" textAnchor="middle" alignmentBaseline="central">SLIDE</text>
                <text id="slide4" className="Slide" x="368" y="320" textAnchor="middle" alignmentBaseline="central">SLIDE</text>
                <text id="slide5" className="Slide" x="232" y="438" textAnchor="middle" alignmentBaseline="central">SLIDE</text>
                <text id="slide6" className="Slide" x="368" y="438" textAnchor="middle" alignmentBaseline="central">SLIDE</text>

                <text id="cabin1" className="Warning" x="103" y="136" textAnchor="middle" alignmentBaseline="central">CABIN</text>
                <text id="cabin4" className="Warning" x="455" y="438" textAnchor="middle" alignmentBaseline="central">CABIN</text>
                <text id="cargo1" className="Warning" x="455" y="211" textAnchor="middle" alignmentBaseline="central">CARGO</text>

                <text id="oxy" className="Note" x="490" y="18" textAnchor="middle" alignmentBaseline="central">CKPT OXY</text>
                <text id="psi_val" className="Value" x="432" y="42" textAnchor="middle" alignmentBaseline="central">1700</text>
                <text id="psi_unit" className="Unit" x="486" y="43" textAnchor="middle" alignmentBaseline="central">PSI</text>
                <text id="psi_val_right" className="Value" x="538" y="42" textAnchor="middle" alignmentBaseline="central">1700</text>
            </g>
        </svg>

    </>
);
