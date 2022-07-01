/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { CloudArrowDown, PlayFill, StopCircleFill } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { Units } from '@shared/units';
import { usePersistentProperty } from '@instruments/common/persistence';
import { BitFlags } from '@shared/bitFlags';
import { useBitFlags } from '@instruments/common/bitFlags';
import { BalanceWeight } from './BalanceWeight/BalanceWeight';
import { SeatInfo, PaxStationInfo, CargoStationInfo, TYPE } from './Seating/Constants';
import { PerformanceEnvelope } from './BalanceWeight/Constants';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
// import Card from '../../UtilComponents/Card/Card';
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
    fwd: 0,
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
        stationIndex: 1,
        position: 21.98,
        simVar: 'A32NX_PAX_TOTAL_ROWS_1_6',
    },
    {
        // B
        name: 'ROWS [7-13]',
        rows: [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(emergRow()), addRow(emergRow())],
        stationIndex: 2,
        position: 2.86,
        simVar: 'A32NX_PAX_TOTAL_ROWS_7_13',
    },
    {
        // C
        name: 'ROWS [14-21]',
        rows: [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow()],
        stationIndex: 3,
        position: -15.34,
        simVar: 'A32NX_PAX_TOTAL_ROWS_14_21',
    },
    {
        // D
        name: 'ROWS [22-29]',
        rows: [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow()],
        stationIndex: 4,
        position: -32.81,
        simVar: 'A32NX_PAX_TOTAL_ROWS_22_29',
    },
];

const defaultCargoMap: CargoStationInfo[] = [
    {
        name: 'FWD BAGGAGE/CONTAINER',
        stationIndex: 5,
        position: 18.28,
        simVar: 'A32NX_CARGO_FWD_BAGGAGE_CONTAINER',
    },
    {
        name: 'AFT CONTAINER',
        stationIndex: 6,
        position: -15.96,
        simVar: 'A32NX_CARGO_AFT_CONTAINER',
    },
    {
        name: 'AFT BAGGAGE',
        stationIndex: 7,
        position: -27.10,
        simVar: 'A32NX_CARGO_AFT_BAGGAGE',
    },
    {
        name: 'AFT BULK/LOOSE',
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

export const Payload = () => {
    const { usingMetric } = Units;
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    const [weightUnit, setWeightUnit] = usePersistentProperty('EFB_PREFERRED_WEIGHT_UNIT', usingMetric ? 'kg' : 'lb');
    const [paxA, setPaxA] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number');
    const [paxB, setPaxB] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number');
    const [paxC, setPaxC] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_21', 'Number');
    const [paxD, setPaxD] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_22_29', 'Number');
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

    /*
    const fuelWeight = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms");
    const centerCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons");
    const LInnCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons");
    const LOutCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT AUX QUANTITY", "Gallons");
    const RInnCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
    const ROutCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT AUX QUANTITY", "Gallons");
    */

    const [fwdBag] = useSimVar('L:A32NX_CARGO_FWD_BAGGAGE_CONTAINER', 'Number');
    const [aftCont] = useSimVar('L:A32NX_CARGO_AFT_CONTAINER', 'Number');
    const [aftBag] = useSimVar('L:A32NX_CARGO_AFT_BAGGAGE', 'Number');
    const [aftBulk] = useSimVar('L:A32NX_CARGO_AFT_BULK_LOOSE', 'Number');

    const [paxWeight] = useSimVar('L:A32NX_WB_PER_PAX_WEIGHT', 'Number');
    const [zfw, setZfw] = useState(0);
    const [zfwCg, setZfwCg] = useState(0);
    const [emptyWeight] = useSimVar('A:EMPTY WEIGHT', usingMetric ? 'Kilograms' : 'Pounds');
    const [cg] = useSimVar('A:CG PERCENT', 'percent');
    const [totalWeight] = useSimVar('A:TOTAL WEIGHT', usingMetric ? 'Kilograms' : 'Pounds');
    const [mlwCg, setMlwCg] = useState(0);
    const [mlwWeight, setMlwWeight] = useState(0);

    const cgPoints = {
        mzfw: { cg: zfwCg, weight: zfw },
        mlw: { cg: mlwCg, weight: mlwWeight },
        mtow: { cg, weight: totalWeight },
    };

    const [stationSize, setSectionLen] = useState<number[]>([]);

    const [aFlags, setAFlags] = useBitFlags('PAX_FLAGS_A');
    const [bFlags, setBFlags] = useBitFlags('PAX_FLAGS_B');
    const [cFlags, setCFlags] = useBitFlags('PAX_FLAGS_C');
    const [dFlags, setDFlags] = useBitFlags('PAX_FLAGS_D');

    const activeFlags = [aFlags, bFlags, cFlags, dFlags];
    const setActiveFlags = [setAFlags, setBFlags, setCFlags, setDFlags];

    const pax = [paxA, paxB, paxC, paxD];
    const setPax = [setPaxA, setPaxB, setPaxC, setPaxD];

    const simbriefDataLoaded = isSimbriefDataLoaded();

    const [seatMap] = useState<PaxStationInfo[]>(defaultSeatMap);
    const [cargoMap] = useState<CargoStationInfo[]>(defaultCargoMap);

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
        if (!stationSize || numOfPax === pax.reduce((a, b) => a + b) || numOfPax > stationSize.reduce((a, b) => a + b) || numOfPax < 0) return;

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

    useEffect(() => {
        const stationSize = [0, 0, 0, 0];
        seatMap.forEach((station, i) => {
            station.rows.forEach((row) => {
                row.seats.forEach(() => {
                    stationSize[i]++;
                });
            });
        });
        setSectionLen(stationSize);
    }, [seatMap]);

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

    // Adjust CG Values
    useEffect(() => {
        const leMacZ = -5.386; // Accurate to 3 decimals, replaces debug weight values
        const macSize = 13.454; // Accurate to 3 decimals, replaces debug weight values

        const emptyPosition = -8.75; // Value from flight_model.cfg
        const emptyMoment = emptyPosition * emptyWeight;

        const paxTotalMass = (paxA + paxB + paxC + paxD) * paxWeight;
        const paxTotalMoment = paxA * paxWeight * seatMap[Station.A].position
            + paxB * paxWeight * seatMap[Station.B].position
            + paxC * paxWeight * seatMap[Station.C].position
            + paxD * paxWeight * seatMap[Station.D].position;

        const cargoTotalMass = fwdBag + aftCont + aftBag + aftBulk;
        const cargoTotalMoment = fwdBag * cargoMap[Station.fwd].position
            + aftCont * cargoMap[Station.aftCont].position
            + aftBag * cargoMap[Station.aftBag].position
            + aftBulk * cargoMap[Station.aftBulk].position;

        const totalMass = emptyWeight + paxTotalMass + cargoTotalMass;
        const totalMoment = emptyMoment + paxTotalMoment + cargoTotalMoment;

        const cgPosition = totalMoment / totalMass;
        const cgPositionToLemac = cgPosition - leMacZ;
        const newZfwCg = -100 * (cgPositionToLemac / macSize);

        if (zfwCg !== newZfwCg) {
            setZfwCg(newZfwCg);
        }

        const newZfw = emptyWeight + paxTotalMass + cargoTotalMass;
        if (zfw !== newZfw) {
            setZfw(newZfw);
        }
    }, [paxA, paxB, paxC, paxD, fwdBag, aftBag, aftCont, aftBulk, paxWeight, emptyWeight]);

    return (
        <div>
            <div className="h-content-section-reduced">
                <div className="mb-10 ">
                    <SeatMap seatMap={seatMap} activeFlags={activeFlags} />
                </div>
                <div className="flex relative right-0 flex-row justify-between px-6 mt-24">
                    {/*
                    <Card>
                        <table className="table-auto">
                            <thead>
                                <tr className="">
                                    <th />
                                    <th>Planned</th>
                                    <th>Current</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Passengers</td>
                                    <td>8</td>
                                    <td>140</td>
                                </tr>
                                <tr>
                                    <td>Cargo & Bags</td>
                                    <td>1000 kg</td>
                                    <td>4500 kg</td>
                                </tr>
                                <tr>
                                    <td>Block Fuel</td>
                                    <td>5800 kg</td>
                                    <td>5800 kg</td>
                                </tr>
                            </tbody>
                        </table>
                    </Card>
                    */}
                    <div className="rounded-2xl border col-1 border-theme-accent">
                        <BalanceWeight width={450} height={350} envelope={defaultEnvelope} points={cgPoints} />
                    </div>
                </div>
            </div>

            <div className="flex overflow-hidden absolute bottom-0 left-0 flex-row rounded-2xl border border-theme-accent ">
                <div className="py-3 px-5 space-y-4">
                    <div className="flex flex-row justify-between items-center">
                        <div className="flex flex-row items-center space-x-3">
                            <h2 className="font-medium">Boarding</h2>
                            <p className={'text-theme-highlight' /* formatRefuelStatusClass() */}>{ `(${t('Ground.Fuel.ReadyToStart')})` /* formatRefuelStatusLabel() */ }</p>
                        </div>
                        <p>{`${t('Ground.Fuel.EstimatedDuration')}: ${0 /* calculateEta() */}`}</p>
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
                                            className="my-1 w-20 rounded-l-none"
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
                    className={`flex justify-center items-center w-20 ${'text-theme-highlight' /* formatRefuelStatusClass() */} bg-current`}
                    onClick={/* () => switchRefuelState() */ undefined}
                >
                    <div className={`${/* airplaneCanRefuel() */ true ? 'text-white' : 'text-theme-unselected'}`}>
                        <PlayFill size={50} className={/* refuelStartedByUser */ false ? 'hidden' : ''} />
                        <StopCircleFill size={50} className={/* refuelStartedByUser */ false ? '' : 'hidden'} />
                    </div>
                </div>
            </div>

            <div className="flex overflow-x-hidden absolute right-6 bottom-0 z-30 flex-col justify-center items-center py-3 px-6 space-y-2 rounded-2xl border border-theme-accent">
                <h2 className="flex font-medium"> Boarding Time </h2>

                <SelectGroup>
                    <SelectItem selected={boardingRate === 'INSTANT'} onSelect={() => setBoardingRate('INSTANT')}>{t('Settings.Instant')}</SelectItem>
                    <SelectItem selected={boardingRate === 'FAST'} onSelect={() => setBoardingRate('FAST')}>{t('Settings.Fast')}</SelectItem>
                    <SelectItem selected={boardingRate === 'REAL'} onSelect={() => setBoardingRate('REAL')}>{t('Settings.Real')}</SelectItem>
                </SelectGroup>
            </div>
        </div>
    );
};
