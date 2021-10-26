//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export type SimVarValue = number | string;

export type SimVarSetter = <T extends SimVarValue>(oldValue: T) => T;

export type SimVarItem = {
    value: SimVarValue;
    lastUpdated: number;
}

export enum SimVarType {
    Sim = 'SIM',
    Global = 'GLOBAL',
    Game = 'GAME'
}
