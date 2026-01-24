// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MutableAccessible, SimVarValueType } from '@microsoft/msfs-sdk';

export class RegisteredSimVar<T> implements MutableAccessible<T> {
  protected constructor(protected readonly id: number) {}

  public static create(name: string, unit: SimVarValueType.Bool, source?: string): RegisteredSimVar<boolean>;
  public static create(name: string, unit: SimVarValueType.String, source?: string): RegisteredSimVar<string>;
  public static create<T extends number>(
    name: string,
    unit: SimVarValueType | string,
    source?: string,
  ): RegisteredSimVar<T>;
  public static create(name: string, unit: SimVarValueType | string, source = ''): RegisteredSimVar<unknown> {
    switch (unit) {
      case SimVarValueType.Bool:
        return new RegisteredBooleanSimVar(SimVar.GetRegisteredId(name, unit, source));
      case SimVarValueType.String:
        return new RegisteredStringSimVar(SimVar.GetRegisteredId(name, unit, source));
    }
    return new RegisteredSimVar(SimVar.GetRegisteredId(name, unit, source));
  }

  /** @inheritdoc */
  public get(): T {
    return SimVar.GetSimVarValueFastReg(this.id) as T;
  }

  /** @inheritdoc */
  public set(value: T): Promise<void> {
    return Coherent.call('setValueReg_Number', this.id, value);
  }
}

class RegisteredBooleanSimVar extends RegisteredSimVar<boolean> {
  public override get(): boolean {
    return SimVar.GetSimVarValueFastReg(this.id) > 0;
  }

  public override set(value: boolean): Promise<void> {
    return Coherent.call('setValueReg_Number', this.id, value ? 1 : 0);
  }
}

class RegisteredStringSimVar extends RegisteredSimVar<string> {
  public override get(): string {
    return SimVar.GetSimVarValueFastRegString(this.id);
  }

  public override set(value: string): Promise<void> {
    return Coherent.call('setValueReg_String', this.id, value);
  }
}
