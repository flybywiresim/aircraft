declare class SimVarTest {
    name: string;
    unit: SimVar.SimVarUnit;
    value: SimVar.SimVarType;
}
declare var simVars: SimVarTest[];
declare function updateSimVarValue(name: any, unit: any, input: HTMLInputElement): void;
declare function addSimVar(inputName: HTMLInputElement, inputType: HTMLInputElement): void;
declare function OnValueArray(values: any[]): void;
declare function testSimVars(bCreate?: boolean): void;
