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

interface SeatID {
    row: number,
    seat: number
}

const Label: React.FC<LabelProps> = ({ text, className, children }) => (
    <div className="flex flex-row justify-between items-center">
        <p className={`text-theme-text mx-4 ${className}`}>{text}</p>
        {children}
    </div>
);

export const Payload = () => {
    const { usingMetric } = Units;
    const [weightUnit, setWeightUnit] = usePersistentProperty('EFB_PREFERRED_WEIGHT_UNIT', usingMetric ? 'kg' : 'lb');
    const [paxA, setPaxA] = useSimVar('L:A32NX_PAX_A', 'Number');
    const [paxB, setPaxB] = useSimVar('L:A32NX_PAX_B', 'Number');
    const [paxC, setPaxC] = useSimVar('L:A32NX_PAX_C', 'Number');
    const [paxD, setPaxD] = useSimVar('L:A32NX_PAX_D', 'Number');
    const [cargo, setCargo] = useSimVar('L:A32NX_CARGO', 'Number');
    const [sectionLen, setSectionLen] = useState<number[]>([0, 0, 0, 0]);
    const simbriefDataLoaded = isSimbriefDataLoaded();

    const Section = {
        A: 0,
        B: 1,
        C: 2,
        D: 3,
    };

    const defaultRow = (): SeatInfo[] => (
        [
            { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: false },
            { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: false },
            { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: false },
            { type: TYPE.ECO, x: 0, y: 0, yOffset: 19, active: false },
            { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: false },
            { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: false },
        ]
    );

    const emergRow = (): SeatInfo[] => (
        [
            { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0, active: false },
            { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0, active: false },
            { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0, active: false },
            { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 19, active: false },
            { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0, active: false },
            { type: TYPE.ECO_EMERG, x: 0, y: 0, yOffset: 0, active: false },
        ]
    );

    const randomRow = (): SeatInfo[] => {
        const rand = Math.random();
        return (
            [
                { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: !!(rand >= 0 && rand <= 0.2) },
                { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: !!(rand >= 0.2 && rand <= 0.4) },
                { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: !!(rand >= 0.4 && rand <= 0.6) },
                { type: TYPE.ECO, x: 0, y: 0, yOffset: 19, active: !!(rand >= 0.5 && rand <= 0.7) },
                { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: !!(rand >= 0.8 && rand <= 1.0) },
                { type: TYPE.ECO, x: 0, y: 0, yOffset: 0, active: !!(rand >= 0.1 && rand <= 0.3) },
            ]
        );
    };

    const addRow = (
        section: number = 0,
        seats: SeatInfo[] = defaultRow(),
        x: number = 0,
        y: number = 0,
        xOffset: number = 0,
        yOffset: number = 0,
    ) => ({ section, seats, x, y, xOffset, yOffset });

    const defaultSeatMap: RowInfo[] = [
        addRow(Section.A), addRow(Section.A), addRow(Section.A), addRow(Section.A), addRow(Section.A), addRow(Section.A),
        addRow(Section.B), addRow(Section.B), addRow(Section.B), addRow(Section.B), addRow(Section.B), addRow(Section.B, emergRow()), addRow(Section.B, emergRow()),
        addRow(Section.C), addRow(Section.C), addRow(Section.C), addRow(Section.C), addRow(Section.C), addRow(Section.C), addRow(Section.C), addRow(Section.C),
        addRow(Section.D), addRow(Section.D), addRow(Section.D), addRow(Section.D), addRow(Section.D), addRow(Section.D), addRow(Section.D), addRow(Section.D),
    ];

    const [seatMap, setSeatMap] = useState<RowInfo[]>(defaultSeatMap);

    const toggleSeat = (row: number, seat: number) => {
        switch (seatMap[row].section) {
        case Section.A:
            setPaxA(seatMap[row].seats[seat].active ? paxA - 1 : paxA + 1);
            break;
        case Section.B:
            setPaxB(seatMap[row].seats[seat].active ? paxA - 1 : paxA + 1);
            break;
        case Section.C:
            setPaxC(seatMap[row].seats[seat].active ? paxA - 1 : paxA + 1);
            break;
        case Section.D:
            setPaxD(seatMap[row].seats[seat].active ? paxA - 1 : paxA + 1);
            break;
        default:
            break;
        }
        seatMap[row].seats[seat].active = !seatMap[row].seats[seat].active;
    };

    const returnSeats = (section: number, active: boolean): SeatInfo[] => {
        const seats: SeatInfo[] = [];
        for (let r = 0; r < seatMap.length; r++) {
            if (seatMap[r].section === section) {
                for (let s = 0; s < seatMap[r].seats.length; s++) {
                    if (seatMap[r].seats[s].active === active) {
                        seats.push(seatMap[r].seats[s]);
                    }
                }
            }
        }
        return seats;
    };

    const returnSeatsIndex = (section: number, increase: boolean): SeatID[] => {
        const seatsIndex: SeatID[] = [];
        for (let r = 0; r < seatMap.length; r++) {
            if (seatMap[r].section === section) {
                for (let s = 0; s < seatMap[r].seats.length; s++) {
                    if (seatMap[r].seats[s].active === !increase) {
                        seatsIndex.push({ row: r, seat: s });
                    }
                }
            }
        }
        return seatsIndex;
    };

    const changePax = (section: number, newValue: number) => {
        if (newValue > sectionLen[section] || newValue < 0) return;
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
        const seats: SeatID[] = returnSeatsIndex(section, newValue > value);
        const diff = Math.abs(value - newValue);
        for (let i = 0; i < diff; i++) {
            if (seats && seats.length > 0) {
                const chosen = ~~(Math.random() * seats.length);
                toggleSeat(seats[chosen].row, seats[chosen].seat);
                seats.splice(chosen, 1);
            }
        }
        setPaxFunc(newValue);
    };

    useEffect(() => {
        const sectionLen = [0, 0, 0, 0];
        seatMap.forEach((row) => {
            row.seats.forEach(() => {
                sectionLen[row.section]++;
            });
        });
        setSectionLen(sectionLen);
    }, [seatMap]);

    useEffect(() => {

    }, [paxA, paxB, paxC, paxD]);

    return (
        <div>
            <SeatMap x={243} y={78} seatMap={seatMap} />

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
                                        max={sectionLen[Section.A]}
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
                                        max={sectionLen[Section.B]}
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
                                        max={sectionLen[Section.C]}
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
                                        max={sectionLen[Section.D]}
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
                                            max={sectionLen.reduce((a, b) => a + b, 0)}
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
