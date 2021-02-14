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
import { IconCornerDownLeft, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingArch, IconArchive } from '@tabler/icons'
import './Ground.scss'
import fuselage from '../Assets/320neo-outline-upright.svg'
import { useSimVar, useSplitSimVar } from '../../Common/simVars';

function Ground() {

    const [tugActive, setTugActive] = useState(false);
    const [activeButtons, setActiveButtons] = useState(new Array<string>());
    const [jetWayActive, setJetWayActive] = useSplitSimVar('A:EXIT OPEN:0', 'Enum', 'K:TOGGLE_JETWAY', 'bool', 500);
    const [cargoActive, setCargoActive] = useSplitSimVar('A:EXIT OPEN:5', 'Enum', 'K:REQUEST_LUGGAGE', 'bool', 500);
    const [cateringActive, setCateringActive] = useSplitSimVar('A:EXIT OPEN:3', 'Enum', 'K:REQUEST_CATERING', 'bool', 500);
    const [fuelingActive, setFuelingActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:9', 'percent', 'K:REQUEST_FUEL_KEY', 'bool');
    const [tugHeading, setTugHeading] = useSplitSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 'K:KEY_TUG_HEADING', 'UINT32');
    const [pushBack, setPushBack] = useSimVar('K:TOGGLE_PUSHBACK', 'bool');

    const getTugHeading = (value: number): number => {
        return (tugHeading  + value) % 360;
    }

     const computeAndSetTugHeading = (direction: number) => {
        if (!tugActive) {
            togglePushback(true);
        }
        const tugHeading = getTugHeading(direction);
        // KEY_TUG_HEADING is an unsigned integer, so let's convert
        setTugHeading((tugHeading * 11930465) & 0xffffffff);
    }

    const togglePushback = (targetState: boolean) => {
        if (tugActive != targetState) {
            setPushBack(targetState);
            setTugActive(targetState);
        }
    }

    const handleClick = (callBack: () => void, event: React.MouseEvent) => {
        let updatedState = activeButtons;
        if (!tugActive) {
            const index = activeButtons.indexOf(event.currentTarget.id);
            if (index > -1) {
                updatedState.splice(index, 1);
                setActiveButtons(updatedState);
            }
            callBack();
        }
    }

    const handlePushBackClick = (callBack: () => void, event: React.MouseEvent) => {
        setActiveButtons([event.currentTarget.id]);
        callBack();
    }

    const applySelected = (className: string, id?: string, gameSync?) => {

        if(gameSync != undefined && id) {
            if (gameSync === 1) {
                if (!activeButtons.includes(id)) {
                    activeButtons.push(id);
                }
                return className + ' selected';
            } else {
                if (activeButtons.includes(id)) {
                    const updatedActiveButtons = activeButtons;
                    updatedActiveButtons.splice(activeButtons.indexOf(id));
                    setActiveButtons(updatedActiveButtons);
                }
                return className;
            }
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
                    onMouseDown={(e) => handlePushBackClick(() => computeAndSetTugHeading(90), e)}
                    className={applySelected('down-left')}><IconCornerDownLeft/>
                </div>
                <div id="down"
                    onMouseDown={(e) => handlePushBackClick(() => computeAndSetTugHeading(0), e)}
                    className={applySelected('down')}><IconArrowDown />
                </div>
                <div id="down-right"
                    onMouseDown={(e) => handlePushBackClick(() => computeAndSetTugHeading(270), e)}
                    className={applySelected('down-right')}><IconCornerDownRight/>
                </div>
                </div>
                <div className="fuel control-grid">
                    <h1 className="text-white font-medium text-xl">Fuel</h1>
                    <div id="fuel"
                         onMouseDown={(e) => handleClick(() => setFuelingActive(1), e)}
                         className={applySelected('call', 'fuel', fuelingActive)}><IconTruck/>
                    </div>
                </div>
                <div className="baggage control-grid">
                    <h1 className="text-white font-medium text-xl">Baggage</h1>
                    <div id="baggage"
                         onMouseDown={(e) => handleClick(() => setCargoActive(1), e)}
                         className={applySelected('call', 'baggage', cargoActive)}><IconBriefcase/>
                    </div>
                </div>
                <div className="catering control-grid">
                    <h1 className="text-white font-medium text-xl">Catering</h1>
                    <div id="catering"
                         onMouseDown={(e) => handleClick(() => setCateringActive(1), e)}
                         className={applySelected('call', 'catering', cateringActive)}><IconArchive/>
                    </div>
                </div>
                <div className="jetway control-grid">
                    <h1 className="text-white font-medium text-xl">Jetway</h1>
                    <div id="jetway"
                         onMouseDown={(e) => handleClick(() => setJetWayActive(1), e)}
                         className={applySelected('call', 'jetway', jetWayActive)}><IconBuildingArch/>
                    </div>
                </div>
            </div>
        );
    };

export default Ground;
