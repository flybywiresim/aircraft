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
import { IconCornerDownLeft, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingBridge, IconBuildingArch, IconArchive } from '@tabler/icons'

import './Ground.scss'
import fuselage from '../Assets/320neo-outline-upright.svg'

type GroundProps = {}

type GroundState = {}

class Ground extends React.Component<GroundProps, GroundState> {

    render() {
        return (
            <div className="wrapper">
                <div className="pushback control-grid">
                    <h1 className="text-white font-medium text-xl">Pushback</h1>
                    <div className="stop"><IconHandStop/></div>
                    <div className="down-left"><IconCornerDownLeft/></div>
                    <div className="down selected"><IconArrowDown /></div>
                    <div className="down-right"><IconCornerDownRight/></div>
                </div>
                <div className="fuel control-grid">
                    <h1 className="text-white font-medium text-xl">Fuel</h1>
                    <div className="call"><IconTruck/></div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div className="call"><IconBriefcase/></div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div className="call"><IconArchive/></div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div className="call"><IconBuildingArch/></div>
                </div>
                <img className="airplane" src={fuselage} />
            </div>
        );
    }
}

export default Ground;
