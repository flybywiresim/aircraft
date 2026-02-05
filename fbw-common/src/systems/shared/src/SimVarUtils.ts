// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MutableAccessible, SimVarValueType } from '@microsoft/msfs-sdk';

export class RegisteredSimVar<T> implements MutableAccessible<T> {
  private constructor(
    protected readonly id: number,
    private readonly isBool = false,
  ) {}

  public static create<T>(name: string, unit: SimVarValueType | string, source = ''): RegisteredSimVar<T> {
    return new RegisteredSimVar(SimVar.GetRegisteredId(name, unit, source));
  }

  public static createBoolean(name: string, source = ''): RegisteredSimVar<boolean> {
    return new RegisteredSimVar(SimVar.GetRegisteredId(name, SimVarValueType.Bool, source), true);
  }

  /** @inheritdoc */
  public get(): T {
    return this.isBool ? ((SimVar.GetSimVarValueFastReg(this.id) > 0) as T) : SimVar.GetSimVarValueFastReg(this.id);
  }

  /** @inheritdoc */
  public set(value: T): Promise<void> {
    return Coherent.call('setValueReg_Number', this.id, this.isBool ? (value ? 1 : 0) : value);
  }
}
