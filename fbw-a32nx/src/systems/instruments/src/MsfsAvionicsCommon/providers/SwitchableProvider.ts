import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType, Subject } from 'msfssdk';

export interface SwitchableSimVarDefinition<TState> {
    name: (state: TState) => string;

    type: SimVarValueType;
}

export abstract class SwitchableSimVarProvider<TSimVar, TState> extends SimVarPublisher<TSimVar> {
    protected constructor(
        private simVars: Map<keyof TSimVar, SwitchableSimVarDefinition<TState>>,
        public stateSubject: Subject<TState>,
        bus: EventBus,
    ) {
        super(definitions(simVars, stateSubject.get()), bus);

        stateSubject.sub((value) => this.updateDefinitions(value));
    }

    private updateDefinitions(newStateValue: TState) {
        for (const [key, value] of this.simVars) {
            const newName = value.name(newStateValue);

            this.updateSimVarSource(key, { name: newName, type: value.type });
        }
    }
}

function definitions<TSimVar, TState>(
    simVars: Map<keyof TSimVar, SwitchableSimVarDefinition<TState>>,
    state: TState,
): Map<keyof TSimVar, SimVarDefinition> {
    return new Map(Array.from(simVars.entries()).map(([k, v]) => [k, {
        name: v.name(state),
        type: v.type,
    }]));
}
