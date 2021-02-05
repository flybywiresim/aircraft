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
import { IconCornerDownLeft, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingArch, IconArchive, IconHandFinger } from '@tabler/icons'

import './Ground.scss'
import fuselage from '../Assets/320neo-outline-upright.svg'
import {setSimVar, getSimVar} from '../../util.mjs'

type GroundProps = {}

type GroundState = {
    tugActive: boolean;
    activeButtons: Array<string>
}

let timer: number;

class Ground extends React.Component<GroundProps, GroundState> {

    constructor(props: GroundProps) {
        super(props);

        this.state = {
            tugActive: false,
            activeButtons: new Array(),
        };
    }

    componentWillUnmount() {
        clearTimeout(timer);
    }

    toggleGroundAction(action: GroundServices) {
        setSimVar(action, "1", "boolean");
    }

    setTugHeading(action: GroundServices, direction: number) {
            if (!this.state.tugActive) {
                this.togglePushback(true);
            }
            const tugHeading = this.getTugHeading(direction);
            // KEY_TUG_HEADING is an unsigned integer, so let's convert
            setSimVar(action, (tugHeading * 11930465) & 0xffffffff, "UINT32");

    }

    getTugHeading(value: number): number {
        const currentHeading = getSimVar("PLANE HEADING DEGREES TRUE", "degrees");
        return (currentHeading  + value) % 360;
    }

    togglePushback(targetState: boolean) {
        const tugActive = this.state.tugActive;

        if (tugActive != targetState) {
            setSimVar(GroundServices.TOGGLE_PUSHBACK, 1, "boolean");
            this.setState({
                tugActive: targetState
            });
        }
    }

    handleClick(callBack: () => void, event: React.MouseEvent) {
        let updatedState = this.state.activeButtons;
        if (!this.state.tugActive) {
            const index = this.state.activeButtons.indexOf(event.currentTarget.id, 0);
            if (index > -1) {
                updatedState.splice(index, 1);
                this.setState({
                    activeButtons: updatedState
                });
                callBack();
            } else {
                updatedState.push(event.currentTarget.id)
                    this.setState({
                        activeButtons: updatedState
                });
                callBack();
            }
        }
    }

    handlePushBackClick(callBack: () => void, event: React.MouseEvent) {
        if(event.currentTarget.id === "stop") {
            if(this.state.tugActive) {
                this.timedClick(event);
                this.setState({
                    activeButtons: [event.currentTarget.id]
                });
                callBack();
            }
        } else {
            this.setState({
                activeButtons: [event.currentTarget.id]
            });
            callBack();
        }
    }

    timedClick(event: React.MouseEvent) {
        const buttonId = event.currentTarget.id;
        let handler: TimerHandler = () => {
            const timedButtonId = buttonId;
            const index = this.state.activeButtons.indexOf(timedButtonId, 0);
            if(index > -1) {
                const updatedState = this.state.activeButtons;
                updatedState.splice(index, 1);
                this.setState({
                    activeButtons: updatedState
                });
            }
        }
        timer = setTimeout(handler, 2000);
    }

    applySelected(className: string, id?: string) {
        if (id) {
            return className + (this.state.activeButtons.includes(id) ? ' selected' : '');
        }
        return className + (this.state.activeButtons.includes(className) ? ' selected' : '');
     }

    render() {
        return (
            <div className="wrapper flex-grow flex flex-col">
                <img className="airplane w-full" src={fuselage} />
                <div className="pushback control-grid">
                    <h1 className="text-white font-medium text-xl">Pushback</h1>
                    <div id="stop"
                         onMouseDown={(e) => this.handlePushBackClick(() => this.togglePushback(false), e)}
                         className={this.applySelected('stop')}><IconHandStop/>
                    </div>
                    <div id="down-left"
                         onMouseDown={(e) => this.handlePushBackClick(() => this.setTugHeading(GroundServices.PUSHBACK_TURN, 90), e)}
                         className={this.applySelected('down-left')}><IconCornerDownLeft/>
                    </div>
                    <div id="down"
                         onMouseDown={(e) => this.handlePushBackClick(() => this.setTugHeading(GroundServices.PUSHBACK_TURN, 0), e)}
                         className={this.applySelected('down')}><IconArrowDown />
                    </div>
                    <div id="down-right"
                         onMouseDown={(e) => this.handlePushBackClick(() => this.setTugHeading(GroundServices.PUSHBACK_TURN, 270), e)}
                         className={this.applySelected('down-right')}><IconCornerDownRight/>
                    </div>
                </div>
                <div className="fuel control-grid">
                    <h1 className="text-white font-medium text-xl">Fuel</h1>
                    <div id="fuel"
                         onMouseDown={(e) => this.handleClick(() => this.toggleGroundAction(GroundServices.TOGGLE_FUEL), e)}
                         className={this.applySelected('call', 'fuel')}><IconTruck/>
                    </div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div id="baggage"
                         onMouseDown={(e) => this.handleClick(() => this.toggleGroundAction(GroundServices.TOGGLE_CARGO), e)}
                         className={this.applySelected('call', 'baggage')}><IconBriefcase/>
                    </div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div id="catering"
                         onMouseDown={(e) => this.handleClick(() => this.toggleGroundAction(GroundServices.TOGGLE_CATERING), e)}
                         className={this.applySelected('call', 'catering')}><IconArchive/>
                    </div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div id="jetway"
                         onMouseDown={(e) => this.handleClick(() => this.toggleGroundAction(GroundServices.TOGGLE_JETWAY), e)}
                         className={this.applySelected('call', 'jetway')}><IconBuildingArch/>
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
