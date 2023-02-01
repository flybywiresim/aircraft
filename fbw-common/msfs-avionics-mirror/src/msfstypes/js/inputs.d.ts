declare class InputsListener extends ViewListener.ViewListener {
    addInputChangeCallback(context: any, action: any, callback: (down: boolean) => void): string;
    removeInputChangeCallback(id: string): void;
}
declare function RegisterInputsListener(callback?: any): InputsListener;
declare var globalInputsListener: any;
interface InputsManager {
    getInputStatus(context: string, action: string): EInputStatus;
    getInputValue(context: string, action: string): number;
}
declare var inputs: InputsManager;
declare function GetInputs(): InputsManager;
declare enum EInputStatus {
    idle = 0,
    pressed = 1,
    down = 2,
    released = 3
}
declare function registerGlobalInputListener(): void;
declare function GetInputStatus(_context: any, _action: any): EInputStatus;
declare function GetInputValue(_context: any, _action: any): number;
