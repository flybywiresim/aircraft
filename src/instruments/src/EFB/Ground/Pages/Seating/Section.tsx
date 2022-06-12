import React from 'react';
import { Row } from './Row';
import { SeatConstants } from './Constants';
// @ts-ignore

export const Section = ({ id, rows }) => (
    <div style={{ transform: `translateX(${id * SeatConstants.RowGap * SeatConstants.DefaultSectionRows}px)` }}>
        {
            rows.map((row, i) => (
                <Row id={i} />
            ))
        }
    </div>
);
