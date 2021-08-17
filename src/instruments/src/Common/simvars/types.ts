export type SimVarValue = number | string | any;

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
