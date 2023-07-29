// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { FC } from 'react';
// import { useSeatFlags, useSeatMap } from '@instruments/common/bitFlags';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { getAirframeType } from '../../../Efb';
import { A320Payload } from './A320_251N/A320Payload';
import { A380Payload } from './A380_842/A380Payload';

export const Payload = () => {
    switch (getAirframeType()) {
    case 'A380_842':
        return (
            <A380Payload />
        );
    case 'A320_251N':
    default:
        return (
            <A320Payload />
        );
    }
};

interface PayloadValueInputProps {
    min: number,
    max: number,
    value: number
    onBlur: (v: string) => void,
    unit: string,
    disabled?: boolean
}

export const PayloadValueInput: FC<PayloadValueInputProps> = ({ min, max, value, onBlur, unit, disabled }) => (
    <div className="relative w-44">
        <SimpleInput
            className={`my-2 w-full font-mono ${(disabled ? 'cursor-not-allowed placeholder-theme-body text-theme-body' : '')}`}
            fontSizeClassName="text-2xl"
            number
            min={min}
            max={max}
            value={value.toFixed(0)}
            onBlur={onBlur}
        />
        <div className="flex absolute top-0 right-3 items-center h-full font-mono text-2xl text-gray-400">{unit}</div>
    </div>
);

export interface NumberUnitDisplayProps {
    /**
     * The value to show
     */
    value: number,

    /**
     * The amount of leading zeroes to pad with
     */
    padTo: number,

    /**
     * The unit to show at the end
     */
    unit: string,
}

export const PayloadValueUnitDisplay: FC<NumberUnitDisplayProps> = ({ value, padTo, unit }) => {
    const fixedValue = value.toFixed(0);
    const leadingZeroCount = Math.max(0, padTo - fixedValue.length);

    return (
        <span className="flex items-center">
            <span className="flex justify-end pr-2 w-20 text-2xl">
                <span className="text-2xl text-gray-400">{'0'.repeat(leadingZeroCount)}</span>
                {fixedValue}
            </span>
            {' '}
            <span className="text-2xl text-gray-500">{unit}</span>
        </span>
    );
};

export const PayloadPercentUnitDisplay: FC<{value: number}> = ({ value }) => {
    const fixedValue = value.toFixed(2);

    return (
        <span className="flex items-center">
            <span className="flex justify-end pr-2 w-20 text-2xl">
                {fixedValue}
            </span>
            {' '}
            <span className="text-2xl text-gray-500">%</span>
        </span>
    );
};
