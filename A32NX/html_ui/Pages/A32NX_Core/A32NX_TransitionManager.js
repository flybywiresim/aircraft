class A32NX_TransitionManager {
    init() {
        console.log('A32NX_TransitionManager init');
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        if (mode!==AUTO) {
            this.transitionManual();
        }
    }
    update(_deltaTime, _core) {
        this.transitionSelector(deltaTime);
    }
    transitionSelector(deltaTime) {
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        if (mode === "AUTO") {
            const departureAirport = await this.dataManager.GetAirportByIdent(altDestIdent);
            const arrivalAirport = await this.dataManager.GetAirportByIdent(airportIdent);
            const departureICAO = departureAirport.substring(1, 2);
            const arrivalICAO = arrivalAirport.substring(1, 2);

            this.departureLogic(departureICAO);
            this.arrivalLogic(arrivalICAO);
        }
    }
    transitionManual() {
        const storedDepartTransAlt = NXDataStore.get("CONFIG_DEPART_TRANSALT", "10000");
        const storedArrivalTransAlt = NXDataStore.get("CONFIG_ARRIVAL_TRANSALT", "10000");

        SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", storedDepartTransAlt);
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", storedArrivalTransAlt);
    }
    departureLogic(icao) {
    }
    arrivalLogic(icao) {
    }
}
    const airportList = [
    //NorthAmerica
        { icao: "PA", transAlt: 18000 },
        { icao: "C", transAlt: 18000 },
        { icao: "BG", transAlt: 18000 },
        { icao: "BI", transAlt: 18000 },
        { icao: "K", transAlt: 18000 }, //done
        { icao: "MM", transAlt: 18000 },
        { icao: "MY", transAlt: 18000 },
        { icao: "TX", transAlt: 18000 },
        { icao: "MH", transAlt: 18000 },
        { icao: "MS", transAlt: 18000 },
        { icao: "MR", transAlt: 18000 },
        { icao: "MP", transAlt: 18000 },
        { icao: "MZ", transAlt: 18000 },
        { icao: "MG", transAlt: 18000 },
        { icao: "MN", transAlt: 18000 },
        { icao: "MU", transAlt: 18000 },
        { icao: "MK", transAlt: 18000 },
        { icao: "MT", transAlt: 18000 },
        { icao: "MD", transAlt: 18000 },
        { icao: "TJ", transAlt: 18000 },
    //SouthAmerica
        { icao: "SK", transAlt: 18000 },
        { icao: "SV", transAlt: 18000 },
        { icao: "SY", transAlt: 18000 },
        { icao: "SM", transAlt: 18000 },
        { icao: "SO", transAlt: 18000 },
        { icao: "SE", transAlt: 18000 },
        { icao: "SP", transAlt: 18000 },
        { icao: "SL", transAlt: 18000 },
        { icao: "SG", transAlt: 18000 },
        { icao: "SU", transAlt: 18000 },
        { icao: "SC", transAlt: 18000 },
        { icao: "SA", transAlt: 18000 },
        { icao: "SB", transAlt: 18000 },
        { icao: "SD", transAlt: 18000 },
        { icao: "SN", transAlt: 18000 },
        { icao: "SS", transAlt: 18000 },
        { icao: "SW", transAlt: 18000 },
    //Europe
        { icao: "EI", transAlt: 18000 },
        { icao: "EG", transAlt: 18000 },
        { icao: "LP", transAlt: 18000 },
        { icao: "LE", transAlt: 18000 },
        { icao: "LF", transAlt: 18000 },
        { icao: "EB", transAlt: 18000 },
        { icao: "EL", transAlt: 18000 },
        { icao: "LS", transAlt: 18000 },
        { icao: "LI", transAlt: 18000 },
        { icao: "EH", transAlt: 18000 },
        { icao: "EK", transAlt: 18000 },
        { icao: "ED", transAlt: 5000 }, //done
        { icao: "ET", transAlt: 5000 }, //done
        { icao: "EN", transAlt: 18000 },
        { icao: "ES", transAlt: 18000 },
        { icao: "EF", transAlt: 18000 },
        { icao: "EE", transAlt: 18000 },
        { icao: "EV", transAlt: 18000 },
        { icao: "EY", transAlt: 18000 },
        { icao: "EP", transAlt: 18000 },
        { icao: "LO", transAlt: 18000 },
        { icao: "LK", transAlt: 18000 },
        { icao: "LZ", transAlt: 18000 },
        { icao: "LH", transAlt: 18000 },
        { icao: "LJ", transAlt: 18000 },
        { icao: "LB", transAlt: 18000 },
        { icao: "LQ", transAlt: 18000 },
        { icao: "LY", transAlt: 18000 },
        { icao: "LA", transAlt: 18000 },
        { icao: "LW", transAlt: 18000 },
        { icao: "LG", transAlt: 18000 },
        { icao: "LB", transAlt: 18000 },
        { icao: "LR", transAlt: 18000 },
        { icao: "UK", transAlt: 18000 },
        { icao: "UM", transAlt: 18000 },
    ];
}
