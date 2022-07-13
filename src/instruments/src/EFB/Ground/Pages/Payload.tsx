/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { BriefcaseFill, CloudArrowDown, PersonPlusFill, PlayFill, StopCircleFill } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { Units } from '@shared/units';
import { usePersistentProperty } from '@instruments/common/persistence';
import { BitFlags } from '@shared/bitFlags';
import { useBitFlags } from '@instruments/common/bitFlags';
import { round } from 'lodash';
import { BalanceWeight } from './BalanceWeight/BalanceWeight';
import { PaxStationInfo, CargoStationInfo } from './Seating/Constants';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import Loadsheet from './Loadsheet/a20nv55.json';
import { ProgressBar } from '../../UtilComponents/Progress/Progress';
import Card from '../../UtilComponents/Card/Card';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SeatMapWidget } from './Seating/SeatMapWidget';
import { isSimbriefDataLoaded } from '../../Store/features/simBrief';

enum PaxStation {
    A,
    B,
    C,
    D
}

enum CargoStation {
    fwdBag,
    aftCont,
    aftBag,
    aftBulk
}

export const Payload = () => {
    const { usingMetric } = Units;
    const simbriefDataLoaded = isSimbriefDataLoaded();
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    const [paxWeight, setPaxWeight] = useSimVar(`L:${Loadsheet.specs.prefix}_WB_PER_PAX_WEIGHT`, 'Number');
    const [paxBagWeight, setPaxBagWeight] = useSimVar(`L:${Loadsheet.specs.prefix}_WB_PER_BAG_WEIGHT`, 'Number');
    const [galToKg] = useSimVar('FUEL WEIGHT PER GALLON', 'kilograms');
    const [estFuelBurn] = useSimVar(`L:${Loadsheet.specs.prefix}_ESTIMATED_FUEL_BURN`, 'Kilograms');

    const [emptyWeight] = useSimVar('A:EMPTY WEIGHT', usingMetric ? 'Kilograms' : 'Pounds');

    const [paxA, setPaxA] = useSimVar(`L:${Loadsheet.specs.prefix}_PAX_TOTAL_ROWS_1_6`, 'Number');
    const [paxB, setPaxB] = useSimVar(`L:${Loadsheet.specs.prefix}_PAX_TOTAL_ROWS_7_13`, 'Number');
    const [paxC, setPaxC] = useSimVar(`L:${Loadsheet.specs.prefix}_PAX_TOTAL_ROWS_14_21`, 'Number');
    const [paxD, setPaxD] = useSimVar(`L:${Loadsheet.specs.prefix}_PAX_TOTAL_ROWS_22_29`, 'Number');

    const [stationSize, setStationLen] = useState<number[]>([]);

    const pax = [paxA, paxB, paxC, paxD];
    const setPax = [setPaxA, setPaxB, setPaxC, setPaxD];
    const totalPax = pax && pax.length > 0 && pax.reduce((a, b) => a + b);
    const maxPax = (stationSize && stationSize.length > 0) ? stationSize.reduce((a, b) => a + b) : -1;
    const totalPaxWeight = totalPax * paxWeight;

    const [aFlags, setAFlags] = useBitFlags('PAX_FLAGS_A');
    const [bFlags, setBFlags] = useBitFlags('PAX_FLAGS_B');
    const [cFlags, setCFlags] = useBitFlags('PAX_FLAGS_C');
    const [dFlags, setDFlags] = useBitFlags('PAX_FLAGS_D');

    const desiredFlags = [aFlags, bFlags, cFlags, dFlags];
    const setActiveFlags = [setAFlags, setBFlags, setCFlags, setDFlags];

    const [clicked, setClicked] = useState(false);

    const [fwdBag, setFwdBag] = useSimVar(`L:${Loadsheet.specs.prefix}_CARGO_FWD_BAGGAGE_CONTAINER`, 'Number');
    const [aftCont, setAftCont] = useSimVar(`L:${Loadsheet.specs.prefix}_CARGO_AFT_CONTAINER`, 'Number');
    const [aftBag, setAftBag] = useSimVar(`L:${Loadsheet.specs.prefix}_CARGO_AFT_BAGGAGE`, 'Number');
    const [aftBulk, setAftBulk] = useSimVar(`L:${Loadsheet.specs.prefix}_CARGO_AFT_BULK_LOOSE`, 'Number');

    const [cargoStationSize, setCargoStationLen] = useState<number[]>([]);

    const cargo = [fwdBag, aftCont, aftBag, aftBulk];
    const setCargo = [setFwdBag, setAftCont, setAftBag, setAftBulk];
    const maxCargo = (cargoStationSize && cargoStationSize.length > 0) ? cargoStationSize.reduce((a, b) => a + b) : -1;
    const totalCargo = (cargo && cargo.length > 0) ? cargo.reduce((a, b) => a + b) : -1;

    const [centerCurrent] = useSimVar('FUEL TANK CENTER QUANTITY', 'Gallons');
    const [LInnCurrent] = useSimVar('FUEL TANK LEFT MAIN QUANTITY', 'Gallons');
    const [LOutCurrent] = useSimVar('FUEL TANK LEFT AUX QUANTITY', 'Gallons');
    const [RInnCurrent] = useSimVar('FUEL TANK RIGHT MAIN QUANTITY', 'Gallons');
    const [ROutCurrent] = useSimVar('FUEL TANK RIGHT AUX QUANTITY', 'Gallons');

    /*
    const [paxAInput, setPaxAInput] = useSimVar('L:${Loadsheet.specs.prefix}_PAX_TOTAL_ROWS_1_6_DESIRED', 'Number');
    const [paxBInput, setPaxBInput] = useSimVar('L:${Loadsheet.specs.prefix}_PAX_TOTAL_ROWS_7_13_DESIRED', 'Number');
    const [paxCInput, setPaxCInput] = useSimVar('L:${Loadsheet.specs.prefix}_PAX_TOTAL_ROWS_14_21_DESIRED', 'Number');
    const [paxDInput, setPaxDInput] = useSimVar('L:${Loadsheet.specs.prefix}_PAX_TOTAL_ROWS_22_29_DESIRED', 'Number');
    */

    /*
    const [fwdBagInput, setFwdBagInput] = useSimVar('L:${Loadsheet.specs.prefix}_CARGO_FWD_BAGGAGE_CONTAINER_DESIRED', 'Number');
    const [aftContInput, setAftContInput] = useSimVar('L:${Loadsheet.specs.prefix}_CARGO_AFT_CONTAINER_DESIRED', 'Number');
    const [aftBagInput, setAftBagInput] = useSimVar('L:${Loadsheet.specs.prefix}_CARGO_AFT_BAGGAGE_DESIRED', 'Number');
    const [aftBulkInput, setAftBulkInput] = useSimVar('L:${Loadsheet.specs.prefix}_CARGO_FWD_BAGGAGE_CONTAINER_DESIRED', 'Number');
    */

    // Units
    // Weight/CG
    const [zfw, setZfw] = useState(0);
    const [zfwCg, setZfwCg] = useState(0);
    const [cg] = useSimVar('A:CG PERCENT', 'percent');
    const [totalWeight] = useSimVar('A:TOTAL WEIGHT', usingMetric ? 'Kilograms' : 'Pounds');
    const [mlwCg, setMlwCg] = useState(0);
    const [mlw, setMlw] = useState(0);

    const cgPoints = {
        mzfw: { cg: zfwCg, weight: zfw },
        mlw: { cg: mlwCg, weight: mlw },
        mtow: { cg, weight: totalWeight },
    };

    const [seatMap] = useState<PaxStationInfo[]>(Loadsheet.seatMap);
    const [cargoMap] = useState<CargoStationInfo[]>(Loadsheet.cargoMap);

    const totalCurrentGallon = () => round(Math.max(LInnCurrent + LOutCurrent + RInnCurrent + ROutCurrent + centerCurrent, 0));

    const returnSeats = (station: number, increase: boolean): number[] => {
        const seats: number[] = [];
        const bitFlags: BitFlags = desiredFlags[station];
        for (let seatId = 0; seatId < stationSize[station]; seatId++) {
            if (!increase && bitFlags.getBitIndex(seatId)) {
                seats.push(seatId);
            } else if (increase && !bitFlags.getBitIndex(seatId)) {
                seats.push(seatId);
            }
        }
        return seats;
    };

    const chooseRandomSeats = (station: number, choices: number[], numChoose: number) => {
        const bitFlags: BitFlags = desiredFlags[station];
        for (let i = 0; i < numChoose; i++) {
            if (choices.length > 0) {
                const chosen = ~~(Math.random() * choices.length);
                bitFlags.toggleBitIndex(choices[chosen]);
                choices.splice(chosen, 1);
            }
        }
        setActiveFlags[station](bitFlags);
    };

    /*
    const changePax = (station: number, newValue: number) => {
        if (!stationSize || newValue > stationSize[station] || newValue < 0) return;
        const value = pax[station];
        const seats: number[] = returnSeats(station, newValue > value);
        chooseRandomSeats(station, seats, Math.abs(value - newValue));

        setPax[station](newValue);
    };
    */

    const setTotalPax = (numOfPax: number) => {
        if (!stationSize || numOfPax === totalPax || numOfPax > maxPax || numOfPax < 0) return;

        let paxRemaining = numOfPax;

        const fillStation = (stationIndex, percent, paxToFill) => {
            const pax = Math.min(Math.trunc(percent * paxToFill), stationSize[stationIndex]);
            setPax[stationIndex](pax);
            paxRemaining -= pax;

            const paxCount = returnSeats(stationIndex, false).length;
            const seats: number[] = returnSeats(stationIndex, pax[stationIndex] > paxCount);
            chooseRandomSeats(stationIndex, seats, Math.abs(paxCount - pax[stationIndex]));
        };

        for (let i = pax.length - 1; i > 0; i--) {
            fillStation(i, stationSize[i] / maxPax, numOfPax);
        }
        fillStation(0, 1, paxRemaining);
    };

    const setTargetCargo = (numberOfPax, freight) => {
        const bagWeight = numberOfPax * paxBagWeight;
        const maxLoadInCargoHold = maxCargo;
        const loadableCargoWeight = Math.min(bagWeight + parseInt(freight), maxLoadInCargoHold);

        let remainingWeight = loadableCargoWeight;

        async function fillCargo(station, percent, loadableCargoWeight) {
            const cargo = Math.round(percent * loadableCargoWeight);
            remainingWeight -= cargo;
            setCargo[station](cargo);
        }

        for (let i = cargo.length - 1; i > 0; i--) {
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

    const calculateCargoMoment = () => {
        let cargoMoment = 0;
        cargo.forEach((station, i) => {
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

        setTotalPax(newPax);
        setTargetCargo(newPax, newCargo);
    };

    const onClickCargo = (cargoStation, e) => {
        const cargoPercent = Math.min(Math.max(0, e.nativeEvent.offsetX / cargoMap[cargoStation].progressBarWidth), 1);
        setCargo[cargoStation](Math.round(cargoMap[cargoStation].weight * cargoPercent));
    };

    const onClickSeat = (station: number, seatId: number) => {
        setClicked(true);
        const bitFlags: BitFlags = desiredFlags[station];

        if (bitFlags.getBitIndex(seatId)) {
            setPax[station](pax[station] - 1);
        } else {
            setPax[station](pax[station] + 1);
        }
        bitFlags.toggleBitIndex(seatId);
        setActiveFlags[station](bitFlags);
        setClicked(false);
    };

    // Init
    useEffect(() => {
        // TODO: remove magic numbers
        if (paxWeight === 0) {
            setPaxWeight(Loadsheet.specs.pax.defaultPaxWeight);
        }
        if (paxBagWeight === 0) {
            setPaxBagWeight(Loadsheet.specs.pax.defaultBagWeight);
        }
    }, []);

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

    // Adjust passenger seats to match station size on change
    pax.forEach((station, stationIndex) => {
        useEffect(() => {
            const paxCount = returnSeats(stationIndex, false).length;
            if (!clicked && station !== paxCount) {
                const seats: number[] = returnSeats(stationIndex, station > paxCount);
                chooseRandomSeats(stationIndex, seats, Math.abs(paxCount - station));
            }
        }, [station]);
    });

    useEffect(() => {
        // Adjust ZFW CG Values based on payload
        const newZfwMass = emptyWeight + totalPaxWeight + totalCargo;
        const newZfwMoment = Loadsheet.specs.emptyPosition * emptyWeight + calculatePaxMoment() + calculateCargoMoment();
        const newZfwCg = calculateCg(newZfwMass, newZfwMoment);

        if (zfwCg !== newZfwCg) {
            setZfwCg(newZfwCg);
        }

        if (zfw !== newZfwMass) {
            setZfw(newZfwMass);
        }

        // Adjust MLW CG values based on estimated fuel burn
        const OUTER_CELL_KG = 228 * galToKg;
        const INNER_CELL_KG = 1816 * galToKg;

        const centerTankMoment = -6;
        const innerTankMoment = -8;
        const outerTankMoment = -13;

        const totalFuel = round(totalCurrentGallon() * galToKg);
        let fuelRemain = totalFuel - estFuelBurn;

        let centerTank = 0;
        let outerTanks = 0;
        let innerTanks = 0;

        // TODO: Better fuel burn algorithm for estimation
        fuelRemain -= (OUTER_CELL_KG) * 2;
        outerTanks = ((OUTER_CELL_KG) * 2) + Math.min(fuelRemain, 0);
        if (fuelRemain > 0) {
            fuelRemain -= (INNER_CELL_KG) * 2;
            innerTanks = ((INNER_CELL_KG) * 2) + Math.min(fuelRemain, 0);
            if (fuelRemain > 0) {
                centerTank = fuelRemain;
            }
        }

        const fuelRemainMoment = centerTank * centerTankMoment
        + outerTanks * outerTankMoment + innerTanks * innerTankMoment;

        const newLdgMass = newZfwMass + totalFuel - estFuelBurn;
        const newLdgMoment = newZfwMoment + fuelRemainMoment;

        const newLdgCg = calculateCg(newLdgMass, newLdgMoment);

        if (mlwCg !== newLdgCg) {
            setMlwCg(newLdgCg);
        }
        if (mlw !== newLdgMass) {
            setMlw(newLdgMass);
        }
    }, [
        paxA, paxB, paxC, paxD,
        fwdBag, aftBag, aftCont,
        aftBulk, paxWeight, paxBagWeight, emptyWeight,
        LInnCurrent, LOutCurrent, RInnCurrent,
        ROutCurrent, centerCurrent, estFuelBurn,
    ]);

    return (
        <div>
            <div className="h-content-section-reduced">
                <div className="mb-10 ">
                    <SeatMapWidget seatMap={seatMap} desiredFlags={desiredFlags} onClickSeat={onClickSeat} />
                </div>
                <div className="flex absolute top-16 left-1/4 flex-row px-4 w-fit">
                    <BriefcaseFill size={25} className="my-1 mx-3" />
                    <div className="cursor-pointer" onClick={(e) => onClickCargo(CargoStation.fwdBag, e)}>
                        <ProgressBar
                            height="20px"
                            width={`${cargoMap[CargoStation.fwdBag].progressBarWidth}px`}
                            displayBar={false}
                            completedBarBegin={100}
                            isLabelVisible={false}
                            bgcolor="var(--color-highlight)"
                            completed={fwdBag / cargoStationSize[CargoStation.fwdBag] * 100}
                        />
                    </div>
                </div>
                <div className="flex absolute top-16 left-2/3 flex-row px-4 w-fit">
                    <div className="flex flex-row cursor-pointer" onClick={(e) => onClickCargo(CargoStation.aftCont, e)}>
                        <ProgressBar
                            height="20px"
                            width={`${cargoMap[CargoStation.aftCont].progressBarWidth}px`}
                            displayBar={false}
                            completedBarBegin={100}
                            isLabelVisible={false}
                            bgcolor="var(--color-highlight)"
                            completed={aftCont / cargoStationSize[CargoStation.aftCont] * 100}
                        />
                    </div>
                    <div className="flex flex-row cursor-pointer " onClick={(e) => onClickCargo(CargoStation.aftBag, e)}>
                        <ProgressBar
                            height="20px"
                            width={`${cargoMap[CargoStation.aftBag].progressBarWidth}px`}
                            displayBar={false}
                            completedBarBegin={100}
                            isLabelVisible={false}
                            bgcolor="var(--color-highlight)"
                            completed={aftBag / cargoStationSize[CargoStation.aftBag] * 100}
                        />
                    </div>
                    <div className="flex flex-row cursor-pointer " onClick={(e) => onClickCargo(CargoStation.aftBulk, e)}>
                        <ProgressBar
                            height="20px"
                            width={`${cargoMap[CargoStation.aftBulk].progressBarWidth}px`}
                            displayBar={false}
                            completedBarBegin={100}
                            isLabelVisible={false}
                            bgcolor="var(--color-highlight)"
                            completed={aftBulk / cargoStationSize[CargoStation.aftBulk] * 100}
                        />
                    </div>
                </div>

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
                                            <div>
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxPassengers')} ${maxPax}`}>
                                                    <td className="relative px-4 font-light whitespace-nowrap text-md">
                                                        <SimpleInput
                                                            className="my-2 w-32"
                                                            number
                                                            min={0}
                                                            max={maxPax > 0 ? maxPax : 999}
                                                            value={totalPax}
                                                            onBlur={(x) => {
                                                                setTotalPax(parseInt(x));
                                                                setTargetCargo(parseInt(x), cargo);
                                                            }}
                                                        />
                                                    </td>
                                                </TooltipWrapper>
                                            </div>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {`${totalPax} ${t('Ground.Payload.Passengers')}`}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {t('Ground.Payload.Cargo')}
                                            </td>
                                            <div>
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxCargo')} ${maxCargo} ${usingMetric ? 'kg' : 'lb'}`}>
                                                    <td className="px-4 font-light whitespace-nowrap text-md">
                                                        <div className="relative">
                                                            <SimpleInput
                                                                className="my-2 w-32"
                                                                number
                                                                min={0}
                                                                max={maxCargo > 0 ? maxCargo : 99999}
                                                                value={cargo && totalCargo}
                                                                onBlur={(x) => setTargetCargo(0, x)}
                                                            />
                                                            <div className="absolute top-2 right-4 my-2 text-lg text-gray-400">{usingMetric ? 'KG' : 'LB'}</div>
                                                        </div>
                                                    </td>
                                                </TooltipWrapper>
                                            </div>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {`${totalCargo} ${usingMetric ? 'kg' : 'lb'}`}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {t('Ground.Payload.ZFW')}
                                            </td>
                                            <div>
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxZFW')} ${Loadsheet.specs.weights.maxZfw} ${usingMetric ? 'kg' : 'lb'}`}>
                                                    <td className="px-4 font-light whitespace-nowrap text-md">
                                                        <div className="relative">
                                                            <SimpleInput
                                                                className="my-2 w-32"
                                                                number
                                                                min={emptyWeight.toFixed(0)}
                                                                max={Loadsheet.specs.weights.maxZfw}
                                                                value={zfw.toFixed(0)}
                                                                onBlur={(x) => processZfw(parseInt(x))}
                                                            />
                                                            <div className="absolute top-2 right-4 my-2 text-lg text-gray-400">{usingMetric ? 'KG' : 'LB'}</div>
                                                        </div>
                                                    </td>
                                                </TooltipWrapper>
                                            </div>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {`${zfw.toFixed(0)} kg`}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {t('Ground.Payload.ZFWCG')}
                                            </td>
                                            <div>
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxZFWCG')} ${40}%`}>
                                                    <td className="px-4 font-light whitespace-nowrap text-md">
                                                        {/* TODO FIXME: Setting pax/cargo given desired ZFWCG, ZFW, total pax, total cargo */}
                                                        <div className="py-4 px-3 rounded-md transition">
                                                            {`${zfwCg.toFixed(2)} %`}
                                                        </div>
                                                        {/*
                                                        <SimpleInput
                                                            className="my-2 w-24"
                                                            number
                                                            disabled
                                                            min={0}
                                                            max={maxPax > 0 ? maxPax : 999}
                                                            value={zfwCg.toFixed(2)}
                                                            onBlur={undefined} // {(x) => processZfwCg(x)}
                                                        />
                                                        */}
                                                    </td>
                                                </TooltipWrapper>
                                            </div>
                                            <td className="px-4 font-light whitespace-nowrap text-md">
                                                {`${zfwCg.toFixed(2)} %`}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Card>
                            {true && (
                                <TooltipWrapper text={t('Ground.Payload.TT.FillPayloadFromSimbrief')}>
                                    <div
                                        className="flex justify-center items-center px-2 h-auto rounded-md rounded-l-none border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                                        onClick={undefined}
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
                                            <PersonPlusFill size={25} className="mx-3" />
                                            <SimpleInput
                                                className="w-24"
                                                number
                                                min={Loadsheet.specs.pax.minPaxWeight}
                                                max={Loadsheet.specs.pax.maxPaxWeight}
                                                placeholder={Loadsheet.specs.pax.defaultPaxWeight.toString()}
                                                value={paxWeight}
                                                onBlur={(x) => setPaxWeight(parseInt(x))}
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
                                            min={Loadsheet.specs.pax.minBagWeight}
                                            max={Loadsheet.specs.pax.maxBagWeight}
                                            placeholder={Loadsheet.specs.pax.defaultBagWeight.toString()}
                                            value={paxBagWeight}
                                            onBlur={(x) => setPaxBagWeight(parseInt(x))}
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
                                        <SelectItem selected={boardingRate === 'FAST'} onSelect={() => setBoardingRate('FAST')}>{t('Settings.Fast')}</SelectItem>
                                        <SelectItem selected={boardingRate === 'REAL'} onSelect={() => setBoardingRate('REAL')}>{t('Settings.Real')}</SelectItem>
                                    </SelectGroup>
                                </div>
                            </Card>
                            <div>
                                <TooltipWrapper text={t('Ground.Payload.TT.StartBoarding')}>
                                    <div
                                        className={`flex justify-center rounded-md rounded-l-none items-center h-full w-24 ${true ? 'text-theme-highlight' : 'text-theme-highlight'} bg-current`}
                                        onClick={undefined}
                                    >
                                        <div className={`${true ? 'text-white' : 'text-theme-unselected'}`}>
                                            <PlayFill size={50} className={false ? 'hidden' : ''} />
                                            <StopCircleFill size={50} className={false ? '' : 'hidden'} />
                                        </div>
                                    </div>
                                </TooltipWrapper>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border col-1 border-theme-accent">
                        <BalanceWeight width={525} height={475} envelope={Loadsheet.performanceEnvelope} points={cgPoints} />
                    </div>
                </div>
            </div>
        </div>
    );
};
