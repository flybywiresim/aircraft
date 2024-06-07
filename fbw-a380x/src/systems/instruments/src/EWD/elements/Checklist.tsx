import React, { useEffect, useState } from 'react';
import { Position } from '@instruments/common/types';

const checklistData = {
    completed: [
        'CKPT PREP : COMPLETE',
        'PARK BRK : ON',
        'GEAR PINS & COVERS : REMOVE',
        'FUEL QTY : CHECK',
        'T.O DATA : SET',
        'BARO REF VALUE : SET',
        'BIG CHUNGUS : ON',
        'SIGNS ON/AUTO',
        'ADIRS NAV',
    ],
    next: [
        'WINDOWS/DOORS : CLOSE (BOTH)',
        'BEACON : ON',
        'C/L COMPLETE',
        'RESET',
    ],
};

const Item = ({ x, y, checked, handleClick, children }: Position & any) => {
    const [color, setColor] = useState('#00ff00');

    useEffect(() => setColor(checked ? '#00ff00' : '#00ffff'), [checked]);

    return (
        <g onClick={handleClick}>
            {/** Tick box * */}
            <path stroke={color} strokeWidth={1.5} fill="none" d={`m ${x - 7} ${y - 1} h -12 v -16.5 h 12 v 16.5 z`} />
            {checked && <path stroke={color} strokeWidth={2} fill="none" d={`m ${x - 19} ${y - 12} l 6 8 l 5 -14`} />}

            {/* Hyphen */}
            <path stroke={color} strokeWidth={2.5} fill="none" d={`m ${x + 10} ${y - 5.5} h 10 `} />

            <text fill={color} x={x + 26} y={y}>{children}</text>
        </g>
    );
};

const Ticker = ({ x, y, nextItemsHeight, checkedItemsHeight, position }: Position & { nextItemsHeight: number, checkedItemsHeight: number, position: number }) => (
    <g strokeWidth={2.5} stroke="white">
        {/* Upper frame */}
        <path d={`m ${x + 694} ${y - 60} h 23`} />
        <path d={`m ${x + 695} ${y - 60} v ${checkedItemsHeight + 98.35}`} />
        <path d={`m ${x + 716} ${y - 60} v ${checkedItemsHeight + 98.35 + 28 + (nextItemsHeight - 32)}`} />

        {/* Item highlight */}
        <path stroke="#00ffff" d={`m ${x + 694} ${y + checkedItemsHeight + 37} h -700`} />
        <path stroke="#00ffff" d={`m ${x - 5} ${y + checkedItemsHeight + 36} v 30`} />
        <path stroke="#00ffff" d={`m ${x + 694} ${y + checkedItemsHeight + 67} h -700`} />

        {/* Lower frame */}
        <path d={`m ${x + 695} ${y + checkedItemsHeight + 65.75} v ${nextItemsHeight - 32}`} />
        <path d={`m ${x + 694} ${y + checkedItemsHeight + 65.75 + (nextItemsHeight - 32)} h 23`} />
    </g>
);

export const Checklist = ({ x, y }: Position) => {
    const [checkedItems, setCheckedItems] = useState(checklistData.completed);
    const [nextItems, setNextItems] = useState(checklistData.next);

    const [height, setNextItemsHeight] = useState(0);
    const [checkedItemsHeight, setCheckedItemsHeight] = useState(0);

    useEffect(() => {
        setCheckedItemsHeight((checkedItems.length - 1) * 32);
    }, [checkedItems]);

    useEffect(() => {
        setNextItemsHeight(nextItems.length * 32);
    }, [nextItems, checkedItemsHeight]);

    const handleItemClick = (itemIndex: number, checked: boolean) => {
        if (checked) {
            setCheckedItems((items) => items.filter((_, index) => index !== itemIndex));
        } else {
            setNextItems((items) => items.filter((_, index) => index !== itemIndex));
        }
    };

    return (
        <>
            <Ticker x={x} y={y} nextItemsHeight={height} checkedItemsHeight={checkedItemsHeight} position={9} />

            <g fontSize="25px">
                {/** Completed items * */}
                {checkedItems.map((item, index) => <Item key={index} handleClick={() => handleItemClick(index, true)} checked x={x + 22} y={y + (32 * index)}>{item}</Item>)}
            </g>

            <g fontSize="25px">
                {/** Completed items * */}
                {nextItems.map((item, index) => <Item key={index} handleClick={() => handleItemClick(index, false)} x={x + 22} y={y + checkedItemsHeight + 62 + (32 * index)}>{item}</Item>)}
            </g>

            <path strokeWidth={2} stroke="white" d={`m ${x} ${y + checkedItemsHeight + 22} h 693`} />
        </>
    );
};
