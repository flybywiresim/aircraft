/**
 * TO V2 speed table
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 - Config 1 + F, 1 - Config 2, 2 - Config 3.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const to = [
    [
        () => 126,
        () => 126,
        () => 126,
        (m) => 126 + 0.2 * (m - 50),
        (m) => 127 + m - 55,
        (m) => 132 + m - 60,
        (m) => 137 + m - 65,
        (m) => 142 + m - 70,
        (m) => 147 + m - 75,
        () => 151
    ], // Conf 1 + F
    [
        () => 126,
        () => 126,
        () => 126,
        () => 126,
        (m) => 126 + 0.2 * (m - 55),
        (m) => 127 + m - 60,
        (m) => 132 + m - 65,
        (m) => 137 + 0.8 * (m - 70),
        (m) => 141 + m - 75,
        () => 146
    ], // Conf 2
    [
        () => 125,
        () => 125,
        () => 125,
        () => 125,
        () => 125,
        (m) => 125 + 0.6 * (m - 60),
        (m) => 128 + 0.8 * (m - 65),
        (m) => 128 + m - 70,
        (m) => 128 + 0.8 * (m - 75),
        () => 141
    ] // Conf 3
];

/**
 * Stall speed table
 * calls function(gross weight (t), landing gear) which returns CAS.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const vs = [
    [
        () => 124,
        (m) => 124 + 1.4 * (m - 40),
        (m) => 131 + 1.4 * (m - 45),
        (m) => 138 + 1.4 * (m - 50),
        (m) => 145 + m - 55,
        (m) => 150 + 1.2 * (m - 60),
        (m) => 155 + 1.2 * (m - 65),
        (m) => 161 + m - 70,
        (m) => 166 + 1.2 * (m - 75),
        () => 172
    ], // Clean Conf
    [
        () => 93,
        (m) => 93 + m - 40,
        (m) => 98 + m - 45,
        (m) => 103 + m - 50,
        (m) => 108 + .8 * (m - 55),
        (m) => 112 + m - 60,
        (m) => 117 + .8 + (m - 65),
        (m) => 121 + .8 + (m - 70),
        (m) => 125 + m - 75,
        () => 130
    ], // Conf 1 + F
    [
        () => 91,
        (m) => 91 + m - 40,
        (m) => 96 + m - 45,
        (m) => 101 + .8 * (m - 50),
        (m) => 105 + m - 55,
        (m) => 110 + .8 * (m - 60),
        (m) => 114 + m - 65,
        (m) => 119 + .6 * (m - 70),
        (m) => 122 + .8 * (m - 75),
        () => 126
    ], // Conf 2
    [
        (_, ldg) => 91 - ldg * 2,
        (m, ldg) => 91 + m - 40 - ldg * 2,
        (m, ldg) => 96 + m - 45 - ldg * 2,
        (m, ldg) => 101 + .8 * (m - 50) - ldg * 2,
        (m, ldg) => 105 + m - 55 - ldg * 2,
        (m, ldg) => 110 + .8 * (m - 60) - ldg * 2,
        (m, ldg) => 114 + m - 65 - ldg * 2,
        (m, ldg) => 119 + .6 * (m - 70) - ldg * 2,
        (m, ldg) => 122 + .8 * (m - 75) - ldg * 2,
        (_, ldg) => 126 - ldg * 2
    ], // Conf 3
    [
        () => 84,
        (m) => 84 + .8 * (m - 40),
        (m) => 88 + m - 45,
        (m) => 93 + .8 * (m - 50),
        (m) => 97 + .8 * (m - 55),
        (m) => 101 + .8 * (m - 60),
        (m) => 105 + .8 * (m - 65),
        (m) => 109 + .8 * (m - 70),
        (m) => 113 + .6 * (m - 75),
        () => 116
    ], // Conf Full
    [
        () => 102,
        (m) => 102 + m - 40,
        (m) => 107 + m - 45,
        (m) => 112 + m - 50,
        (m) => 117 + 1.2 * (m - 55),
        (m) => 123 + .8 * (m - 60),
        (m) => 127 + m - 65,
        (m) => 132 + m - 70,
        (m) => 137 + .8 * (m - 75),
        () => 141
    ] // Conf 1
];

/**
 * Lowest selectable Speed Table
 * calls function(gross weigh (t), landing gear) which returns CAS, automatically compensates for cg.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const vls = [
    [
        () => 159,
        (m) => 159 + 1.8 * (m - 40),
        (m) => 168 + 1.8 * (m - 45),
        (m) => 177 + 1.8 * (m - 50),
        (m) => 186 + 1.2 * (m - 55),
        (m) => 192 + 1.2 * (m - 60),
        (m) => 198 + 1.6 * (m - 65),
        (m) => 206 + 1.2 * (m - 70),
        (m) => 212 + 1.6 * (m - 75),
        () => 220
    ], // Clean Config
    [
        () => 114,
        (m) => 114 + 1.4 * (m - 40),
        (m) => 121 + 1.2 * (m - 45),
        (m) => 127 + 1.2 * (m - 50),
        (m) => 133 + m - 55,
        (m) => 138 + 1.2 * (m - 60),
        (m) => 144 + m - 65,
        (m) => 149 + m - 70,
        (m) => 154 + 1.2 * (m - 75),
        () => 160
    ], // Config 1 + F
    [
        () => 110,
        (m) => 110 + 1.8 * (m - 40),
        (m) => 119 + 1.2 * (m - 45),
        (m) => 125 + 1.2 * (m - 50),
        (m) => 131 + 1.2 * (m - 55),
        (m) => 137 + m - 60,
        (m) => 142 + .6 * (m - 65),
        (m) => 145 + .8 * (m - 70),
        (m) => 149 + m - 75,
        () => 154
    ], // Config 2
    [
        (_, ldg) => 117 - ldg,
        (m, ldg) => correctCg(m, (m, cg) => cg < 25 ? 117 + .4 * (m - 40) : 117) - ldg,
        (m, ldg) => correctCg(m, (m, cg) => cg < 25 ? 119 + 1.2 * (m - 45) : 117 + 1.4 * (m - 45)) - ldg,
        (m, ldg) => correctCg(m, (m, cg) => cg < 25 ? 125 + 1.2 * (m - 50) : 124 + 1.2 * (m - 50)) - ldg,
        (m, ldg) => correctCg(m, (m, cg) => cg < 25 ? 131 + 1.2 * (m - 55) : 130 + m - 55) - ldg,
        (m, ldg) => correctCg(m, (m, cg) => cg < 25 ? 137 + m - 60 : 135 + 1.2 * (m - 60)) - ldg,
        (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 142 : 141) + m - 65) - ldg,
        (m, ldg) => correctCg(m, (m, cg) => (cg < 25 ? 147 : 146) + m - 70) - ldg,
        (m, ldg) => correctCg(m, (m, cg) => cg < 25 ? 152 + .8 * (m - 75) : 151 + m - 65) - ldg,
        (_, ldg) => 156 - ldg
    ], // Config 3
    [
        () => 116,
        () => 116,
        () => 116,
        (m) => 116 + correctCg(m, (m, cg) => (cg < 25 ? .8 : .6) * (m - 50)),
        (m) => correctCg(m, (m, cg) => (cg < 25 ? 120 : 119) + m - 55),
        (m) => correctCg(m, (m, cg) => (cg < 25 ? 125 : 124) + m - 60),
        (m) => correctCg(m, (m, cg) => (cg < 25 ? 130 : 129) + m - 65),
        (m) => correctCg(m, (m, cg) => cg < 25 ? 135 + .8 * (m - 70) : 134 + m - 70),
        (m) => 139 + .8 * (m - 75),
        () => 143
    ], // Config Full
    [
        () => 125,
        (m) => 125 + 1.4 * (m - 40),
        (m) => 132 + 1.2 * (m - 45),
        (m) => 138 + 1.2 * (m - 50),
        (m) => 144 + 1.4 * (m - 55),
        (m) => 151 + m - 60,
        (m) => 156 + 1.2 * (m - 65),
        (m) => 162 + 1.4 * (m - 70),
        (m) => 169 + .8 * (m - 75),
        () => 173
    ] // Config 1
];

/**
 * Lowest selectable Speed Table for TakeOff ONLY
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const vlsTo = [
    vls[0], // Clean Config
    [
        () => 105,
        (m) => 105 + 1.2 * (m - 40),
        (m) => 111 + m - 45,
        (m) => 116 + 1.2 * (m - 50),
        (m) => 122 + m - 55,
        (m) => 127 + m - 60,
        (m) => 132 + m - 65,
        (m) => 137 + .8 * (m - 70),
        (m) => 141 + 1.2 * (m - 75),
        () => 147
    ], // Config 1 + F
    [
        (_) => 101,
        (m) => 101 + 1.4 * (m - 40),
        (m) => 108 + 1.2 * (m - 45),
        (m) => 114 + m - 50,
        (m) => 119 + 1.2 * (m - 55),
        (m) => 125 + m - 60,
        (m) => 130 + .4 * (m - 65),
        (m) => 132 + .8 * (m - 70),
        (m) => 136 + .8 * (m - 75),
        () => 140
    ], // Config 2
    [
        () => 101,
        (m) => 101 + 1.4 * (m - 40),
        (m) => 108 + 1.2 * (m - 45),
        (m) => 114 + m - 50,
        (m) => 119 + 1.2 * (m - 55),
        (m) => 125 + m - 60,
        (m) => 130 + .8 * (m - 65),
        (m) => 134 + m - 70,
        (m) => 139 + .6 * (m - 75),
        () => 142
    ], // Config 3
    vls[4], // Config Full
    vls[5] // Config 1
];

/**
 * F-Speed Table
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const fs = [
    () => 131,
    () => 131,
    () => 131,
    (m) => 131 + 1.2 * (m - 50),
    (m) => 137 + 1.4 * (m - 55),
    (m) => 144 + m - 60,
    (m) => 149 + 1.2 * (m - 65),
    (m) => 155 + m - 70,
    (m) => 160 + 1.20 * (m - 75),
    () => 166
];

/**
 * S-Speed Table
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const ss = [
    () => 152,
    (m) => 152 + 1.8 * (m - 40),
    (m) => 161 + 1.6 * (m - 45),
    (m) => 169 + 1.8 * (m - 50),
    (m) => 178 + 1.6 * (m - 55),
    (m) => 186 + 1.4 * (m - 60),
    (m) => 193 + 1.4 * (m - 65),
    (m) => 200 + 1.4 * (m - 70),
    (m) => 207 + 1.4 * (m - 75),
    () => 214
];

/**
 * Correct input function for cg
 * @param m {number} gross weight (t)
 * @param f {function} function to be called with cg variable
 * @param cg {number} center of gravity
 * @returns {number} cg corrected velocity (CAS)
 */
function correctCg(m, f, cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) {
    return f(m, isNaN(cg) ? 24 : cg);
}

/**
 * Calculates and shares Vs, Vls, F, S and GD.
 * L SimVars:
 * A32NX_VS,
 * A32NX_VLS,
 * A32NX_FS,
 * A32NX_SS,
 * A32NX_GD,
 * A32NX_LANDING_CONF3
 */
class A32NX_Vspeeds {
    constructor() {
        console.log('A32NX_VSPEEDS constructed');
    }

    init() {
        console.log('A32NX_VSPEEDS init');
        SimVar.SetSimVarValue("L:A32NX_VS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_VLS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_FS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_GD", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_LANDING_CONF3", "boolean", 0);
        SimVar.SetSimVarValue("L:A32NX_TO_CONF", "number", 1);
        SimVar.SetSimVarValue("L:A32NX_V2", "number", 0);
        this.lastGw = 50;
        this.lastFhi = -1;
        this.curFhi = -1;
        this.ldgPos = -1;
        this.alt = -1;
        this.cgw = 0;
        this.toConf = 1;

        /**
         * Fetches aircraft parameter and checks against cached values.
         * On disagree cache gets updated and Vspeeds recalculated, then shared.
         */
        setInterval(() => {
            const fp = Simplane.getCurrentFlightPhase();
            const fhi = Simplane.getFlapsHandleIndex();
            const gw = this.round(SimVar.GetSimVarValue("TOTAL WEIGHT", "kg")) / 1000;
            const ldg = Math.round(SimVar.GetSimVarValue("GEAR POSITION:0", "Enum"));
            const alt = this.round(Simplane.getAltitude());
            const conf = SimVar.GetSimVarValue("L:A32NX_TO_CONF", "number");

            if (fhi === this.lastFhi && gw === this.lastGw && ldg === this.ldgPos && alt === this.alt && conf === this.toConf) {
                return;
            }

            this.curFhi = this.lastFhi === 0 && fp > FlightPhase.FLIGHT_PHASE_TAKEOFF ? 5 : fhi;
            this.lastFhi = fhi;
            this.lastGw = gw;
            this.cgw = Math.ceil(((gw > 80 ? 80 : gw) - 40) / 5);
            this.ldgPos = ldg;
            this.alt = alt;
            this.toConf = conf;

            SimVar.SetSimVarValue("L:A32NX_VS", "number", this.compensateForMachEffect(vs[this.curFhi][this.cgw](this.lastGw, this.ldgPos)));
            SimVar.SetSimVarValue("L:A32NX_VLS", "number", this.compensateForMachEffect(
                (fp < FlightPhase.FLIGHT_PHASE_CLIMB ? vlsTo : vls)[this.curFhi][this.cgw](this.lastGw, this.ldgPos)
            ));
            SimVar.SetSimVarValue("L:A32NX_V2", "number",
                Math.floor(to[this.toConf - 1][this.cgw](this.lastGw) + (this.toConf === 2 ? (Math.abs(this.alt * 0.0002)) : 0))
            );
            SimVar.SetSimVarValue("L:A32NX_FS", "number", fs[this.cgw](this.lastGw));
            SimVar.SetSimVarValue("L:A32NX_SS", "number", ss[this.cgw](this.lastGw));
            SimVar.SetSimVarValue("L:A32NX_GD", "number", this.curFhi === 0 ? this.compensateForMachEffect(this.calculateGreenDotSpeed()) : 0);
        }, 500);
    }

    update() {
    }

    /**
     * Calculate green dot speed
     * Calculation:
     * Gross weight (t) * 2 + 85 when below FL200
     * @returns {number}
     */
    calculateGreenDotSpeed() {
        return this.lastGw * 2 + 85;
    }

    /**
     * Corrects velocity for mach effect by adding 1kt for every 1000ft above FL200
     * @param v {number} velocity in kt (CAS)
     * @returns {number} Mach corrected velocity in kt (CAS)
     */
    compensateForMachEffect(v) {
        return this.alt > 20000 ? v + (this.alt - 20000) / 1000 : v;
    }

    /** Corrects velocity by min 5 kt and max 15 kt for wind correction
     * @param v {number} CAS kt
     * @param vw {number} wind speed kt
     * @returns {number} CAS kt
     */
    compensateForWind(v, vw = SimVar.GetSimVarValue("AIRCRAFT WIND Z", "knots")) {
        return Math.ceil(Math.max(v + (vw > 15 ? 15 : vw), 5));
    }

    /**
     * Math.round(x / r) * r
     * @param x {number} number to be rounded
     * @param r {number} precision
     * @returns {number} rounded number
     */
    round(x, r = 100) {
        return Math.round(x / r) * r;
    }
}
