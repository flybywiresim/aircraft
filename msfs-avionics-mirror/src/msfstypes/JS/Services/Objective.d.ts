interface ObjectiveData {
    objectiveId: number;
    text: string;
    status: string;
    activated: boolean;
}
interface StepData {
    stepId: number;
    objectiveId: number;
    text: string;
    status: string;
    activated: boolean;
}
declare class ObjectiveListener extends ViewListener.ViewListener {
    onObjectiveUpdate(callback: (data: ObjectiveData) => void): void;
    onStepUpdate(callback: (data: StepData) => void): void;
    onObjectiveReset(callback: () => void): void;
}
declare function RegisterObjectiveListener(callback?: any): ObjectiveListener;
