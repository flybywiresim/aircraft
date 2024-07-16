// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Subject } from '@microsoft/msfs-sdk';
import { Arinc429Register } from '@flybywiresim/fbw-sdk';

export class Arinc429RegisterSubject extends Subject<Arinc429Register> {
  static createEmpty(): Arinc429RegisterSubject {
    return new Arinc429RegisterSubject(Arinc429Register.empty(), () => false); // FIXME bruh
  }

  get(): Arinc429Register {
    return this.value;
  }

  set(_value: Arinc429Register) {
    throw new Error('Cannot directly set Arinc429RegisterSubject');
  }

  setWord(word: number) {
    const oldSsm = this.value.ssm;
    const oldValue = this.value.value;

    this.value.set(word);

    if (oldSsm !== this.value.ssm || oldValue !== this.value.value) {
      this.notify();
    }
  }

  setValue(value: number): void {
    const oldValue = this.value.value;

    this.value.value = value;

    if (oldValue !== value) {
      this.notify();
    }
  }

  setSsm(ssm: number): void {
    const oldSsm = this.value.ssm;

    this.value.ssm = ssm;

    if (oldSsm !== ssm) {
      this.notify();
    }
  }

  setValueSsm(value: number, ssm: number): void {
    const oldSsm = this.value.ssm;
    const oldValue = this.value.value;

    this.value.value = value;
    this.value.ssm = ssm;

    if (oldSsm !== this.value.ssm || oldValue !== this.value.value) {
      this.notify();
    }
  }

  setBitValue(bit: number, value: boolean): void {
    const oldValue = this.value.value;
    this.value.setBitValue(bit, value);
    if (oldValue !== this.value.value) {
      this.notify();
    }
  }
}
