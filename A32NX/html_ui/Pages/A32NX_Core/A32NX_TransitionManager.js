class A32NX_TransitionManager {
    init() {
        console.log('A32NX_TransitionManager init');
        this.totalDeltaTime = 0;
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        if (mode !== "AUTO") {
            this.transitionManual();
        }
    }
    update(_deltaTime, _core) {
        const spawn = SimVar.GetSimVarValue("L:A32NX_COLD_AND_DARK_SPAWN", "Bool");
        if (spawn === true) {
            this.transitionSelector();
            this.transitionLevel();
        }
        if (spawn === false) {
            this.transitionSelector_2();
            this.transitionLevel_2();
        }
    }
    async transitionSelector() {
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        if (mode === "AUTO") {
            let departureICAO = await NXDataStore.get("PLAN_ORIGIN", "").substr(0, 2);
            let arrivalICAO = await NXDataStore.get("PLAN_DESTINATION", "").substr(0, 2);
            this.departureLogic(departureICAO);
            this.arrivalLogic(arrivalICAO);
        }
    }
    transitionSelector_2() {
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        if (mode === "AUTO") {
            let departureICAO = NXDataStore.get("PLAN_ORIGIN", "").substr(0, 2);
            let arrivalICAO = NXDataStore.get("PLAN_DESTINATION", "").substr(0, 2);
            this.departureLogic(departureICAO);
            this.arrivalLogic(arrivalICAO);
        }
    }
    transitionManual() {
        const storedDepartTransAlt = parseInt(NXDataStore.get("CONFIG_DEPART_TRANSALT", "10000"));
        const storedArrivalTransAlt = parseInt(NXDataStore.get("CONFIG_ARRIVAL_TRANSALT", "10000"));

        SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", storedDepartTransAlt);
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", storedArrivalTransAlt);
    }
    departureLogic(airport) {
        if (airport.substr(0, 1) === "K") {
            SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", 18000);
        } else if (airport.substr(0, 1) === "C") {
            SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", 18000);
        } else if (airport.substr(0, 1) === "Y") {
            SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", 11000);
        } else {
            let departure = airportList.find(airportList => airportList.icao === airport);
            SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", departure.transAlt);
        }
    }
    arrivalLogic(airport) {
        if (airport.substr(0, 1) === "K") {
            SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", 18000);
        } else if (airport.substr(0, 1) === "C") {
            SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", 18000);
        } else if (airport.substr(0, 1) === "Y") {
            SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", 11000);
        } else {
            let arrival = airportList.find(airportList => airportList.icao === airport);
            SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", arrival.transAlt);
        }
    }
    async transitionLevel() {
        let transAlt = SimVar.GetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number");
        let arrivalICAO = await NXDataStore.get("PLAN_DESTINATION", "");
        let QNH = await getMETAR(arrivalICAO, MSFS);
        let transitionLevel = (((transAlt + 28*(QNH - 1013)) + 2500)/2);
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_LVL", "Number", transitionLevel);
    }
    transitionLevel_2() {
        let transAlt = SimVar.GetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number");
        let arrivalICAO = NXDataStore.get("PLAN_DESTINATION", "");
        let QNH = getMETAR(arrivalICAO, MSFS);
        let transitionLevel = (((transAlt + 28*(QNH - 1013)) + 2500)/2);
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_LVL", "Number", transitionLevel);
    }
}
    const airportList = [
    //NorthAmerica
        { icao: "PA", transAlt: 18000 },
        { icao: "C", transAlt: 18000 },
        { icao: "K", transAlt: 18000 },
        { icao: "BG", transAlt: NaN },
        { icao: "TX", transAlt: NaN },
        { icao: "MY", transAlt: NaN },
        { icao: "MM", transAlt: NaN },
        { icao: "PH", transAlt: NaN },
        { icao: "MH", transAlt: NaN },
        { icao: "MS", transAlt: NaN },
        { icao: "MR", transAlt: NaN },
        { icao: "MP", transAlt: NaN },
        { icao: "MZ", transAlt: NaN },
        { icao: "MG", transAlt: NaN },
        { icao: "MN", transAlt: NaN },
        { icao: "MU", transAlt: NaN },
        { icao: "MK", transAlt: NaN },
        { icao: "MT", transAlt: NaN },
        { icao: "MD", transAlt: NaN },
        { icao: "TJ", transAlt: NaN },
    //SouthAmerica
        { icao: "SK", transAlt: NaN },
        { icao: "SV", transAlt: NaN },
        { icao: "SY", transAlt: NaN },
        { icao: "SM", transAlt: NaN },
        { icao: "SO", transAlt: NaN },
        { icao: "SE", transAlt: NaN },
        { icao: "SP", transAlt: NaN },
        { icao: "SL", transAlt: NaN },
        { icao: "SG", transAlt: NaN },
        { icao: "SC", transAlt: NaN },
        { icao: "SA", transAlt: NaN },
        { icao: "SU", transAlt: NaN },
        { icao: "SF", transAlt: NaN },
        { icao: "SB", transAlt: NaN },
        { icao: "SD", transAlt: NaN },
        { icao: "SN", transAlt: NaN },
        { icao: "SS", transAlt: NaN },
        { icao: "SW", transAlt: NaN },
    //Europe
        { icao: "BI", transAlt: NaN },
        { icao: "EI", transAlt: NaN },
        { icao: "EG", transAlt: NaN },
        { icao: "LP", transAlt: NaN },
        { icao: "LE", transAlt: NaN },
        { icao: "LF", transAlt: NaN },
        { icao: "EB", transAlt: NaN },
        { icao: "EL", transAlt: NaN },
        { icao: "LS", transAlt: NaN },
        { icao: "LI", transAlt: NaN },
        { icao: "LJ", transAlt: NaN },
        { icao: "LD", transAlt: NaN },
        { icao: "LQ", transAlt: NaN },
        { icao: "LY", transAlt: NaN },
        { icao: "LA", transAlt: NaN },
        { icao: "LG", transAlt: NaN },
        { icao: "LM", transAlt: NaN },
        { icao: "LC", transAlt: NaN },
        { icao: "LL", transAlt: NaN },
        { icao: "LW", transAlt: NaN },
        { icao: "LY", transAlt: NaN },
        { icao: "LH", transAlt: NaN },
        { icao: "EH", transAlt: NaN },
        { icao: "EK", transAlt: NaN },
        { icao: "ED", transAlt: 5000 },
        { icao: "ET", transAlt: NaN },
        { icao: "EN", transAlt: NaN },
        { icao: "ES", transAlt: NaN },
        { icao: "EF", transAlt: NaN },
        { icao: "EE", transAlt: NaN },
        { icao: "EV", transAlt: NaN },
        { icao: "EY", transAlt: NaN },
        { icao: "UM", transAlt: NaN },
        { icao: "EP", transAlt: NaN },
        { icao: "LK", transAlt: NaN },
        { icao: "LO", transAlt: NaN },
        { icao: "LZ", transAlt: NaN },
        { icao: "LR", transAlt: NaN },
        { icao: "LB", transAlt: NaN },
        { icao: "UM", transAlt: NaN },
        { icao: "UK", transAlt: NaN },
        { icao: "UL", transAlt: NaN },
        { icao: "UU", transAlt: NaN },
        { icao: "UR", transAlt: NaN },
    //NorthAfrica
        { icao: "GM", transAlt: NaN },
        { icao: "GS", transAlt: NaN },
        { icao: "DA", transAlt: NaN },
        { icao: "DT", transAlt: NaN },
        { icao: "HL", transAlt: NaN },
        { icao: "HE", transAlt: NaN },
        { icao: "HS", transAlt: NaN },
    //WestAfrica
        { icao: "GV", transAlt: NaN },
        { icao: "GB", transAlt: NaN },
        { icao: "GG", transAlt: NaN },
        { icao: "GL", transAlt: NaN },
        { icao: "GF", transAlt: NaN },
        { icao: "GO", transAlt: NaN },
        { icao: "GU", transAlt: NaN },
        { icao: "DI", transAlt: NaN },
        { icao: "DG", transAlt: NaN },
        { icao: "DX", transAlt: NaN },
        { icao: "DF", transAlt: NaN },
        { icao: "DB", transAlt: NaN },
        { icao: "DN", transAlt: NaN },
        { icao: "GQ", transAlt: NaN },
        { icao: "GA", transAlt: NaN },
        { icao: "DR", transAlt: NaN },
    //MiddleAfrica
        { icao: "FH", transAlt: NaN },
        { icao: "FP", transAlt: NaN },
        { icao: "FG", transAlt: NaN },
        { icao: "FK", transAlt: NaN },
        { icao: "FO", transAlt: NaN },
        { icao: "FC", transAlt: NaN },
        { icao: "FT", transAlt: NaN },
        { icao: "FE", transAlt: NaN },
        { icao: "FZ", transAlt: NaN }, 
        { icao: "FN", transAlt: NaN },
    //SouthAfrica
        { icao: "FY", transAlt: NaN },
        { icao: "FB", transAlt: NaN },
        { icao: "FA", transAlt: NaN },
        { icao: "FX", transAlt: NaN },
        { icao: "FD", transAlt: NaN },
        { icao: "FQ", transAlt: NaN },
        { icao: "FV", transAlt: NaN },
        { icao: "FL", transAlt: NaN },
        { icao: "FW", transAlt: NaN },
    //EastAfrica
        { icao: "HH", transAlt: NaN },
        { icao: "HA", transAlt: NaN },
        { icao: "HS", transAlt: NaN },
        { icao: "HR", transAlt: NaN },
        { icao: "HB", transAlt: NaN },
        { icao: "HU", transAlt: NaN },
        { icao: "HT", transAlt: NaN },
        { icao: "HK", transAlt: NaN },
        { icao: "HC", transAlt: NaN }, 
        { icao: "FM", transAlt: NaN },
        { icao: "FI", transAlt: NaN },
        { icao: "FS", transAlt: NaN },
        { icao: "HD", transAlt: NaN },
        { icao: "HF", transAlt: NaN },
    //NorthAsia
        { icao: "UW", transAlt: NaN },
        { icao: "US", transAlt: NaN },
        { icao: "UN", transAlt: NaN },
        { icao: "UO", transAlt: NaN },
        { icao: "UI", transAlt: NaN },
        { icao: "UE", transAlt: NaN },
        { icao: "UH", transAlt: NaN },
    //EastAsia
        { icao: "ZW", transAlt: NaN },
        { icao: "ZM", transAlt: NaN },
        { icao: "ZY", transAlt: NaN },
        { icao: "ZU", transAlt: NaN },
        { icao: "ZL", transAlt: NaN },
        { icao: "ZB", transAlt: NaN },
        { icao: "ZP", transAlt: NaN },
        { icao: "ZH", transAlt: NaN },
        { icao: "ZS", transAlt: NaN },
        { icao: "ZG", transAlt: NaN },
        { icao: "VH", transAlt: NaN },
        { icao: "VM", transAlt: NaN },
        { icao: "RC", transAlt: NaN },
        { icao: "RO", transAlt: NaN },
        { icao: "RJ", transAlt: NaN },
        { icao: "ZK", transAlt: NaN },
        { icao: "RK", transAlt: 14000 },
    //MiddleAsia
        { icao: "UA", transAlt: NaN },
        { icao: "UT", transAlt: NaN },
    //MiddleEast
        { icao: "LT", transAlt: NaN },
        { icao: "UD", transAlt: NaN },
        { icao: "UG", transAlt: NaN },
        { icao: "UB", transAlt: NaN },
        { icao: "OL", transAlt: NaN },
        { icao: "OS", transAlt: NaN },
        { icao: "OJ", transAlt: NaN },
        { icao: "OR", transAlt: NaN },
        { icao: "OE", transAlt: NaN },
        { icao: "OY", transAlt: NaN },
        { icao: "OO", transAlt: NaN },
        { icao: "OI", transAlt: NaN },
        { icao: "OK", transAlt: NaN },
        { icao: "OB", transAlt: NaN },
        { icao: "OT", transAlt: NaN },
        { icao: "OM", transAlt: NaN },
    //SouthAsia
        { icao: "OA", transAlt: NaN },
        { icao: "OP", transAlt: NaN },
        { icao: "VI", transAlt: NaN },
        { icao: "VA", transAlt: NaN },
        { icao: "VE", transAlt: NaN },
        { icao: "VO", transAlt: NaN },
        { icao: "VR", transAlt: NaN },
        { icao: "FJ", transAlt: NaN },
        { icao: "VC", transAlt: NaN },
        { icao: "VN", transAlt: NaN },
        { icao: "VQ", transAlt: NaN },
        { icao: "VG", transAlt: NaN },
    //SouthEastAsia
        { icao: "VY", transAlt: NaN },
        { icao: "VL", transAlt: NaN },
        { icao: "VT", transAlt: NaN },
        { icao: "VD", transAlt: NaN },
        { icao: "VV", transAlt: NaN },
        { icao: "WM", transAlt: NaN },
        { icao: "WI", transAlt: NaN },
        { icao: "WB", transAlt: NaN },
        { icao: "RP", transAlt: NaN },
        { icao: "WR", transAlt: NaN },
        { icao: "WA", transAlt: NaN },
    //Oceania
        { icao: "Y", transAlt: NaN },
        { icao: "AY", transAlt: NaN },
        { icao: "AG", transAlt: NaN },
        { icao: "NZ", transAlt: NaN },
        { icao: "NF", transAlt: NaN },
        { icao: "NT", transAlt: NaN },
        { icao: "PT", transAlt: NaN }
    ];
