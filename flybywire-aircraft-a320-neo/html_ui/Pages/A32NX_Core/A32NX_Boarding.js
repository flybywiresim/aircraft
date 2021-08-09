function airplaneCanBoard() {
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
        this.boardingState = "finished";
        this.time = 0;
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
                simVar: "A32NX_PAX_TOTAL_ROWS_1_6"
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
                simVar: "A32NX_PAX_TOTAL_ROWS_7_13"
            },
            rows14_21: {
                name: 'ECONOMY ROWS 14-21',
                seats: 48,
                weight: 4032,
                pax: 0,
                paxTarget: 0,
                stationIndex: 4 + 1,
                position: -15.34,
                seatsRange: [79, 126],
                simVar: "A32NX_PAX_TOTAL_ROWS_14_21"
            },
            rows22_29: {
                name: 'ECONOMY ROWS 22-29',
                seats: 48,
                weight: 4032,
                pax: 0,
                paxTarget: 0,
                stationIndex: 5 + 1,
                position: -32.81,
                seatsRange: [127, 174],
                simVar: "A32NX_PAX_TOTAL_ROWS_22_29"
            },
        };

        this.payloadStations = {
            fwdBag: {
                name: 'FWD BAGGAGE/CONTAINER',
                weight: 3402,
                stationIndex: 6 + 1,
                position: 18.28,
            },
            aftCont: {
                name: 'AFT CONTAINER',
                weight: 2426,
                stationIndex: 7 + 1,
                position: -15.96,
            },
            aftBag: {
                name: 'AFT BAGGAGE',
                weight: 2110,
                stationIndex: 8 + 1,
                position: -27.10,
            },
            aftBulk: {
                name: 'COMP 5 - AFT BULK/LOOSE',
                weight: 1497,
                stationIndex: 9 + 1,
                position: -37.35,
            },
        };
    }

    async init() {

        // Set default pax (0)
        await this.setPax(0);
        await this.loadPayload();
        await this.loadCargoZero();
    }

    async fillStation(station, paxToFill) {

        const pax = Math.min(paxToFill, station.seats);
        station.pax = pax;

        await SimVar.SetSimVarValue(`L:${station.simVar}`, "Number", parseInt(pax));
    }

    async setPax(numberOfPax) {

        let paxRemaining = parseInt(numberOfPax);

        async function fillStation(station, paxToFill) {

            const pax = Math.min(paxToFill, station.seats);
            station.pax = pax;

            await SimVar.SetSimVarValue(`L:${station.simVar}`, "Number", parseInt(pax));

            paxRemaining -= pax;
        }

        await fillStation(this.paxStations['rows22_29'], paxRemaining);
        await fillStation(this.paxStations['rows14_21'], paxRemaining);

        const remainingByTwo = Math.trunc(paxRemaining / 2);
        await fillStation(this.paxStations['rows1_6'], remainingByTwo);
        await fillStation(this.paxStations['rows7_13'], paxRemaining);

        return;
    }

    async loadPayload() {

        const MAX_SEAT_AVAILABLE = 174;
        const PAX_WEIGHT = 84;
        const BAG_WEIGHT = 20;

        const currentPaxWeight = PAX_WEIGHT + BAG_WEIGHT;

        for (const station of Object.values(this.paxStations)) {
            await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", station.pax * currentPaxWeight);
        }

        return;
    }

    async loadCargoZero() {

        for (const station of Object.values(this.payloadStations)) {
            await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", 0);
        }

        return;
    }

    async update(_deltaTime) {
        this.time += _deltaTime;

        const boardingStartedByUser = SimVar.GetSimVarValue("L:A32NX_BOARDING_STARTED_BY_USR", "Bool");

        if (!boardingStartedByUser) {
            return;
        }

        if (!airplaneCanBoard()) {
            return;
        }

        const currentPax = Object.values(this.paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur);
        const paxTarget = Object.values(this.paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number")).reduce((acc, cur) => acc + cur);

        const boardingRate = SimVar.GetSimVarValue("L:A32NX_BOARDING_RATE_SETTING", "Number");

        let isAllStationFilled = true;
        for (const _station of Object.values(this.paxStations)) {
            const stationCurrentPax = SimVar.GetSimVarValue(`L:${_station.simVar}`, "Number");
            const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${_station.simVar}_DESIRED`, "Number");

            if (stationCurrentPax !== stationCurrentPaxTarget) {
                isAllStationFilled = false;
                break;
            }
        }

        if (currentPax === paxTarget && isAllStationFilled) {
            // Finish boarding
            this.boardingState = "finished";
            await SimVar.SetSimVarValue("L:A32NX_BOARDING_STARTED_BY_USR", "Bool", false);

            SimVar.SetSimVarValue('K:TOGGLE_JETWAY', 'bool', false);
            SimVar.SetSimVarValue('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 0);
            SimVar.SetSimVarValue('K:TOGGLE_RAMPTRUCK', 'bool', false);
            SimVar.SetSimVarValue('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 0);
        } else if (currentPax < paxTarget) {
            this.boardingState = "boarding";
        } else if (currentPax === paxTarget) {
            this.boardingState = "finished";
        }

        if (boardingRate == 2) {
            // Instant
            for (const station of Object.values(this.paxStations)) {
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number");

                await this.fillStation(station, stationCurrentPaxTarget);
            }
            await this.loadPayload();
            return;
        }

        let msDelay = 1000;
        if (boardingRate === 1) {
            msDelay = 500;
        }

        if (this.time > msDelay) {
            this.time = 0;

            // Stations logic:
            for (const station of Object.values(this.paxStations).reverse()) {
                const stationCurrentPax = SimVar.GetSimVarValue(`L:${station.simVar}`, "Number");
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number");

                if (stationCurrentPax < stationCurrentPaxTarget) {
                    this.fillStation(station, stationCurrentPax + 1);
                    break;
                } else if (stationCurrentPax > stationCurrentPaxTarget) {
                    this.fillStation(station, stationCurrentPax - 1);
                    break;
                } else {
                    continue;
                }
            }

            await this.loadPayload();
        }
    }
}
