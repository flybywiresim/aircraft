function airplaneCanBoard() {
    const busDC2 = SimVar.GetSimVarValue('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool');
    const busDCHot1 = SimVar.GetSimVarValue('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'Bool');
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const eng1Running = SimVar.GetSimVarValue('ENG COMBUSTION:1', 'Bool');
    const eng2Running = SimVar.GetSimVarValue('ENG COMBUSTION:2', 'Bool');

    return !(gs > 0.1 || eng1Running || eng2Running || !isOnGround || (!busDC2 && !busDCHot1));
}

function setDefaultWeights(simbriefPaxWeight, simbriefBagWeight) {
    const perPaxWeight = (simbriefPaxWeight === 0) ? Math.round(NXUnits.kgToUser(84)) : simbriefPaxWeight;
    const perBagWeight = (simbriefBagWeight === 0) ? Math.round(NXUnits.kgToUser(20)) : simbriefBagWeight;
    const conversionFactor = (getUserUnit() == 'Kilograms') ? 0.4535934 : 1;
    SimVar.SetSimVarValue('L:A32NX_WB_PER_PAX_WEIGHT', 'Number', parseInt(perPaxWeight));
    SimVar.SetSimVarValue('L:A32NX_WB_PER_BAG_WEIGHT', 'Number', parseInt(perBagWeight));
    SimVar.SetSimVarValue('L:A32NX_EFB_UNIT_CONVERSION_FACTOR', 'Number', conversionFactor);
}

class A32NX_Boarding {
    constructor() {
        this.boardingState = 'finished';
        this.time = 0;
        const payloadConstruct = new A32NX_PayloadConstructor();
        this.paxStations = payloadConstruct.paxStations;
        this.cargoStations = payloadConstruct.cargoStations;

        // GSX Helpers
        this.passengersLeftToFillOrEmpty = 0;
        this.prevBoardedOrDeboarded = 0;
        this.prevCargoDeboardedPercentage = 0;

        this.gsxStates = {
            AVAILABLE: 1,
            NOT_AVAILABLE: 2,
            BYPASSED: 3,
            REQUESTED: 4,
            PERFORMING: 5,
            COMPLETED: 6,
        };
    }

    async init() {
        const inDeveloperState = SimVar.GetSimVarValue('L:A32NX_DEVELOPER_STATE', 'Bool');
        if (!inDeveloperState) {
            // Set default pax (0)
            await this.setPax(0);
            this.loadPaxPayload();
            this.loadCargoZero();
            this.loadCargoPayload();
        }
    }

    async fillPaxStation(station, paxToFill) {
        const pax = Math.min(paxToFill, station.seats);
        station.pax = pax;
        await SimVar.SetSimVarValue(`L:${station.simVar}`, 'Number', parseInt(pax));
    }

    async fillCargoStation(station, loadToFill) {
        station.load = loadToFill;
        await SimVar.SetSimVarValue(`L:${station.simVar}`, 'Number', parseInt(loadToFill));
    }

    async setPax(numberOfPax) {
        let paxRemaining = parseInt(numberOfPax);

        async function fillStation(station, percent, paxToFill) {
            const pax = Math.min(Math.trunc(percent * paxToFill), station.seats);
            station.pax = pax;
            await SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, 'Number', parseInt(pax));
            paxRemaining -= pax;
        }

        await fillStation(paxStations.rows22_29, 0.28, numberOfPax);
        await fillStation(paxStations.rows14_21, 0.28, numberOfPax);
        await fillStation(paxStations.rows7_13, 0.25, numberOfPax);
        await fillStation(paxStations.rows1_6, 1, paxRemaining);
    }

    loadPaxPayload() {
        const PAX_WEIGHT = SimVar.GetSimVarValue('L:A32NX_WB_PER_PAX_WEIGHT', 'Number');
        return Promise.all(Object.values(this.paxStations).map((paxStation) => SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${paxStation.stationIndex}`, getUserUnit(), paxStation.pax * PAX_WEIGHT)));
    }

    loadCargoPayload() {
        return Promise.all(Object.values(this.cargoStations).map((loadStation) => SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${loadStation.stationIndex}`, getUserUnit(), loadStation.load)));
    }

    loadCargoZero() {
        for (const station of Object.values(this.cargoStations)) {
            SimVar.SetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, 'Kilograms', 0);
            SimVar.SetSimVarValue(`L:${station.simVar}_DESIRED`, 'Number', 0);
            SimVar.SetSimVarValue(`L:${station.simVar}`, 'Number', 0);
        }
    }

    areStationsFilled() {
        let isAllPaxStationFilled = true;
        for (const _station of Object.values(this.paxStations)) {
            const stationCurrentPax = SimVar.GetSimVarValue(`L:${_station.simVar}`, 'Number');
            const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${_station.simVar}_DESIRED`, 'Number');

            if (stationCurrentPax !== stationCurrentPaxTarget) {
                isAllPaxStationFilled = false;
                break;
            }
        }

        let isAllCargoStationFilled = true;
        for (const _station of Object.values(this.cargoStations)) {
            const stationCurrentLoad = SimVar.GetSimVarValue(`L:${_station.simVar}`, 'Number');
            const stationCurrentLoadTarget = SimVar.GetSimVarValue(`L:${_station.simVar}_DESIRED`, 'Number');

            if (stationCurrentLoad !== stationCurrentLoadTarget) {
                isAllCargoStationFilled = false;
                break;
            }
        }
        return [isAllPaxStationFilled, isAllCargoStationFilled];
    }

    generateMsDelay(boardingRate) {
        switch (boardingRate) {
        case 'FAST':
            return 1000;
        case 'REAL':
            return 5000;
        default:
            return 5000;
        }
    }

    async manageGsxBoarding(currentPax, boardState) {
        switch (boardState) {
        // GSX doesn't emit 100% boarding, this case is to ensure cargo is 100% filled to target
        case this.gsxStates.COMPLETED:
            for (const loadStation of Object.values(this.cargoStations)) {
                const stationCurrentLoadTarget = SimVar.GetSimVarValue(`L:${loadStation.simVar}_DESIRED`, 'Number');
                this.fillCargoStation(loadStation, stationCurrentLoadTarget);
            }

            await SimVar.SetSimVarValue('L:A32NX_SOUND_PAX_AMBIENCE', 'Bool', currentPax > 0);
            break;
        case this.gsxStates.PERFORMING:
            await SimVar.SetSimVarValue('L:A32NX_SOUND_PAX_AMBIENCE', 'Bool', currentPax > 0);
            const gsxBoardingTotal = SimVar.GetSimVarValue('L:FSDT_GSX_NUMPASSENGERS_BOARDING_TOTAL', 'Number');
            this.passengersLeftToFillOrEmpty = gsxBoardingTotal - this.prevBoardedOrDeboarded;

            for (const paxStation of Object.values(this.paxStations).reverse()) {
                const stationCurrentPax = SimVar.GetSimVarValue(`L:${paxStation.simVar}`, 'Number');
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${paxStation.simVar}_DESIRED`, 'Number');
                if (this.passengersLeftToFillOrEmpty <= 0) {
                    break;
                }

                const loadAmount = Math.min(this.passengersLeftToFillOrEmpty, paxStation.seats);
                if (stationCurrentPax < stationCurrentPaxTarget) {
                    this.fillPaxStation(paxStation, stationCurrentPax + loadAmount);
                    this.passengersLeftToFillOrEmpty -= loadAmount;
                }
            }
            this.prevBoardedOrDeboarded = gsxBoardingTotal;

            const gsxCargoPercentage = SimVar.GetSimVarValue('L:FSDT_GSX_BOARDING_CARGO_PERCENT', 'Number');
            for (const loadStation of Object.values(this.cargoStations)) {
                const stationCurrentLoadTarget = SimVar.GetSimVarValue(`L:${loadStation.simVar}_DESIRED`, 'Number');

                const loadAmount = stationCurrentLoadTarget * (gsxCargoPercentage / 100);
                this.fillCargoStation(loadStation, loadAmount);
            }
            break;
        default:
            break;
        }
    }

    manageGsxDeBoarding(currentPax, boardState) {
        switch (boardState) {
        // this is a backup state incase the EFB page isn't open to set desired PAX/Cargo to 0
        case this.gsxStates.REQUESTED:
            Object.values(this.paxStations)
                .reverse()
                .forEach((paxStation) => SimVar.SetSimVarValue(`L:${paxStation.simVar}_DESIRED`, 'Number', parseInt(0)));

            Object.values(this.cargoStations)
                .forEach((loadStation) => SimVar.SetSimVarValue(`L:${loadStation.simVar}_DESIRED`, 'Number', parseInt(0)));
            break;

            // GSX doesn't emit 100% deboard percentage, this is set to ensure cargo completetly empties
        case this.gsxStates.COMPLETED:
            for (const loadStation of Object.values(this.cargoStations)) {
                this.fillCargoStation(loadStation, 0);
            }
            SimVar.SetSimVarValue('L:A32NX_SOUND_PAX_AMBIENCE', 'Bool', currentPax > 0);
            break;

        case this.gsxStates.PERFORMING:
            SimVar.SetSimVarValue('L:A32NX_SOUND_PAX_AMBIENCE', 'Bool', currentPax > 0);
            const gsxDeBoardingTotal = SimVar.GetSimVarValue('L:FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL', 'Number');
            this.passengersLeftToFillOrEmpty = gsxDeBoardingTotal - this.prevBoardedOrDeboarded;

            for (const paxStation of Object.values(this.paxStations).reverse()) {
                const stationCurrentPax = SimVar.GetSimVarValue(`L:${paxStation.simVar}`, 'Number');
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${paxStation.simVar}_DESIRED`, 'Number');
                if (this.passengersLeftToFillOrEmpty <= 0) {
                    break;
                }

                if (stationCurrentPax > stationCurrentPaxTarget) {
                    this.fillPaxStation(paxStation, stationCurrentPax - Math.min(this.passengersLeftToFillOrEmpty, paxStation.seats));
                    this.passengersLeftToFillOrEmpty -= Math.min(this.passengersLeftToFillOrEmpty, paxStation.seats);
                }
            }
            this.prevBoardedOrDeboarded = gsxDeBoardingTotal;

            const gsxCargoDeBoardPercentage = SimVar.GetSimVarValue('L:FSDT_GSX_DEBOARDING_CARGO_PERCENT', 'Number');
            for (const loadStation of Object.values(this.cargoStations)) {
                if (this.prevCargoDeboardedPercentage == gsxCargoDeBoardPercentage) {
                    break;
                }
                const stationCurrentLoad = SimVar.GetSimVarValue(`L:${loadStation.simVar}`, 'Number');

                const loadAmount = stationCurrentLoad * ((100 - gsxCargoDeBoardPercentage) / 100);
                this.fillCargoStation(loadStation, loadAmount);
            }
            this.prevCargoDeboardedPercentage = gsxCargoDeBoardPercentage;
        default:
            break;
        }
    }

    async manageBoarding(boardingRate) {
        if (boardingRate == 'INSTANT') {
            for (const paxStation of Object.values(this.paxStations)) {
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${paxStation.simVar}_DESIRED`, 'Number');
                await this.fillPaxStation(paxStation, stationCurrentPaxTarget);
            }
            for (const loadStation of Object.values(this.cargoStations)) {
                const stationCurrentLoadTarget = SimVar.GetSimVarValue(`L:${loadStation.simVar}_DESIRED`, 'Number');
                await this.fillCargoStation(loadStation, stationCurrentLoadTarget);
            }
            this.loadPaxPayload();
            this.loadCargoPayload();
            return;
        }

        const msDelay = this.generateMsDelay(boardingRate);

        if (this.time > msDelay) {
            this.time = 0;

            // Stations logic:
            for (const paxStation of Object.values(this.paxStations).reverse()) {
                const stationCurrentPax = SimVar.GetSimVarValue(`L:${paxStation.simVar}`, 'Number');
                const stationCurrentPaxTarget = SimVar.GetSimVarValue(`L:${paxStation.simVar}_DESIRED`, 'Number');

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
                const stationCurrentLoad = SimVar.GetSimVarValue(`L:${loadStation.simVar}`, 'Number');
                const stationCurrentLoadTarget = SimVar.GetSimVarValue(`L:${loadStation.simVar}_DESIRED`, 'Number');

                const loadDelta = Math.abs(stationCurrentLoadTarget - stationCurrentLoad);
                if (stationCurrentLoad < stationCurrentLoadTarget) {
                    this.fillCargoStation(loadStation, stationCurrentLoad + Math.min(60, loadDelta));
                    break;
                } else if (stationCurrentLoad > stationCurrentLoadTarget) {
                    this.fillCargoStation(loadStation, stationCurrentLoad - Math.min(60, loadDelta));
                    break;
                } else {
                    continue;
                }
            }

            this.loadPaxPayload();
            this.loadCargoPayload();
        }
    }

    async manageSoundControllers(currentPax, paxTarget, boardingStartedByUser) {
        if ((currentPax < paxTarget) && boardingStartedByUser == true) {
            await SimVar.SetSimVarValue('L:A32NX_SOUND_PAX_BOARDING', 'Bool', true);
            this.isBoarding = true;
        } else {
            await SimVar.SetSimVarValue('L:A32NX_SOUND_PAX_BOARDING', 'Bool', false);
        }

        await SimVar.SetSimVarValue('L:A32NX_SOUND_PAX_DEBOARDING', 'Bool', currentPax > paxTarget && boardingStartedByUser == true);

        if ((currentPax == paxTarget) && this.isBoarding == true) {
            await SimVar.SetSimVarValue('L:A32NX_SOUND_BOARDING_COMPLETE', 'Bool', true);
            this.isBoarding = false;
            return;
        }
        await SimVar.SetSimVarValue('L:A32NX_SOUND_BOARDING_COMPLETE', 'Bool', false);

        await SimVar.SetSimVarValue('L:A32NX_SOUND_PAX_AMBIENCE', 'Bool', currentPax > 0);
    }

    async manageBoardingState(currentPax, paxTarget) {
        const currentLoad = Object.values(this.cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number')).reduce((acc, cur) => acc + cur);
        const loadTarget = Object.values(this.cargoStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, 'Number')).reduce((acc, cur) => acc + cur);
        const [isAllPaxStationFilled, isAllCargoStationFilled] = this.areStationsFilled();

        if (currentPax === paxTarget && currentLoad === loadTarget && isAllPaxStationFilled && isAllCargoStationFilled) {
            // Finish boarding
            this.boardingState = 'finished';
            await SimVar.SetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'Bool', false);
        } else if ((currentPax < paxTarget) || (currentLoad < loadTarget)) {
            this.boardingState = 'boarding';
        } else if ((currentPax === paxTarget) && (currentLoad === loadTarget)) {
            this.boardingState = 'finished';
        }
    }

    async update(_deltaTime) {
        this.time += _deltaTime;

        const gsxPayloadSyncEnabled = NXDataStore.get('GSX_PAYLOAD_SYNC', 0);
        const currentPax = Object.values(this.paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number')).reduce((acc, cur) => acc + cur);

        if (gsxPayloadSyncEnabled === '1') {
            const gsxBoardState = Math.round(SimVar.GetSimVarValue('L:FSDT_GSX_BOARDING_STATE', 'Number'));
            const gsxDeBoardState = Math.round(SimVar.GetSimVarValue('L:FSDT_GSX_DEBOARDING_STATE', 'Number'));

            this.manageGsxDeBoarding(currentPax, gsxDeBoardState);
            this.manageGsxBoarding(currentPax, gsxBoardState);

            this.loadPaxPayload();
            this.loadCargoPayload();
        } else {
            const boardingStartedByUser = SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'Bool');
            const boardingRate = NXDataStore.get('CONFIG_BOARDING_RATE', 'REAL');

            if (!boardingStartedByUser) {
                return;
            }

            if ((!airplaneCanBoard() && boardingRate == 'REAL') || (!airplaneCanBoard() && boardingRate == 'FAST')) {
                return;
            }

            const paxTarget = Object.values(this.paxStations).map((station) => SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, 'Number')).reduce((acc, cur) => acc + cur);

            await this.manageSoundControllers(currentPax, paxTarget, boardingStartedByUser);

            await this.manageBoardingState(currentPax, paxTarget);

            this.manageBoarding(boardingRate);
        }
    }
}
