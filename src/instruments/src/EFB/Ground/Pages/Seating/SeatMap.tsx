import React from 'react';
import { Section } from './Section';
// @ts-ignore
import Fuselage from '../../../Assets/320neo-outline-fuselage-wb.svg';
// @ts-ignore

// 222, 260
const x = 260;
const y = 222;
export const SeatMap = () => ( // (x, y) => (

    <div className="flex relative flex-col h-content-section-reduced">
        <img
            className="absolute w-full"
            src={Fuselage}
            alt="Fuselage"
        />

        <div className="relative" style={{ transform: `translateX(${x}px) translateY(${y}px)` }}>
            <Section id={0} rows={['1', '2', '3', '4', '5', '6', '7']} />
            <Section id={1} rows={['1', '2', '3', '4', '5', '6', '7']} />
            <Section id={2} rows={['1', '2', '3', '4', '5', '6', '7']} />
            <Section id={3} rows={['1', '2', '3', '4', '5', '6', '7', '8']} />
        </div>
    </div>
);
