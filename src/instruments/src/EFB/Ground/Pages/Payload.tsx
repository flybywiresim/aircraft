/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { CloudArrowDown, PlayFill, StopCircleFill } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { Units } from '@shared/units';
import { usePersistentProperty } from '@instruments/common/persistence';
import { BitFlags } from '@shared/bitFlags';
import { useBitFlags } from '@instruments/common/bitFlags';
import { BalanceWeight } from './BalanceWeight/BalanceWeight';
import { RowInfo, SeatInfo, TYPE } from './Seating/Constants';
import { PerformanceEnvelope } from './BalanceWeight/Constants';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
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

export const Payload = () => {
    const { usingMetric } = Units;
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    const plane = 'A32NX';
    const [weightUnit, setWeightUnit] = usePersistentProperty('EFB_PREFERRED_WEIGHT_UNIT', usingMetric ? 'kg' : 'lb');
    const [paxA, setPaxA] = useSimVar(`L:${plane}_PAX_TOTAL_ROWS_1_6_DESIRED`, 'Number');
    const [paxB, setPaxB] = useSimVar(`L:${plane}_PAX_TOTAL_ROWS_7_13_DESIRED`, 'Number');
    const [paxC, setPaxC] = useSimVar(`L:${plane}_PAX_TOTAL_ROWS_14_21_DESIRED`, 'Number');
    const [paxD, setPaxD] = useSimVar(`L:${plane}_PAX_TOTAL_ROWS_22_29_DESIRED`, 'Number');
    const [cargo, setCargo] = useSimVar('L:A32NX_CARGO', 'Number');

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

    const Station = {
        A: 0,
        B: 1,
        C: 2,
        D: 3,
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

    const defaultSeatMap: RowInfo[][] = [
        [addRow(), addRow(), addRow(), addRow(), addRow(), addRow()], // Station A
        [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(emergRow()), addRow(emergRow())], // Station B
        [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow()], // Station C
        [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow()], // Station D
    ];

    const defaultEnvelope: PerformanceEnvelope = {
        mlw: [
            [20.4, 64500],
            [38, 64500],
        ],
        mzfw: [
            [22.8, 37000],
            [20.5, 48000],
            [21, 53000],
            [20.8, 55900],
            [21.3, 60000],
            [21.2, 62500],
            [39, 62500],
            [37, 37000],
        ],
        mtow: [
            [21.5, 37000],
            [19, 53000],
            [20.35, 63000],
            [20, 72000],
            [22, 73000],
            [30.8, 77000],
            [35.8, 77000],
            [38.3, 72000],
            [37.7, 58000],
            [33, 47500],
            [32, 37000],
        ],

    };

    const [seatMap] = useState<RowInfo[][]>(defaultSeatMap);

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
            station.forEach((row) => {
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

    return (
        <div>
            <div className="h-content-section-reduced">
                <div className="mb-10">
                    <SeatMap seatMap={seatMap} activeFlags={activeFlags} />
                </div>
                <div className="flex relative right-0 flex-row justify-between mt-24">
                    <div className="col-1" />
                    <div className="rounded-2xl border col-1 border-theme-accent">
                        <BalanceWeight width={450} height={300} envelope={defaultEnvelope}/* x={750} y={350}  */ />
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
                                            value={cargo}
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
