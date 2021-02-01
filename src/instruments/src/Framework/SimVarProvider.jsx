import * as React from 'react';
import { customElement } from '../util.mjs';

const errorCallback = () => {throw Error("useSimVar called outside of SimVarProvider context.")};
const context = React.createContext({get: errorCallback, set: errorCallback});

export class SimVarProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cache: {},
        };

        this.onUpdateEvent = this.onUpdateEvent.bind(this);
    }

    componentDidMount() {
        customElement.addEventListener('update', this.onUpdateEvent);
    }

    componentWillMount() {
        customElement.removeEventListener('update', this.onUpdateEvent);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return Object.entries(nextState.cache).some(([key, {value}]) => {
            return !this.state.cache[key] || this.state.cache[key].value !== value;
        });
    }

    onUpdateEvent(event) {
        const stateUpdates = {};
        const deltaTime = event.detail;
        for (const [key, value] of Object.entries(this.state.cache)) {
            const threshold = Math.min(value.listeners);
            const lastUpdatedAgo = (value.lastUpdatedAgo || 0) + deltaTime;
            if (lastUpdatedAgo >= threshold) {
                const [name, unit] = key.split('_________');
                stateUpdates[key] = {
                    value: SimVar.GetSimVarValue(name, unit),
                    lastUpdatedAgo: lastUpdatedAgo % threshold,
                };
            } else {
                stateUpdates[key] = {lastUpdatedAgo};
            }
        }

        this.setState((state) => {
            const newCache = {};
            for (const [key, value] of Object.entries(stateUpdates))
                newCache[key] = Object.assign({}, state.cache[key], value);
            return {cache: Object.assign({}, state.cache, newCache)};
        });
    }

    getValue(name, unit) {
        const key = `${name}_________${unit}`;
        if (this.state.cache[key]) return this.state.cache[key].value;

        const value = SimVar.GetSimVarValue(name, unit);
        this.setState((state) => ({
            cache: Object.assign({}, state.cache, {
                [key]: { value, listeners: [] },
            })
        }));
        return value;
    }

    async setValue(name, unit, value) {
        const key = `${name}_________${unit}`;
        this.setState((state) => ({
            cache: Object.assign({}, state.cache, {[key]: {value, listeners: state.cache[key].listeners}}),
        }));
        return SimVar.SetSimVarValue(name, unit, value);
    }

    registerHook(name, unit, minInterval) {
        const key = `${name}_________${unit}`;
        if (!this.state.cache[key]) {
            const value = SimVar.GetSimVarValue(name, unit);
            this.setState((state) => ({
                cache: Object.assign({}, state.cache, {
                    [key]: { value, listeners: [minInterval] },
                })
            }));
            return;
        }

        this.setState((state) => ({
            cache: Object.assign({}, state.cache, {
                [key]: { value, listeners: state.cache[key].listeners.concat([minInterval]) },
            })
        }));
    }

    unregisterHook(name, unit, minInterval) {
        const key = `${name}_________${unit}`;
        this.setState((state) => ({
            cache: Object.assign({}, state.cache, {
                [key]: { listeners: state.cache[key].listeners.splice(state.cache[key].listeners.indexOf(minInterval), 1)},
            })
        }));
    }

    render() {
        return (
            <context.Provider value={{
                get: this.getValue.bind(this),
                set: this.setValue.bind(this),
                register: this.registerHook.bind(this),
                unregister: this.unregisterHook.bind(this),
            }}>
                { this.props.children }
            </context.Provider>
        );
    }
}

export const useSimVar = (name, unit, minInterval = 0) => {
    const contextValue = React.useContext(context);

    React.useEffect(() => {
        contextValue.register(name, unit, minInterval);
        return () => contextValue.unregister(name, unit, minInterval);
    }, [name, unit, minInterval]);

    return [
        contextValue.get(name, unit),
        (value) => contextValue.set(name, unit, value),
    ];
}
