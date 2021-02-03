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
import {setSimVar, getSimVar} from '../../types/util'

type GroundProps = {}

type GroundState = {
    tugActive: boolean;
    lastTugHeading: number,
    activeButton: string,
}

class Ground extends React.Component<GroundProps, GroundState> {

    constructor(props: GroundProps) {
        super(props);

        this.state = {
            tugActive: false,
            lastTugHeading: 0,
            activeButton: 'none',
        };
      }

    toggleGroundAction(action: GroundServices, event: React.MouseEvent) {
            setSimVar(action, "1", "boolean");
            this.setState({
                activeButton: event.currentTarget.id
            });
    }

    setTugHeading(action: GroundServices, value: number, type: string, event: React.MouseEvent) {
            if (!this.state.tugActive) {
                this.togglePushback();
            } else {
                let tuhHeading = this.getTugHeading(value);
                console.log("HEADING to go " + tuhHeading);

                // KEY_TUG_HEADING is an unsigned integer, so let's convert
                setSimVar(action, (tuhHeading * 11930464) & 0xffffffff, "UINT32");

                this.setState({
                    lastTugHeading: value,
                    activeButton: event.currentTarget.id
                });
            }
        }

    getTugHeading(value: number): number {
        const currentHeading = getSimVar("PLANE HEADING DEGREES TRUE", "degrees");
        let desiredHeading: number = currentHeading  + value;
        desiredHeading %= 360;
        return desiredHeading;
    }

    togglePushback() {
        const tugActive = this.state.tugActive;
        setSimVar(GroundServices.TOGGLE_PUSHBACK, 1, "boolean");
        this.setState({
            tugActive: !tugActive
        });
    }

    unselectButton() {
        this.setState({
            activeButton : "none"
        })
    }

    render() {
        return (
            <div className="wrapper flex-grow flex flex-col">
                <img className="airplane w-full" src={fuselage} />
                <div className="pushback control-grid">
                    <h1 className="text-white font-medium text-xl">Pushback</h1>
                    <div onClick={() => this.state.tugActive ? this.togglePushback() : {}} className="stop"><IconHandStop/></div>
                    <div onClick={(e: React.MouseEvent) => this.setTugHeading(GroundServices.PUSHBACK_TURN, 90, "number", e)} className="down-left"><IconCornerDownLeft/></div>
                    <div onClick={(e: React.MouseEvent) => this.setTugHeading(GroundServices.PUSHBACK_TURN, 0, "number", e)} className="down"><IconArrowDown /></div>
                    <div onClick={(e: React.MouseEvent) => this.setTugHeading(GroundServices.PUSHBACK_TURN, 270, "number", e)} className="down-right"><IconCornerDownRight/></div>
                </div>
                <div className="fuel control-grid">
                    <h1 className="text-white font-medium text-xl">Fuel</h1>
                    <div id="fuel" onMouseDown={(e: React.MouseEvent) => this.toggleGroundAction(GroundServices.TOGGLE_FUEL,e)}
                    onMouseUp={() => this.unselectButton()}
                    className={this.state.activeButton === "fuel" ? "call selected" : "call"}><IconTruck/></div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div id="baggage" onMouseDown={(e: React.MouseEvent) => this.toggleGroundAction(GroundServices.TOGGLE_CARGO,e)}
                    onMouseUp={() => this.unselectButton()}
                    className={this.state.activeButton === "baggage" ? "call selected" : "call"}><IconBriefcase/></div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div id="catering" onMouseDown={(e: React.MouseEvent) => this.toggleGroundAction(GroundServices.TOGGLE_CATERING,e)}
                    onMouseUp={() => this.unselectButton()}
                    className={this.state.activeButton === "catering" ? "call selected" : "call"}><IconArchive/></div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div id="jetway" onMouseDown={ (e: React.MouseEvent) => this.toggleGroundAction(GroundServices.TOGGLE_JETWAY,e )}
                    onMouseUp={() => this.unselectButton()}
                    className={this.state.activeButton === "jetway" ? "call selected" : "call"}><IconBuildingArch/></div>
                </div>
            </div>
        );
    }
}

enum GroundServices {
    TOGGLE_PUSHBACK = "K:TOGGLE_PUSHBACK",
    PUSHBACK_TURN = "K:KEY_TUG_HEADING",
    TOGGLE_JETWAY = "K:TOGGLE_JETWAY",
    TOGGLE_STAIRS = "K:TOGGLE_RAMPTRUCK",
    TOGGLE_CARGO = "K:REQUEST_LUGGAGE",
    TOGGLE_CATERING = "K:REQUEST_CATERING",
    TOGGLE_FUEL = "K:REQUEST_FUEL_KEY"
}

export default Ground;
