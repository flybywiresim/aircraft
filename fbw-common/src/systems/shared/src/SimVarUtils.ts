// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MutableAccessible, SimVarValueType } from '@microsoft/msfs-sdk';

export class RegisteredSimVar<T> implements MutableAccessible<T> {
  protected constructor(protected readonly id: number) {}

  /**
   * Creates a new registered "simvar" that registers a handle for faster get/set of a local or sim var.
   * Note: use {@link RegisteredSimVar.createBoolean} for boolean variables.
   * @param name The name of the local or sim var.
   * @param unit The MSFS unit to read/write the var with. MSFS will perform the unit conversions required.
   * @param source An optional source, which is used somewhere deep inside MSFS for... something.
   */
  public static create(name: string, unit: SimVarValueType.String, source?: string): RegisteredSimVar<string>;
  public static create<T extends number, U extends SimVarValueType | string = SimVarValueType | string>(
    name: string,
    unit: U,
    source?: string,
  ): U extends SimVarValueType.Bool | 'bool' | 'boolean' ? never : RegisteredSimVar<T>;
  public static create(name: string, unit: SimVarValueType | string, source = ''): RegisteredSimVar<unknown> {
    switch (unit) {
      case SimVarValueType.String:
        return new RegisteredStringSimVar(SimVar.GetRegisteredId(name, unit, source));
    }
    return new RegisteredSimVar(SimVar.GetRegisteredId(name, unit, source));
  }

  /**
   * Creates a new registered boolean "simvar" that registers a handle for faster get/set of a local or sim var.
   * It is converted to true/false, rather than non-zero/zero.
   * @param name The name of the local or sim var.
   * @param source An optional source, which is used somewhere deep inside MSFS for... something.
   */
  public static createBoolean(name: string, source = ''): RegisteredSimVar<boolean> {
    return new RegisteredBooleanSimVar(SimVar.GetRegisteredId(name, SimVarValueType.Bool, source));
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
