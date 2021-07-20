export class Failures {
    private test: string;

    constructor() {
        this.test = 'Hello World';
    }
}

export function sum(a, b) {
    SimVar.SetSimVarValue('x', 'number', 123);
    SimVar.GetSimVarValue('x', 'number');
    return a + b;
}
