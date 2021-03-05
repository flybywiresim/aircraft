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
import { IconCornerDownLeft, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingArch, IconArchive, IconStairsUp, IconPlug } from '@tabler/icons';
import './Ground.scss';
import fuselage from '../Assets/320neo-outline-upright.svg';
import { useSplitSimVar } from '../../Common/simVars';
import Button, { BUTTON_TYPE } from '../Components/Button/Button';

export const Ground: React.FC = () => {
    const [activeButtons, setActiveButtons] = useState <string[]>([]);
    const [jetWayActive, setJetWayActive] = useSplitSimVar('A:EXIT OPEN:0', 'Enum', 'K:TOGGLE_JETWAY', 'bool', 1000);
    const [_rampActive, setRampActive] = useSplitSimVar('A:EXIT OPEN:0', 'Enum', 'K:TOGGLE_RAMPTRUCK', 'bool', 1000);
    const [cargoActive, setCargoActive] = useSplitSimVar('A:EXIT OPEN:5', 'Enum', 'K:REQUEST_LUGGAGE', 'bool', 1000);
    const [cateringActive, setCateringActive] = useSplitSimVar('A:EXIT OPEN:3', 'Enum', 'K:REQUEST_CATERING', 'bool', 1000);
    const [fuelingActive, setFuelingActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:9', 'percent', 'K:REQUEST_FUEL_KEY', 'bool', 1000);
    const [tugHeading, setTugHeading] = useSplitSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 'K:KEY_TUG_HEADING', 'UINT32', 1000);
    const [pushBack, setPushBack] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 1000);
    const [powerActive, setPowerActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:8', 'percent', 'K:REQUEST_POWER_SUPPLY', 'bool', 1000);
    const [tugDirection, setTugDirection] = useState(0);
    const [tugActive, setTugActive] = useState(false);

    /**
     * allows a direction to be selected directly
     * rather than first backwards and after that the direction
     */
    useEffect(() => {
        if (pushBack === 0 && tugDirection !== 0) {
            computeAndSetTugHeading(tugDirection);
            setTugDirection(0);
        }
    });

    const getTugHeading = (value: number): number => (tugHeading + value) % 360;

    const computeAndSetTugHeading = (direction: number) => {
        if (!tugActive) {
            togglePushback(true);
        }
        const tugHeading = getTugHeading(direction);
        // KEY_TUG_HEADING is an unsigned integer, so let's convert
        /* eslint no-bitwise: ["error", { "allow": ["&"] }] */
        setTugHeading((tugHeading * 11930465) & 0xffffffff);
        setTugDirection(direction);
    };

    const togglePushback = (targetState: boolean) => {
        if (tugActive !== targetState) {
            setPushBack(targetState);
            setTugActive(targetState);
        }
    };

    const handleClick = (callBack: () => void, event: React.MouseEvent) => {
        const updatedState = activeButtons;
        if (!activeButtons.includes(event.currentTarget.id)) {
            activeButtons.push(event.currentTarget.id);
            callBack();

            // return className;
        } else if (!tugActive) {
            const index = activeButtons.indexOf(event.currentTarget.id);
            if (index > -1) {
                updatedState.splice(index, 1);
                setActiveButtons(updatedState);
            }
            callBack();
        }
    };

    /**
     * Pushback actions disable all other services
     * So all highlighting should be removed as well
     */
    const handlePushBackClick = (callBack: () => void, event: React.MouseEvent) => {
        setActiveButtons([event.currentTarget.id]);
        callBack();
    };

    const applySelected = (className: string, id?: string) => {
        if (id && id !== 'stop') {
            console.log(`vtuh${id}`);
            return className + (activeButtons.includes(id) ? ' text-white bg-green-600 border-green-600'
                : ' border-blue-500 hover:bg-blue-600 hover:border-blue-600 bg-blue-500 text-blue-darkest');
        }
        return className;
    };

    /**
     * Applies highlighting of an activated service based on SimVars
     * This ensures the displayed state is in sync with the active services
     */
    const applySelectedWithSync = (className: string, id: string, gameSync) => {
        if (gameSync > 0 && activeButtons.includes(id)) {
            return `${className} bg-green-500 border-green-500 text-white`;
        }

        if (gameSync > 0 && !activeButtons.includes(id)) {
            return `${className} text-white, border-white, bg-gray-600`;
        }
        return className + (activeButtons.includes(id) ? ' text-white border-green-600, bg-gray-600'
            : '  border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 text-blue-darkest');
    };

    return (
        <div className="wrapper flex-grow flex flex-col">
            <img className="airplane w-full" src={fuselage} />
            <div className="left-1/4 grid grid-cols-2 control-grid absolute top-12">
                <div className="">
                    <h1 className="text-white font-medium text-xl text-center pb-1">Jetway</h1>
                    <Button
                        onClick={(e) => handleClick(() => setJetWayActive(1), e)}
                        className={applySelectedWithSync('call w-32 ', 'jetway', jetWayActive)}
                        text=""
                        type={BUTTON_TYPE.NONE}
                        id="jetway"
                    >
                        <IconBuildingArch size="3rem" stroke="1.5" />
                    </Button>
                </div>
                <div className="">
                    <h1 className="text-white font-medium text-xl text-center pb-1">Stairs</h1>
                    <Button
                        onClick={(e) => handleClick(() => setRampActive(1), e)}
                        className={applySelectedWithSync('call  w-32 ', 'jetway', jetWayActive)}
                        text=""
                        type={BUTTON_TYPE.NONE}
                        id="jetway"
                    >
                        <IconStairsUp size="3rem" stroke="1.5" />
                    </Button>
                </div>
            </div>

            <div className="left-1/4 grid grid-cols-1 control-grid absolute top-48">
                <div className="">
                    <h1 className="text-white font-medium text-xl text-center pb-1">Fuel</h1>
                    <Button
                        onClick={(e) => handleClick(() => setFuelingActive(1), e)}
                        className={applySelectedWithSync('call w-32', 'fuel', fuelingActive)}
                        text=""
                        type={BUTTON_TYPE.NONE}
                        id="fuel"
                    >
                        <IconTruck size="3rem" stroke="1.5" />
                    </Button>
                </div>
            </div>

            <div className="right-1/4 grid grid-cols-2 control-grid absolute top-12">

                <div>
                    <h1 className="text-white font-medium text-xl text-center pb-1">Baggage</h1>
                    <Button
                        onClick={(e) => handleClick(() => setCargoActive(1), e)}
                        className={applySelectedWithSync('call w-32', 'baggage', cargoActive)}
                        text=""
                        type={BUTTON_TYPE.NONE}
                        id="baggage"
                    >
                        <IconBriefcase size="3rem" stroke="1.5" />
                    </Button>
                </div>
                <div>
                    <h1 className="text-white font-medium text-xl text-center pb-1">Ground Power</h1>
                    <Button
                        onClick={(e) => handleClick(() => setPowerActive(1), e)}
                        className={applySelectedWithSync('call w-32', 'power', powerActive)}
                        text=""
                        type={BUTTON_TYPE.NONE}
                        id="power"
                    >
                        <IconPlug size="3rem" stroke="1.5" />
                    </Button>
                </div>
            </div>
            <div className="right-1/4 grid grid-cols-2 control-grid absolute bottom-36">
                <div>
                    <h1 className="text-white font-medium text-xl text-center pb-1">Catering</h1>
                    <Button
                        onClick={(e) => handleClick(() => setCateringActive(1), e)}
                        className={applySelectedWithSync('call  w-32', 'catering', cateringActive)}
                        text=""
                        type={BUTTON_TYPE.NONE}
                        id="catering"
                    >
                        <IconArchive size="3rem" stroke="1.5" />

                    </Button>
                </div>
            </div>

            <div className="right-0 mr-4 grid grid-cols-3 absolute bottom-16 control-grid">
                <div className="stop">
                    <h1 className="text-white font-medium text-xl text-center">Pushback</h1>
                    <Button
                        id="stop"
                        text=""
                        onClick={(e) => handlePushBackClick(() => togglePushback(false), e)}
                        className={applySelected('w-32 stop bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 text-blue-darkest', 'stop')}
                        type={BUTTON_TYPE.NONE}
                    >
                        <IconHandStop size="3rem" stroke="1.5" />
                    </Button>
                </div>

                <Button
                    id="down-left"
                    text=""
                    type={BUTTON_TYPE.NONE}
                    onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(90), e)}
                    className={applySelected('w-32 down-left', 'down-left')}
                >
                    <IconCornerDownLeft size="3rem" stroke="1.5" />
                </Button>
                <Button
                    id="down"
                    text=""
                    type={BUTTON_TYPE.NONE}
                    onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(0), e)}
                    className={applySelected('down w-32 down', 'down')}
                >
                    <IconArrowDown size="3rem" stroke="1.5" />
                </Button>
                <Button
                    id="down-right"
                    text=""
                    type={BUTTON_TYPE.NONE}
                    onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(270), e)}
                    className={applySelected('w-32 down-right', 'down-right')}
                >
                    <IconCornerDownRight size="3rem" stroke="1.5" />
                </Button>
            </div>

        </div>
    );
};

export default Ground;
