class A32NX_Transition {
    init() {
        console.log('A32NX_TransitionAltitude init');
        this.currentDeparture = "";
        this.currentArrival = "";
        this.offline = false;
        this.serverStatus();
    }

    update(_deltaTime, _core) {
    }

    serverStatus() {
        if (!NXApi.hasTelexConnection()) {
            this.offline = true;
        }
    }

    updateOfflineTransitionAltitude(airport, phase) {
        let phaseTransAlt = "";
        if (phase === "origin") {
            phaseTransAlt = "L:AIRLINER_TRANS_ALT";
        }
        if (phase === "destination") {
            phaseTransAlt = "L:AIRLINER_APPR_TRANS_ALT";
        }
        const airportFirstLetter = airport.substr(0,1);
        if (airportFirstLetter === "K" || airportFirstLetter === "C") {
            SimVar.SetSimVarValue(phaseTransAlt, "Number", 18000); // Canada & USA fixed to 18,000ft
        } else if (airportFirstLetter === "Y") {
            SimVar.SetSimVarValue(phaseTransAlt, "Number", 10000); // Australia area only have 10,000ft & 11,000ft. But 10,000ft is more so using that.
        } else {
            let airportInfo = "";
            const airportICAO = airport.substr(0,2);
            airportInfo = airportData[airportICAO];
            if (airportInfo === "") {
                SimVar.SetSimVarValue(phaseTransAlt, "Number", 18000); // if can't find on list, default value to 18,000ft
            } else {
                SimVar.SetSimVarValue(phaseTransAlt, "Number", airportInfo);
            }
        }
    }

    transitionLevel(pressureValue, mode) {
        const transitionAltitude = SimVar.GetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number");

        /* formula
        Transition altitude at standard pressure = Transition altitude at local QNH + 28 * (Standard pressure – Local QNH)
        Transition altitude at standard pressure = Transition altitude + 28 * (1013 – Local QNH)
        */

        let equivalentLevel = 0;
        if (mode === "inhg") {
            equivalentLevel = transitionAltitude + (28 * (1013 - parseInt(pressureValue * 33.86)));
        } else if (mode === "hpa") {
            equivalentLevel = transitionAltitude + (28 * (1013 - pressureValue));
        }
        const transitionLevel = ((equivalentLevel + 20) / 10) * 1000
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_LEVEL", "Number", transitionLevel);
    }
}

// This list is built manually, and might contain errors
const airportData = {
    "AG": 11000,
    "AK": 18000,
    "AL": 18000,
    "AN": 11000,
    "AY": 20000,
    "AZ": 18000,
    "BG": 11000,
    "BI": 7000,
    "BK": 10000,
    "CY": 18000,
    "DA": 9450,
    "DB": 2000,
    "DF": 4300,
    "DG": 4000,
    "DI": 7000,
    "DN": 8500,
    "DR": 4200,
    "DT": 6000,
    "DX": 4200,
    "EB": 4500,
    "ED": 5000,
    "EE": 5000,
    "EF": 5000,
    "EG": 6000,
    "EH": 3000,
    "EI": 5000,
    "EK": 7500,
    "EL": 4500,
    "EN": 7000,
    "EP": 6500,
    "ES": 9000,
    "ET": 5000,
    "EV": 5000,
    "EY": 5000,
    "FA": 9500,
    "FB": 7000,
    "FC": 6000,
    "FD": 8000,
    "FE": 4200,
    "FG": 6000,
    "FH": 6000,
    "FI": 4000,
    "FJ": 17000,
    "FK": 6300,
    "FL": 7000,
    "FM": 12000,
    "FN": 10000,
    "FO": 4500,
    "FP": 4500,
    "FQ": 7500,
    "FS": 4500,
    "FT": 4400,
    "FV": 8000,
    "FW": 7000,
    "FX": 12000,
    "FY": 10000,
    "FZ": 14000,
    "GA": 4000,
    "GB": 2500,
    "GC": 6000,
    "GE": 6000,
    "GF": 5000,
    "GG": 3000,
    "GL": 3000,
    "GM": 10000,
    "GO": 3500,
    "GQ": 3100,
    "GU": 6000,
    "GV": 7000,
    "HA": 14000,
    "HB": 9500,
    "HD": 5000,
    "HR": 9000,
    "HU": 7000,
    "LA": 10000,
    "LD": 9500,
    "LH": 10000,
    "LJ": 10500,
    "LK": 5000,
    "LL": 18000,
    "LM": 5000,
    "LO": 10000,
    "LQ": 9500,
    "LU": 4000,
    "LW": 11000,
    "LX": 6000,
    "LY": 10000,
    "LZ": 10000,
    "MB": 6000,
    "MD": 17000,
    "MG": 19000,
    "MK": 17000,
    "MM": 18500,
    "MN": 19500,
    "MO": 18000,
    "MP": 18000,
    "MR": 19000,
    "MT": 17000,
    "MW": 17000,
    "MY": 18000,
    "MZ": 19500,
    "NC": 13000,
    "NG": 11000,
    "NI": 11000,
    "NS": 13000,
    "NV": 11000,
    "NW": 11000,
    "NZ": 13000,
    "OA": 14000,
    "OB": 13000,
    "OE": 13000,
    "OJ": 13000,
    "OK": 13000,
    "OL": 13000,
    "OM": 13000,
    "OO": 13000,
    "OS": 13000,
    "OT": 13000,
    "OY": 13000,
    "PA": 18000,
    "PA": 18000,
    "PA": 18000,
    "PC": 5500,
    "PF": 18000,
    "PG": 18000,
    "PH": 18000,
    "PL": 11000,
    "PM": 5500,
    "PP": 18000,
    "PT": 5500,
    "PW": 5500,
    "RC": 11000,
    "RJ": 14000,
    "RK": 14000,
    "RO": 14000,
    "RP": 11000,
    "SG": 4000,
    "SI": 5000,
    "SJ": 6000,
    "SK": 18000,
    "SK": 18000,
    "SM": 3000,
    "SO": 3000,
    "SQ": 18000,
    "SU": 3000,
    "SY": 3000,
    "TA": 18000,
    "TB": 3000,
    "TD": 9000,
    "TE": 18000,
    "TF": 9000,
    "TG": 4000,
    "TI": 18000,
    "TJ": 18000,
    "TK": 5000,
    "TL": 9000,
    "TN": 18000,
    "TQ": 5000,
    "TT": 4100,
    "TU": 3200,
    "TX": 18000,
    "UD": 11500,
    "UK": 10010,
    "VC": 11000,
    "VD": 10000,
    "VG": 4000,
    "VH": 9000,
    "VL": 11000,
    "VN": 13500,
    "VR": 11000,
    "VT": 11000,
    "WB": 11000,
    "WI": 11000,
    "WM": 11000,
    "WP": 11000,
    "WS": 11000,
    "YB": 11000,
    "YM": 10000,
    "ZB": 9850,
    "ZH": 9850,
    "ZJ": 9850,
    "HC": 7000,
    "HE": 10500,
    "HH": 11500,
    "HK": 10000,
    "HL": 6000,
    "HS": 7000,
    "HT": 9000,
    "LB": 12000,
    "LC": 9000,
    "LE": 13000,
    "LF": 600000,
    "LG": 11000,
    "LI": 15000,
    "LP": 8000,
    "LR": 9000,
    "LS": 17000,
    "LT": 19000,
    "MH": 19500,
    "MS": 19500,
    "MU": 18000,
    "NF": 13000,
    "NL": 5000,
    "NT": 9000,
    "OI": 14000,
    "OP": 15000,
    "OR": 15000,
    "PK": 18000,
    "SA": 9000,
    "SB": 18000,
    "UA": 5240,
    "UB": 12000,
    "UC": 13000,
    "SC": 11500,
    "SD": 6000,
    "SE": 18000,
    "SL": 18000,
    "SN": 6000,
    "SP": 18000,
    "SS": 5000,
    "SV": 18000,
    "SW": 6000,
    "TV": 5200,
    "UE": 6750,
    "UG": 7600,
    "UH": 8010,
    "UI": 8180,
    "UL": 6110,
    "UM": 6000,
    "UN": 9690,
    "UO": 4540,
    "UR": 9860,
    "US": 5700,
    "UT": 12000,
    "UU": 5530,
    "UW": 3430,
    "VA": 7000,
    "VE": 13000,
    "VI": 23000,
    "VM": 9000,
    "VO": 11000,
    "VQ": 18000,
    "VV": 10010,
    "VY": 17000,
    "WA": 18000,
    "ZU": 24610,
    "ZW": 13780,
    "ZY": 10730,
    "ZS": 9850,
    "ZP": 19690,
    "ZM": 11490,
    "ZG": 10270,
    "ZK": 12000
};
