import { Units } from '@shared/units';

// TODO: Refactor to use Seat Map matrix format
interface PassengerStations {
    rows1to6: PassengerStation,
    rows7to13: PassengerStation,
    rows14to21: PassengerStation,
    rows22to29: PassengerStation,
}

interface CargoStations {
    fwdBag: CargoStation,
    aftCont: CargoStation,
    aftBag: CargoStation,
    aftBulk: CargoStation,
}

interface PassengerStation {
    name: string,
    seats: number,
    weight: number,
    pax: number,
    paxTarget: number,
    stationIndex: number,
    position: number,
    simVar: string
}

interface CargoStation {
    name: string,
    weight: number,
    load: number,
    stationIndex: number,
    position: number,
    visible: boolean,
    simVar: string
}

export class PayloadConstructor {
    paxStations: PassengerStations;

    cargoStations: CargoStations;

    constructor() {
        this.paxStations = {
            rows1to6: {
                name: 'ROWS [1-6]',
                seats: 36,
                weight: Math.round(Units.kilogramToUser(3024)),
                pax: 0,
                paxTarget: 0,
                stationIndex: 0 + 1,
                position: 21.98,
                simVar: 'A32NX_PAX_TOTAL_ROWS_1_6',
            },
            rows7to13: {
                name: 'ROWS [7-13]',
                seats: 42,
                weight: Math.round(Units.kilogramToUser(3530)),
                pax: 0,
                paxTarget: 0,
                stationIndex: 1 + 1,
                position: 2.86,
                simVar: 'A32NX_PAX_TOTAL_ROWS_7_13',
            },
            rows14to21: {
                name: 'ROWS [14-21]',
                seats: 48,
                weight: Math.round(Units.kilogramToUser(4032)),
                pax: 0,
                paxTarget: 0,
                stationIndex: 2 + 1,
                position: -15.34,
                simVar: 'A32NX_PAX_TOTAL_ROWS_14_21',
            },
            rows22to29: {
                name: 'ROWS [22-29]',
                seats: 48,
                weight: Math.round(Units.kilogramToUser(4032)),
                pax: 0,
                paxTarget: 0,
                stationIndex: 3 + 1,
                position: -32.81,
                simVar: 'A32NX_PAX_TOTAL_ROWS_22_29',
            },
        };

        this.cargoStations = {
            fwdBag: {
                name: 'FWD BAGGAGE/CONTAINER',
                weight: Math.round(Units.kilogramToUser(3402)),
                load: 0,
                stationIndex: 4 + 1,
                position: 18.28,
                visible: true,
                simVar: 'A32NX_CARGO_FWD_BAGGAGE_CONTAINER',
            },
            aftCont: {
                name: 'AFT CONTAINER',
                weight: Math.round(Units.kilogramToUser(2426)),
                load: 0,
                stationIndex: 5 + 1,
                position: -15.96,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_CONTAINER',
            },
            aftBag: {
                name: 'AFT BAGGAGE',
                weight: Math.round(Units.kilogramToUser(2110)),
                load: 0,
                stationIndex: 6 + 1,
                position: -27.10,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_BAGGAGE',
            },
            aftBulk: {
                name: 'AFT BULK/LOOSE',
                weight: Math.round(Units.kilogramToUser(1497)),
                load: 0,
                stationIndex: 7 + 1,
                position: -37.35,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_BULK_LOOSE',
            },
        };
    }
}

export class PayloadManager {
    static payloadConstruct = new PayloadConstructor();

    static paxStations = PayloadManager.payloadConstruct.paxStations;

    static cargoStations = PayloadManager.payloadConstruct.cargoStations;

    /**
     * Calculate %MAC ZWFCG of all stations
     */
    static getZfwcg() {
        const leMacZ = -5.386; // Accurate to 3 decimals, replaces debug weight values
        const macSize = 13.454; // Accurate to 3 decimals, replaces debug weight values

        const emptyWeight = (SimVar.GetSimVarValue('EMPTY WEIGHT', PayloadManager.getUserUnit()));
        const emptyPosition = -8.75; // Value from flight_model.cfg
        const emptyMoment = emptyPosition * emptyWeight;
        const PAX_WEIGHT = SimVar.GetSimVarValue('L:A32NX_WB_PER_PAX_WEIGHT', 'Number');

        const paxTotalMass = Object.values(PayloadManager.paxStations)
            .map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number') * PAX_WEIGHT))
            .reduce((acc, cur) => acc + cur, 0);

        const paxTotalMoment = Object.values(PayloadManager.paxStations)
            .map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number') * PAX_WEIGHT) * station.position)
            .reduce((acc, cur) => acc + cur, 0);

        const cargoTotalMass = Object.values(PayloadManager.cargoStations)
            .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, PayloadManager.getUserUnit()))
            .reduce((acc, cur) => acc + cur, 0);

        const cargoTotalMoment = Object.values(PayloadManager.cargoStations)
            .map((station) => (SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, PayloadManager.getUserUnit()) * station.position))
            .reduce((acc, cur) => acc + cur, 0);

        const totalMass = emptyWeight + paxTotalMass + cargoTotalMass;
        const totalMoment = emptyMoment + paxTotalMoment + cargoTotalMoment;

        const cgPosition = totalMoment / totalMass;
        const cgPositionToLemac = cgPosition - leMacZ;
        const cgPercentMac = -100 * (cgPositionToLemac / macSize);

        return cgPercentMac;
    }

    static getTotalCargo() {
        const cargoTotalMass = Object.values(PayloadManager.cargoStations).filter((station) => station.visible)
            .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, PayloadManager.getUserUnit()))
            .reduce((acc, cur) => acc + cur, 0);
        return cargoTotalMass;
    }

    static getTotalPayload() {
        const paxTotalMass = Object.values(PayloadManager.paxStations)
            .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, PayloadManager.getUserUnit()))
            .reduce((acc, cur) => acc + cur, 0);
        const cargoTotalMass = PayloadManager.getTotalCargo();
        return paxTotalMass + cargoTotalMass;
    }

    static getZfw() {
        const emptyWeight = (SimVar.GetSimVarValue('EMPTY WEIGHT', PayloadManager.getUserUnit()));
        return emptyWeight + PayloadManager.getTotalPayload();
    }

    static getUserUnit() {
        const defaultUnit = (Units.userWeightSuffixEis2 === 'kg') ? 'Kilograms' : 'Pounds';
        return defaultUnit;
    }
}
