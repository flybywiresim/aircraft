/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { CloudArrowDown, PlayFill, StopCircleFill } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { Units } from '@shared/units';
import { usePersistentProperty } from '@instruments/common/persistence';
// import { Label } from '../../Performance/Widgets/LandingWidget';
import { RowInfo, SeatInfo, TYPE } from './Seating/Constants';
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
    const plane = 'A32NX';
    const [weightUnit, setWeightUnit] = usePersistentProperty('EFB_PREFERRED_WEIGHT_UNIT', usingMetric ? 'kg' : 'lb');
    const [paxA, setPaxA] = useSimVar(`L:${plane}_PAX_TOTAL_ROWS_1_6_DESIRED`, 'Number');
    const [paxB, setPaxB] = useSimVar(`L:${plane}_PAX_TOTAL_ROWS_7_13_DESIRED`, 'Number');
    const [paxC, setPaxC] = useSimVar(`L:${plane}_PAX_TOTAL_ROWS_14_21_DESIRED`, 'Number');
    const [paxD, setPaxD] = useSimVar(`L:${plane}_PAX_TOTAL_ROWS_22_29_DESIRED`, 'Number');

    const [aFlags1, setAFlags1] = useSimVar(`L:${plane}_PAX_FLAGS_A1`, 'Number');
    const [aFlags2, setAFlags2] = useSimVar(`L:${plane}_PAX_FLAGS_A2`, 'Number');
    const [bFlags1, setBFlags1] = useSimVar(`L:${plane}_PAX_FLAGS_B1`, 'Number');
    const [bFlags2, setBFlags2] = useSimVar(`L:${plane}_PAX_FLAGS_B2`, 'Number');
    const [cFlags1, setCFlags1] = useSimVar(`L:${plane}_PAX_FLAGS_C1`, 'Number');
    const [cFlags2, setCFlags2] = useSimVar(`L:${plane}_PAX_FLAGS_C2`, 'Number');
    const [dFlags1, setDFlags1] = useSimVar(`L:${plane}_PAX_FLAGS_D1`, 'Number');
    const [dFlags2, setDFlags2] = useSimVar(`L:${plane}_PAX_FLAGS_D2`, 'Number');

    const activeFlags = [[aFlags1, aFlags2], [bFlags1, bFlags2], [cFlags1, cFlags2], [dFlags1, dFlags2]];
    const setActiveFlags = [[setAFlags1, setAFlags2], [setBFlags1, setBFlags2], [setCFlags1, setCFlags2], [setDFlags1, setDFlags2]];

    // const [paxA] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number');
    // const [paxB] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number');
    // const [paxC] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_21', 'Number');
    // const [paxD] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_22_29', 'Number');

    const [cargo, setCargo] = useSimVar('L:A32NX_CARGO', 'Number');
    const [sectionLen, setSectionLen] = useState<number[]>([]);
    const simbriefDataLoaded = isSimbriefDataLoaded();

    const Section = {
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
        [addRow(), addRow(), addRow(), addRow(), addRow(), addRow()], // Section A
        [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(emergRow()), addRow(emergRow())], // Section B
        [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow()], // Section C
        [addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow(), addRow()], // Section D
    ];

    const [seatMap] = useState<RowInfo[][]>(defaultSeatMap);

    const diffFlags = (bitFlags: number[], seatId: number): number[] => {
        const flags = bitFlags;
        if (seatId < 32) {
            flags[0] = bitFlags[0] ^ 1 << seatId;
        } else {
            flags[1] = bitFlags[1] ^ 1 << seatId - 32;
        }

        return flags;
    };

    const isActiveSeat = (flags: number[], seatId: number) => (seatId < 32 ? flags[0] & 1 << seatId : flags[1] & 1 << seatId - 32);

    const returnSeats = (section: number, increase: boolean): number[] => {
        const seats: number[] = [];
        const flags = activeFlags[section];
        for (let seatId = 0; seatId < sectionLen[section]; seatId++) {
            if (!increase && isActiveSeat(flags, seatId)) {
                seats.push(seatId);
            } else if (increase && !isActiveSeat(flags, seatId)) {
                seats.push(seatId);
            }
        }
        return seats;
    };

    const chooseRandomSeats = (section: number, choices: number[], numChoose: number) => {
        let bitFlags = activeFlags[section];
        for (let i = 0; i < numChoose; i++) {
            if (choices.length > 0) {
                const chosen = ~~(Math.random() * choices.length);
                bitFlags = diffFlags(bitFlags, choices[chosen]);
                choices.splice(chosen, 1);
            }
            setActiveFlags[section][0](bitFlags[0]);
            setActiveFlags[section][1](bitFlags[1]);
        }
    };

    const changePax = (section: number, newValue: number) => {
        if (!sectionLen || newValue > sectionLen[section] || newValue < 0) return;
        let setPaxFunc: (value: number) => any = () => {};
        let value: number = 0;
        switch (section) {
        case Section.A:
            setPaxFunc = setPaxA;
            value = paxA;
            break;
        case Section.B:
            setPaxFunc = setPaxB;
            value = paxB;
            break;
        case Section.C:
            setPaxFunc = setPaxC;
            value = paxC;
            break;
        case Section.D:
            setPaxFunc = setPaxD;
            value = paxD;
            break;
        default:
            break;
        }
        const seats: number[] = returnSeats(section, newValue > value);
        chooseRandomSeats(section, seats, Math.abs(value - newValue));
        setPaxFunc(newValue);
    };

    useEffect(() => {
        const sectionLen = [0, 0, 0, 0];
        seatMap.forEach((section, i) => {
            section.forEach((row) => {
                row.seats.forEach(() => {
                    sectionLen[i]++;
                });
            });
        });
        setSectionLen(sectionLen);
    }, [seatMap]);

    useEffect(() => {
        const paxCount = returnSeats(Section.A, false).length;
        if (paxA !== paxCount) {
            const seats: number[] = returnSeats(Section.A, paxA > paxCount);
            chooseRandomSeats(Section.A, seats, Math.abs(paxCount - paxA));
        }
    }, [paxA]);

    useEffect(() => {
        const paxCount = returnSeats(Section.B, false).length;
        if (paxB !== paxCount) {
            const seats: number[] = returnSeats(Section.B, paxB > paxCount);
            chooseRandomSeats(Section.B, seats, Math.abs(paxCount - paxB));
        }
    }, [paxB]);

    useEffect(() => {
        const paxCount: number = returnSeats(Section.C, false).length;
        if (paxC !== paxCount) {
            const seats: number[] = returnSeats(Section.C, paxC > paxCount);
            chooseRandomSeats(Section.C, seats, Math.abs(paxCount - paxC));
        }
    }, [paxC]);

    useEffect(() => {
        const paxCount: number = returnSeats(Section.D, false).length;
        if (paxD !== paxCount) {
            const seats: number[] = returnSeats(Section.D, paxD > paxCount);
            chooseRandomSeats(Section.D, seats, Math.abs(paxCount - paxD));
        }
    }, [paxD]);

    return (
        <div>
            <SeatMap x={243} y={78} seatMap={seatMap} activeFlags={activeFlags} />

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
                                        max={(sectionLen && sectionLen[Section.A]) ?? 99}
                                        value={paxA}
                                        onBlur={(x) => changePax(Section.A, parseInt(x))}
                                    />
                                </Label>
                                <Label text="B">
                                    <SimpleInput
                                        className="my-1 w-24"
                                        placeholder=""
                                        number
                                        min={0}
                                        max={(sectionLen && sectionLen[Section.B]) ?? 99}
                                        value={paxB}
                                        onBlur={(x) => changePax(Section.B, parseInt(x))}
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
                                        max={(sectionLen && sectionLen[Section.C]) ?? 99}
                                        value={paxC}
                                        onBlur={(x) => changePax(Section.C, parseInt(x))}
                                    />
                                </Label>
                                <Label text="D">
                                    <SimpleInput
                                        className="my-1 w-24"
                                        placeholder=""
                                        number
                                        min={0}
                                        max={(sectionLen && sectionLen[Section.D]) ?? 99}
                                        value={paxD}
                                        onBlur={(x) => changePax(Section.D, parseInt(x))}
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
                                            max={(sectionLen && sectionLen.reduce((a, b) => a + b, 0))}
                                            value={paxA + paxB + paxC + paxD}
                                            disabled
                                        />
                                        {/* onBlur={(x) => changePax(Section.D, parseInt(x))} */}
                                        {simbriefDataLoaded && (
                                            <TooltipWrapper text={t('Ground.Fuel.TT.FillBlockFuelFromSimBrief')}>
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
                    <SelectItem selected>{t('Settings.Instant')}</SelectItem>

                    <TooltipWrapper>
                        <div>
                            <SelectItem disabled>{t('Settings.Fast')}</SelectItem>
                        </div>
                    </TooltipWrapper>

                    <TooltipWrapper>
                        <div>
                            <SelectItem disabled>{t('Settings.Real')}</SelectItem>
                        </div>
                    </TooltipWrapper>
                </SelectGroup>
            </div>
        </div>
    );
};

// <Plane className="inset-x-0 mx-auto w-full h-full text-theme-text" />
