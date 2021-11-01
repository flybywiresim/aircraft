import React from 'react';
import { round } from 'lodash';
import { IconPlayerPlay, IconHandStop } from '@tabler/icons';
import { Slider } from '@flybywiresim/react-components';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import { ProgressBar } from '../../Components/Progress/Progress';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import fuselage from '../../Assets/320neo_outline_fuel.svg';
import { useSimVar } from '../../../Common/simVars';
import { usePersistentProperty } from '../../../Common/persistence';

export const FuelPage = () => {
    const totalFuelGallons = 6267;
    const outerCellGallon = 228;
    const innerCellGallon = 1816;
    const centerTankGallon = 2179;
    const wingTotalRefuelTimeSeconds = 1020;
    const CenterTotalRefuelTimeSeconds = 180;
    const [usingMetrics] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');

    const currentUnit = () => {
        if (usingMetrics === '1') {
            return 'KG';
        }
        return 'LB';
    };

    const convertUnit = () => {
        if (usingMetrics === '1') {
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
    const [refuelRate, setRefuelRate] = usePersistentProperty('REFUEL_RATE_SETTING');
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

    const isAirplaneCnD = () => {
        if (simGroundSpeed > 0.1 || eng1Running || eng2Running || !isOnGround || (!busDC2 && !busDCHot1)) {
            return false;
        }
        return true;
    };

    const airplaneCanRefuel = () => {
        if (refuelRate !== '2') {
            if (!isAirplaneCnD()) {
                return false;
            }
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

    const formatRefuelStatusClass = () => {
        if (airplaneCanRefuel()) {
            if (round(totalTarget) === totalCurrentGallon() || !refuelStartedByUser) {
                if (refuelStartedByUser) {
                    setRefuelStartedByUser(false);
                }
                return 'text-base text-blue-500';
            }
            return ((totalTarget) > (totalCurrentGallon())) ? 'text-base text-green-500' : 'text-base text-yellow-500';
        }
        return 'text-base text-gray-400';
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
        if (round(totalTarget) === totalCurrentGallon() || refuelRate === '2') { // instant
            return ' 0';
        }
        let estimatedTimeSeconds = 0;
        const totalWingFuel = totalFuelGallons - centerTankGallon;
        const differentialFuelWings = Math.abs(currentWingFuel() - targetWingFuel());
        const differentialFuelCenter = Math.abs(centerTarget - centerCurrent);
        estimatedTimeSeconds += (differentialFuelWings / totalWingFuel) * wingTotalRefuelTimeSeconds;
        estimatedTimeSeconds += (differentialFuelCenter / centerTankGallon) * CenterTotalRefuelTimeSeconds;
        if (refuelRate === '1') { // fast
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

    const refuelButtonStatus = () => (
        <>
            <SelectGroup>
                <SelectItem enabled selected={isAirplaneCnD() ? refuelRate === '2' : !isAirplaneCnD()} onSelect={() => setRefuelRate('2')}>Instant</SelectItem>
                <SelectItem enabled={isAirplaneCnD()} selected={refuelRate === '1'} onSelect={() => setRefuelRate('1')}>Fast</SelectItem>
                <SelectItem enabled={isAirplaneCnD()} selected={refuelRate === '0'} onSelect={() => setRefuelRate('0')}>Real</SelectItem>
            </SelectGroup>
        </>
    );

    return (
        <div className="flex flex-col justify-between mt-6 h-efb-nav">
            <div className="z-40">
                <div className="flex flex-row w-full">
                    <div className="mr-3 w-1/3">
                        <div className="overflow-x-hidden p-6 rounded-2xl bg-navy-lighter">
                            <h2 className="text-2xl font-medium">Left Inner Tank</h2>
                            <div className="flex mt-4">
                                <ProgressBar
                                    height="10px"
                                    width="200px"
                                    isLabelVisible={false}
                                    displayBar={false}
                                    completedBarBegin={getFuelBarPercent(LInnTarget, innerCellGallon)}
                                    bgcolor="#3b82f6"
                                    completed={(Math.max(LInnCurrent, 0) / innerCellGallon) * 100}
                                />
                                <div className="fuel-label">
                                    <label className="text-base fuel-content-label" htmlFor="fuel-label">
                                        {convertFuelValue(LInnCurrent)}
                                        /
                                        {round(innerCell())}
                                        {' '}
                                        {currentUnit()}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mx-3 w-1/3">
                        <div className="overflow-x-hidden p-6 rounded-2xl bg-navy-lighter">
                            <h2 className="text-2xl font-medium">Center Tank</h2>
                            <div className="flex mt-4">
                                <ProgressBar
                                    height="10px"
                                    width="200px"
                                    displayBar={false}
                                    completedBarBegin={getFuelBarPercent(centerTarget, centerTankGallon)}
                                    isLabelVisible={false}
                                    bgcolor="#3b82f6"
                                    completed={(Math.max(centerCurrent, 0) / centerTankGallon) * 100}
                                />
                                <div className="fuel-label">
                                    <label className="text-base fuel-content-label" htmlFor="fuel-label">
                                        {convertFuelValueCenter(centerCurrent)}
                                        /
                                        {round(centerTank())}
                                        {' '}
                                        {currentUnit()}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ml-3 w-1/3">
                        <div className="overflow-x-hidden p-6 rounded-2xl bg-navy-lighter">
                            <h2 className="text-2xl font-medium">Right Inner Tank</h2>
                            <div className="flex mt-4">
                                <ProgressBar
                                    height="10px"
                                    width="200px"
                                    displayBar={false}
                                    completedBarBegin={getFuelBarPercent(RInnTarget, innerCellGallon)}
                                    isLabelVisible={false}
                                    bgcolor="#3b82f6"
                                    completed={(Math.max(RInnCurrent, 0) / innerCellGallon) * 100}
                                />
                                <div className="fuel-label">
                                    <label className="text-base fuel-content-label" htmlFor="fuel-label">
                                        {convertFuelValue(RInnCurrent)}
                                        /
                                        {round(innerCell())}
                                        {' '}
                                        {currentUnit()}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row mt-6 w-full">
                    <div className="mr-3 w-4/12">
                        <div className="overflow-x-hidden p-6 rounded-2xl bg-navy-lighter">
                            <h2 className="text-2xl font-medium">Left Outer Tank</h2>
                            <div className="mt-4">
                                <ProgressBar
                                    height="10px"
                                    width="200px"
                                    displayBar={false}
                                    completedBarBegin={getFuelBarPercent(LOutTarget, outerCellGallon)}
                                    isLabelVisible={false}
                                    bgcolor="#3b82f6"
                                    completed={(Math.max(LOutCurrent, 0) / outerCellGallon) * 100}
                                />
                                <div className="mt-4">
                                    <label className="text-base fuel-content-label" htmlFor="fuel-label">
                                        {convertFuelValue(LOutCurrent)}
                                        /
                                        {round(outerCell())}
                                        {' '}
                                        {currentUnit()}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mx-3 w-2/4">
                        <div className="overflow-x-hidden p-6 rounded-2xl bg-navy-lighter">
                            <div className="flex items-center w-full">
                                <h2 className="mr-2 text-2xl font-medium">Refuel</h2>
                                <label htmlFor="fuel-label" className={formatRefuelStatusClass()}>{formatRefuelStatusLabel()}</label>
                            </div>
                            <div className="flex relative flex-row items-center mt-4 mb-2">
                                <div className="fuel-progress">
                                    <Slider className="w-48" value={sliderValue} onInput={(value) => updateSlider(value)} />
                                </div>
                                <div className="relative ml-4 fuel-label">
                                    <SimpleInput
                                        className="w-32"
                                        noLeftMargin
                                        noLabel
                                        placeholder={round(totalFuel()).toString()}
                                        number
                                        min={0}
                                        max={round(totalFuel())}
                                        value={inputValue}
                                        onChange={(x) => updateDesiredFuel(x)}
                                    />
                                    <div className="absolute top-2 right-4 text-lg text-gray-400">{currentUnit()}</div>
                                </div>
                                <div className="absolute right-28 h-28 border-t-0 border-r border-b-0 border-l-0 border-white" />
                                <div className="flex absolute right-3 flex-col justify-center items-center mt-3">
                                    <div className={formatRefuelStatusClass()}>
                                        <Button onClick={() => switchRefuelState()} type={BUTTON_TYPE.NONE}>
                                            <IconPlayerPlay className={refuelStartedByUser ? 'hidden' : ''} />
                                            <IconHandStop className={refuelStartedByUser ? '' : 'hidden'} />
                                        </Button>
                                    </div>
                                    <div className="mt-4 text-base">
                                        Est:
                                        {calculateEta()}
                                        Min
                                    </div>
                                </div>
                            </div>
                            <span className="text-base fuel-content-label">Current Fuel:</span>
                            <div className="flex current-fuel-line">
                                <ProgressBar height="10px" width="200px" displayBar={false} isLabelVisible={false} bgcolor="#3b82f6" completed={(totalCurrent() / round(totalFuel())) * 100} />
                                <div className="fuel-label">
                                    <label className="text-base fuel-content-label" htmlFor="fuel-label">
                                        {totalCurrent()}
                                        /
                                        {round(totalFuel())}
                                        {' '}
                                        {currentUnit()}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ml-3 w-4/12">
                        <div className="overflow-x-hidden p-6 rounded-2xl bg-navy-lighter">
                            <h2 className="text-2xl font-medium">Right Outer Tank</h2>
                            <div className="mt-4">
                                <ProgressBar
                                    height="10px"
                                    width="200px"
                                    displayBar={false}
                                    completedBarBegin={getFuelBarPercent(ROutTarget, outerCellGallon)}
                                    isLabelVisible={false}
                                    bgcolor="#3b82f6"
                                    completed={(Math.max(ROutCurrent, 0) / outerCellGallon) * 100}
                                />
                                <div className="mt-4">
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
                    </div>
                </div>
            </div>
            <div className="flex flex-col justify-end items-center">
                <img className="z-20 mb-3 h-96" src={fuselage} />
                <div className="absolute z-0 w-24 h-20 bottom-ctr-tk-y" style={{ background: formatFuelFilling(centerCurrent, centerTankGallon) }} />
                <div className="absolute z-0 h-36 w-inr-tk bottom-inn-tk-y left-inn-tk-l" style={{ background: formatFuelFilling(LInnCurrent, innerCellGallon) }} />
                <div className="absolute z-0 h-36 w-inr-tk bottom-inn-tk-y right-inn-tk-r" style={{ background: formatFuelFilling(RInnCurrent, innerCellGallon) }} />
                <div className="absolute z-0 h-16 w-out-tk bottom-out-tk-y left-out-tk-l" style={{ background: formatFuelFilling(LOutCurrent, outerCellGallon) }} />
                <div className="absolute z-0 h-16 w-out-tk bottom-out-tk-y right-out-tk-r" style={{ background: formatFuelFilling(ROutCurrent, outerCellGallon) }} />
                <div className="absolute z-10 w-96 h-20 transform bg-navy-regular bottom-overlay-b-y left-overlay-bl -rotate-18.5" />
                <div className="absolute z-10 w-96 h-20 transform bg-navy-regular bottom-overlay-b-y right-overlay-br rotate-18.5" />
                <div className="absolute z-10 w-96 h-24 transform bg-navy-regular bottom-overlay-t-y left-overlay-tl -rotate-26.5" />
                <div className="absolute z-10 w-96 h-24 transform bg-navy-regular bottom-overlay-t-y right-overlay-tr rotate-26.5" />
                <div className="overflow-x-hidden absolute z-30 p-6 rounded-2xl bg-navy-lighter">
                    <div className="flex flex-row justify-between items-center w-96">
                        <span className="text-lg text-gray-300">Refuel Time</span>
                        {refuelButtonStatus()}
                    </div>
                </div>
            </div>
        </div>
    );
};
