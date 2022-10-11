import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType, Subject } from 'msfssdk';

export interface SwitchableSimVarDefinition<TState> {
    name: (state: TState) => string;

    type: SimVarValueType;
}

export abstract class SwitchableSimVarProvider<TSimVar, TState> extends SimVarPublisher<TSimVar> {
    protected constructor(
        private simVars: Map<keyof TSimVar & string, SwitchableSimVarDefinition<TState>>,
        public stateSubject: Subject<TState>,
        bus: EventBus,
    ) {
        super(new Map(
            Array.from(simVars.entries()).map(([k, v]) => [k, {
                name: v.name(stateSubject.get()),
                type: v.type,
            }]),
        ), bus);

        stateSubject.sub((value) => this.updateDefinitions(value));
    }

    private updateDefinitions(newStateValue: TState) {
        for (const [key, value] of this.simVars) {
            const newName = value.name(newStateValue);

            this.updateSimvarSource(key, { name: newName, type: value.type });
        }
    }
}
