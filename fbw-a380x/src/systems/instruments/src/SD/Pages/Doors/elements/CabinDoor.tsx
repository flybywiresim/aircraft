import { Position, CabinDoorProps } from '@instruments/common/types';
import React from 'react';

const CabinDoor: React.FC<Position & CabinDoorProps> = ({ x, y, doorNumber, side, mainOrUpper, engineRunning }) => {
    const doorOpen = false;
    const armed = true;
    const validSDAC = true;

    let slide = '';
    if (!validSDAC) {
        slide = 'XX';
    } else if (armed) {
        slide = 'S';
    }

    let cabinDoorMessage = '';
    let xpos = 0;
    if (!validSDAC || (engineRunning && doorOpen)) {
        cabinDoorMessage = side === 'L' ? `${mainOrUpper} ${doorNumber}${side} ----` : `---- ${mainOrUpper} ${doorNumber}${side}`;
    }
    if (side === 'L') {
        xpos = -180;
        if (mainOrUpper === 'UPPER') {
            xpos = -193;
        }
    } else {
        xpos = 30;
        if (mainOrUpper === 'UPPER') {
            xpos = 33;
        }
    }
    let doorNumberCss = 'Green';
    let doorRectCss = 'Green SW3 BackgroundFill';
    let slideCss = 'White';
    if (side === 'L') {
        slideCss = 'White EndAlign';
    }
    if (!validSDAC) {
        doorNumberCss = 'Amber';
        doorRectCss = 'Hide';
        slideCss = 'AmberFill';
        if (side === 'L') {
            slideCss = 'AmberFill EndAlign';
        }
    } else if (doorOpen) {
        doorNumberCss = 'BackgroundFill';
        doorRectCss = 'Amber SW3 AmberFill';
    }

    return (
        <g id={`${side}${doorNumber}`} transform={`translate(${x} ${y})`}>
            <rect
                x={0}
                y={0}
                width='18'
                height='26'
                rx='5'
                className={
                    doorRectCss
                }
            />
            <text x={4} y={21} className={`${doorNumberCss} F22`}>{!validSDAC ? 'X' : doorNumber}</text>
            <text x={xpos} y={-5} className={`${!validSDAC ? 'White' : 'AmberFill'} F22`}>{cabinDoorMessage}</text>
            <text x={side === 'L' ? -6 : 23} y={38} className={`${slideCss} F30`}>{slide}</text>
        </g>
    );
};

export default CabinDoor;
