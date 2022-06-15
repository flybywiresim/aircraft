import React, { useEffect, useState } from 'react';
import { Row } from './Row';
import { SeatConstants } from './Constants';
// @ts-ignore

export const Section = ({ id, rows }) => {
    const [xList, setXList] = useState<number[]>([]);

    useEffect(() => {
        let xOffset = 0;
        const xList: number[] = [];
        rows.forEach((r) => {
            xOffset += r.width;
            xList.push(xOffset);
        });
        console.log(xList);
        setXList(xList);
    }, []);

    return (
        <div style={{ transform: `translateX(${id * SeatConstants.RowGap * SeatConstants.DefaultSectionRows}px)` }}>
            {
                rows.map((r, i) => (
                    <Row space={xList[i]} />
                ))
            }
        </div>
    );
};
