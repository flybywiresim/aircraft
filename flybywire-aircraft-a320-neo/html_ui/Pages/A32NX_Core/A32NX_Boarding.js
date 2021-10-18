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

    async fillCargoStation(station, loadToFill) {
        station.load = loadToFill;
        await SimVar.SetSimVarValue(`L:${station.simVar}`, "Number", parseInt(loadToFill));

    }

    async setPax(numberOfPax) {
        let paxRemaining = parseInt(numberOfPax);

        async function fillStation(station, percent, paxToFill) {

            const pax = Math.min(Math.trunc(percent * paxToFill), station.seats);
            station.pax = pax;

            await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, "Number", parseInt(pax));

            paxRemaining -= pax;
        }

        await fillStation(paxStations['rows22_29'], .28 , numberOfPax);
        await fillStation(paxStations['rows14_21'], .28, numberOfPax);
        await fillStation(paxStations['rows7_13'], .25 , numberOfPax);
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

        for (const loadStation of Object.values(this.cargoStations)) {
            await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${loadStation.stationIndex}`, "kilograms", loadStation.load);
        }

        return;
    }

    async loadCargoZero() {
        for (const station of Object.values(this.cargoStations)) {
            await SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, "kilograms", 0);
            await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, "Number", 0);
            await SimVar.SetSimVarValue(`L:${station.simVar}`, "Number", 0);
        }

        return;
    }

    async update(_deltaTime) {
        this.time += _deltaTime;

        const boardingStartedByUser = SimVar.GetSimVarValue("L:A32NX_BOARDING_STARTED_BY_USR", "Bool");
        const boardingRate = NXDataStore.get("CONFIG_BOARDING_RATE", 'REAL');
        const isOnGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");

        if (!boardingStartedByUser) {
            return;
        }

        if ((!airplaneCanBoard() && boardingRate == 'REAL') || (!airplaneCanBoard() && boardingRate == 'FAST') || (boardingRate == 'INSTANT' && !isOnGround)) {
            return;
        }

        const currentPax = Object.values(this.paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur);
        const paxTarget = Object.values(this.paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number")).reduce((acc, cur) => acc + cur);
        const currentLoad = Object.values(this.cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, "Number")).reduce((acc, cur) => acc + cur);
        const loadTarget = Object.values(this.cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, "Number")).reduce((acc, cur) => acc + cur);

        let isAllPaxStationFilled = true;
        for (const _station of Object.values(this.paxStations)) {
            const stationCurrentPax = SimVar.GetSimVarValue(`L:${_station.simVar}`, "Number");
            const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${_station.simVar}_DESIRED`, "Number");

            if (stationCurrentPax !== stationCurrentPaxTarget) {
                isAllPaxStationFilled = false;
                break;
            }
        }

        let isAllCargoStationFilled = true;
        for (const _station of Object.values(this.cargoStations)) {
            const stationCurrentLoad = SimVar.GetSimVarValue(`L:${_station.simVar}`, "Number");
            const stationCurrentLoadTarget = SimVar.GetSimVarValue(`L:${_station.simVar}_DESIRED`, "Number");

            if (stationCurrentLoad !== stationCurrentLoadTarget) {
                isAllCargoStationFilled = false;
                break;
            }
        }

        if (currentPax === paxTarget && currentLoad === loadTarget && isAllPaxStationFilled && isAllCargoStationFilled) {
            // Finish boarding
            this.boardingState = "finished";
            await SimVar.SetSimVarValue("L:A32NX_BOARDING_STARTED_BY_USR", "Bool", false);

        } else if ((currentPax < paxTarget) || (currentLoad < loadTarget)) {
            this.boardingState = "boarding";
        } else if ((currentPax === paxTarget) && (currentLoad === loadTarget)) {
            this.boardingState = "finished";
        }

        if (boardingRate == 'INSTANT') {
            // Instant
            for (const paxStation of Object.values(this.paxStations)) {
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${paxStation.simVar}_DESIRED`, "Number");
                await this.fillPaxStation(paxStation, stationCurrentPaxTarget);
            }
            for (const loadStation of Object.values(this.cargoStations)) {
                const stationCurrentLoadTarget = SimVar.GetSimVarValue(`L:${loadStation.simVar}_DESIRED`, "Number");
                await this.fillCargoStation(loadStation, stationCurrentLoadTarget);
            }
            await this.loadPaxPayload();
            await this.loadCargoPayload();
            return;
        }

        let msDelay = 5000;

        if (boardingRate == 'FAST') {
            msDelay = 1000;
        }

        if (boardingRate == 'REAL') {
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

            for (const loadStation of Object.values(this.cargoStations)) {
                const stationCurrentLoad = SimVar.GetSimVarValue(`L:${loadStation.simVar}`, "Number");
                const stationCurrentLoadTarget = SimVar.GetSimVarValue(`L:${loadStation.simVar}_DESIRED`, "Number");

                if ((stationCurrentLoad < stationCurrentLoadTarget) && (Math.abs((stationCurrentLoadTarget - stationCurrentLoad)) > 40)) {
                    this.fillCargoStation(loadStation, stationCurrentLoad + 40);
                    break;
                } else if ((stationCurrentLoad < stationCurrentLoadTarget) && (Math.abs((stationCurrentLoadTarget - stationCurrentLoad)) <= 40)) {
                    this.fillCargoStation(loadStation, (stationCurrentLoad + (Math.abs(stationCurrentLoadTarget - stationCurrentLoad))));
                    break;
                } else if ((stationCurrentLoad > stationCurrentLoadTarget) && (Math.abs((stationCurrentLoadTarget - stationCurrentLoad)) > 40)) {
                    this.fillCargoStation(loadStation, stationCurrentLoad - 40);
                    break;
                } else if ((stationCurrentLoad > stationCurrentLoadTarget) && (Math.abs((stationCurrentLoadTarget - stationCurrentLoad)) <= 40)) {
                    this.fillCargoStation(loadStation, (stationCurrentLoad - (Math.abs(stationCurrentLoad - stationCurrentLoadTarget))));
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
