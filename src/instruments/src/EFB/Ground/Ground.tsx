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
import { IconCornerDownLeft, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingArch, IconArchive } from '@tabler/icons'

import './Ground.scss'
import fuselage from '../Assets/320neo-outline-upright.svg'
import {setSimVar, getSimVar} from '../../util.mjs'
import { GroundServices } from './GroundServices';

type GroundProps = {}

type GroundState = {}

class Ground extends React.Component<GroundProps, GroundState> {


    performGroundAction(action: GroundServices, value: any = 1, type: any = "boolean") {
        return (() =>{
            console.log("Bruheg");
            console.log(setSimVar(action,value,type));
        })
    }

    manageTugHeading(action: GroundServices, value: any = 1, type: any = "boolean") {
        return (() =>{
            const currentHeading = getSimVar("PLANE HEADING DEGREES TRUE", "degrees");
            const desiredHeading = (currentHeading * 180 /3.141 + value) % 360;
            console.log("Heading to get "+desiredHeading * 11930465);
            setSimVar(action,desiredHeading* 11930465,type);
        })
    }

    render() {

        return (
            <div className="wrapper flex-grow flex flex-col">
                <div className="pushback control-grid">
                    <h1 className="text-white font-medium text-xl">Pushback</h1>
                    <div onClick={this.performGroundAction(GroundServices.TOGGLE_PUSHBACK)} className="stop"><IconHandStop/>
                    </div>
                    <div onClick={this.manageTugHeading(GroundServices.PUSHBACK_TURN, 90,"number")} className="down-left"><IconCornerDownLeft/></div>
                    <div onClick={this.performGroundAction(GroundServices.TOGGLE_PUSHBACK)} className="down selected"><IconArrowDown /></div>
                    <div onClick={this.manageTugHeading(GroundServices.PUSHBACK_TURN, 270, "number")} className="down-right"><IconCornerDownRight/></div>
                </div>
                <div className="fuel control-grid">
                    <h1 className="text-white font-medium text-xl">Fuel</h1>
                    <div onClick={this.performGroundAction(GroundServices.TOGGLE_FUEL)} className="call"><IconTruck/></div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div onClick={this.performGroundAction(GroundServices.TOGGLE_CARGO)} className="call"><IconBriefcase/></div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div onClick={this.performGroundAction(GroundServices.TOGGLE_CATERING)} className="call"><IconArchive/></div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div onClick={this.performGroundAction(GroundServices.TOGGLE_JETWAY)}  className="call"><IconBuildingArch/></div>
                </div>
                <img className="airplane w-full" src={fuselage} />
            </div>
        );
    }
}

export default Ground;
