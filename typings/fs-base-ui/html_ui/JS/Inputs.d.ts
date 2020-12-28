declare global {
    interface Inputs {
        getInputStatus(context: any, action: any): any;
    }

    function GetInputs(): Inputs;

    enum EInputStatus {
        idle,
        pressed,
        down,
        released
    }

    function GetInputStatus(context: any, action: any): any;
}

export {};
