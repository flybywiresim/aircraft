/* eslint-disable no-undef */
class A32NX_PayloadConstructor {
    constructor() {
        this.paxStations = {
            rows1_6: {
                name: 'ROWS [1-6]',
                seats: 36,
                weight: Math.round(NXUnits.kgToUser(3024)),
                stationIndex: 0 + 1,
                position: 20.0,
                simVar: "A32NX_PAX_FLAGS_A",
                activeFlags: new SeatFlags(SimVar.GetSimVarValue('L:A32NX_PAX_FLAGS_A', 'Number'), 36),
                desiredFlags: new SeatFlags(SimVar.GetSimVarValue('L:A32NX_PAX_FLAGS_A_DESIRED', 'Number'), 36),

            },
            rows7_13: {
                name: 'ROWS [7-13]',
                seats: 42,
                weight: Math.round(NXUnits.kgToUser(3530)),
                stationIndex: 1 + 1,
                position: 0.9,
                simVar: "A32NX_PAX_FLAGS_B",
                activeFlags: new SeatFlags(SimVar.GetSimVarValue('L:A32NX_PAX_FLAGS_B', 'Number'), 42),
                desiredFlags: new SeatFlags(SimVar.GetSimVarValue('L:A32NX_PAX_FLAGS_B_DESIRED', 'Number'), 42),
            },
            rows14_21: {
                name: 'ROWS [14-21]',
                seats: 48,
                weight: Math.round(NXUnits.kgToUser(4032)),
                stationIndex: 2 + 1,
                position: -17.3,
                simVar: "A32NX_PAX_FLAGS_C",
                activeFlags: new SeatFlags(SimVar.GetSimVarValue('L:A32NX_PAX_FLAGS_C', 'Number'), 48),
                desiredFlags: new SeatFlags(SimVar.GetSimVarValue('L:A32NX_PAX_FLAGS_C_DESIRED', 'Number'), 48),
            },
            rows22_29: {
                name: 'ROWS [22-29]',
                seats: 48,
                weight: Math.round(NXUnits.kgToUser(4032)),
                stationIndex: 3 + 1,
                position: -36.3,
                simVar: "A32NX_PAX_FLAGS_D",
                activeFlags: new SeatFlags(SimVar.GetSimVarValue('L:A32NX_PAX_FLAGS_D', 'Number'), 48),
                desiredFlags: new SeatFlags(SimVar.GetSimVarValue('L:A32NX_PAX_FLAGS_D_DESIRED', 'Number'), 48),
            },
        };

        this.cargoStations = {
            fwdBag: {
                name: 'FWD BAGGAGE/CONTAINER',
                weight: Math.round(NXUnits.kgToUser(3402)),
                load: 0,
                stationIndex: 4 + 1,
                position: 16.3,
                visible: true,
                simVar: 'A32NX_CARGO_FWD_BAGGAGE_CONTAINER',
            },
            aftCont: {
                name: 'AFT CONTAINER',
                weight: Math.round(NXUnits.kgToUser(2426)),
                load: 0,
                stationIndex: 5 + 1,
                position: -25.1,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_CONTAINER',
            },
            aftBag: {
                name: 'AFT BAGGAGE',
                weight: Math.round(NXUnits.kgToUser(2110)),
                load: 0,
                stationIndex: 6 + 1,
                position: -35.1,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_BAGGAGE',
            },
            aftBulk: {
                name: 'AFT BULK/LOOSE',
                weight: Math.round(NXUnits.kgToUser(1497)),
                load: 0,
                stationIndex: 7 + 1,
                position: -44.4,
                visible: true,
                simVar: 'A32NX_CARGO_AFT_BULK_LOOSE',
            },
        };
    }
}

const payloadConstruct = new A32NX_PayloadConstructor();
const paxStations = payloadConstruct.paxStations;
const cargoStations = payloadConstruct.cargoStations;
const MAX_SEAT_AVAILABLE = 174;

/**
 * Calculate %MAC ZWFCG of all stations
 */
function getZfwcg() {

    const leMacZ = -5.383; // Accurate to 3 decimals, replaces debug weight values
    const macSize = 13.464; // Accurate to 3 decimals, replaces debug weight values

    const emptyWeight = (SimVar.GetSimVarValue("EMPTY WEIGHT", getUserUnit()));
    const emptyPosition = -9.42; // Value from flight_model.cfg
    const emptyMoment = emptyPosition * emptyWeight;
    const PAX_WEIGHT = SimVar.GetSimVarValue("L:A32NX_WB_PER_PAX_WEIGHT", "Number");

    const paxTotalMass = Object.values(paxStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}`, "Number") * PAX_WEIGHT)).reduce((acc, cur) => acc + cur, 0);
    const paxTotalMoment = Object.values(paxStations).map((station) => (SimVar.GetSimVarValue(`L:${station.simVar}`, "Number") * PAX_WEIGHT) * station.position).reduce((acc, cur) => acc + cur, 0);

    const cargoTotalMass = Object.values(cargoStations).map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit())).reduce((acc, cur) => acc + cur, 0);
    const cargoTotalMoment = Object.values(cargoStations).map((station) => (SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()) * station.position)).reduce((acc, cur) => acc + cur, 0);

    const totalMass = emptyWeight + paxTotalMass + cargoTotalMass;
    const totalMoment = emptyMoment + paxTotalMoment + cargoTotalMoment;

    const cgPosition = totalMoment / totalMass;
    const cgPositionToLemac = cgPosition - leMacZ;
    const cgPercentMac = -100 * (cgPositionToLemac / macSize);

    return cgPercentMac;
}

function getTotalCargo() {
    const cargoTotalMass = Object.values(cargoStations).filter((station) => station.visible).map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit())).reduce((acc, cur) => acc + cur, 0);
    return cargoTotalMass;
}

function getTotalPayload() {
    const paxTotalMass = Object.values(paxStations).map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit())).reduce((acc, cur) => acc + cur, 0);
    const cargoTotalMass = getTotalCargo();
    return paxTotalMass + cargoTotalMass;
}

function getZfw() {
    const emptyWeight = (SimVar.GetSimVarValue("EMPTY WEIGHT", getUserUnit()));
    return emptyWeight + getTotalPayload();
}

function getUserUnit() {
    const defaultUnit = (NXUnits.userWeightUnit() == "KG") ? "Kilograms" : "Pounds";
    return defaultUnit;
}
