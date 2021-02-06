import * as React from 'react';
import { customElement } from '../util.mjs';

const errorCallback = () => {
    throw Error('useSimVar was called in a React tree with no SimVarProvider');
};
const context = React.createContext({
    get: errorCallback,
    set: errorCallback,
});

/**
 * This component provides the basic functionality for the useSimVar hooks.
 * By keeping the last known SimVar values inside this provider, we're
 * effectively caching each SimVar, so that there is no additional overhead when
 * using multiple useSimVar hooks for the same SimVar.
 * For improved performance, this component will only trigger renders when the
 * "update" custom event is emitted through an instrument.
 */
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

    shouldComponentUpdate(nextProps, nextState) {
        return Object.entries(nextState.cache).some(([key, {value}]) => {
            return !this.state.cache[key] || this.state.cache[key].value !== value;
        });
    }

    componentWillUnmount() {
        customElement.removeEventListener('update', this.onUpdateEvent);
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

/**
 * The useSimVar hook provides an easy way to read and write SimVars from React.
 *
 * It's signature is similar to useState and it regularly refreshes the SimVar
 * to ensure your React component stays in sync with the SimVar being modified
 * from outside your component (like from other components, XML or SimConnect).
 *
 * You may optionally specify the maximum refresh interval. If the same SimVar
 * is used in multiple places, this hook will automatically deduplicate those
 * for maximum performance, rather than fetching the SimVar multiple times.
 * Setting the SimVar will instantly cause it to be updated in all other places
 * within the same React tree.
 *
 * @param name The name of the SimVar.
 * @param unit The unit of the SimVar.
 * @param maxInterval The maximum time in milliseconds that may elapse before
 * the next render will cause a SimVar refresh from the simulator. This
 * parameter is only an upper bound! If another hook requests the same SimVar
 * with a lower maxInterval, this hook will also benefit from that and refresh
 * the value more often.
 *
 * @example
 * // the return value is the value itself and a setter, similar to useSate
 * const [v1, setV1] = useSimVar('L:AIRLINER_V1_SPEED', 'Knots');
 *
 * @example
 * // only refresh the SimVar every 500ms
 * const [lightsTest] = useSimVar('L:XMLVAR_LTS_Test', 'Bool', 500);
 *
 * @returns {[*, (function(*): void)]}
 */
export const useSimVar = (name, unit, maxInterval = 0) => {
    const contextValue = React.useContext(context);

    React.useEffect(() => {
        // This part of useEffect will be called whenever either:
        // - the component has just mounted, or
        // - one the parameters below (name, unit, maxInterval) has changed.
        // In these cases, we want to register our current parameters with the
        // SimVarProvider that we access through the context.
        contextValue.register(name, unit, maxInterval);
        return () => {
            // This part of useEffect will be called whenever either:
            // - one of the parameters below (name, unit, maxInterval) is about
            //   to change, or
            // - the component is about to unmount
            // In these cases, we want to unregister our current parameters from
            // the SimVar provider, that we again access through the context.
            contextValue.unregister(name, unit, maxInterval);
        };
    }, [name, unit, maxInterval]);

    return [
        contextValue.get(name, unit), // SimVar value
        (value) => contextValue.set(name, unit, value), // SimVar setter
    ];
};
