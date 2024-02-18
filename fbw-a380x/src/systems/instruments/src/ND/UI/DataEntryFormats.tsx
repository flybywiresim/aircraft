// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Subject, Subscribable } from '@microsoft/msfs-sdk';

type FieldFormatTuple = [value: string | null, unitLeading: string | null, unitTrailing: string | null];

export interface DataEntryFormat<T> {
    placeholder: string;
    maxDigits: number;
    format(value: T | null): FieldFormatTuple;
    parse(input: string): Promise<T | null>;
    /**
     * If modified or notify()ed, triggers format() in the input field (i.e. when dependencies to value have changed)
     */
    reFormatTrigger?: Subscribable<boolean>;
}

export class DropdownFieldFormat implements DataEntryFormat<string> {
    public placeholder = '';

    public maxDigits = 6;

    constructor(numDigits: number) {
        this.maxDigits = numDigits;
        this.placeholder = '-'.repeat(numDigits);
    }

    public format(value: string) {
        if (!value) {
            return [this.placeholder, null, null] as FieldFormatTuple;
        }
        return [value, null, null] as FieldFormatTuple;
    }

    public async parse(input: string) {
        return input;
    }
}

export class LengthFormat implements DataEntryFormat<number> {
    public placeholder = '----';

    public maxDigits = 4;

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        if (value === null || value === undefined) {
            return [this.placeholder, null, 'M'] as FieldFormatTuple;
        }
        return [value.toString(), null, 'M'] as FieldFormatTuple;
    }

    public async parse(input: string) {
        if (input === '') {
            return null;
        }

        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return nbr;
        }
        if (nbr > this.maxValue || nbr < this.minValue) {
            return null;
        }
        return null;
    }
}
