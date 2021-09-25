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
        this.cargoStations = payloadConstruct.cargoStations;
    }

    async init() {
        // Set default pax (0)
        await this.setPax(0);
        await this.loadPaxPayload();
        await this.loadCargoZero();
        await this.loadCargoPayload();
    }

    async fillPaxStation(station, paxToFill) {
        const pax = Math.min(paxToFill, station.seats);
        station.pax = pax;

        await SimVar.SetSimVarValue(`L:${station.simVar}`, "Number", parseInt(pax));
    }

    async fillBaggageStation(station, bagsToFill) {
        station.bags = bagsToFill;

        await SimVar.SetSimVarValue(`L:${station.simVar}`, "Number", parseInt(bagsToFill));

    }

    async setPax(numberOfPax) {
        let paxRemaining = parseInt(numberOfPax);

        async function fillStation(station, percent, paxToFill) {

            const pax = Math.min(Math.round(percent * paxToFill), station.seats);
            station.pax = pax;

            await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, "Number", parseInt(pax));

            paxRemaining -= pax;
        }

        await fillStation(paxStations['rows22_29'], .275 , numberOfPax);
        await fillStation(paxStations['rows14_21'], .275, numberOfPax);
        await fillStation(paxStations['rows7_13'], .240 , numberOfPax);
        await fillStation(paxStations['rows1_6'], 1 , paxRemaining);
        return;
    }

    async loadPaxPayload() {

        for (const paxStation of Object.values(this.paxStations)) {
            await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${paxStation.stationIndex}`, "kilograms", paxStation.pax * PAX_WEIGHT);
        }

        return;
    }

    async loadCargoPayload() {

        for (const bagStation of Object.values(this.cargoStations)) {
            await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${bagStation.stationIndex}`, "kilograms", bagStation.bags * BAG_WEIGHT);
        }

        return;
    }

    async loadCargoZero() {
        for (const station of Object.values(this.cargoStations)) {
            await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", 0);
        }

        return;
    }

    async update(_deltaTime) {
        this.time += _deltaTime;

        const boardingStartedByUser = SimVar.GetSimVarValue("L:A32NX_BOARDING_STARTED_BY_USR", "Bool");
        const boardingRate = NXDataStore.get("CONFIG_BOARDING_RATE", "");
        const isOnGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");

        if (!boardingStartedByUser) {
            return;
        }

        if ((!airplaneCanBoard() && boardingRate == '1') || (!airplaneCanBoard() && boardingRate == '2') || (boardingRate == '3' && !isOnGround)) {
            return;
        }

        const currentPax = Object.values(this.paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur);
        const paxTarget = Object.values(this.paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number")).reduce((acc, cur) => acc + cur);

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

        if (boardingRate == '3') {
            // Instant
            for (const paxStation of Object.values(this.paxStations)) {
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${paxStation.simVar}_DESIRED`, "Number");

                await this.fillPaxStation(paxStation, stationCurrentPaxTarget);
            }
            for (const bagStation of Object.values(this.cargoStations)) {
                const stationCurrentBagsTarget = SimVar.GetSimVarValue(`L:${bagStation.simVar}_DESIRED`, "Number");
                await this.fillBaggageStation(bagStation, stationCurrentBagsTarget);
            }
            await this.loadPaxPayload();
            await this.loadCargoPayload();
            return;
        }

        let msDelay = 5000;

        if (boardingRate == '2') {
            msDelay = 1000;
        }

        if (boardingRate == '1') {
            msDelay = 5000;
        }

        if (this.time > msDelay) {
            this.time = 0;

            // Stations logic:
            for (const paxStation of Object.values(this.paxStations).reverse()) {
                const stationCurrentPax = SimVar.GetSimVarValue(`L:${paxStation.simVar}`, "Number");
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${paxStation.simVar}_DESIRED`, "Number");

                if (stationCurrentPax < stationCurrentPaxTarget) {
                    this.fillPaxStation(paxStation, stationCurrentPax + 1);
                    break;
                } else if (stationCurrentPax > stationCurrentPaxTarget) {
                    this.fillPaxStation(paxStation, stationCurrentPax - 1);
                    break;
                } else {
                    continue;
                }
            }

            for (const bagStation of Object.values(this.cargoStations)) {
                const stationCurrentBags = SimVar.GetSimVarValue(`L:${bagStation.simVar}`, "Number");
                const stationCurrentBagsTarget = SimVar.GetSimVarValue(`L:${bagStation.simVar}_DESIRED`, "Number");

                if (stationCurrentBags < stationCurrentBagsTarget) {
                    this.fillBaggageStation(bagStation, stationCurrentBags + 1);
                    break;
                } else if (stationCurrentBags > stationCurrentBagsTarget) {
                    this.fillBaggageStation(bagStation, stationCurrentBags - 1);
                    break;
                } else {
                    continue;
                }
            }

            await this.loadPaxPayload();
            await this.loadCargoPayload();
        }
    }
}
