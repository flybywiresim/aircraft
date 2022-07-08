/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { BagPlusFill, CloudArrowDown, PersonPlusFill, PlayFill, StopCircleFill } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { Units } from '@shared/units';
import { usePersistentProperty } from '@instruments/common/persistence';
import { BitFlags } from '@shared/bitFlags';
import { useBitFlags } from '@instruments/common/bitFlags';
import { round } from 'lodash';
import { BalanceWeight } from './BalanceWeight/BalanceWeight';
import { SeatInfo, PaxStationInfo, CargoStationInfo, TYPE } from './Seating/Constants';
import { PerformanceEnvelope } from './BalanceWeight/Constants';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { ProgressBar } from '../../UtilComponents/Progress/Progress';
import Card from '../../UtilComponents/Card/Card';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SeatMap } from './Seating/SeatMap';
import { isSimbriefDataLoaded } from '../../Store/features/simBrief';

interface LabelProps {
    className?: string;
    text: string;
}

const Label: React.FC<LabelProps> = ({ text, className, children }) => (
    <div className="flex flex-row justify-between items-center">
        <p className={`text-theme-text mx-4 ${className}`}>{text}</p>
        {children}
    </div>
);

const Station = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    fwdBag: 0,
    aftCont: 1,
    aftBag: 2,
    aftBulk: 3,
};

const defaultRow = (): SeatInfo[] => (
    [
        { type: TYPE.ECO, x: 0, y: 0, yOffset: 0 },
        { type: TYPE.ECO, x: 0, y: 0, yOffset: 0 },
        { type: TYPE.ECO, x: 0, y: 0, yOffset: 0 },
        { type: TYPE.ECO, x: 0, y: 0, yOffset: 19 },
        { type: TYPE.ECO, x: 0, y: 0, yOffset: 0 },
        { type: TYPE.ECO, x: 0, y: 0, yOffset: 0 },
    ]
);

const emergRow = (): SeatInfo[] => (
    [
        { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0 },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0 },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0 },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 19 },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0 },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0 },
    ]
);

const addRow = (
    seats: SeatInfo[] = defaultRow(),
    x: number = 0,
    y: number = 0,
    xOffset: number = 0,
    yOffset: number = 0,
) => ({ seats, x, y, xOffset, yOffset });

const defaultSeatMap: PaxStationInfo[] = [
    {
        // A
        name: 'ROWS [1-6]',
        rows: [addRow(), addRow(), addRow(), addRow(), addRow(), addRow()],
        index: 0,
        stationIndex: 1,
        position: 21.98,
        simVar: 'A32NX_PAX_TOTAL_ROWS_1_6',
    },
    {
        // B
        name: 'ROWS [7-13]',
        rows: [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(emergRow()), addRow(emergRow())],
        index: 1,
        stationIndex: 2,
        position: 2.86,
        simVar: 'A32NX_PAX_TOTAL_ROWS_7_13',
    },
    {
        // C
        name: 'ROWS [14-21]',
        rows: [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow()],
        index: 2,
        stationIndex: 3,
        position: -15.34,
        simVar: 'A32NX_PAX_TOTAL_ROWS_14_21',
    },
    {
        // D
        name: 'ROWS [22-29]',
        rows: [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow()],
        index: 3,
        stationIndex: 4,
        position: -32.81,
        simVar: 'A32NX_PAX_TOTAL_ROWS_22_29',
    },
];

const defaultCargoMap: CargoStationInfo[] = [
    {
        name: 'FWD BAGGAGE/CONTAINER',
        weight: 3402,
        index: 0,
        stationIndex: 5,
        position: 18.28,
        simVar: 'A32NX_CARGO_FWD_BAGGAGE_CONTAINER',
    },
    {
        name: 'AFT CONTAINER',
        weight: 2426,
        index: 1,
        stationIndex: 6,
        position: -15.96,
        simVar: 'A32NX_CARGO_AFT_CONTAINER',
    },
    {
        name: 'AFT BAGGAGE',
        weight: 2110,
        index: 2,
        stationIndex: 7,
        position: -27.10,
        simVar: 'A32NX_CARGO_AFT_BAGGAGE',
    },
    {
        name: 'AFT BULK/LOOSE',
        weight: 1497,
        index: 3,
        stationIndex: 8,
        position: -37.35,
        simVar: 'A32NX_CARGO_AFT_BULK_LOOSE',
    },
];

const defaultEnvelope: PerformanceEnvelope = {
    mlw: [
        [17, 67400],
        [40, 67400],
        [40, 50000],
        [35, 46000],
        [35, 40600],
    ],
    mzfw: [
        [17, 64300],
        [40, 64300],
        [40, 73500],
        [40, 50000],
        [35, 46000],
        [35, 40600],
        [15, 40600],
    ],
    mtow: [
        [15, 40600],
        [15, 53000],
        [17, 63000],
        [17, 72000],
        [27, 79000],
        [36, 79000],
        [40, 73500],
        [40, 58000],
        [32, 40600],
    ],
};

const leMacZ = -5.386;
const macSize = 13.454;

const emptyPosition = -8.75; // Value from flight_model.cfg

export const Payload = () => {
    const { usingMetric } = Units;
    const simbriefDataLoaded = isSimbriefDataLoaded();
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    // const [weightUnit, setWeightUnit] = usePersistentProperty('EFB_PREFERRED_WEIGHT_UNIT', usingMetric ? 'kg' : 'lb');
    const [paxWeight, setPaxWeight] = useSimVar('L:A32NX_WB_PER_PAX_WEIGHT', 'Number');
    const [paxBagWeight, setPaxBagWeight] = useSimVar('L:A32NX_WB_PER_BAG_WEIGHT', 'Number');
    const [galToKg] = useSimVar('FUEL WEIGHT PER GALLON', 'kilograms');
    const [estFuelBurn] = useSimVar('L:A32NX_ESTIMATED_FUEL_BURN', 'Kilograms');

    const [emptyWeight] = useSimVar('A:EMPTY WEIGHT', usingMetric ? 'Kilograms' : 'Pounds');

    const [paxA, setPaxA] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number');
    const [paxB, setPaxB] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number');
    const [paxC, setPaxC] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_21', 'Number');
    const [paxD, setPaxD] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_22_29', 'Number');
    const [fwdBag, setFwdBag] = useSimVar('L:A32NX_CARGO_FWD_BAGGAGE_CONTAINER', 'Number');
    const [aftCont, setAftCont] = useSimVar('L:A32NX_CARGO_AFT_CONTAINER', 'Number');
    const [aftBag, setAftBag] = useSimVar('L:A32NX_CARGO_AFT_BAGGAGE', 'Number');
    const [aftBulk, setAftBulk] = useSimVar('L:A32NX_CARGO_AFT_BULK_LOOSE', 'Number');
    const [centerCurrent] = useSimVar('FUEL TANK CENTER QUANTITY', 'Gallons');
    const [LInnCurrent] = useSimVar('FUEL TANK LEFT MAIN QUANTITY', 'Gallons');
    const [LOutCurrent] = useSimVar('FUEL TANK LEFT AUX QUANTITY', 'Gallons');
    const [RInnCurrent] = useSimVar('FUEL TANK RIGHT MAIN QUANTITY', 'Gallons');
    const [ROutCurrent] = useSimVar('FUEL TANK RIGHT AUX QUANTITY', 'Gallons');

    /*
    const [paxA, setPaxA] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6_DESIRED', 'Number');
    const [paxB, setPaxB] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13_DESIRED', 'Number');
    const [paxC, setPaxC] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_21_DESIRED', 'Number');
    const [paxD, setPaxD] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_22_29_DESIRED', 'Number');
    */

    /*
    const [fwdBag, setFwdBag] = useSimVar('L:A32NX_CARGO_FWD_BAGGAGE_CONTAINER_DESIRED', 'Number');
    const [aftCont, setAftCont] = useSimVar('L:A32NX_CARGO_AFT_CONTAINER_DESIRED', 'Number');
    const [aftBag, setAftBag] = useSimVar('L:A32NX_CARGO_AFT_BAGGAGE_DESIRED', 'Number');
    const [aftBulk, setAftBulk] = useSimVar('L:A32NX_CARGO_FWD_BAGGAGE_CONTAINER_DESIRED', 'Number');
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

    const [stationSize, setStationLen] = useState<number[]>([]);
    const [cargoStationSize, setCargoStationLen] = useState<number[]>([]);

    const [aFlags, setAFlags] = useBitFlags('PAX_FLAGS_A');
    const [bFlags, setBFlags] = useBitFlags('PAX_FLAGS_B');
    const [cFlags, setCFlags] = useBitFlags('PAX_FLAGS_C');
    const [dFlags, setDFlags] = useBitFlags('PAX_FLAGS_D');

    const activeFlags = [aFlags, bFlags, cFlags, dFlags];
    const setActiveFlags = [setAFlags, setBFlags, setCFlags, setDFlags];

    const [seatMap] = useState<PaxStationInfo[]>(defaultSeatMap);
    const [cargoMap] = useState<CargoStationInfo[]>(defaultCargoMap);

    const pax = [paxA, paxB, paxC, paxD];
    const setPax = [setPaxA, setPaxB, setPaxC, setPaxD];
    const totalPax = pax && pax.length > 0 && pax.reduce((a, b) => a + b);
    const maxPax = (stationSize && stationSize.length > 0) ? stationSize.reduce((a, b) => a + b) : -1;
    const totalPaxWeight = totalPax * paxWeight;
    const cargo = [fwdBag, aftCont, aftBag, aftBulk];
    const setCargo = [setFwdBag, setAftCont, setAftBag, setAftBulk];
    const maxCargo = (cargoStationSize && cargoStationSize.length > 0) ? cargoStationSize.reduce((a, b) => a + b) : -1;
    const totalCargo = (cargo && cargo.length > 0) ? cargo.reduce((a, b) => a + b) : -1;

    const totalCurrentGallon = () => round(Math.max(LInnCurrent + LOutCurrent + RInnCurrent + ROutCurrent + centerCurrent, 0));

    const returnSeats = (station: number, increase: boolean): number[] => {
        const seats: number[] = [];
        const bitFlags: BitFlags = activeFlags[station];
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
        const bitFlags: BitFlags = activeFlags[station];
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

        const fillStation = (station, percent, paxToFill) => {
            const pax = Math.min(Math.trunc(percent * paxToFill), stationSize[station]);
            setPax[station](pax);
            paxRemaining -= pax;
        };

        fillStation(Station.D, 0.28, numOfPax);
        fillStation(Station.C, 0.28, numOfPax);
        fillStation(Station.B, 0.25, numOfPax);
        fillStation(Station.A, 1, paxRemaining);
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

        fillCargo(Station.fwdBag, 0.361, loadableCargoWeight);
        fillCargo(Station.aftBag, 0.220, loadableCargoWeight);
        fillCargo(Station.aftCont, 0.251, loadableCargoWeight);
        fillCargo(Station.aftBulk, 1, remainingWeight);
    };

    // TODO FIXME: Refactor hard code
    const calculatePaxMoment = () => paxA * paxWeight * seatMap[Station.A].position
        + paxB * paxWeight * seatMap[Station.B].position
        + paxC * paxWeight * seatMap[Station.C].position
        + paxD * paxWeight * seatMap[Station.D].position;

    const calculateCargoMoment = () => fwdBag * cargoMap[Station.fwdBag].position
        + aftCont * cargoMap[Station.aftCont].position
        + aftBag * cargoMap[Station.aftBag].position
        + aftBulk * cargoMap[Station.aftBulk].position;

    const calculateCg = (mass, moment) => -100 * ((moment / mass - leMacZ) / macSize);
    const calculateMomentFromCG = (cg, mass) => (leMacZ * mass - macSize * cg * mass / 100) - emptyPosition * emptyWeight;

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

    const processZfwCg = (newCg) => {
        const originalMoment = calculatePaxMoment() + calculateCargoMoment();
        const newMoment = calculateMomentFromCG(newCg, zfw);

        const deltaMoment = newMoment - originalMoment;

        // Shift Cargo first, then Pax
        if (deltaMoment > 0) {
            /*
            const fwdCargo = cargoMap.filter((station) => station.position >= 0);
            for (let i = 0; i < fwdCargo.length && deltaMoment > 0; i++) {
                const shiftCargo = Math.round(Math.min(Math.round(Units.kilogramToUser(fwdCargo[i].weight), deltaMoment / fwdCargo[i].position));
                setCargo[fwdCargo[i].index](shiftCargo);
                deltaMoment -= shiftCargo * fwdCargo[i].position;
            }
            /*
            const fwdPax = seatMap.filter((station) => station.position >= 0);
            for (let i = 0; i < fwdPax.length && deltaMoment > 0; i++) {
                const shiftPax = Math.min(stationSize[fwdPax[i].index], Math.round(deltaMoment / fwdPax[i].position / paxWeight));
                setPax[fwdPax[i].index](shiftPax);
                deltaMoment -= shiftPax * paxWeight * fwdPax[i].position;
            }
            */
        } else {
            /*
            const aftCargo = cargoMap.filter((station) => station.position < 0);
            for (let i = 0; i < aftCargo.length; i++) {
                const stationMax = aftCargo[i].weight * aftCargo[i].position;
                const shiftCargo = deltaMoment / aftCargo[i].position;
            }
            const aftPax = seatMap.filter((station) => station.position < 0);
            */
        }
    };

    // Init
    useEffect(() => {
        // TODO: remove magic numbers
        if (paxWeight === 0) {
            setPaxWeight(80);
        }
        if (paxBagWeight === 0) {
            console.log('hello');
            setPaxBagWeight(15);
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
    useEffect(() => {
        const paxCount = returnSeats(Station.A, false).length;
        if (paxA !== paxCount) {
            const seats: number[] = returnSeats(Station.A, paxA > paxCount);
            chooseRandomSeats(Station.A, seats, Math.abs(paxCount - paxA));
        }
    }, [paxA]);
    useEffect(() => {
        const paxCount = returnSeats(Station.B, false).length;
        if (paxB !== paxCount) {
            const seats: number[] = returnSeats(Station.B, paxB > paxCount);
            chooseRandomSeats(Station.B, seats, Math.abs(paxCount - paxB));
        }
    }, [paxB]);
    useEffect(() => {
        const paxCount: number = returnSeats(Station.C, false).length;
        if (paxC !== paxCount) {
            const seats: number[] = returnSeats(Station.C, paxC > paxCount);
            chooseRandomSeats(Station.C, seats, Math.abs(paxCount - paxC));
        }
    }, [paxC]);
    useEffect(() => {
        const paxCount: number = returnSeats(Station.D, false).length;
        if (paxD !== paxCount) {
            const seats: number[] = returnSeats(Station.D, paxD > paxCount);
            chooseRandomSeats(Station.D, seats, Math.abs(paxCount - paxD));
        }
    }, [paxD]);

    useEffect(() => {
        // Adjust ZFW CG Values based on payload
        const newZfwMass = emptyWeight + totalPaxWeight + totalCargo;
        const newZfwMoment = emptyPosition * emptyWeight + calculatePaxMoment() + calculateCargoMoment();
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
                    <SeatMap seatMap={seatMap} activeFlags={activeFlags} />
                </div>
                <div className="flex absolute top-16 left-1/4 flex-row px-4 w-fit">
                    <ProgressBar
                        height="20px"
                        width="180px"
                        displayBar={false}
                        completedBarBegin={100}
                        isLabelVisible={false}
                        bgcolor="var(--color-highlight)"
                        completed={fwdBag / cargoStationSize[Station.fwdBag] * 100}
                    />
                </div>
                <div className="flex absolute top-16 left-2/3 flex-row px-4 w-fit">
                    <ProgressBar
                        height="20px"
                        width="100px"
                        displayBar={false}
                        completedBarBegin={100}
                        isLabelVisible={false}
                        bgcolor="var(--color-highlight)"
                        completed={aftCont / cargoStationSize[Station.aftCont] * 100}
                    />
                    <ProgressBar
                        height="20px"
                        width="100px"
                        displayBar={false}
                        completedBarBegin={100}
                        isLabelVisible={false}
                        bgcolor="var(--color-highlight)"
                        completed={aftBag / cargoStationSize[Station.aftBag] * 100}
                    />
                    <ProgressBar
                        height="20px"
                        width="100px"
                        displayBar={false}
                        completedBarBegin={100}
                        isLabelVisible={false}
                        bgcolor="var(--color-highlight)"
                        completed={aftBulk / cargoStationSize[Station.aftBulk] * 100}
                    />
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
                                                    <td className="px-4 font-light whitespace-nowrap text-md">
                                                        <SimpleInput
                                                            className="my-2 w-24"
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
                                                    <td className="flex flex-row px-4 font-light whitespace-nowrap text-md">
                                                        <SimpleInput
                                                            className="my-2 w-24"
                                                            number
                                                            min={0}
                                                            max={maxCargo > 0 ? maxCargo : 99999}
                                                            value={cargo && totalCargo}
                                                            onBlur={(x) => setTargetCargo(0, x)}
                                                        />
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
                                                {/* TODO FIXME: Hardcode */}
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxZFW')} ${64300} ${usingMetric ? 'kg' : 'lb'}`}>
                                                    <td className="px-4 font-light whitespace-nowrap text-md">
                                                        <SimpleInput
                                                            className="my-2 w-24"
                                                            number
                                                            min={emptyWeight.toFixed(0)}
                                                            max={64300}
                                                            value={zfw.toFixed(0)}
                                                            onBlur={(x) => processZfw(parseInt(x))}
                                                        />
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
                                                {/* TODO FIXME: Hardcode */}
                                                <TooltipWrapper text={`${t('Ground.Payload.TT.MaxZFWCG')} ${40}%`}>
                                                    <td className="px-4 font-light whitespace-nowrap text-md">
                                                        <SimpleInput
                                                            className="my-2 w-24"
                                                            number
                                                            min={0}
                                                            max={maxPax > 0 ? maxPax : 999}
                                                            value={zfwCg.toFixed(2)}
                                                            onBlur={(x) => processZfwCg(x)}
                                                        />
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
                                    <div className="flex flex-row items-center font-light text-medium">
                                        <PersonPlusFill size={25} className="mx-3" />
                                        <SimpleInput
                                            className="mt-1 w-24"
                                            number
                                            min={10}
                                            max={250}
                                            placeholder="80"
                                            value={paxWeight}
                                            onBlur={(x) => setPaxWeight(parseInt(x))}
                                        />
                                    </div>
                                </TooltipWrapper>
                                <TooltipWrapper text={t('Ground.Payload.TT.PerPaxBagWeight')}>
                                    <div className="flex flex-row items-center font-light text-medium">
                                        <BagPlusFill size={25} className="mx-3" />
                                        <SimpleInput
                                            className="mt-1 w-24"
                                            number
                                            min={10}
                                            max={250}
                                            placeholder="15"
                                            value={paxBagWeight}
                                            onBlur={(x) => setPaxBagWeight(parseInt(x))}
                                        />
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
                        <BalanceWeight width={525} height={475} envelope={defaultEnvelope} points={cgPoints} />
                    </div>
                </div>
            </div>

            {/*
            <div className="flex overflow-hidden absolute bottom-0 left-0 flex-row rounded-2xl border border-theme-accent ">
                <div className="py-3 px-5 space-y-4">
                    <div className="flex flex-row justify-between items-center">
                        <div className="flex flex-row items-center space-x-3">
                            <h2 className="font-medium">Boarding</h2>
                            <p className="text-theme-highlight">{ `(${t('Ground.Fuel.ReadyToStart')})`}</p>
                        </div>
                        <p>{`${t('Ground.Fuel.EstimatedDuration')}: ${0}`}</p>
                    </div>
                    <div className="flex flex-row items-center space-x-12" style={{ width: '40rem' }}>
                        <div className="flex flex-row">
                            <div className="mr-8">
                             <Label text="A">
                                    <SimpleInput
                                        className="my-1 w-24"
                                        placeholder=""
                                        number
                                        min={0}
                                        max={(stationSize && stationSize[Station.A]) ?? 99}
                                        value={paxA}
                                        onBlur={(x) => setPaxA(parseInt(x))}
                                    />
                                </Label>
                                <Label text="B">
                                    <SimpleInput
                                        className="my-1 w-24"
                                        placeholder=""
                                        number
                                        min={0}
                                        max={(stationSize && stationSize[Station.B]) ?? 99}
                                        value={paxB}
                                        onBlur={(x) => setPaxB(parseInt(x))}
                                    />
                                </Label>
                            </div>
                            <div className="mr-8">
                                <Label text="C">
                                    <SimpleInput
                                        className="my-1 w-24"
                                        placeholder=""
                                        number
                                        min={0}
                                        max={(stationSize && stationSize[Station.C]) ?? 99}
                                        value={paxC}
                                        onBlur={(x) => setPaxC(parseInt(x))}
                                    />
                                </Label>
                                <Label text="D">
                                    <SimpleInput
                                        className="my-1 w-24"
                                        placeholder=""
                                        number
                                        min={0}
                                        max={(stationSize && stationSize[Station.D]) ?? 99}
                                        value={paxD}
                                        onBlur={(x) => setPaxD(parseInt(x))}
                                    />
                                </Label>
                            </div>
                            <div className="mr-8">
                            <Label text="Cargo">
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            className="my-1 w-24 rounded-r-none"
                                            placeholder=""
                                            number
                                            min={0}
                                            max={10000}
                                            value={0}
                                            onBlur={(x) => setCargo(parseInt(x))}
                                        />
                                        <SelectInput
                                            value={weightUnit}
                                            className="my-1 w-24 rounded-l-none"
                                            options={[
                                                { value: 'kg', displayValue: 'kg' },
                                                { value: 'lb', displayValue: 'lb' },
                                            ]}
                                            onChange={(newValue: 'kg' | 'lb') => setWeightUnit(newValue)}
                                        />
                                    </div>
                                </Label>
                                <Label text="Total">
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            className={`${simbriefDataLoaded ? 'w-28' : 'w-44'} my-1 ${simbriefDataLoaded && 'rounded-r-none'}`}
                                            placeholder=""
                                            number
                                            min={0}
                                            max={stationSize.length > 0 ? stationSize.reduce((a, b) => a + b, 0) : 999}
                                            value={pax && pax.reduce((a, b) => a + b)}
                                            onBlur={(x) => setTotalPax(parseInt(x))}
                                        />
                                        {simbriefDataLoaded && (
                                            <TooltipWrapper text={t('Ground.Payload.TT.FillPaxDataFromSimbrief')}>
                                                <div
                                                    className="flex justify-center items-center px-2 my-1 h-auto rounded-md rounded-l-none border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                                                    onClick={undefined}
                                                >
                                                    <CloudArrowDown size={26} />
                                                </div>
                                            </TooltipWrapper>
                                        )}
                                    </div>
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className={`flex justify-center items-center w-20 ${'text-theme-highlight'} bg-current`}
                    onClick={undefined}
                >
                    <div className={`${true ? 'text-white' : 'text-theme-unselected'}`}>
                        <PlayFill size={50} className={false ? 'hidden' : ''} />
                        <StopCircleFill size={50} className={false ? '' : 'hidden'} />
                    </div>
                </div>
            </div>

            <div className="flex overflow-x-hidden absolute right-4 bottom-0 flex-col justify-center items-center py-3 px-6 space-y-2 rounded-2xl border bg-theme-body border-theme-accent">
                <h2 className="flex font-medium"> Boarding Time </h2>

                <SelectGroup>
                    <SelectItem selected={boardingRate === 'INSTANT'} onSelect={() => setBoardingRate('INSTANT')}>{t('Settings.Instant')}</SelectItem>
                    <SelectItem selected={boardingRate === 'FAST'} onSelect={() => setBoardingRate('FAST')}>{t('Settings.Fast')}</SelectItem>
                    <SelectItem selected={boardingRate === 'REAL'} onSelect={() => setBoardingRate('REAL')}>{t('Settings.Real')}</SelectItem>
                </SelectGroup>
            </div>
            */}
        </div>
    );
};
