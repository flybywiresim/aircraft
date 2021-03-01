class A32NX_TransitionAltitude {
    init() {
        console.log('A32NX_TransitionAltitude init');
        this.currentDeparture = "";
        this.currentArrival = "";
        this.offline = false;
        this.tryCheckAPI();
    }

    update(_deltaTime, _core) {
        if (this.offline) {
            this.offlineTransAlt();
        }
    }

    tryCheckAPI() {
        if (!NXApi.hasTelexConnection()) {
            this.offline = true;
        }
    }

    offlineTransAlt() {
        const Origin = NXDataStore.get("PLAN_ORIGIN", "");
        const Destination = NXDataStore.get("PLAN_DESTINATION", "");
        if (Origin !== "" && Destination !== "") {
            if (this.currentDeparture !== Origin) {
                this.transitionAltitude(Origin, "takeoff");
                this.currentDeparture = Origin;
            }
            if (this.currentArrival !== Destination) {
                this.transitionAltitude(Destination, "arrival");
                this.currentArrival = Destination;
            }
        }
    }

    transitionAltitude(airport, phase) {
        let phaseTransAlt = "";
        if (phase === "takeoff") {
            phaseTransAlt = "L:AIRLINER_TRANS_ALT";
        }
        if (phase === "arrival") {
            phaseTransAlt = "L:AIRLINER_APPR_TRANS_ALT";
        }
        const airportFirstLetter = airport.substr(0,1);
        if (airportFirstLetter === "K" || airportFirstLetter === "C") {
            SimVar.SetSimVarValue(phaseTransAlt, "Number", 18000); // Canada & USA fixed to 18,000ft
        } else if (airportFirstLetter === "Y") {
            SimVar.SetSimVarValue(phaseTransAlt, "Number", 10000); // Belgium region only have 10,000ft & 11,000ft. But 10,000ft is more so using that
        } else {
            const airportICAO = airport.substr(0,2);
            const airportInfo = airportData.find(airportData => airportData.icao === airportICAO);
            if (airportInfo.icao !== airportICAO) {
                SimVar.SetSimVarValue(phaseTransAlt, "Number", 18000); // if can't find on list, default value to 18,000ft
            } else {
                SimVar.SetSimVarValue(phaseTransAlt, "Number", airportInfo.transAlt);
            }
        }
    }
}

// This list is built manually, and might contain errors
const airportData = [
    { icao: "AG", transAlt: 11000 },
    { icao: "AK", transAlt: 18000 },
    { icao: "AL", transAlt: 18000 },
    { icao: "AN", transAlt: 11000 },
    { icao: "AY", transAlt: 20000 },
    { icao: "AZ", transAlt: 18000 },
    { icao: "BG", transAlt: 11000 },
    { icao: "BI", transAlt: 7000 },
    { icao: "BK", transAlt: 10000 },
    { icao: "CY", transAlt: 18000 },
    { icao: "DA", transAlt: 9450 },
    { icao: "DB", transAlt: 2000 },
    { icao: "DF", transAlt: 4300 },
    { icao: "DG", transAlt: 4000 },
    { icao: "DI", transAlt: 7000 },
    { icao: "DN", transAlt: 8500 },
    { icao: "DR", transAlt: 4200 },
    { icao: "DT", transAlt: 6000 },
    { icao: "DX", transAlt: 4200 },
    { icao: "EB", transAlt: 4500 },
    { icao: "ED", transAlt: 5000 },
    { icao: "EE", transAlt: 5000 },
    { icao: "EF", transAlt: 5000 },
    { icao: "EG", transAlt: 6000 },
    { icao: "EH", transAlt: 3000 },
    { icao: "EI", transAlt: 5000 },
    { icao: "EK", transAlt: 7500 },
    { icao: "EL", transAlt: 4500 },
    { icao: "EN", transAlt: 7000 },
    { icao: "EP", transAlt: 6500 },
    { icao: "ES", transAlt: 9000 },
    { icao: "ET", transAlt: 5000 },
    { icao: "EV", transAlt: 5000 },
    { icao: "EY", transAlt: 5000 },
    { icao: "FA", transAlt: 9500 },
    { icao: "FB", transAlt: 7000 },
    { icao: "FC", transAlt: 6000 },
    { icao: "FD", transAlt: 8000 },
    { icao: "FE", transAlt: 4200 },
    { icao: "FG", transAlt: 6000 },
    { icao: "FH", transAlt: 6000 },
    { icao: "FI", transAlt: 4000 },
    { icao: "FJ", transAlt: 17000 },
    { icao: "FK", transAlt: 6300 },
    { icao: "FL", transAlt: 7000 },
    { icao: "FM", transAlt: 12000 },
    { icao: "FN", transAlt: 10000 },
    { icao: "FO", transAlt: 4500 },
    { icao: "FP", transAlt: 4500 },
    { icao: "FQ", transAlt: 7500 },
    { icao: "FS", transAlt: 4500 },
    { icao: "FT", transAlt: 4400 },
    { icao: "FV", transAlt: 8000 },
    { icao: "FW", transAlt: 7000 },
    { icao: "FX", transAlt: 12000 },
    { icao: "FY", transAlt: 10000 },
    { icao: "FZ", transAlt: 14000 },
    { icao: "GA", transAlt: 4000 },
    { icao: "GB", transAlt: 2500 },
    { icao: "GC", transAlt: 6000 },
    { icao: "GE", transAlt: 6000 },
    { icao: "GF", transAlt: 5000 },
    { icao: "GG", transAlt: 3000 },
    { icao: "GL", transAlt: 3000 },
    { icao: "GM", transAlt: 10000 },
    { icao: "GO", transAlt: 3500 },
    { icao: "GQ", transAlt: 3100 },
    { icao: "GU", transAlt: 6000 },
    { icao: "GV", transAlt: 7000 },
    { icao: "HA", transAlt: 14000 },
    { icao: "HB", transAlt: 9500 },
    { icao: "HD", transAlt: 5000 },
    { icao: "HR", transAlt: 9000 },
    { icao: "HU", transAlt: 7000 },
    { icao: "LA", transAlt: 10000 },
    { icao: "LD", transAlt: 9500 },
    { icao: "LH", transAlt: 10000 },
    { icao: "LJ", transAlt: 10500 },
    { icao: "LK", transAlt: 5000 },
    { icao: "LL", transAlt: 18000 },
    { icao: "LM", transAlt: 5000 },
    { icao: "LO", transAlt: 10000 },
    { icao: "LQ", transAlt: 9500 },
    { icao: "LU", transAlt: 4000 },
    { icao: "LW", transAlt: 11000 },
    { icao: "LX", transAlt: 6000 },
    { icao: "LY", transAlt: 10000 },
    { icao: "LZ", transAlt: 10000 },
    { icao: "MB", transAlt: 6000 },
    { icao: "MD", transAlt: 17000 },
    { icao: "MG", transAlt: 19000 },
    { icao: "MK", transAlt: 17000 },
    { icao: "MM", transAlt: 18500 },
    { icao: "MN", transAlt: 19500 },
    { icao: "MO", transAlt: 18000 },
    { icao: "MP", transAlt: 18000 },
    { icao: "MR", transAlt: 19000 },
    { icao: "MT", transAlt: 17000 },
    { icao: "MW", transAlt: 17000 },
    { icao: "MY", transAlt: 18000 },
    { icao: "MZ", transAlt: 19500 },
    { icao: "NC", transAlt: 13000 },
    { icao: "NG", transAlt: 11000 },
    { icao: "NI", transAlt: 11000 },
    { icao: "NS", transAlt: 13000 },
    { icao: "NV", transAlt: 11000 },
    { icao: "NW", transAlt: 11000 },
    { icao: "NZ", transAlt: 13000 },
    { icao: "OA", transAlt: 14000 },
    { icao: "OB", transAlt: 13000 },
    { icao: "OE", transAlt: 13000 },
    { icao: "OJ", transAlt: 13000 },
    { icao: "OK", transAlt: 13000 },
    { icao: "OL", transAlt: 13000 },
    { icao: "OM", transAlt: 13000 },
    { icao: "OO", transAlt: 13000 },
    { icao: "OS", transAlt: 13000 },
    { icao: "OT", transAlt: 13000 },
    { icao: "OY", transAlt: 13000 },
    { icao: "PA", transAlt: 18000 },
    { icao: "PA", transAlt: 18000 },
    { icao: "PA", transAlt: 18000 },
    { icao: "PC", transAlt: 5500 },
    { icao: "PF", transAlt: 18000 },
    { icao: "PG", transAlt: 18000 },
    { icao: "PH", transAlt: 18000 },
    { icao: "PL", transAlt: 11000 },
    { icao: "PM", transAlt: 5500 },
    { icao: "PP", transAlt: 18000 },
    { icao: "PT", transAlt: 5500 },
    { icao: "PW", transAlt: 5500 },
    { icao: "RC", transAlt: 11000 },
    { icao: "RJ", transAlt: 14000 },
    { icao: "RK", transAlt: 14000 },
    { icao: "RO", transAlt: 14000 },
    { icao: "RP", transAlt: 11000 },
    { icao: "SG", transAlt: 4000 },
    { icao: "SI", transAlt: 5000 },
    { icao: "SJ", transAlt: 6000 },
    { icao: "SK", transAlt: 18000 },
    { icao: "SK", transAlt: 18000 },
    { icao: "SM", transAlt: 3000 },
    { icao: "SO", transAlt: 3000 },
    { icao: "SQ", transAlt: 18000 },
    { icao: "SU", transAlt: 3000 },
    { icao: "SY", transAlt: 3000 },
    { icao: "TA", transAlt: 18000 },
    { icao: "TB", transAlt: 3000 },
    { icao: "TD", transAlt: 9000 },
    { icao: "TE", transAlt: 18000 },
    { icao: "TF", transAlt: 9000 },
    { icao: "TG", transAlt: 4000 },
    { icao: "TI", transAlt: 18000 },
    { icao: "TJ", transAlt: 18000 },
    { icao: "TK", transAlt: 5000 },
    { icao: "TL", transAlt: 9000 },
    { icao: "TN", transAlt: 18000 },
    { icao: "TQ", transAlt: 5000 },
    { icao: "TT", transAlt: 4100 },
    { icao: "TU", transAlt: 3200 },
    { icao: "TX", transAlt: 18000 },
    { icao: "UD", transAlt: 11500 },
    { icao: "UK", transAlt: 10010 },
    { icao: "VC", transAlt: 11000 },
    { icao: "VD", transAlt: 10000 },
    { icao: "VG", transAlt: 4000 },
    { icao: "VH", transAlt: 9000 },
    { icao: "VL", transAlt: 11000 },
    { icao: "VN", transAlt: 13500 },
    { icao: "VR", transAlt: 11000 },
    { icao: "VT", transAlt: 11000 },
    { icao: "WB", transAlt: 11000 },
    { icao: "WI", transAlt: 11000 },
    { icao: "WM", transAlt: 11000 },
    { icao: "WP", transAlt: 11000 },
    { icao: "WS", transAlt: 11000 },
    { icao: "YB", transAlt: 11000 },
    { icao: "YM", transAlt: 10000 },
    { icao: "ZB", transAlt: 9850 },
    { icao: "ZH", transAlt: 9850 },
    { icao: "ZJ", transAlt: 9850 },
    { icao: "HC", transAlt: 7000 },
    { icao: "HE", transAlt: 10500 },
    { icao: "HH", transAlt: 11500 },
    { icao: "HK", transAlt: 10000 },
    { icao: "HL", transAlt: 6000 },
    { icao: "HS", transAlt: 7000 },
    { icao: "HT", transAlt: 9000 },
    { icao: "LB", transAlt: 12000 },
    { icao: "LC", transAlt: 9000 },
    { icao: "LE", transAlt: 13000 },
    { icao: "LF", transAlt: 600000 },
    { icao: "LG", transAlt: 11000 },
    { icao: "LI", transAlt: 15000 },
    { icao: "LP", transAlt: 8000 },
    { icao: "LR", transAlt: 9000 },
    { icao: "LS", transAlt: 17000 },
    { icao: "LT", transAlt: 19000 },
    { icao: "MH", transAlt: 19500 },
    { icao: "MS", transAlt: 19500 },
    { icao: "MU", transAlt: 18000 },
    { icao: "NF", transAlt: 13000 },
    { icao: "NL", transAlt: 5000 },
    { icao: "NT", transAlt: 9000 },
    { icao: "OI", transAlt: 14000 },
    { icao: "OP", transAlt: 15000 },
    { icao: "OR", transAlt: 15000 },
    { icao: "PK", transAlt: 18000 },
    { icao: "SA", transAlt: 9000 },
    { icao: "SB", transAlt: 18000 },
    { icao: "UA", transAlt: 5240 },
    { icao: "UB", transAlt: 12000 },
    { icao: "UC", transAlt: 13000 },
    { icao: "SC", transAlt: 11500 },
    { icao: "SD", transAlt: 6000 },
    { icao: "SE", transAlt: 18000 },
    { icao: "SL", transAlt: 18000 },
    { icao: "SN", transAlt: 6000 },
    { icao: "SP", transAlt: 18000 },
    { icao: "SS", transAlt: 5000 },
    { icao: "SV", transAlt: 18000 },
    { icao: "SW", transAlt: 6000 },
    { icao: "TV", transAlt: 5200 },
    { icao: "UE", transAlt: 6750 },
    { icao: "UG", transAlt: 7600 },
    { icao: "UH", transAlt: 8010 },
    { icao: "UI", transAlt: 8180 },
    { icao: "UL", transAlt: 6110 },
    { icao: "UM", transAlt: 6000 },
    { icao: "UN", transAlt: 9690 },
    { icao: "UO", transAlt: 4540 },
    { icao: "UR", transAlt: 9860 },
    { icao: "US", transAlt: 5700 },
    { icao: "UT", transAlt: 12000 },
    { icao: "UU", transAlt: 5530 },
    { icao: "UW", transAlt: 3430 },
    { icao: "VA", transAlt: 7000 },
    { icao: "VE", transAlt: 13000 },
    { icao: "VI", transAlt: 23000 },
    { icao: "VM", transAlt: 9000 },
    { icao: "VO", transAlt: 11000 },
    { icao: "VQ", transAlt: 18000 },
    { icao: "VV", transAlt: 10010 },
    { icao: "VY", transAlt: 17000 },
    { icao: "WA", transAlt: 18000 },
    { icao: "ZU", transAlt: 24610 },
    { icao: "ZW", transAlt: 13780 },
    { icao: "ZY", transAlt: 10730 },
    { icao: "ZS", transAlt: 9850 },
    { icao: "ZP", transAlt: 19690 },
    { icao: "ZM", transAlt: 11490 },
    { icao: "ZG", transAlt: 10270 },
    { icao: "ZK", transAlt: 12000 }
];
