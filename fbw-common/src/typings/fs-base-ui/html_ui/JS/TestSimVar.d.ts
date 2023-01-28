declare global {
    function updateSimVarValue(name: string, unit: string, input: { value: any }): void;
    function addSimVar(inputName: { value: string; }, inputType: { value: string }): void;
    function OnValueArray(values: any[]): void;
    function testSimVars(create?: boolean): void;

    class SimVarTest {
    }

    let simVars: {
        name: string;
        unit: string;
    }[];
}

export {};
