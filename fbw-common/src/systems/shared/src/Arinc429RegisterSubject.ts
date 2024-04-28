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

  setValue(value: typeof this.value.value): void {
    const oldValue = this.value.value;
    this.value.setValue(value);
    if (oldValue !== this.value.value) {
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

  setSsm(ssm: typeof this.value.ssm): void {
    const oldSsm = this.value.ssm;
    this.value.setSsm(ssm);
    if (oldSsm !== this.value.ssm) {
      this.notify();
    }
  }
}
