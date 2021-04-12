const WING_FUELRATE_GAL_SEC = 3.99;
const CENTER_MODIFIER = 3.0198;
const PAX_WEIGHT = 84;

function airplaneCanRefuel() {
    const busDC2 = SimVar.GetSimVarValue("L:A32NX_ELEC_DC_2_BUS_IS_POWERED", "Bool");
    const busDCHot1 = SimVar.GetSimVarValue("L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED", "Bool");
    const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
    const isOnGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
    const eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "Bool");
    const eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "Bool");

    if (gs > 0.1 || eng1Running || eng2Running || !isOnGround || (!busDC2 && !busDCHot1)) {
        return false;
    }
    return true;
}

class A32NX_Boarding {
    constructor() {
        this.paxStations = {
            rows1_6: {
                name: 'ECONOMY ROWS 1-6',
                seats: 36,
                weight: 3024,
                pax: 0,
                paxTarget: 0,
                stationIndex: 2 + 1,
                position: 21.98,
                seatsRange: [1, 36],
            },
            rows7_13: {
                name: 'ECONOMY ROWS 7-13',
                seats: 42,
                weight: 3530,
                pax: 0,
                paxTarget: 0,
                stationIndex: 3 + 1,
                position: 2.86,
                seatsRange: [37, 78],
            },
            rows14_20: {
                name: 'ECONOMY ROWS 14-21',
                seats: 48,
                weight: 4032,
                pax: 0,
                paxTarget: 0,
                stationIndex: 4 + 1,
                position: -15.34,
                seatsRange: [79, 126],
            },
            rows21_27: {
                name: 'ECONOMY ROWS 22-29',
                seats: 48,
                weight: 4032,
                pax: 0,
                paxTarget: 0,
                stationIndex: 5 + 1,
                position: -32.81,
                seatsRange: [127, 174],
            },
        };
    }

    init() {
        console.log('A32NX_Boarding init');

        // Set default pax (150)
        this.setPax(150);
        this.loadPayload();
    }

    async setPax(numberOfPax) {
        console.log('setPax', numberOfPax);
        // setPaxTarget(Number(numberOfPax));

        let paxRemaining = parseInt(numberOfPax);

        function fillStation(stationKey, paxToFill) {
            const pax = Math.min(paxToFill, payload[stationKey].seats);
            // changeStationPax(pax, stationKey);
            changeStationPaxTarget(pax, stationKey);
            paxRemaining -= pax;
        }

        fillStation('rows21_27', paxRemaining);
        fillStation('rows14_20', paxRemaining);

        const remainingByTwo = Math.trunc(paxRemaining / 2);
        fillStation('rows1_6', remainingByTwo);
        fillStation('rows7_13', paxRemaining);

        // setPayload(numberOfPax);
    }

    async loadPayload() {
        const currentPaxWeight = this.aocWeight.paxWeight || this.simbrief.paxWeight || PAX_WEIGHT;

        for (const station of Object.values(this.paxStations)) {
            await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", station.pax * currentPaxWeight);
        }

        // for (const station of Object.values(this.payloadStations)) {
        //     await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", station.currentWeight);
        // }

        return;
    }

    update(_deltaTime) {

    }
}
