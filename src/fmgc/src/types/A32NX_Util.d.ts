export type Spherical = [number, number, number]

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

    // eslint-disable-next-line camelcase
    namespace A32NX_Util {
        function createDeltaTimeCalculator(startTime: number): () => number

        function createFrameCounter(interval: number): number

        function createMachine(machineDef: StateMachineDefinition): StateMachine

        function trueToMagnetic(heading: Degrees, magVar?: Degrees): Degrees

        function magneticToTrue(heading: Degrees, magVar?: Degrees): Degrees

        function latLonToSpherical(ll: LatLongData): Spherical

        function sphericalToLatLon(s: Spherical): LatLongData

        function greatCircleIntersection(latlon1: LatLongData, brg1: Degrees, latlon2: LatLongData, brg2: Degrees): LatLongData

        function bothGreatCircleIntersections(latlon1: LatLongData, brg1: Degrees, latlon2: LatLongData, brg2: Degrees): [LatLongData, LatLongData]

        function getIsaTemp(alt?: Feet): number;

        function getIsaTempDeviation(alt?: Feet, sat?: Celcius): Celcius
    }
}

export {};
