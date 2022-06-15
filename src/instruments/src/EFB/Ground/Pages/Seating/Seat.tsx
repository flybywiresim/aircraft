import React from 'react';
// @ts-ignore
import SVGSeat from '../../../Assets/seat.svg';
import { SeatConstants } from './Constants';

export const TYPE = { AISLE: 0, ECO: 1 };

export interface SeatInfo {
    type: number,
    x: number,
    y: number
}

export const Seat = ({ type = TYPE.ECO, x = 0, y = 0 }) => {
    if (type === TYPE.ECO) {
        return (
            <div style={{ transform: `translateX(${x}px) translateY(${y}px)` }}>
                <img
                    className="w-6"
                    src={SVGSeat}
                    alt="Seat"
                />
            </div>
        );
    }
    if (type === TYPE.AISLE) {
        return (
            <div style={{ height: `${SeatConstants.AisleGap}px` }} />
        );
    }
    return (<> </>);
};
