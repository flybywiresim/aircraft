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
import { IconPlayerPlay, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingArch, IconArchive } from '@tabler/icons'
import { Slider } from '../../Components/Form/Slider';
import { Select, SelectGroup, SelectItem } from '../../Components/Form/Select';
import ProgressBar from "@ramonak/react-progress-bar";
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput'
import '../Styles/Fuel.scss'
import { round } from 'lodash';
import fuselage from '../../Assets/320neo_outline_fuel.svg'
import { useState } from 'react';
import { useSplitSimVar, useSimVar } from '../../../Common/simVars';
import { useSimVarSyncedPersistentProperty } from '../../../Common/persistence';

type FuelPageProps = {
    fuels: {}
};


const FuelWidget = (props: FuelPageProps) => {
    const totalFuel = 18979;
    const outerCells = 1382;
    const outerCell = 691;
    const innerCells = 10998;
    const innerCell = 5499
    const centerTank = 6598
    const currentUnit = "Kg"
    //const [flightPhase] = useSimVar("L:A32NX_FWC_FLIGHT_PHASE", "Enum", 1_000);
    const [simGroundSpeed] = [0] //useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    const [isOnGround] = [true] //useSimVar('SIM ON GROUND', 'Bool', 1_000);
    const [eng1Running] = [false] //useSimVar("ENG COMBUSTION:1", "Bool", 1_000);
    const [eng2Running] = [false] //useSimVar("ENG COMBUSTION:2", "Bool", 1_000);
    const [refuelRate, setRefuelRate] = useState<number>(); // useSimVarSyncedPersistentProperty('L:A32NX_REFUEL_RATE_SETTING', 'Number', 'REFUEL_RATE_SETTING');
    const [sliderValue, setSliderValue] = useState<number>();
    const [totalTarget, setTotalTarget] = useState<number>();
    const [centerTarget, setCenterTarget] = useState<number>();
    const [LInnTarget, setLInnTarget] = useState<number>();
    const [LOutTarget, setLOutTarget] = useState<number>();
    const [RInnTarget, setRInnTarget] = useState<number>();
    const [ROutTarget, setROutTarget] = useState<number>();
    const [totalCurrent, setTotalCurrent] = useState<number>();
    const [centerCurrent, setCenterCurrent] = useState<number>();
    const [LInnCurrent, setLInnCurrent] = useState<number>();
    const [LOutCurrent, setLOutCurrent] = useState<number>();
    const [RInnCurrent, setRInnCurrent] = useState<number>();
    const [ROutCurrent, setROutCurrent] = useState<number>();
    const formatFuelBar = (curr:number, max: number) => {
        let percent = (curr/max)*100
        return 6 + 0.51 * percent
    }
    const airplaneCanRefuel = () => {
        if(simGroundSpeed>0.1 || eng1Running || eng2Running || !isOnGround){
            return false;
        }
        return true;
    }
    const formatRefuelStatusLabel = () => {
        if(airplaneCanRefuel()){
            if(totalTarget == totalCurrent) {
                return "(Available)";
            }
            return (totalTarget > totalCurrent) ? "(Defueling...)" : "(Refueling...)";
        }
        return "(Unavailable)";
    }
    const formatRefuelStatusClass = () => {
        let newClass = 'fuel-truck-avail';
        if(airplaneCanRefuel()){
            if(totalTarget == totalCurrent) {
                return newClass + ' completed-text'
            }
            return newClass + ' in-progress-text'
        }
        return newClass + ' disabled-text'
    }
    const formatFuelFilling = (curr: number, max: number) => {
        let percent = (curr/max)*100;
        return 'linear-gradient(to top, #3b82f6 '+percent+'%,#ffffff00 0%)';
    }
    const setDesiredFuel = (fuel: number) => {
        fuel -= outerCells;
        let outerTank = (outerCells + Math.min(fuel, 0))/2;
        setLOutTarget(outerTank);
        setROutTarget(outerTank);
        if(fuel <= 0) {
            setLInnTarget(0);
            setRInnTarget(0);
            setCenterTarget(0);
            return;
        }
        fuel -= innerCells
        let innerTank = (innerCells + Math.min(fuel, 0))/2;
        setLInnTarget(innerTank);
        setRInnTarget(innerTank);
        if(fuel <= 0) {
            setCenterTarget(0);
            return;
        }
        setCenterTarget(fuel);
    }
    const updateDesiredFuel = (value:string) => {
        let fuel = 0
        if(value.length>0){
            fuel = parseInt(value)
        }
        if(fuel>totalFuel){
            fuel = totalFuel
        }
        setTotalTarget(fuel)
        setSliderValue((fuel/totalFuel)*100);
        setDesiredFuel(fuel)

        setTotalCurrent(16232)
        setCenterCurrent(0)
        setLInnCurrent(2425)
        setRInnCurrent(2425)
        setLOutCurrent(691)
        setROutCurrent(691)
        //setFuelingActive(1);
	}
    const updateSlider = (value: number) => {
        setSliderValue(value);
        let fuel = Math.round(totalFuel * (value/100));
        updateDesiredFuel(fuel.toString());
    }

    return (
        <div className="text-white px-6">
            {/* <div className="fuel-truck control-grid">
                <h1 className="text-white font-medium text-xl">Fuel</h1>
                <div className="call"><IconPlayerPlay/></div>
                <div className="call"><IconTruck/></div>
            </div> */}
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info">
            <h2 className="text-2xl font-medium">Left inner tank</h2>
                <div className="flex mt-4">
                    <div className="fuel-bar" style={{left:''+formatFuelBar(LInnTarget||0,innerCell)+'%'}}></div>
                    <div className="fuel-progress"><ProgressBar height={"10px"} width={"200px"} isLabelVisible={false} bgcolor={'#3b82f6'} completed={((LInnCurrent||0)/innerCell)*100} /></div>
                    <div className="fuel-label"><label>{LInnCurrent||0}/{innerCell} {currentUnit}</label></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info outter">
            <h2 className="text-2xl font-medium">Left outer tank</h2>
                <div className="flex mt-4">
                    <div className="fuel-bar" style={{left:''+formatFuelBar(LOutTarget||0,outerCell)+'%'}}></div>
                    <div className="fuel-progress"><ProgressBar height={"10px"} width={"200px"} isLabelVisible={false} bgcolor={'#3b82f6'} completed={((LOutCurrent||0)/outerCell)*100} /></div>
                    <div className="fuel-label"><label>{LOutCurrent||0}/{outerCell} {currentUnit}</label></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info center-tanks-info">
            <h2 className="text-2xl font-medium">Center tank</h2>
                <div className="flex mt-4">
                    <div className="fuel-bar" style={{left:''+formatFuelBar(centerTarget||0,centerTank)+'%'}}></div>
                    <div className="fuel-progress"><ProgressBar height={"10px"} width={"200px"} isLabelVisible={false} bgcolor={'#3b82f6'} completed={((centerCurrent||0)/centerTank)*100} /></div>
                    <div className="fuel-label"><label>{centerCurrent||0}/{centerTank} {currentUnit}</label></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info refuel-info">
            <h2 className="text-2xl font-medium">Refuel</h2><label className={formatRefuelStatusClass()}>{formatRefuelStatusLabel()}</label>
                    <div className="flex mt-n5">
                        <div className="fuel-progress"><Slider value={sliderValue} onInput={(value) => updateSlider(value)} className="w-48" /></div>
                        <div className="fuel-label"><SimpleInput noLeftMargin={true} placeholder={totalFuel.toString()} number={true} min={0} max={totalFuel} value={totalTarget} onChange={(x) => updateDesiredFuel(x)} /></div>
                        <div className="unit-label">{currentUnit}</div>
                        <div className="separation-line-refuel"></div>
                        <div className="manage-fuel-truck">
                            <div className='call-inop fuel-truck disabled'><IconTruck /></div>
                            <label className="inop-label-fuel-page">Inop.</label>
                        </div>
                    </div>
                    <span>Current fuel :</span>
                    <div className="flex mt-n5">
                        <div className="fuel-progress"><ProgressBar height={"10px"} width={"200px"} isLabelVisible={false} bgcolor={'#3b82f6'} completed={((totalCurrent||0)/totalFuel)*100} /></div>
                        <div className="fuel-label"><label>{totalCurrent||0}/{totalFuel} {currentUnit}</label></div>
                    </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info right-tanks-info">
            <h2 className="text-2xl font-medium">Right inner tank</h2>
                <div className="flex mt-4">
                    <div className="fuel-bar" style={{left:''+formatFuelBar(RInnTarget||0,innerCell)+'%'}}></div>
                    <div className="fuel-progress"><ProgressBar height={"10px"} width={"200px"} isLabelVisible={false} bgcolor={'#3b82f6'} completed={((RInnCurrent||0)/innerCell)*100} /></div>
                    <div className="fuel-label"><label>{RInnCurrent||0}/{innerCell} {currentUnit}</label></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info right-tanks-info outter">
            <h2 className="text-2xl font-medium">Right outer tank</h2>
                <div className="flex mt-4">
                    <div className="fuel-bar" style={{left:''+formatFuelBar(ROutTarget||0,outerCell)+'%'}}></div>
                    <div className="fuel-progress"><ProgressBar height={"10px"} width={"200px"} isLabelVisible={false} bgcolor={'#3b82f6'} completed={((ROutCurrent||0)/outerCell)*100} /></div>
                    <div className="fuel-label"><label>{ROutCurrent||0}/{outerCell} {currentUnit}</label></div>
                </div>
            </div>
            <div className='wrapper visible-tank center-tank' style={{background:formatFuelFilling(centerCurrent||0,centerTank)}}>
            </div>
            <div className='wrapper visible-tank inner-left-tank' style={{background:formatFuelFilling(LInnCurrent||0,innerCell)}}>
            </div>
            <div className='wrapper visible-tank inner-right-tank' style={{background:formatFuelFilling(RInnCurrent||0,innerCell)}}>
            </div>
            <div className='wrapper visible-tank outer-left-tank' style={{background:formatFuelFilling(LOutCurrent||0,outerCell)}}>
            </div>
            <div className='wrapper visible-tank outer-right-tank' style={{background:formatFuelFilling(ROutCurrent||0,outerCell)}}>
            </div>
            <img className="airplane-fuel w-full" src={fuselage} />
            <div className="bg-gray-800 rounded-xl text-white shadow-lg mr-4 overflow-x-hidden refuel-speed">
                <div className="mb-3.5 flex flex-row justify-between items-center">
                    <span className="text-lg text-gray-300">Refuel Time</span>
                    <SelectGroup>
                        <SelectItem selected={refuelRate == 2} onSelect={() => setRefuelRate(2)}>Instant</SelectItem>
                        <SelectItem selected={refuelRate == 1} onSelect={() => setRefuelRate(1)}>Fast</SelectItem>
                        <SelectItem selected={refuelRate == 0} onSelect={() => setRefuelRate(0)}>Real</SelectItem>
                    </SelectGroup>
                </div>
            </div>
            <div className='wrapper hiding-block hiding-block-top-left'></div>
            <div className='wrapper hiding-block hiding-block-bottom-left'></div>
            <div className='wrapper hiding-block hiding-block-top-right'></div>
            <div className='wrapper hiding-block hiding-block-bottom-right'></div>
        </div>
    );
};

export default FuelWidget;
