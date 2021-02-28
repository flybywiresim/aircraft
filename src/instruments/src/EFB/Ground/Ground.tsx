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
import { IconCornerDownLeft, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingArch, IconArchive, IconStairsUp, IconPower } from '@tabler/icons';
import './Ground.scss';
import fuselage from '../Assets/320neo-outline-upright.svg';
import { useSplitSimVar } from '../../Common/simVars';

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
        if (!tugActive) {
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
        if (id) {
            return className + (activeButtons.includes(id) ? ' selected' : '');
        }
        return className + (activeButtons.includes(className) ? ' selected' : '');
    };

    /**
     * Applies highlighting of an activated service based on SimVars
     * This ensures the displayed state is in sync with the active services
     */
    const applySelectedWithSync = (className: string, id: string, gameSync) => {
        if (gameSync > 0) {
            if (!activeButtons.includes(id)) {
                activeButtons.push(id);
            }
            return `${className} selected`;
        } if (activeButtons.includes(id)) {
            const updatedActiveButtons = activeButtons;
            updatedActiveButtons.splice(activeButtons.indexOf(id));
            setActiveButtons(updatedActiveButtons);
        }
        return className;
    };

    return (
        <div className="wrapper flex-grow flex flex-col">
            <img className="airplane w-full" src={fuselage} />
            <div className="pushback control-grid">
                <h1 className="text-white font-medium text-xl">Pushback</h1>
                <div
                    id="stop"
                    onMouseDown={(e) => handlePushBackClick(() => togglePushback(false), e)}
                    className={applySelected('stop')}
                >
                    <IconHandStop />
                </div>
                <div
                    id="down-left"
                    onMouseDown={(e) => handlePushBackClick(() => computeAndSetTugHeading(90), e)}
                    className={applySelected('down-left')}
                >
                    <IconCornerDownLeft />
                </div>
                <div
                    id="down"
                    onMouseDown={(e) => handlePushBackClick(() => computeAndSetTugHeading(0), e)}
                    className={applySelected('down')}
                >
                    <IconArrowDown />
                </div>
                <div
                    id="down-right"
                    onMouseDown={(e) => handlePushBackClick(() => computeAndSetTugHeading(270), e)}
                    className={applySelected('down-right')}
                >
                    <IconCornerDownRight />
                </div>
            </div>
            <div className="fuel control-grid">
                <h1 className="text-white font-medium text-xl">Fuel</h1>
                <div
                    id="fuel"
                    onMouseDown={(e) => handleClick(() => setFuelingActive(1), e)}
                    className={applySelectedWithSync('call', 'fuel', fuelingActive)}
                >
                    <IconTruck />
                </div>
            </div>
            <div className="baggage control-grid">
                <h1 className="text-white font-medium text-xl">Baggage</h1>
                <div
                    id="baggage"
                    onMouseDown={(e) => handleClick(() => setCargoActive(1), e)}
                    className={applySelectedWithSync('call', 'baggage', cargoActive)}
                >
                    <IconBriefcase />
                </div>
            </div>
            <div className="power control-grid">
                <h1 className="text-white font-medium text-xl">Ground Power</h1>
                <div
                    id="baggage"
                    onMouseDown={(e) => handleClick(() => setPowerActive(1), e)}
                    className={applySelectedWithSync('call', 'power', powerActive)}
                >
                    <IconPower />
                </div>
            </div>
            <div className="catering control-grid">
                <h1 className="text-white font-medium text-xl">Catering</h1>
                <div
                    id="catering"
                    onMouseDown={(e) => handleClick(() => setCateringActive(1), e)}
                    className={applySelectedWithSync('call', 'catering', cateringActive)}
                >
                    <IconArchive />
                </div>
            </div>
            <div className="jetway control-grid">
                <h1 className="text-white font-medium text-xl">Jetway</h1>
                <div
                    id="jetway"
                    onMouseDown={(e) => handleClick(() => setJetWayActive(1), e)}
                    className={applySelectedWithSync('call', 'jetway', jetWayActive)}
                >
                    <IconBuildingArch />
                </div>
            </div>
            <div className="ramp control-grid">
                <h1 className="text-white font-medium text-xl">Stairs</h1>
                <div
                    id="ramp"
                    onMouseDown={(e) => handleClick(() => setRampActive(1), e)}
                    className={applySelectedWithSync('call', 'jetway', jetWayActive)}
                >
                    <IconStairsUp />
                </div>
            </div>
        </div>
    );
};

export default Ground;
