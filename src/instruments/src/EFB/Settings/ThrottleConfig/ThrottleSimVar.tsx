export class ThrottleSimvar {
    readableName: string;

    technicalName: string;

    hiValue;

    lowValue;

    getHiGetter = () => this.hiValue[0]

    getHiSetter = () => this.hiValue[1]

    getLowGetter = () => this.lowValue[0]

    getLowSetter = () => this.lowValue[1]

    constructor(readableName: string, technicalName: string, throttleNumber: number) {
        this.readableName = readableName;
        this.technicalName = technicalName;

        this.hiValue = [
            SimVar.GetSimVarValue(`${technicalName}HIGH:${throttleNumber}`, 'number'),
            (value: number) => SimVar.SetSimVarValue(`${technicalName}HIGH:${throttleNumber}`, 'number', value),
        ];
        this.lowValue = [
            SimVar.GetSimVarValue(`${technicalName}LOW:${throttleNumber}`, 'number'),
            (value: number) => SimVar.SetSimVarValue(`${technicalName}LOW:${throttleNumber}`, 'number', value),
        ];
    }
}
