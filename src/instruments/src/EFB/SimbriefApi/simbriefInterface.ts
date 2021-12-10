export interface ISimbriefData {
    origin: IAirportInfo,
    destination: IAirportInfo,
    airline: string,
    flightNumber: string,
    aircraftReg: string,
    cruiseAltitude: number,
    costIndex: string,
    route: string,
    distance: string,
    flightETAInSeconds: string,
    weights: IWeights,
    fuel: IFuel,
    units: string,
    alternate: IAlternate,
    times: ITimes,
    weather: IWeather,
    files: Files,
    text: string,
}

interface IAirportInfo {
    icao: string,
    iata: string
}

export interface IWeights {
    cargo: number,
    estLandingWeight: number,
    estTakeOffWeight: number,
    estZeroFuelWeight: number,
    maxLandingWeight: number,
    maxTakeOffWeight: number,
    maxZeroFuelWeight: number,
    passengerCount: number,
    passengerWeight: number,
    payload: number
}

export interface IFuel {
    avgFuelFlow: number,
    contingency: number,
    enrouteBurn: number,
    etops: number,
    extra: number,
    maxTanks: number,
    minTakeOff: number,
    planLanding: number,
    planRamp: number,
    planTakeOff: number,
    reserve: number,
    taxi: number
}

interface IAlternate {
    burn: number,
    icao: string,
    iata: string
}

interface ITimes {
    contFuelTime: number,
    destTimezone: number,
    endurance: number,
    estBlock: number,
    estIn: number,
    estOff: number,
    estOn: number,
    estOut: number,
    estTimeEnroute: number,
    etopsFuelTime: number,
    extraFuelTime: number,
    origTimeZone: number,
    reserveTime: number,
    schedBlock: number,
    schedIn: string,
    schedOff: number,
    schedOn: number,
    schedOut: string,
    schedTimeEnroute: number,
    taxiIn: number,
    taxiOut: number,
}

interface IWeather {
    avgWindDir: number,
    avgWindSpeed: number,
}

interface Files {
    loadsheet: string
}

export const EmptyISimbriefData = {
    airline: '',
    flightNumber: '',
    aircraftReg: '',
    cruiseAltitude: 0,
    costIndex: '',
    route: '',
    files: { loadsheet: '' },
    origin: {
        iata: '',
        icao: '',
    },
    destination: {
        iata: '',
        icao: '',
    },
    distance: '0nm',
    flightETAInSeconds: '',
    weights: {
        cargo: 0,
        estLandingWeight: 0,
        estTakeOffWeight: 0,
        estZeroFuelWeight: 0,
        maxLandingWeight: 0,
        maxTakeOffWeight: 0,
        maxZeroFuelWeight: 0,
        passengerCount: 0,
        passengerWeight: 0,
        payload: 0,
    },
    fuel: {
        avgFuelFlow: 0,
        contingency: 0,
        enrouteBurn: 0,
        etops: 0,
        extra: 0,
        maxTanks: 0,
        minTakeOff: 0,
        planLanding: 0,
        planRamp: 0,
        planTakeOff: 0,
        reserve: 0,
        taxi: 0,
    },
    units: '',
    alternate: {
        icao: '',
        iata: '',
        burn: 0,
    },
    times: {
        contFuelTime: 0,
        destTimezone: 0,
        endurance: 0,
        estBlock: 0,
        estIn: 0,
        estOff: 0,
        estOn: 0,
        estOut: 0,
        estTimeEnroute: 0,
        etopsFuelTime: 0,
        extraFuelTime: 0,
        origTimeZone: 0,
        reserveTime: 0,
        schedBlock: 0,
        schedIn: '',
        schedOff: 0,
        schedOn: 0,
        schedOut: '',
        schedTimeEnroute: 0,
        taxiIn: 0,
        taxiOut: 0,
    },
    weather: {
        avgWindDir: 0,
        avgWindSpeed: 0,
    },
    text: '',
};
