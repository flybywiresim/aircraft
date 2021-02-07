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

import React, { useEffect, useState } from 'react';
import { IconCornerDownLeft, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingArch, IconArchive, IconHandFinger } from '@tabler/icons'

import './Ground.scss'
import fuselage from '../Assets/320neo-outline-upright.svg'
import {setSimVar, getSimVar} from '../../util.mjs'
import { useSimVar } from '../../Common/SimVarProvider';
import SimPlane from '../../../../../typings/fs-base-ui/html_ui/JS/SimPlane'


function Ground() {

    const [tugActive, setTugActive] = useState(false);
    const [activeButtons, setActiveButtons] = useState(new Array<StatefulButton>());
    const [jetWayActive] = useSimVar('A:EXIT OPEN:0', 'Enum', 500);
    const [cargoActive] = useSimVar('A:EXIT OPEN:5', 'Enum', 500);
    const [cateringActive] = useSimVar('A:EXIT OPEN:3', 'Enum', 500);
    const [fuelingActive] = useSimVar('A:INTERACTIVE POINT OPEN:9','percent', 500);

    const toggleGroundAction = (action: GroundServices) => {
        setSimVar(action, "1", "bool");
    }

    const setTugHeading = (action: GroundServices, direction: number) => {
        if (!tugActive) {
            togglePushback(true);
        }
        const tugHeading = getTugHeading(direction);
        // KEY_TUG_HEADING is an unsigned integer, so let's convert
        setSimVar(action, (tugHeading * 11930465) & 0xffffffff, "UINT32");
    }

    const getTugHeading = (value: number): number => {
        const currentHeading = getSimVar("PLANE HEADING DEGREES TRUE", "degrees");
        return (currentHeading  + value) % 360;
    }

    const togglePushback = (targetState: boolean) => {
        if (tugActive != targetState) {
            setSimVar(GroundServices.TOGGLE_PUSHBACK, 1, "bool");
            setTugActive(targetState);
        }
    }

    const handleClick = (callBack: () => void, event: React.MouseEvent) => {
        let updatedState = activeButtons;
        if (!tugActive) {
            const index = activeButtons.findIndex( b => b.id === event.currentTarget.id);
            if (index > -1) {
                updatedState.splice(index, 1);
                setActiveButtons(updatedState);
                callBack();
            } else {
                updatedState.push(new StatefulButton(event.currentTarget.id, ButtonState.WAITING));
                setActiveButtons(updatedState);
                callBack();
            }
        }
    }

    const handlePushBackClick = (callBack: () => void, event: React.MouseEvent) => {
        setActiveButtons([new StatefulButton(event.currentTarget.id, ButtonState.ACTIVE)]);
        callBack();
    }

    const applySelected = (className: string, id?: string, gameSync?) => {

        console.log(gameSync + " classname " + className + " id " + id);
        if(gameSync != undefined) {
            if (gameSync === 1) {
                if(!activeButtons.find(b => b.id === id)) {
                    activeButtons.push(new StatefulButton(id, ButtonState.ACTIVE));
                }
                return className + ' selected';
            } else {
                return className + (activeButtons.find(b => b.id === id && b.state === ButtonState.WAITING) ? ' waiting' : '');;
            }
        }
        if (id) {
            return className + (activeButtons.find(b => b.id === id && b.state === ButtonState.ACTIVE) ? ' selected' : '');
        }
        return className + (activeButtons.find(b => b.id === className && b.state === ButtonState.ACTIVE) ? ' selected' : '');
     }

    return (
        <div className="wrapper flex-grow flex flex-col">
            <img className="airplane w-full" src={fuselage} />
            <div className="pushback control-grid">
                <h1 className="text-white font-medium text-xl">Pushback</h1>
                <div id="stop"
                    onMouseDown={(e) => handlePushBackClick(() => togglePushback(false), e)}
                    className={applySelected('stop')}><IconHandStop/>
                </div>
                <div id="down-left"
                    onMouseDown={(e) => handlePushBackClick(() => setTugHeading(GroundServices.PUSHBACK_TURN, 90), e)}
                    className={applySelected('down-left')}><IconCornerDownLeft/>
                </div>
                <div id="down"
                    onMouseDown={(e) => handlePushBackClick(() => setTugHeading(GroundServices.PUSHBACK_TURN, 0), e)}
                    className={applySelected('down')}><IconArrowDown />
                </div>
                <div id="down-right"
                    onMouseDown={(e) => handlePushBackClick(() => setTugHeading(GroundServices.PUSHBACK_TURN, 270), e)}
                    className={applySelected('down-right')}><IconCornerDownRight/>
                </div>
                </div>
                <div className="fuel control-grid">
                    <h1 className="text-white font-medium text-xl">Fuel</h1>
                    <div id="fuel"
                         onMouseDown={(e) => handleClick(() => toggleGroundAction(GroundServices.TOGGLE_FUEL), e)}
                         className={applySelected('call', 'fuel', fuelingActive)}><IconTruck/>
                    </div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div id="baggage"
                         onMouseDown={(e) => handleClick(() => toggleGroundAction(GroundServices.TOGGLE_CARGO), e)}
                         className={applySelected('call', 'baggage', cargoActive)}><IconBriefcase/>
                    </div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div id="catering"
                         onMouseDown={(e) => handleClick(() => toggleGroundAction(GroundServices.TOGGLE_CATERING), e)}
                         className={applySelected('call', 'catering', cateringActive)}><IconArchive/>
                    </div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div id="jetway"
                         onMouseDown={(e) => handleClick(() => toggleGroundAction(GroundServices.TOGGLE_JETWAY), e)}
                         className={applySelected('call', 'jetway', jetWayActive)}><IconBuildingArch/>
                    </div>
                </div>
            </div>
        );
    };

enum GroundServices {
    TOGGLE_PUSHBACK = "K:TOGGLE_PUSHBACK",
    PUSHBACK_TURN = "K:KEY_TUG_HEADING",
    TOGGLE_JETWAY = "K:TOGGLE_JETWAY",
    TOGGLE_STAIRS = "K:TOGGLE_RAMPTRUCK",
    TOGGLE_CARGO = "K:REQUEST_LUGGAGE",
    TOGGLE_CATERING = "K:REQUEST_CATERING",
    TOGGLE_FUEL = "K:REQUEST_FUEL_KEY"
}
enum ButtonState {
    ACTIVE,
    WAITING,
    INACTIVE
}

class StatefulButton {
    id: string;
    state: ButtonState;
    className: string;

    constructor(id, state) {
        this.state = state;
        this.id = id;
    }
}

export default Ground;
