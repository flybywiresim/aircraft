import React from 'react';
import { SeatInfo, TYPE, Seat } from './Seat';

type RowProps = {
    space: number,
    layout?: SeatInfo[]
}

const defaultLayout: SeatInfo[] = [
    { type: TYPE.ECO, x: 0, y: 0 },
    { type: TYPE.ECO, x: 0, y: 0 },
    { type: TYPE.ECO, x: 0, y: 0 },
    { type: TYPE.AISLE, x: 0, y: 0 },
    { type: TYPE.ECO, x: 0, y: 0 },
    { type: TYPE.ECO, x: 0, y: 0 },
    { type: TYPE.ECO, x: 0, y: 0 },
];

export const Row: React.FC<RowProps> = ({ space, layout = defaultLayout }) => (
    <div style={{ marginRight: `${space}px` }}>
        <div>
            {
                layout.map((seat) => <Seat type={seat.type} x={seat.x} y={seat.y} />)
            }
        </div>
    </div>
);
