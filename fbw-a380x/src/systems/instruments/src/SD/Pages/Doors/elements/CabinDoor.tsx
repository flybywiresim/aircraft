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
    let xpos = x;
    if (!validSDAC || (engineRunning && doorOpen)) {
        cabinDoorMessage = side === 'L' ? `${mainOrUpper} ${doorNumber}${side} ----` : `---- ${mainOrUpper} ${doorNumber}${side}`;
    }
    if (side === 'L') {
        xpos = x - 180;
        if (mainOrUpper === 'UPPER') {
            xpos = x - 193;
        }
    } else {
        xpos = x + 30;
        if (mainOrUpper === 'UPPER') {
            xpos = x + 33;
        }
    }
    let doorNumberCss = 'Green';
    let doorRectCss = 'Green SW2 BackgroundFill';
    let slideCss = 'White';
    if (side === 'L') {
        slideCss = 'White EndAlign';
    }
    if (!validSDAC) {
        doorNumberCss = 'AmberFill';
        doorRectCss = 'Hide';
        slideCss = 'AmberFill';
        if (side === 'L') {
            slideCss = 'AmberFill EndAlign';
        }
    } else if (engineRunning && doorOpen) {
        doorNumberCss = 'BackgroundFill';
        doorRectCss = 'Amber SW2 AmberFill';
    }

    return (
        <g id={`${side}${doorNumber}`}>
            <rect
                x={side === 'L' ? x - 3 : x + 3}
                y={y - 22}
                width="18"
                height="26"
                rx="5"
                className={
                    doorRectCss
                }
            />
            <text x={side === 'L' ? x : x + 6} y={y} className={`${doorNumberCss} F24`}>{!validSDAC ? 'X' : doorNumber}</text>
            <text x={xpos} y={y - 5} className={`${!validSDAC ? 'White' : 'AmberFill'} F22`}>{cabinDoorMessage}</text>
            <text x={side === 'L' ? x - 9 : x + 26} y={y + 14} className={`${slideCss} F26`}>{slide}</text>
        </g>
    );
};

export default CabinDoor;
