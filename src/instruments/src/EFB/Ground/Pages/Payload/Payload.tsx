/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { BriefcaseFill, CloudArrowDown, PersonFill, PlayFill, StopCircleFill } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { Units } from '@shared/units';
import { usePersistentProperty } from '@instruments/common/persistence';
import { BitFlags } from '@shared/bitFlags';
import { useBitFlags } from '@instruments/common/bitFlags';
import { round } from 'lodash';
import { CargoWidget } from './Seating/CargoWidget';
import { ChartWidget } from './Chart/ChartWidget';
import { PaxStationInfo, CargoStationInfo } from './Seating/Constants';
import { t } from '../../../translation';
import { TooltipWrapper } from '../../../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import Loadsheet from './Loadsheet/a20nv55.json';
import Card from '../../../UtilComponents/Card/Card';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { SeatMapWidget } from './Seating/SeatMapWidget';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { useAppSelector } from '../../../Store/store';

export const Payload = () => {
    const { usingMetric } = Units;
    const [boardingStarted, setBoardingStarted] = useSimVar('L:A32NX_BOARDING_STARTED_BY_USR', 'Bool', 200);
    const simbriefDataLoaded = isSimbriefDataLoaded();
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    const [paxWeight, setPaxWeight] = useSimVar('L:A32NX_WB_PER_PAX_WEIGHT', 'Number', 200);
    const [paxBagWeight, setPaxBagWeight] = useSimVar('L:A32NX_WB_PER_BAG_WEIGHT', 'Number', 200);
    const [galToKg] = useSimVar('FUEL WEIGHT PER GALLON', 'kilograms', 2_000);
    const [estFuelBurn] = useSimVar('L:A32NX_ESTIMATED_FUEL_BURN', 'Kilograms', 2_000);

    const [emptyWeight] = useSimVar('A:EMPTY WEIGHT', usingMetric ? 'Kilograms' : 'Pounds', 2_000);

    const [paxA] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number');
    const [paxB] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number');
    const [paxC] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_21', 'Number');
    const [paxD] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_22_29', 'Number');

    const [paxADesired, setPaxADesired] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6_DESIRED', 'number');
    const [paxBDesired, setPaxBDesired] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13_DESIRED', 'number');
    const [paxCDesired, setPaxCDesired] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_21_DESIRED', 'number');
    const [paxDDesired, setPaxDDesired] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_22_29_DESIRED', 'number');

    const [stationSize, setStationLen] = useState<number[]>([]);

    const pax = [paxA, paxB, paxC, paxD];
    const totalPax = pax && pax.length > 0 && pax.reduce((a, b) => a + b);
    const maxPax = (stationSize && stationSize.length > 0) ? stationSize.reduce((a, b) => a + b) : -1;

    const [aFlags, setAFlags] = useBitFlags('PAX_FLAGS_A');
    const [bFlags, setBFlags] = useBitFlags('PAX_FLAGS_B');
    const [cFlags, setCFlags] = useBitFlags('PAX_FLAGS_C');
    const [dFlags, setDFlags] = useBitFlags('PAX_FLAGS_D');

    const paxDesired = [paxADesired, paxBDesired, paxCDesired, paxDDesired];
    const setPaxDesired = [setPaxADesired, setPaxBDesired, setPaxCDesired, setPaxDDesired];
    const totalPaxDesired = paxDesired && paxDesired.length > 0 && paxDesired.reduce((a, b) => parseInt(a) + parseInt(b));

    const [aFlagsDesired, setAFlagsDesired] = useBitFlags('PAX_FLAGS_A_DESIRED');
    const [bFlagsDesired, setBFlagsDesired] = useBitFlags('PAX_FLAGS_B_DESIRED');
    const [cFlagsDesired, setCFlagsDesired] = useBitFlags('PAX_FLAGS_C_DESIRED');
    const [dFlagsDesired, setDFlagsDesired] = useBitFlags('PAX_FLAGS_D_DESIRED');

    const activeFlags = [aFlags, bFlags, cFlags, dFlags];
    const desiredFlags = [aFlagsDesired, bFlagsDesired, cFlagsDesired, dFlagsDesired];
    const setActiveFlags = [setAFlags, setBFlags, setCFlags, setDFlags];
    const setDesiredFlags = [setAFlagsDesired, setBFlagsDesired, setCFlagsDesired, setDFlagsDesired];

    const [clicked, setClicked] = useState(false);

    const [fwdBag] = useSimVar('L:A32NX_CARGO_FWD_BAGGAGE_CONTAINER', 'Number', 200);
    const [aftCont] = useSimVar('L:A32NX_CARGO_AFT_CONTAINER', 'Number', 200);
    const [aftBag] = useSimVar('L:A32NX_CARGO_AFT_BAGGAGE', 'Number', 200);
    const [aftBulk] = useSimVar('L:A32NX_CARGO_AFT_BULK_LOOSE', 'Number', 200);

    const [fwdBagDesired, setFwdBagDesired] = useSimVar('L:A32NX_CARGO_FWD_BAGGAGE_CONTAINER_DESIRED', 'Number', 200);
    const [aftContDesired, setAftContDesired] = useSimVar('L:A32NX_CARGO_AFT_CONTAINER_DESIRED', 'Number', 200);
    const [aftBagDesired, setAftBagDesired] = useSimVar('L:A32NX_CARGO_AFT_BAGGAGE_DESIRED', 'Number', 200);
    const [aftBulkDesired, setAftBulkDesired] = useSimVar('L:A32NX_CARGO_AFT_BULK_LOOSE_DESIRED', 'Number', 200);

    const [cargoStationSize, setCargoStationLen] = useState<number[]>([]);

    const cargo = [fwdBag, aftCont, aftBag, aftBulk];
    const totalCargo = (cargo && cargo.length > 0) ? cargo.reduce((a, b) => parseInt(a) + parseInt(b)) : -1;
    const maxCargo = (cargoStationSize && cargoStationSize.length > 0) ? cargoStationSize.reduce((a, b) => a + b) : -1;

    const cargoDesired = [fwdBagDesired, aftContDesired, aftBagDesired, aftBulkDesired];
    const setCargoDesired = [setFwdBagDesired, setAftContDesired, setAftBagDesired, setAftBulkDesired];
    const totalCargoDesired = (cargoDesired && cargoDesired.length > 0) ? cargoDesired.reduce((a, b) => parseInt(a) + parseInt(b)) : -1;

    const [centerCurrent] = useSimVar('FUEL TANK CENTER QUANTITY', 'Gallons', 2_000);
    const [LInnCurrent] = useSimVar('FUEL TANK LEFT MAIN QUANTITY', 'Gallons', 2_000);
    const [LOutCurrent] = useSimVar('FUEL TANK LEFT AUX QUANTITY', 'Gallons', 2_000);
    const [RInnCurrent] = useSimVar('FUEL TANK RIGHT MAIN QUANTITY', 'Gallons', 2_000);
    const [ROutCurrent] = useSimVar('FUEL TANK RIGHT AUX QUANTITY', 'Gallons', 2_000);

    // Units
    // Weight/CG
    const [zfw, setZfw] = useState(0);
    const [zfwCg, setZfwCg] = useState(0);
    const [zfwDesired, setZfwDesired] = useState(0);
    const [zfwDesiredCg, setZfwDesiredCg] = useState(0);
    const [totalWeight, setTotalWeight] = useState(emptyWeight);
    const [cg, setCg] = useState(25);
    const [totalDesiredWeight, setTotalDesiredWeight] = useState(0);
    const [desiredCg, setDesiredCg] = useState(0);
    const [mlw, setMlw] = useState(0);
    const [mlwCg, setMlwCg] = useState(0);
    const [mlwDesired, setMlwDesired] = useState(0);
    const [mlwDesiredCg, setMlwDesiredCg] = useState(0);

    const [seatMap] = useState<PaxStationInfo[]>(Loadsheet.seatMap);
    const [cargoMap] = useState<CargoStationInfo[]>(Loadsheet.cargoMap);

    const totalCurrentGallon = () => round(Math.max(LInnCurrent + LOutCurrent + RInnCurrent + ROutCurrent + centerCurrent, 0));

    const simbriefUnits = useAppSelector((state) => state.simbrief.data.units);
    const simbriefBagWeight = parseInt(useAppSelector((state) => state.simbrief.data.weights.bagWeight));
    const simbriefPaxWeight = parseInt(useAppSelector((state) => state.simbrief.data.weights.passengerWeight));
    const simbriefPax = parseInt(useAppSelector((state) => state.simbrief.data.weights.passengerCount));
    const simbriefBag = parseInt(useAppSelector((state) => state.simbrief.data.weights.bagCount));
    const simbriefFreight = parseInt(useAppSelector((state) => state.simbrief.data.weights.freight));

    const setSimBriefValues = () => {
        if (simbriefUnits === 'kgs') {
            const perBagWeight = Units.kilogramToUser(simbriefBagWeight);
            setPaxBagWeight(perBagWeight);
            setPaxWeight(Units.kilogramToUser(simbriefPaxWeight));
            setTargetPax(simbriefPax);
            setTargetCargo(simbriefBag, Units.kilogramToUser(simbriefFreight), perBagWeight);
        } else {
            const perBagWeight = Units.poundToUser(simbriefBagWeight);
            setPaxBagWeight(perBagWeight);
            setPaxWeight(Units.poundToUser(simbriefPaxWeight));
            setTargetPax(simbriefPax);
            setTargetCargo(simbriefBag, Units.poundToUser(simbriefFreight), perBagWeight);
        }
    };

    const [busDC2] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', 2_000);
    const [busDCHot1] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'Bool', 2_000);
    const [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 2_000);
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 2_000);
    const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'Bool', 2_000);
    const [eng2Running] = useSimVar('ENG COMBUSTION:2', 'Bool', 2_000);
    const [coldAndDark, setColdAndDark] = useState<boolean>(true);

    const returnSeats = (stationIndex: number, empty: boolean, flags: BitFlags[]): number[] => {
        const seats: number[] = [];
        const bitFlags: BitFlags = flags[stationIndex];
        for (let seatId = 0; seatId < stationSize[stationIndex]; seatId++) {
            if (!empty && bitFlags.getBitIndex(seatId)) {
                seats.push(seatId);
            } else if (empty && !bitFlags.getBitIndex(seatId)) {
                seats.push(seatId);
            }
        }
        return seats;
    };

    const returnNumSeats = (stationIndex: number, empty: boolean, flags: BitFlags[]): number => {
        let count = 0;
        const bitFlags: BitFlags = flags[stationIndex];
        for (let seatId = 0; seatId < stationSize[stationIndex]; seatId++) {
            if (!empty && bitFlags.getBitIndex(seatId)) {
                count++;
            } else if (empty && !bitFlags.getBitIndex(seatId)) {
                count++;
            }
        }
        return count;
    };

    const chooseSeats = (stationIndex: number, choices: number[], numChoose: number) => {
        const bitFlags: BitFlags = activeFlags[stationIndex];
        for (let i = 0; i < numChoose; i++) {
            if (choices.length > 0) {
                const chosen = ~~(Math.random() * choices.length);
                bitFlags.toggleBitIndex(choices[chosen]);
                choices.splice(chosen, 1);
            }
        }
        setActiveFlags[stationIndex](bitFlags);
    };

    const chooseDesiredSeats = (stationIndex: number, choices: number[], numChoose: number) => {
        const bitFlags: BitFlags = desiredFlags[stationIndex];
        for (let i = 0; i < numChoose; i++) {
            if (choices.length > 0) {
                const chosen = ~~(Math.random() * choices.length);
                bitFlags.toggleBitIndex(choices[chosen]);
                choices.splice(chosen, 1);
            }
        }
        setDesiredFlags[stationIndex](bitFlags);
    };

    const calculateSeatOptions = (stationIndex: number, increase: boolean): number[] => {
        const plannedSeats = returnSeats(stationIndex, increase, desiredFlags);
        const activeSeats = returnSeats(stationIndex, !increase, activeFlags);

        const intersection = activeSeats.filter((element) => plannedSeats.includes(element));
        return intersection;
    };

    const setTargetPax = (numOfPax: number) => {
        if (!stationSize || numOfPax === totalPaxDesired || numOfPax > maxPax || numOfPax < 0) return;

        let paxRemaining = numOfPax;

        const fillStation = (stationIndex, percent, paxToFill) => {
            const pax = Math.min(Math.trunc(percent * paxToFill), stationSize[stationIndex]);
            setPaxDesired[stationIndex](pax);
            paxRemaining -= pax;

            const paxCount = returnNumSeats(stationIndex, false, activeFlags);
            const seats: number[] = returnSeats(stationIndex, pax[stationIndex] > paxCount, activeFlags);
            chooseDesiredSeats(stationIndex, seats, Math.abs(paxCount - pax[stationIndex]));
        };

        for (let i = pax.length - 1; i > 0; i--) {
            fillStation(i, seatMap[i].fill, numOfPax);
        }
        fillStation(0, 1, paxRemaining);
    };

    const setTargetCargo = (numberOfPax, freight, perBagWeight = paxBagWeight) => {
        const bagWeight = numberOfPax * perBagWeight;
        const loadableCargoWeight = Math.min(bagWeight + Math.round(freight), maxCargo);

        let remainingWeight = loadableCargoWeight;

        async function fillCargo(station, percent, loadableCargoWeight) {
            const c = Math.round(percent * loadableCargoWeight);
            remainingWeight -= c;
            setCargoDesired[station](c);
        }

        for (let i = cargoDesired.length - 1; i > 0; i--) {
            fillCargo(i, cargoStationSize[i] / maxCargo, loadableCargoWeight);
        }
        fillCargo(0, 1, remainingWeight);
    };

    const calculatePaxMoment = () => {
        let paxMoment = 0;
        pax.forEach((station, i) => {
            paxMoment += station * paxWeight * seatMap[i].position;
        });
        return paxMoment;
    };

    const calculatePaxDesiredMoment = () => {
        let paxMoment = 0;
        paxDesired.forEach((station, i) => {
            paxMoment += station * paxWeight * seatMap[i].position;
        });
        return paxMoment;
    };

    const calculateCargoMoment = () => {
        let cargoMoment = 0;
        cargo.forEach((station, i) => {
            cargoMoment += station * cargoMap[i].position;
        });
        return cargoMoment;
    };

    const calculateCargoDesiredMoment = () => {
        let cargoMoment = 0;
        cargoDesired.forEach((station, i) => {
            cargoMoment += station * cargoMap[i].position;
        });
        return cargoMoment;
    };

    const calculateCg = (mass, moment) => -100 * ((moment / mass - Loadsheet.specs.leMacZ) / Loadsheet.specs.macSize);

    const processZfw = (newZfw) => {
        let paxCargoWeight = newZfw - emptyWeight;

        // Load pax first
        const pWeight = paxWeight + paxBagWeight;
        const newPax = Math.min(Math.round(paxCargoWeight / pWeight), maxPax);

        paxCargoWeight -= newPax * pWeight;
        const newCargo = Math.min(paxCargoWeight, maxCargo);

        setTargetPax(newPax);
        setTargetCargo(newPax, newCargo);
    };

    const onClickCargo = (cargoStation, e) => {
        const cargoPercent = Math.min(Math.max(0, e.nativeEvent.offsetX / cargoMap[cargoStation].progressBarWidth), 1);
        setCargoDesired[cargoStation](Math.round(Units.kilogramToUser(cargoMap[cargoStation].weight) * cargoPercent));
    };

    const onClickSeat = (station: number, seatId: number) => {
        setClicked(true);
        let newPax = totalPaxDesired;
        const otherCargo = totalCargoDesired - totalPaxDesired * paxBagWeight;
        const bitFlags: BitFlags = desiredFlags[station];

        if (bitFlags.getBitIndex(seatId)) {
            newPax -= 1;
            setPaxDesired[station](Math.max(paxDesired[station] - 1, 0));
        } else {
            newPax += 1;
            setPaxDesired[station](Math.min(paxDesired[station] + 1, stationSize[station]));
        }

        setTargetCargo(newPax, otherCargo);
        bitFlags.toggleBitIndex(seatId);
        setDesiredFlags[station](bitFlags);
        setTimeout(() => setClicked(false), 500);
    };

    const formatBoardingStatusClass = () => {
        if (!boardingStarted) {
            return 'text-theme-highlight';
        }
        return (totalPaxDesired * paxWeight + totalCargoDesired) >= (totalPax * paxWeight + totalCargo) ? 'text-green-500' : 'text-yellow-500';
    };

    // Init
    useEffect(() => {
        if (paxWeight === 0) {
            setPaxWeight(Math.round(Units.kilogramToUser(Loadsheet.specs.pax.defaultPaxWeight)));
        }
        if (paxBagWeight === 0) {
            setPaxBagWeight(Math.round(Units.kilogramToUser(Loadsheet.specs.pax.defaultBagWeight)));
        }
    }, []);

    // Set Cold and Dark State
    useEffect(() => {
        if (simGroundSpeed > 0.1 || eng1Running || eng2Running || !isOnGround || (!busDC2 && !busDCHot1)) {
            setColdAndDark(false);
        } else {
            setColdAndDark(true);
        }
    }, [simGroundSpeed, eng1Running, eng2Running, isOnGround, busDC2, busDCHot1]);

    useEffect(() => {
        if (boardingRate !== 'INSTANT') {
            if (!coldAndDark) {
                setBoardingRate('INSTANT');
            }
        }
    }, [coldAndDark, boardingRate]);

    // Init the seating map
    useEffect(() => {
        const stationSize: number[] = [];
        for (let i = 0; i < seatMap.length; i++) {
            stationSize.push(0);
        }
        seatMap.forEach((station, i) => {
            station.rows.forEach((row) => {
                row.seats.forEach(() => {
                    stationSize[i]++;
                });
            });
        });
        setStationLen(stationSize);
    }, [seatMap]);

    // Init the cargo map
    useEffect(() => {
        const cargoSize: number[] = [];
        for (let i = 0; i < cargoMap.length; i++) {
            cargoSize.push(0);
        }
        cargoMap.forEach((station) => {
            cargoSize[station.index] = Units.kilogramToUser(station.weight);
        });
        setCargoStationLen(cargoSize);
    }, [cargoMap]);

    // Check that pax data and bitflags are valid
    useEffect(() => {
        pax.forEach((stationPaxNum: number, stationIndex: number) => {
            const paxCount = returnNumSeats(stationIndex, false, activeFlags);
            if (stationPaxNum === 0 && paxCount !== stationPaxNum) {
                setActiveFlags[stationIndex](new BitFlags(0));
            }
        });

        paxDesired.forEach((stationPaxNum, stationIndex) => {
            const paxCount = returnNumSeats(stationIndex, false, desiredFlags);
            if (stationPaxNum === 0 && paxCount !== stationPaxNum) {
                setDesiredFlags[stationIndex](new BitFlags(0));
            }
        });
        if (!boardingStarted) {
            setTargetPax(totalPax);
            setTargetCargo(0, totalCargo);
        }
    }, [stationSize]);

    // Adjusted desired passenger seating layout to match station passenger count on change
    paxDesired.forEach((stationNumPax, stationIndex) => {
        useEffect(() => {
            const paxCount = returnNumSeats(stationIndex, false, desiredFlags);
            if (!clicked && stationNumPax !== paxCount) {
                const seatOptions = calculateSeatOptions(stationIndex, stationNumPax > paxCount);
                const seatDelta = Math.abs(paxCount - stationNumPax);

                if (seatOptions.length >= seatDelta) {
                    chooseDesiredSeats(stationIndex, seatOptions, seatDelta);
                } else if (seatOptions.length && seatOptions.length < seatDelta) {
                    // Fallback if we don't have enough seat options using desired as reference
                    const leftOver = seatDelta - seatOptions.length;
                    chooseDesiredSeats(stationIndex, seatOptions, seatOptions.length);
                    const seats: number[] = returnSeats(stationIndex, stationNumPax > paxCount, desiredFlags);
                    chooseDesiredSeats(stationIndex, seats, leftOver);
                } else {
                    // Fallback if no seat options using desired as reference
                    const seats: number[] = returnSeats(stationIndex, stationNumPax > paxCount, desiredFlags);
                    chooseDesiredSeats(stationIndex, seats, seatDelta);
                }
            }
        }, [stationNumPax]);
    });

    // Adjust actual passenger seating layout to match station passenger count on change
    pax.forEach((stationNumPax: number, stationIndex: number) => {
        useEffect(() => {
            const paxCount = returnNumSeats(stationIndex, false, activeFlags);
            if (!clicked && stationNumPax !== paxCount) {
                const seatOptions = calculateSeatOptions(stationIndex, stationNumPax < paxCount);
                const seatDelta = Math.abs(paxCount - stationNumPax);
                if (seatOptions.length >= seatDelta) {
                    chooseSeats(stationIndex, seatOptions, seatDelta);
                } else if (seatOptions.length && seatOptions.length < seatDelta) {
                    // Fallback if we don't have enough seat options using desired as reference
                    const leftOver = seatDelta - seatOptions.length;
                    chooseSeats(stationIndex, seatOptions, seatOptions.length);
                    const seats: number[] = returnSeats(stationIndex, stationNumPax > paxCount, activeFlags);
                    chooseSeats(stationIndex, seats, leftOver);
                } else {
                    // Fallback if no seat options using desired as reference
                    const seats: number[] = returnSeats(stationIndex, stationNumPax > paxCount, activeFlags);
                    chooseSeats(stationIndex, seats, seatDelta);
                }
            }
        }, [stationNumPax]);
    });

    useEffect(() => {
        pax.forEach((stationNumPax: number, stationIndex: number) => {
            // Sync active to desired layout if pax is equal to desired
            if (stationNumPax === parseInt(paxDesired[stationIndex])) {
                setActiveFlags[stationIndex](desiredFlags[stationIndex]);
            }
        });
    }, [boardingStarted]);

    useEffect(() => {
        const centerTankMoment = -6;
        const innerTankMoment = -8;
        const outerTankMoment = -13;
        // Adjust ZFW CG Values based on payload
        const newZfw = emptyWeight + totalPax * paxWeight + totalCargo;
        const newZfwDesired = emptyWeight + totalPaxDesired * paxWeight + totalCargoDesired;
        const newZfwMoment = Loadsheet.specs.emptyPosition * emptyWeight + calculatePaxMoment() + calculateCargoMoment();
        const newZfwDesiredMoment = Loadsheet.specs.emptyPosition * emptyWeight + calculatePaxDesiredMoment() + calculateCargoDesiredMoment();
        const newZfwCg = calculateCg(newZfw, newZfwMoment);
        const newZfwDesiredCg = calculateCg(newZfwDesired, newZfwDesiredMoment);
        const totalFuel = round(totalCurrentGallon() * galToKg);

        const totalFuelMoment = centerCurrent * galToKg * centerTankMoment + (LOutCurrent + ROutCurrent) * galToKg * outerTankMoment + (LInnCurrent + RInnCurrent) * galToKg * innerTankMoment;
        const newTotalWeight = newZfw + totalFuel;
        const newTotalMoment = newZfwMoment + totalFuelMoment;
        const newCg = calculateCg(newTotalWeight, newTotalMoment);

        const newTotalWeightDesired = newZfwDesired + totalFuel;
        const newTotalDesiredMoment = newZfwDesiredMoment + totalFuelMoment;
        const newDesiredCg = calculateCg(newTotalWeightDesired, newTotalDesiredMoment);

        setZfw(newZfw);
        setZfwCg(newZfwCg);
        setZfwDesired(newZfwDesired);
        setZfwDesiredCg(newZfwDesiredCg);
        setTotalWeight(newTotalWeight);
        setCg(newCg);
        setTotalDesiredWeight(newTotalWeightDesired);
        setDesiredCg(newDesiredCg);

        // TODO: Better fuel burn algorithm for estimation - consider this placeholder logic
        // Adjust MLW CG values based on estimated fuel burn
        if (estFuelBurn > 0) {
            const OUTER_CELL_KG = 228 * galToKg;
            const INNER_CELL_KG = 1816 * galToKg;
            let centerTank = 0;
            let outerTanks = 0;
            let innerTanks = 0;
            const fuelRemain = totalFuel - estFuelBurn;
            let f = fuelRemain;

            f -= (OUTER_CELL_KG) * 2;
            outerTanks = ((OUTER_CELL_KG) * 2) + Math.min(f, 0);
            if (f > 0) {
                f -= (INNER_CELL_KG) * 2;
                innerTanks = ((INNER_CELL_KG) * 2) + Math.min(f, 0);
                if (f > 0) {
                    centerTank = f;
                }
            }

            const newMlw = newZfw + fuelRemain;
            const fuelRemainMoment = centerTank * centerTankMoment + outerTanks * outerTankMoment + innerTanks * innerTankMoment;
            const newMlwMoment = newZfwMoment + fuelRemainMoment;
            const newMlwDesired = newZfwDesired + fuelRemain;
            const newMlwDesiredMoment = newZfwDesiredMoment + fuelRemainMoment;

            const newMlwCg = calculateCg(newMlw, newMlwMoment);
            const newMlwDesiredCg = calculateCg(newMlwDesired, newMlwDesiredMoment);

            setMlw(newMlw);
            setMlwCg(newMlwCg);
            setMlwDesired(newMlwDesired);
            setMlwDesiredCg(newMlwDesiredCg);
        } else {
            setMlw(newTotalWeight);
            setMlwCg(newCg);
            setMlwDesired(newTotalWeightDesired);
            setMlwDesiredCg(newDesiredCg);
        }
    }, [
        paxA, paxB, paxC, paxD,
        paxADesired, paxBDesired, paxCDesired, paxDDesired,
        fwdBag, aftBag, aftCont, aftBulk,
        fwdBagDesired, aftBagDesired, aftContDesired, aftBulkDesired,
        paxWeight, paxBagWeight, emptyWeight,
        LInnCurrent, LOutCurrent, RInnCurrent,
        ROutCurrent, centerCurrent, estFuelBurn,
    ]);

    return (
        <div>
            <div className="relative h-content-section-reduced">
                <div className="mb-10">
                    <SeatMapWidget seatMap={seatMap} desiredFlags={desiredFlags} activeFlags={activeFlags} onClickSeat={onClickSeat} />
                </div>
                <CargoWidget cargo={cargo} cargoDesired={cargoDesired} cargoMap={cargoMap} cargoStationSize={cargoStationSize} onClickCargo={onClickCargo} />

                <div className="flex relative right-0 flex-row justify-between px-4 mt-16">
                    <div className="flex flex-col pr-24">
                        <div className="flex flex-row w-full">
                            <Card className="w-full col-1" childrenContainerClassName={`w-full ${simbriefDataLoaded ? 'rounded-r-none' : ''}`}>
                                <table className="w-full">
                                    <thead className="w-full border-b">
                                        <tr className="py-2">
                                            <th> </th>
                                            <th scope="col" className="py-2 px-4 w-48 font-medium text-left text-md">
                                                {t('Ground.Payload.Planned')}
                                            </th>
                                            <th scope="col" className="py-2 px-4 w-48 font-medium text-left text-md">
                                                {t('Ground.Payload.Current')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {t('Ground.Payload.Passengers')}
                                            </td>
                                            <td>
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxPassengers')} ${maxPax}`}>
                                                    <td className="relative px-4 font-light whitespace-nowrap text-md">
                                                        <SimpleInput
                                                            className="my-2 w-32"
                                                            number
                                                            min={0}
                                                            max={maxPax > 0 ? maxPax : 999}
                                                            value={totalPaxDesired}
                                                            onBlur={(x) => {
                                                                if (!Number.isNaN(parseInt(x) || parseInt(x) === 0)) {
                                                                    setTargetPax(parseInt(x));
                                                                    setTargetCargo(parseInt(x), 0);
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                </TooltipWrapper>
                                            </td>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {`${totalPax}`}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {t('Ground.Payload.Cargo')}
                                            </td>
                                            <td>
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxCargo')} ${maxCargo.toFixed(0)} ${usingMetric ? 'kg' : 'lb'}`}>
                                                    <div className="px-4 font-light whitespace-nowrap text-md">
                                                        <div className="relative">
                                                            <SimpleInput
                                                                className="my-2 w-32"
                                                                number
                                                                min={0}
                                                                max={maxCargo > 0 ? Math.round(maxCargo) : 99999}
                                                                value={totalCargoDesired.toFixed(0)}
                                                                onBlur={(x) => {
                                                                    if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) {
                                                                        setTargetCargo(0, parseInt(x));
                                                                    }
                                                                }}
                                                            />
                                                            <div className="absolute top-2 right-10 my-2 text-lg text-gray-400">{usingMetric ? 'KG' : 'LB'}</div>
                                                        </div>
                                                    </div>
                                                </TooltipWrapper>
                                            </td>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {`${totalCargo.toFixed(0)} ${usingMetric ? 'kg' : 'lb'}`}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {t('Ground.Payload.ZFW')}
                                            </td>
                                            <td>
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxZFW')} ${Units.kilogramToUser(Loadsheet.specs.weights.maxZfw).toFixed(0)} ${usingMetric ? 'kg' : 'lb'}`}>
                                                    <div className="px-4 font-light whitespace-nowrap text-md">
                                                        <div className="relative">
                                                            <SimpleInput
                                                                className="my-2 w-32"
                                                                number
                                                                min={Math.round(emptyWeight)}
                                                                max={Math.round(Units.kilogramToUser(Loadsheet.specs.weights.maxZfw))}
                                                                value={zfwDesired.toFixed(0)}
                                                                onBlur={(x) => {
                                                                    if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) processZfw(parseInt(x));
                                                                }}
                                                            />
                                                            <div className="absolute top-2 right-10 my-2 text-lg text-gray-400">{usingMetric ? 'KG' : 'LB'}</div>
                                                        </div>
                                                    </div>
                                                </TooltipWrapper>
                                            </td>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {`${zfw.toFixed(0)} ${usingMetric ? 'kg' : 'lb'}`}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {t('Ground.Payload.ZFWCG')}
                                            </td>
                                            <td>
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxZFWCG')} ${40}%`}>
                                                    <div className="px-4 font-light whitespace-nowrap text-md">
                                                        {/* TODO FIXME: Setting pax/cargo given desired ZFWCG, ZFW, total pax, total cargo */}
                                                        <div className="py-4 px-3 rounded-md transition">
                                                            {`${zfwDesiredCg.toFixed(2)} %`}
                                                        </div>
                                                        {/*
                                                            <SimpleInput
                                                                className="my-2 w-24"
                                                                number
                                                                disabled
                                                                min={0}
                                                                max={maxPax > 0 ? maxPax : 999}
                                                                value={zfwCg.toFixed(2)}
                                                                onBlur={{(x) => processZfwCg(x)}
                                                            />
                                                            */}
                                                    </div>
                                                </TooltipWrapper>
                                            </td>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {`${zfwCg.toFixed(2)} %`}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Card>
                            {simbriefDataLoaded
                                && (simbriefPax !== totalPaxDesired
                                || simbriefFreight + simbriefBag * simbriefBagWeight !== totalCargoDesired
                                || simbriefPaxWeight !== paxWeight
                                || simbriefBagWeight !== paxBagWeight) && (
                                <TooltipWrapper text={t('Ground.Payload.TT.FillPayloadFromSimbrief')}>
                                    <div
                                        className="flex justify-center items-center px-2 h-auto rounded-md rounded-l-none border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                                        onClick={() => setSimBriefValues()}
                                    >
                                        <CloudArrowDown size={26} />
                                    </div>
                                </TooltipWrapper>
                            )}
                        </div>
                        <div className="flex flex-row mt-4">
                            <Card className="pr-4 h-full" childrenContainerClassName="flex flex-col w-fit h-full">
                                <TooltipWrapper text={t('Ground.Payload.TT.PerPaxWeight')}>
                                    <div className="flex flex-row">
                                        <div className="flex relative flex-row items-center mt-1 font-light text-medium">
                                            <PersonFill size={25} className="mx-3" />
                                            <SimpleInput
                                                className="w-24"
                                                number
                                                min={Math.round(Units.kilogramToUser(Loadsheet.specs.pax.minPaxWeight))}
                                                max={Math.round(Units.kilogramToUser(Loadsheet.specs.pax.maxPaxWeight))}
                                                placeholder={Math.round(Units.kilogramToUser(Loadsheet.specs.pax.defaultPaxWeight)).toString()}
                                                value={paxWeight.toFixed(0)}
                                                onBlur={(x) => {
                                                    if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) setPaxWeight(parseInt(x));
                                                }}
                                            />
                                            <div className="absolute top-2 right-3 text-lg text-gray-400">{usingMetric ? 'KG' : 'LB'}</div>
                                        </div>
                                    </div>
                                </TooltipWrapper>
                                <TooltipWrapper text={t('Ground.Payload.TT.PerPaxBagWeight')}>
                                    <div className="flex relative flex-row items-center mt-1 font-light text-medium">
                                        <BriefcaseFill size={25} className="mx-3" />
                                        <SimpleInput
                                            className="w-24"
                                            number
                                            min={Math.round(Units.kilogramToUser(Loadsheet.specs.pax.minBagWeight))}
                                            max={Math.round(Units.kilogramToUser(Loadsheet.specs.pax.maxBagWeight))}
                                            placeholder={Math.round(Units.kilogramToUser(Loadsheet.specs.pax.defaultBagWeight)).toString()}
                                            value={paxBagWeight.toFixed(0)}
                                            onBlur={(x) => {
                                                if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) setPaxBagWeight(parseInt(x));
                                            }}
                                        />
                                        <div className="absolute top-2 right-3 text-lg text-gray-400">{usingMetric ? 'KG' : 'LB'}</div>
                                    </div>
                                </TooltipWrapper>
                            </Card>
                            <Card className="h-full w-fit" childrenContainerClassName="h-full w-fit rounded-r-none">
                                <div className="flex overflow-x-hidden flex-col justify-center items-center space-y-2">
                                    <div className="flex font-medium"> Boarding Time </div>
                                    <SelectGroup>
                                        <SelectItem selected={boardingRate === 'INSTANT'} onSelect={() => setBoardingRate('INSTANT')}>{t('Settings.Instant')}</SelectItem>

                                        <TooltipWrapper text={`${!coldAndDark ? t('Ground.Fuel.TT.AircraftMustBeColdAndDarkToChangeRefuelTimes') : ''}`}>
                                            <div><SelectItem className={`${!coldAndDark && 'opacity-20'}`} selected={boardingRate === 'FAST'} disabled={!coldAndDark} onSelect={() => setBoardingRate('FAST')}>{t('Settings.Fast')}</SelectItem></div>
                                        </TooltipWrapper>

                                        <div><SelectItem className={`${!coldAndDark && 'opacity-20'}`} selected={boardingRate === 'REAL'} disabled={!coldAndDark} onSelect={() => setBoardingRate('REAL')}>{t('Settings.Real')}</SelectItem></div>

                                    </SelectGroup>
                                </div>
                            </Card>
                            <div>
                                <TooltipWrapper text={t('Ground.Payload.TT.StartBoarding')}>
                                    <div
                                        className={`flex justify-center rounded-md rounded-l-none items-center h-full w-24 ${formatBoardingStatusClass()} bg-current`}
                                        onClick={() => setBoardingStarted(!boardingStarted)}
                                    >
                                        <div className={`${true ? 'text-white' : 'text-theme-unselected'}`}>
                                            <PlayFill size={50} className={boardingStarted ? 'hidden' : ''} />
                                            <StopCircleFill size={50} className={boardingStarted ? '' : 'hidden'} />
                                        </div>
                                    </div>
                                </TooltipWrapper>
                            </div>
                        </div>
                    </div>
                    <div className="border col-1 border-theme-accent">
                        <ChartWidget
                            width={525}
                            height={475}
                            envelope={Loadsheet.performanceEnvelope}
                            cg={boardingStarted ? Math.round(cg * 100) / 100 : Math.round(desiredCg * 100) / 100}
                            totalWeight={boardingStarted ? Math.round(Units.userToKilogram(totalWeight)) : Math.round(Units.userToKilogram(totalDesiredWeight))}
                            mldwCg={boardingStarted ? Math.round(mlwCg * 100) / 100 : Math.round(mlwDesiredCg * 100) / 100}
                            mldw={boardingStarted ? Math.round(Units.userToKilogram(mlw)) : Math.round(Units.userToKilogram(mlwDesired))}
                            zfwCg={boardingStarted ? Math.round(zfwCg * 100) / 100 : Math.round(zfwDesiredCg * 100) / 100}
                            zfw={boardingStarted ? Math.round(Units.userToKilogram(zfw)) : Math.round(Units.userToKilogram(zfwDesired))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
