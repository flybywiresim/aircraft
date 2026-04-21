import { Spherical } from '../../../../../../../../../fbw-a32nx/src/systems/fmgc/src/types/A32NX_Util';

declare global {
    interface StateMachineStateTransition {
        target: StateMachineState,
    }

    interface StateMachineState {
        transitions: { [event: number]: StateMachineStateTransition }
    }

    interface StateMachineDefinition {
        init: StateMachineState,
    }

    interface StateMachine {
        value: StateMachineState,

        action(event: number): void,

        setState(newState: StateMachineState): void,
    }
}

export {};
