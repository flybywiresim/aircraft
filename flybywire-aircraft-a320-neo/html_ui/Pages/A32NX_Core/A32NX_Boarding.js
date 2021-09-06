function airplaneCanBoard() {
    const busDC2 = SimVar.GetSimVarValue("L:A32NX_ELEC_DC_2_BUS_IS_POWERED", "Bool");
    const busDCHot1 = SimVar.GetSimVarValue("L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED", "Bool");
    const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
    const isOnGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
    const eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "Bool");
    const eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "Bool");

    return !(gs > 0.1 || eng1Running || eng2Running || !isOnGround || (!busDC2 && !busDCHot1));
}

class A32NX_Boarding {
    constructor() {
        this.boardingState = "finished";
        this.time = 0;
        const payloadConstruct = new A32NX_PayloadConstructor();
        this.paxStations = payloadConstruct.paxStations;
        this.payloadStations = payloadConstruct.payloadStations;
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
