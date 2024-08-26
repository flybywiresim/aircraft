// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Subscribable } from '@microsoft/msfs-sdk';

type FieldFormatTuple = [value: string, unitLeading: string, unitTrailing: string];
export interface DataEntryFormat<T> {
  placeholder: string;
  maxDigits: number;
  format(value: T): FieldFormatTuple;
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
