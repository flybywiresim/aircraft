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
import { StatefulSimVar } from '../../RMP/Framework/StatefulSimVar.mjs'


type GroundState = {
    tugActive: boolean;
    activeButtons: Array<string>;
   // jetWay: StatefulSimVar;
}

function Ground() {

    const [tugActive, setTugActive] = useState(false);
    const [activeButtons, setActiveButtons] = useState(new Array<string>());

    let timer;

    console.log("BRUH");

    const jetWayActive = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:0`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });


    const cargoActive = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:5`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });

    const cateringActive = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:3`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });
    const jetWayActive1 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:0`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });


    const cargoActive1 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:5`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });

    const cateringActive1 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:3`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });
    const jetWayActive2 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:0`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });


    const cargoActive2 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:5`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });

    const cateringActive2 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:3`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });

    const jetWayActive3 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:0`,
        refreshRate: 1000,
        simVarType: 'Enum'
    });


    const cargoActive3 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:5`,
        refreshRate: 1000000,
        simVarType: 'Enum'
    });

    const cateringActive3 = new StatefulSimVar({
        simVarGetter: `A:EXIT OPEN:3`,
        refreshRate: 1000000,
        simVarType: 'Enum'
    });


    useEffect(() => {
        console.log("HELLP");
        return () => clearTimeout(timer);
    })


    const toggleGroundAction = (action: GroundServices) => {
        setSimVar(action, "1", "boolean");
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
            setSimVar(GroundServices.TOGGLE_PUSHBACK, 1, "boolean");
            setTugActive(targetState);
        }
    }

    const handleClick = (callBack: () => void, event: React.MouseEvent) => {
        let updatedState = activeButtons;
        if (!tugActive) {
            const index = activeButtons.indexOf(event.currentTarget.id, 0);
            if (index > -1) {
                updatedState.splice(index, 1);
                setActiveButtons(updatedState);
                callBack();
            } else {
                updatedState.push(event.currentTarget.id)
                setActiveButtons(updatedState);
                callBack();
            }
        }
    }

    const handlePushBackClick = (callBack: () => void, event: React.MouseEvent) => {
        if(event.currentTarget.id === "stop") {
            if(tugActive) {
                timedClick(event);
                setActiveButtons([event.currentTarget.id]);
                callBack();
            }
        } else {
            setActiveButtons([event.currentTarget.id]);
            callBack();
        }
    }

    const timedClick = (event: React.MouseEvent) => {
        const buttonId = event.currentTarget.id;
        let handler: TimerHandler = () => {
            const timedButtonId = buttonId;
            const index = activeButtons.indexOf(timedButtonId, 0);
            if(index > -1) {
                const updatedState = activeButtons;
                updatedState.splice(index, 1);
                setActiveButtons(updatedState);
            }
        }
        timer = setTimeout(handler, 2000);
    }

    const applySelected = (className: string, id?: string, gameSync?: StatefulSimVar) => {
        if(gameSync) {
          //  console.log("GAMESYNC "+gameSync.value);

            return className + (gameSync.value > 0.5 ?  ' selected':'');
        }
        if (id) {
            return className + (activeButtons.includes(id) ? ' selected' : '');
        }
        return className + (activeButtons.includes(className) ? ' selected' : '');

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
                         className={applySelected('call', 'fuel')}><IconTruck/>
                    </div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div id="baggage"
                         onMouseDown={(e) => handleClick(() => toggleGroundAction(GroundServices.TOGGLE_CARGO), e)}
                         className={applySelected('call', '',cargoActive)}><IconBriefcase/>
                    </div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div id="catering"
                         onMouseDown={(e) => handleClick(() => toggleGroundAction(GroundServices.TOGGLE_CATERING), e)}
                         className={applySelected('call', '',cateringActive)}><IconArchive/>
                    </div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div id="jetway"
                         onMouseDown={(e) => handleClick(() => toggleGroundAction(GroundServices.TOGGLE_JETWAY), e)}
                         className={applySelected('call', '',jetWayActive)}><IconBuildingArch/>
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

export default Ground;
