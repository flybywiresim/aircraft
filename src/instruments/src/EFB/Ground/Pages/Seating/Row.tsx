import React from 'react';
import { Seat } from './Seat';
import { SeatConstants } from './Constants';

export const Row = ({ id }) => (
    <div className="absolute" style={{ transform: `translateX(${id * SeatConstants.RowGap}px)` }}>
        <div style={{ transform: 'translateY(0px)' }}>
            <Seat />
            <Seat />
            <Seat />
        </div>
        <div style={{ transform: `translateY(${SeatConstants.AisleGap}px)` }}>
            <Seat />
            <Seat />
            <Seat />
        </div>
    </div>
);
