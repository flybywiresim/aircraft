import React from 'react';
import { round } from 'lodash';
import { IconPlayerPlay, IconHandStop } from '@tabler/icons';
import { Slider } from '../../Components/Form/Slider';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import { ProgressBar } from '../../Components/Progress/Progress';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import '../Styles/Fuel.scss';
import fuselage from '../../Assets/320neo_outline_fuel.svg';
import { useSimVar } from '../../../Common/simVars';
import { useSimVarSyncedPersistentProperty } from '../../../Common/persistence';

export const FuelPage = () => {
    const totalFuelGallons = 6243;
    const outerCellGallon = 227;
    const innerCellGallon = 1809;
    const centerTankGallon = 2173;
    const wingTotalRefuelTimeSeconds = 1020;
    const CenterTotalRefuelTimeSeconds = 180;
    const [usingMetrics, setUsingMetrics] = useSimVarSyncedPersistentProperty('L:A32NX_CONFIG_USING_METRIC_UNIT', 'Number', 'CONFIG_USING_METRIC_UNIT');
    const currentUnit = () => {
        if (usingMetrics === 1) {
            return 'KG';
        }
        return 'LB';
    };
    const convertUnit = () => {
        if (usingMetrics === 1) {
            return 1;
        }
        return 2.204617615;
    };
    const [galToKg] = useSimVar('FUEL WEIGHT PER GALLON', 'kilograms', 1_000);
    const outerCell = () => outerCellGallon * galToKg * convertUnit();
    const outerCells = () => outerCell() * 2;
    const innerCell = () => innerCellGallon * galToKg * convertUnit();
    const innerCells = () => innerCell() * 2;
    const centerTank = () => centerTankGallon * galToKg * convertUnit();
    const totalFuel = () => centerTank() + innerCells() + outerCells();
    const [busDC2] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', 1_000);
    const [busDCHot1] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'Bool', 1_000);
    const [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 1_000);
    const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'Bool', 1_000);
    const [eng2Running] = useSimVar('ENG COMBUSTION:2', 'Bool', 1_000);
    const [refuelRate, setRefuelRate] = useSimVarSyncedPersistentProperty('L:A32NX_REFUEL_RATE_SETTING', 'Number', 'REFUEL_RATE_SETTING');
    const [sliderValue, setSliderValue] = useSimVar('L:A32NX_FUEL_DESIRED_PERCENT', 'Number');
    const [inputValue, setInputValue] = useSimVar('L:A32NX_FUEL_DESIRED', 'Number');
    const [totalTarget, setTotalTarget] = useSimVar('L:A32NX_FUEL_TOTAL_DESIRED', 'Number');
    const [refuelStartedByUser, setRefuelStartedByUser] = useSimVar('L:A32NX_REFUEL_STARTED_BY_USR', 'Bool');
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
        if (usingMetrics !== 1) {
            setUsingMetrics(1);
        }
        if (simGroundSpeed > 0.1 || eng1Running || eng2Running || !isOnGround || (!busDC2 && !busDCHot1)) {
            return false;
        }
        return true;
    };
    const currentWingFuel = () => round(Math.max((LInnCurrent + (LOutCurrent) + (RInnCurrent) + (ROutCurrent)), 0));
    const targetWingFuel = () => round(Math.max((LInnTarget + (LOutTarget) + (RInnTarget) + (ROutTarget)), 0));
    const convertToGallon = (curr : number) => curr * (1 / convertUnit()) * (1 / galToKg);
    const totalCurrentGallon = () => round(Math.max((LInnCurrent + (LOutCurrent) + (RInnCurrent) + (ROutCurrent) + (centerCurrent)), 0));
    const totalCurrent = () => {
        if (round(totalTarget) === totalCurrentGallon()) {
            return inputValue;
        }
        const val = round(totalCurrentGallon() * getFuelMultiplier());
        if (centerCurrent > 0 && centerCurrent < centerTankGallon) {
            return round(val + convertUnit());
        }
        return val;
    };
    const formatRefuelStatusLabel = () => {
        if (airplaneCanRefuel()) {
            if (round(totalTarget) === totalCurrentGallon()) {
                return '(Completed)';
            }
            if (refuelStartedByUser) {
                return ((totalTarget) > (totalCurrentGallon())) ? '(Refueling...)' : '(Defueling...)';
            }
            return '(Ready to start)';
        }
        if (refuelStartedByUser) {
            setRefuelStartedByUser(false);
        }
        return '(Unavailable)';
    };
    const formatRefuelStatusClass = (baseClass:string, text:boolean) => {
        let suffix = '';
        if (text) {
            suffix = '-text';
        }
        if (airplaneCanRefuel()) {
            if (round(totalTarget) === totalCurrentGallon() || !refuelStartedByUser) {
                if (refuelStartedByUser) {
                    setRefuelStartedByUser(false);
                }
                return `${baseClass} completed${suffix}`;
            }
            return ((totalTarget) > (totalCurrentGallon())) ? `${baseClass} refuel${suffix}` : `${baseClass} defuel${suffix}`;
        }
        return `${baseClass} disabled${suffix}`;
    };
    const getFuelMultiplier = () => galToKg * convertUnit();
    const formatFuelFilling = (curr: number, max: number) => {
        const percent = (Math.max(curr, 0) / max) * 100;
        return `linear-gradient(to top, #3b82f6 ${percent}%,#ffffff00 0%)`;
    };
    const convertFuelValue = (curr: number) => round(round(Math.max(curr, 0)) * getFuelMultiplier());
    const convertFuelValueCenter = (curr: number) => {
        if (curr < 1) {
            return 0;
        }
        if (curr === centerTankGallon) {
            return convertFuelValue(curr);
        }
        return round(convertFuelValue(curr) + convertUnit());
    };
    const setDesiredFuel = (fuel: number) => {
        fuel -= (outerCellGallon) * 2;
        const outerTank = (((outerCellGallon) * 2) + Math.min(fuel, 0)) / 2;
        setLOutTarget(outerTank);
        setROutTarget(outerTank);
        if (fuel <= 0) {
            setLInnTarget(0);
            setRInnTarget(0);
            setCenterTarget(0);
            return;
        }
        fuel -= (innerCellGallon) * 2;
        const innerTank = (((innerCellGallon) * 2) + Math.min(fuel, 0)) / 2;
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
        if (value.length > 0) {
            originalFuel = parseInt(value);
            fuel = convertToGallon(originalFuel);
            if (originalFuel > totalFuel()) {
                originalFuel = round(totalFuel());
            }
            setInputValue(originalFuel);
        }
        if (fuel > totalFuelGallons) {
            fuel = totalFuelGallons + 2;
        }
        setTotalTarget(fuel);
        setSliderValue((fuel / totalFuelGallons) * 100);
        setDesiredFuel(fuel);
    };
    const updateSlider = (value: number) => {
        if (value < 2) {
            value = 0;
        }
        setSliderValue(value);
        const fuel = Math.round(totalFuel() * (value / 100));
        updateDesiredFuel(fuel.toString());
    };
    const calculateEta = () => {
        if (round(totalTarget) === totalCurrentGallon() || refuelRate === 2) {
            return ' 0';
        }
        let estimatedTimeSeconds = 0;
        const totalWingFuel = totalFuelGallons - centerTankGallon;
        const differentialFuelWings = Math.abs(currentWingFuel() - targetWingFuel());
        const differentialFuelCenter = Math.abs(centerTarget - centerCurrent);
        estimatedTimeSeconds += (differentialFuelWings / totalWingFuel) * wingTotalRefuelTimeSeconds;
        estimatedTimeSeconds += (differentialFuelCenter / centerTankGallon) * CenterTotalRefuelTimeSeconds;
        if (refuelRate === 1) {
            estimatedTimeSeconds /= 5;
        }
        if (estimatedTimeSeconds < 35) {
            return ' 0.5';
        }
        return ` ${Math.round(estimatedTimeSeconds / 60)}`;
    };
    const switchRefuelState = () => {
        if (airplaneCanRefuel()) {
            setRefuelStartedByUser(!refuelStartedByUser);
        }
    };
    return (
        <div className="text-white px-6">
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info">
                <h2 className="text-2xl font-medium">Left inner tank</h2>
                <div className="flex mt-4">
                    <ProgressBar
                        height="10px"
                        width="200px"
                        isLabelVisible={false}
                        displayBar
                        completedBarBegin={getFuelBarPercent(LInnTarget, innerCellGallon)}
                        bgcolor="#3b82f6"
                        completed={(Math.max(LInnCurrent, 0) / innerCellGallon) * 100}
                    />
                    <div className="fuel-label">
                        <label className="fuel-content-label" htmlFor="fuel-label">
                            {convertFuelValue(LInnCurrent)}
                            /
                            {round(innerCell())}
                            {' '}
                            {currentUnit()}
                        </label>
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info outter">
                <h2 className="text-2xl font-medium">Left outer tank</h2>
                <div className="flex mt-4">
                    <ProgressBar
                        height="10px"
                        width="200px"
                        displayBar
                        completedBarBegin={getFuelBarPercent(LOutTarget, outerCellGallon)}
                        isLabelVisible={false}
                        bgcolor="#3b82f6"
                        completed={(Math.max(LOutCurrent, 0) / outerCellGallon) * 100}
                    />
                    <div className="fuel-label">
                        <label className="fuel-content-label" htmlFor="fuel-label">
                            {convertFuelValue(LOutCurrent)}
                            /
                            {round(outerCell())}
                            {' '}
                            {currentUnit()}
                        </label>
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info center-tanks-info">
                <h2 className="text-2xl font-medium">Center tank</h2>
                <div className="flex mt-4">
                    <ProgressBar
                        height="10px"
                        width="200px"
                        displayBar
                        completedBarBegin={getFuelBarPercent(centerTarget, centerTankGallon)}
                        isLabelVisible={false}
                        bgcolor="#3b82f6"
                        completed={(Math.max(centerCurrent, 0) / centerTankGallon) * 100}
                    />
                    <div className="fuel-label">
                        <label className="fuel-content-label" htmlFor="fuel-label">
                            {convertFuelValueCenter(centerCurrent)}
                            /
                            {round(centerTank())}
                            {' '}
                            {currentUnit()}
                        </label>
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info refuel-info">
                <h2 className="text-2xl font-medium">Refuel</h2>
                <label htmlFor="fuel-label" className={formatRefuelStatusClass('fuel-truck-avail', true)}>{formatRefuelStatusLabel()}</label>
                <div className="flex mt-n5">
                    <div className="fuel-progress"><Slider value={sliderValue} onInput={(value) => updateSlider(value)} className="w-48" /></div>
                    <div className="fuel-label pad15">
                        <SimpleInput
                            label=""
                            noLeftMargin
                            placeholder={round(totalFuel()).toString()}
                            number
                            min={0}
                            max={round(totalFuel())}
                            value={inputValue}
                            onChange={(x) => updateDesiredFuel(x)}
                        />
                        <div className="unit-label">{currentUnit()}</div>
                    </div>
                    <div className="separation-line-refuel" />
                    <div className="manage-refuel">
                        <div className={formatRefuelStatusClass('refuel-icon', false)}>
                            <Button className="refuel-button" onClick={() => switchRefuelState()} type={BUTTON_TYPE.NONE}>
                                <IconPlayerPlay className={refuelStartedByUser ? 'hidden' : ''} />
                                <IconHandStop className={refuelStartedByUser ? '' : 'hidden'} />
                            </Button>
                        </div>
                        <span className="eta-label">
                            Est:
                            {calculateEta()}
                            min
                        </span>
                    </div>
                </div>
                <span className="fuel-content-label">Current fuel :</span>
                <div className="flex mt-n5 current-fuel-line">
                    <ProgressBar height="10px" width="200px" displayBar={false} isLabelVisible={false} bgcolor="#3b82f6" completed={(totalCurrent() / round(totalFuel())) * 100} />
                    <div className="fuel-label">
                        <label className="fuel-content-label" htmlFor="fuel-label">
                            {totalCurrent()}
                            /
                            {round(totalFuel())}
                            {' '}
                            {currentUnit()}
                        </label>
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info right-tanks-info">
                <h2 className="text-2xl font-medium">Right inner tank</h2>
                <div className="flex mt-4">
                    <ProgressBar
                        height="10px"
                        width="200px"
                        displayBar
                        completedBarBegin={getFuelBarPercent(RInnTarget, innerCellGallon)}
                        isLabelVisible={false}
                        bgcolor="#3b82f6"
                        completed={(Math.max(RInnCurrent, 0) / innerCellGallon) * 100}
                    />
                    <div className="fuel-label">
                        <label className="fuel-content-label" htmlFor="fuel-label">
                            {convertFuelValue(RInnCurrent)}
                            /
                            {round(innerCell())}
                            {' '}
                            {currentUnit()}
                        </label>
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info right-tanks-info outter">
                <h2 className="text-2xl font-medium">Right outer tank</h2>
                <div className="flex mt-4">
                    <ProgressBar
                        height="10px"
                        width="200px"
                        displayBar
                        completedBarBegin={getFuelBarPercent(ROutTarget, outerCellGallon)}
                        isLabelVisible={false}
                        bgcolor="#3b82f6"
                        completed={(Math.max(ROutCurrent, 0) / outerCellGallon) * 100}
                    />
                    <div className="fuel-label">
                        <label className="fuel-content-label" htmlFor="fuel-label">
                            {convertFuelValue(ROutCurrent)}
                            /
                            {round(outerCell())}
                            {' '}
                            {currentUnit()}
                        </label>
                    </div>
                </div>
            </div>
            <div className="wrapper visible-tank center-tank" style={{ background: formatFuelFilling(centerCurrent, centerTankGallon) }} />
            <div className="wrapper visible-tank inner-left-tank" style={{ background: formatFuelFilling(LInnCurrent, innerCellGallon) }} />
            <div className="wrapper visible-tank inner-right-tank" style={{ background: formatFuelFilling(RInnCurrent, innerCellGallon) }} />
            <div className="wrapper visible-tank outer-left-tank" style={{ background: formatFuelFilling(LOutCurrent, outerCellGallon) }} />
            <div className="wrapper visible-tank outer-right-tank" style={{ background: formatFuelFilling(ROutCurrent, outerCellGallon) }} />
            <img className="airplane-fuel w-full" src={fuselage} />
            <div className="bg-gray-800 rounded-xl text-white shadow-lg mr-4 overflow-x-hidden refuel-speed">
                <div className="mb-3.5 flex flex-row justify-between items-center">
                    <span className="text-lg text-gray-300">Refuel Time</span>
                    <SelectGroup>
                        <SelectItem selected={refuelRate === 2} onSelect={() => setRefuelRate(2)}>Instant</SelectItem>
                        <SelectItem selected={refuelRate === 1} onSelect={() => setRefuelRate(1)}>Fast</SelectItem>
                        <SelectItem selected={refuelRate === 0} onSelect={() => setRefuelRate(0)}>Real</SelectItem>
                    </SelectGroup>
                </div>
            </div>
            <div className="wrapper hiding-block hiding-block-top-left" />
            <div className="wrapper hiding-block hiding-block-bottom-left" />
            <div className="wrapper hiding-block hiding-block-top-right" />
            <div className="wrapper hiding-block hiding-block-bottom-right" />
        </div>
    );
};
