// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MutableAccessible, SimVarValueType } from '@microsoft/msfs-sdk';

export class RegisteredSimVar<T> implements MutableAccessible<T> {
  private constructor(private readonly id: number) {}

  public static create<T>(name: string, unit: SimVarValueType | string, source = ''): RegisteredSimVar<T> {
    return new RegisteredSimVar(SimVar.GetRegisteredId(name, unit, source));
  }

  /** @inheritdoc */
  public get(): T {
    return SimVar.GetSimVarValueFastReg(this.id);
  }

  /** @inheritdoc */
  public set(value: T): Promise<void> {
    return Coherent.call('setValueReg_Number', this.id, value);
  }
}
