import { Writer } from '..';

export class SimVarWriter implements Writer {
    private simVarName: string;

    constructor(simVarName: string) {
        this.simVarName = simVarName;
    }

    write(value: number): Promise<void> {
        return SimVar.SetSimVarValue(this.simVarName, 'number', value);
    }
}
