/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react';
import { Section } from './Section';
// @ts-ignore
import Fuselage from '../../../Assets/320neo-outline-fuselage-wb.svg';
import { SeatConstants } from './Constants';
import { Row } from './Row';
import { Seat } from './Seat';
// @ts-ignore

const TYPE = { AISLE: 0, ECO: 1 };

const seat = {
    type: TYPE.ECO,
    x: 0,
    y: 0,
    active: false,
};

const row = {
    row: {
        x: 0,
        y: 0,
        width: SeatConstants.RowGap,
        shiftX: 0,
        shiftY: 0,
    },
    seats: [
        { type: TYPE.ECO },
        { type: TYPE.ECO },
        { type: TYPE.ECO },
        { type: TYPE.AISLE },
        { type: TYPE.ECO },
        { type: TYPE.ECO },
        { type: TYPE.ECO },
    ],
};

const section = {
    rows: [
        row,
        row,
        row,
        row,
        row,
        row,
        row,
        row,
    ],
};

// 222, 260
const x = 260;
const y = 222;
export const SeatMap = () => { // (x, y) => (
    useEffect(() => {
    }, []);

    return (
        <div className="flex relative flex-col h-content-section-reduced">
            <img
                className="absolute w-full"
                src={Fuselage}
                alt="Fuselage"
            />

            <div className="flex relative flex-row" style={{ transform: `translateX(${x}px) translateY(${y}px)` }}>

                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />

                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.EmergRowGap} />
                <Row space={SeatConstants.EmergRowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />

                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />

                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
                <Row space={SeatConstants.RowGap} />
            </div>
        </div>
    );
};

/*

            <Section
                id={0}
                rows={[
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                ]}
            />
            <Section
                id={1}
                rows={[
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                ]}
            />
            <Section
                id={2}
                rows={[
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                ]}
            />
            <Section
                id={3}
                rows={[
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                    { width: SeatConstants.RowGap },
                ]}
            />
            */
