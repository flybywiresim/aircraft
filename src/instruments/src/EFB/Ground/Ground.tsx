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

type GroundProps = {}

type GroundState = {
    tugStatus: boolean;
}

class Ground extends React.Component<GroundProps, GroundState> {

    constructor(props) {
        super(props);

        this.state = {
            tugStatus: false,
        };
      }

    toggleGroundAction(action: GroundServices) {
        return (() =>{
            setSimVar(action,"1","boolean");
        })
    }

    setTugHeading(action: GroundServices, value: any = 1, type: any = "boolean") {
        return (() =>{
            const currentHeading = getSimVar("PLANE HEADING DEGREES TRUE", "degrees");
            let desiredHeading = Math.floor(currentHeading)  + value;
            desiredHeading %=360;
            setSimVar(action,desiredHeading * 11930465,type);
            if(!this.state.tugStatus) {
                this.togglePushback();
            }
        })
    }

    getTugHeading(value: number): number {
        const currentHeading = getSimVar("PLANE HEADING DEGREES TRUE", "degrees");
        let desiredHeading: number = Math.floor(currentHeading)  + value;
        desiredHeading %=360;
        return desiredHeading;
    }

    togglePushback() {
            const tugActive = this.state.tugStatus;
            setSimVar(GroundServices.TOGGLE_PUSHBACK,1,"boolean");
            this.setState ({
                tugStatus: !tugActive
            });
    }

    render() {

        return (
            <div className="wrapper flex-grow flex flex-col">
                <div className="pushback control-grid">
                    <h1 className="text-white font-medium text-xl">Pushback</h1>
                    <div onClick={() => this.state.tugStatus?this.togglePushback():{}} className="stop"><IconHandStop/></div>
                    <div onClick={this.setTugHeading(GroundServices.PUSHBACK_TURN, 90,"number")} className="down-left"><IconCornerDownLeft/></div>
                    <div onClick={this.setTugHeading(GroundServices.PUSHBACK_TURN, 0, "number")} className="down"><IconArrowDown /></div>
                    <div onClick={this.setTugHeading(GroundServices.PUSHBACK_TURN, 270, "number")} className="down-right"><IconCornerDownRight/></div>
                </div>
                <div className="fuel control-grid">
                    <h1 className="text-white font-medium text-xl">Fuel</h1>
                    <div onClick={this.toggleGroundAction(GroundServices.TOGGLE_FUEL)} className="call"><IconTruck/></div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div onClick={this.toggleGroundAction(GroundServices.TOGGLE_CARGO)} className="call"><IconBriefcase/></div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div onClick={this.toggleGroundAction(GroundServices.TOGGLE_CATERING)} className="call"><IconArchive/></div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div onClick={this.toggleGroundAction(GroundServices.TOGGLE_JETWAY)}  className="call"><IconBuildingArch/></div>
                </div>
                <img className="airplane w-full" src={fuselage} />
            </div>
        );
    }
}

enum GroundServices {
    TOGGLE_PUSHBACK = "K:TOGGLE_PUSHBACK",
    PUSHBACK_TURN = "K:KEY_TUG_HEADING",
    TOGGLE_JETWAY= "K:TOGGLE_JETWAY",
    TOGGLE_STAIRS="K:TOGGLE_RAMPTRUCK",
    TOGGLE_CARGO="K:REQUEST_LUGGAGE",
    TOGGLE_CATERING="K:REQUEST_CATERING",
    TOGGLE_FUEL="K:REQUEST_FUEL_KEY",
    TOGGLE_POWER="K:TOGGLE_EXTERNAL_POWER",
}


export default Ground;
