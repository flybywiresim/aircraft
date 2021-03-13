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

import React, { useState } from 'react';
import { round } from 'lodash';
import { IconTruck } from '@tabler/icons';
import { Slider } from '../../Components/Form/Slider';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import { ProgressBar } from '../../Components/Progress/Progress';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import '../Styles/Fuel.scss';
import fuselage from '../../Assets/320neo_outline_fuel.svg';
import { useSimVar } from '../../../Common/simVars';
import { useSimVarSyncedPersistentProperty } from '../../../Common/persistence';

type FuelPageProps = {
    fuels: {}
};

export const FuelPage = (props: FuelPageProps) => {
    const totalFuelGallons = 6243;
    const outerCellGallon = 227;
    const innerCellGallon = 1809;
    const centerTankGallon = 2173;
    const [usingMetrics, setUsingMetrics] = useSimVarSyncedPersistentProperty('L:A32NX_CONFIG_USING_METRIC_UNIT', 'Number', 'CONFIG_USING_METRIC_UNIT');
    const currentUnit = () => {
        return usingMetrics === 1 ? 'Kgs' : 'Lbs';
    }
    const convertUnit = () => {
        return usingMetrics === 1 ? 1 : 2.20462;
    }
    const [galToKg] = useSimVar('FUEL WEIGHT PER GALLON', 'kilograms', 1_000);
    const outerCell = () => outerCellGallon * galToKg * convertUnit();
    const outerCells = () => outerCell() * 2;
    const innerCell = () => innerCellGallon * galToKg * convertUnit();
    const innerCells = () => innerCell() * 2;
    const centerTank = () => centerTankGallon * galToKg * convertUnit();
    const totalFuel = () => centerTank() + innerCells() + outerCells();
    const [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 1_000);
    const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'Bool', 1_000);
    const [eng2Running] = useSimVar('ENG COMBUSTION:2', 'Bool', 1_000);
    const [refuelRate, setRefuelRate] = useSimVarSyncedPersistentProperty('L:A32NX_REFUEL_RATE_SETTING', 'Number', 'REFUEL_RATE_SETTING');
    const [sliderValue, setSliderValue] = useState<number>();
    const [inputValue, setInputValue] = useState<number>();
    const [totalTarget, setTotalTarget] = useState<number>();
    const [centerTarget, setCenterTarget] = useSimVar('L:A32NX_FUEL_CENTER_DESIRED', 'Number');
    const [LInnTarget, setLInnTarget] = useSimVar('L:A32NX_FUEL_LEFT_MAIN_DESIRED', 'Number');
    const [LOutTarget, setLOutTarget] = useSimVar('L:A32NX_FUEL_LEFT_AUX_DESIRED', 'Number');
    const [RInnTarget, setRInnTarget] = useSimVar('L:A32NX_FUEL_RIGHT_MAIN_DESIRED', 'Number');
    const [ROutTarget, setROutTarget] = useSimVar('L:A32NX_FUEL_RIGHT_AUX_DESIRED', 'Number');
    const [centerCurrent] = useSimVar('FUEL TANK CENTER QUANTITY', 'Gallons', 1_000);
    const [LInnCurrent] = useSimVar('FUEL TANK LEFT MAIN QUANTITY', 'Gallons', 1_000);
    const [LOutCurrent] = useSimVar('FUEL TANK LEFT AUX QUANTITY', 'Gallons', 1_000);
    const [RInnCurrent] = useSimVar('FUEL TANK RIGHT MAIN QUANTITY', 'Gallons', 1_000);
    const [ROutCurrent] = useSimVar('FUEL TANK RIGHT AUX QUANTITY', 'Gallons', 1_000);
    const getFuelBarPercent = (curr:number, max: number) => (Math.max(curr, 0) / max) * 100;
    const airplaneCanRefuel = () => {
        // TODO : REMOVE THIS IF WHENEVER PERSISTANCE IS IMPLEMENTED
        if (usingMetrics !== 1){
            setUsingMetrics(1);
        }
        if (simGroundSpeed > 0.1 || eng1Running || eng2Running || !isOnGround){
            return false;
        }
        return true;
    };
    const convertToGallon = (curr : number) => curr * (1/convertUnit()) * (1/galToKg);
    const totalCurrentGallon = () => round(Math.max((LInnCurrent + (LOutCurrent) + (RInnCurrent) + (ROutCurrent) + (centerCurrent)),0));
    const totalCurrent = () => {
        let val = round(totalCurrentGallon() * getFuelMultiplier());
        if (centerCurrent > 0 && centerCurrent < centerTankGallon){
            return round(val + convertUnit());
        }
        return val;
    };
    const formatRefuelStatusLabel = () => {
        if (airplaneCanRefuel()){
            if (round(totalTarget) === totalCurrentGallon()) {
                return '(Available)';
            }
            return ((totalTarget || 0) > (totalFuelGallons)) ? '(Refueling...)' : '(Defueling...)' ;
        }
        return '(Unavailable)';
    };
    const formatRefuelStatusClass = () => {
        let newClass = 'fuel-truck-avail';
        if (airplaneCanRefuel()){
            if (round(totalTarget) === totalCurrentGallon()) {
                return newClass + ' completed-text'
            }
            return newClass + ' in-progress-text'
        }
        return newClass + ' disabled-text'
    };
    const getFuelMultiplier = () => galToKg * convertUnit();
    const formatFuelFilling = (curr: number, max: number) => {
        let percent = (Math.max(curr, 0) / max) * 100;
        return 'linear-gradient(to top, #3b82f6 ' + percent + '%,#ffffff00 0%)';
    };
    const convertFuelValue = (curr: number) => round(round(Math.max(curr, 0)) * getFuelMultiplier());
    const convertFuelValueCenter = (curr: number) => {
        if (curr === centerTankGallon){
            return convertFuelValue(curr);
        }
        return round(convertFuelValue(curr) + convertUnit());
    };
    const setDesiredFuel = (fuel: number) => {
        fuel -= (outerCellGallon) * 2;
        let outerTank = (((outerCellGallon) * 2) + Math.min(fuel, 0)) / 2;
        setLOutTarget(outerTank);
        setROutTarget(outerTank);
        if (fuel <= 0) {
            setLInnTarget(0);
            setRInnTarget(0);
            setCenterTarget(0);
            return;
        }
        fuel -= (innerCellGallon) * 2
        let innerTank = (((innerCellGallon) * 2) + Math.min(fuel, 0)) / 2;
        setLInnTarget(innerTank);
        setRInnTarget(innerTank);
        if (fuel <= 0) {
            setCenterTarget(0);
            return;
        }
        setCenterTarget(fuel);
    };
    const updateDesiredFuel = (value:string) => {
        let fuel = 0;
        let originalFuel = 0;
        if (value.length > 0){
            originalFuel = parseInt(value);
            fuel = convertToGallon(originalFuel);
            if(originalFuel>totalFuel()){
                originalFuel = round(totalFuel());
            }
            setInputValue(originalFuel);
        }
        if (fuel > totalFuelGallons){
            fuel = totalFuelGallons+2;
        }
        setTotalTarget(fuel);
        setSliderValue((fuel / totalFuelGallons) * 100);
        setDesiredFuel(fuel);
	};
    const updateSlider = (value: number) => {
        if (value < 2){
            value = 0;
        }
        setSliderValue(value);
        let fuel = Math.round(totalFuel() * (value / 100));
        updateDesiredFuel(fuel.toString());
    };

    return (
        <div className="text-white px-6">
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info">
            <h2 className="text-2xl font-medium">Left inner tank</h2>
                <div className="flex mt-4">
                    <ProgressBar height={"10px"} width={"200px"} isLabelVisible={false} displayBar={true} completedBar={getFuelBarPercent(LInnTarget,innerCellGallon)} bgcolor={'#3b82f6'} completed={(Math.max(LInnCurrent, 0) / innerCellGallon) * 100} />
                    <div className="fuel-label"><label>{convertFuelValue(LInnCurrent)}/{round(innerCell())} {currentUnit()}</label></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info outter">
            <h2 className="text-2xl font-medium">Left outer tank</h2>
                <div className="flex mt-4">
                    <ProgressBar height={"10px"} width={"200px"} displayBar={true} completedBar={getFuelBarPercent(LOutTarget,outerCellGallon)} isLabelVisible={false} bgcolor={'#3b82f6'} completed={(Math.max(LOutCurrent, 0) / outerCellGallon) * 100} />
                    <div className="fuel-label"><label>{convertFuelValue(LOutCurrent)}/{round(outerCell())} {currentUnit()}</label></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info center-tanks-info">
            <h2 className="text-2xl font-medium">Center tank</h2>
                <div className="flex mt-4">
                    <ProgressBar height={"10px"} width={"200px"} displayBar={true} completedBar={getFuelBarPercent(centerTarget,centerTankGallon)} isLabelVisible={false} bgcolor={'#3b82f6'} completed={(Math.max(centerCurrent, 0) / centerTankGallon) * 100} />
                    <div className="fuel-label"><label>{convertFuelValueCenter(centerCurrent)}/{round(centerTank())} {currentUnit()}</label></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info refuel-info">
            <h2 className="text-2xl font-medium">Refuel</h2><label className={formatRefuelStatusClass()}>{formatRefuelStatusLabel()}</label>
                    <div className="flex mt-n5">
                        <div className="fuel-progress"><Slider value={sliderValue} onInput={(value) => updateSlider(value)} className="w-48" /></div>
                        <div className="fuel-label"><SimpleInput noLeftMargin={true} placeholder={round(totalFuel()).toString()} number={true} min={0} max={round(totalFuel())} value={inputValue} onChange={(x) => updateDesiredFuel(x)} /></div>
                        <div className="unit-label">{currentUnit()}</div>
                        <div className="separation-line-refuel"></div>
                        <div className="manage-fuel-truck">
                            <div className='call-inop fuel-truck disabled'><IconTruck /></div>
                            <label className="inop-label-fuel-page">Inop.</label>
                        </div>
                    </div>
                    <span>Current fuel :</span>
                    <div className="flex mt-n5">
                        <ProgressBar height={"10px"} width={"200px"} displayBar={false} isLabelVisible={false} bgcolor={'#3b82f6'} completed={(totalCurrent() / round(totalFuel())) * 100} />
                        <div className="fuel-label"><label>{totalCurrent()}/{round(totalFuel())} {currentUnit()}</label></div>
                    </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info right-tanks-info">
            <h2 className="text-2xl font-medium">Right inner tank</h2>
                <div className="flex mt-4">
                    <ProgressBar height={"10px"} width={"200px"} displayBar={true} completedBar={getFuelBarPercent(RInnTarget,innerCellGallon)} isLabelVisible={false} bgcolor={'#3b82f6'} completed={(Math.max(RInnCurrent, 0) / innerCellGallon) * 100} />
                    <div className="fuel-label"><label>{convertFuelValue(RInnCurrent)}/{round(innerCell())} {currentUnit()}</label></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info right-tanks-info outter">
            <h2 className="text-2xl font-medium">Right outer tank</h2>
                <div className="flex mt-4">
                    <ProgressBar height={"10px"} width={"200px"} displayBar={true} completedBar={getFuelBarPercent(ROutTarget,outerCellGallon)} isLabelVisible={false} bgcolor={'#3b82f6'} completed={(Math.max(ROutCurrent, 0) / outerCellGallon) * 100} />
                    <div className="fuel-label"><label>{convertFuelValue(ROutCurrent)}/{round(outerCell())} {currentUnit()}</label></div>
                </div>
            </div>
            <div className='wrapper visible-tank center-tank' style={{background:formatFuelFilling(centerCurrent,centerTankGallon)}}>
            </div>
            <div className='wrapper visible-tank inner-left-tank' style={{background:formatFuelFilling(LInnCurrent,innerCellGallon)}}>
            </div>
            <div className='wrapper visible-tank inner-right-tank' style={{background:formatFuelFilling(RInnCurrent,innerCellGallon)}}>
            </div>
            <div className='wrapper visible-tank outer-left-tank' style={{background:formatFuelFilling(LOutCurrent,outerCellGallon)}}>
            </div>
            <div className='wrapper visible-tank outer-right-tank' style={{background:formatFuelFilling(ROutCurrent,outerCellGallon)}}>
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
