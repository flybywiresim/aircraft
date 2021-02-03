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
    tugActive: boolean;
    activeButton: string,
}

class Ground extends React.Component<GroundProps, GroundState> {

    constructor(props: GroundProps) {
        super(props);

        this.state = {
            tugActive: false,
            activeButton: 'none',
        };
      }

    toggleGroundAction(action: GroundServices) {
            setSimVar(action, "1", "boolean");
    }

    setTugHeading(action: GroundServices, direction: number) {
            if (!this.state.tugActive) {
                this.togglePushback();
            } else {
                const tugHeading = this.getTugHeading(direction);
                // KEY_TUG_HEADING is an unsigned integer, so let's convert
                setSimVar(action, (tugHeading * 11930465) & 0xffffffff, "UINT32");
            }
    }

    getTugHeading(value: number): number {
        const currentHeading = getSimVar("PLANE HEADING DEGREES TRUE", "degrees");
        return (currentHeading  + value) % 360;
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
            activeButton: "none"
        })
    }

    handleClick(callBack: () => void, event: React.MouseEvent) {
        this.setState({
            activeButton: event.currentTarget.id
        });
        callBack();
    }

    render() {
        return (
            <div className="wrapper flex-grow flex flex-col">
                <img className="airplane w-full" src={fuselage} />
                <div className="pushback control-grid">
                    <h1 className="text-white font-medium text-xl">Pushback</h1>
                    <div id="stop"
                         onMouseDown={(e) => this.handleClick(() => this.state.tugActive ? this.togglePushback() : {}, e)}
                         onMouseUp={() => this.unselectButton()}
                         className={this.state.activeButton === "stop" ? "stop selected" : "stop"}><IconHandStop/>
                    </div>
                    <div id="turnleft"
                         onMouseDown={(e) => this.handleClick(() => this.setTugHeading(GroundServices.PUSHBACK_TURN, 90), e)}
                         onMouseUp={() => this.unselectButton()}
                         className={this.state.activeButton === "turnleft" ? "down-left selected" : "down-left"}><IconCornerDownLeft/>
                    </div>
                    <div id="down"
                         onMouseDown={(e) => this.handleClick(() => this.setTugHeading(GroundServices.PUSHBACK_TURN, 0), e)}
                         onMouseUp={() => this.unselectButton()}
                         className={this.state.activeButton === "down" ? "down selected" : "down"}><IconArrowDown />
                    </div>
                    <div id="turnright"
                         onMouseDown={(e) => this.handleClick(() => this.setTugHeading(GroundServices.PUSHBACK_TURN, 270), e)}
                         onMouseUp={() => this.unselectButton()}
                         className={this.state.activeButton === "turnright" ? "down-right selected" : "down-right"}><IconCornerDownRight/>
                    </div>
                </div>
                <div className="fuel control-grid">
                    <h1 className="text-white font-medium text-xl">Fuel</h1>
                    <div id="fuel"
                         onMouseDown={(e) => this.handleClick(() => this.toggleGroundAction(GroundServices.TOGGLE_FUEL), e)}
                         onMouseUp={() => this.unselectButton()}
                         className={this.state.activeButton === "fuel" ? "call selected" : "call"}><IconTruck/>
                    </div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div id="baggage"
                         onMouseDown={(e) => this.handleClick(() => this.toggleGroundAction(GroundServices.TOGGLE_CARGO), e)}
                         onMouseUp={() => this.unselectButton()}
                         className={this.state.activeButton === "baggage" ? "call selected" : "call"}><IconBriefcase/>
                    </div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div id="catering"
                         onMouseDown={(e) => this.handleClick(() => this.toggleGroundAction(GroundServices.TOGGLE_CATERING), e)}
                         onMouseUp={() => this.unselectButton()}
                         className={this.state.activeButton === "catering" ? "call selected" : "call"}><IconArchive/>
                    </div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div id="jetway"
                         onMouseDown={(e) => this.handleClick(() => this.toggleGroundAction(GroundServices.TOGGLE_JETWAY), e)}
                         onMouseUp={() => this.unselectButton()}
                         className={this.state.activeButton === "jetway" ? "call selected" : "call"}><IconBuildingArch/>
                    </div>
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
