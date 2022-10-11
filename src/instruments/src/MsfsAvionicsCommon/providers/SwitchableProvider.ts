import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType, Subject } from 'msfssdk';

export interface SwitchableSimVarDefinition<TState> {
    name: (state: TState) => string;

    type: SimVarValueType;
}

export abstract class SwitchableSimVarProvider<TSimVar, TState> extends SimVarPublisher<TSimVar> {
    protected constructor(
        private simVars: Map<any, SwitchableSimVarDefinition<TState>>,
        public stateSubject: Subject<TState>,
        bus: EventBus,
    ) {
        super(definitions(simVars, stateSubject.get()), bus);

        stateSubject.sub((value) => this.updateDefinitions(value));
    }

    private updateDefinitions(newStateValue: TState) {
        for (const [key, value] of this.simVars) {
            const newName = value.name(newStateValue);

            this.updateSimvarSource(key, { name: newName, type: value.type });
        }
    }
}

function definitions<TSimVar, TState>(
    simVars: Map<any, SwitchableSimVarDefinition<TState>>,
    state: TState,
): Map<keyof TSimVar & string, SimVarDefinition> {
    return new Map(Array.from(simVars.entries()).map(([k, v]) => [k, {
        name: v.name(state),
        type: v.type,
    }]));
}
