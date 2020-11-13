const vs = [
    [
        () => 124,
        (gw) => 124 + 1.4 * (gw - 40),
        (gw) => 131 + 1.4 * (gw - 45),
        (gw) => 138 + 1.4 * (gw - 50),
        (gw) => 145 + gw - 55,
        (gw) => 150 + 1.2 * (gw - 60),
        (gw) => 155 + 1.2 * (gw - 65),
        (gw) => 161 + gw - 70,
        (gw) => 166 + 1.2 * (gw - 75),
        () => 172
    ], // Clean Conf
    [
        () => 93,
        (gw) => 93 + gw - 40,
        (gw) => 98 + gw - 45,
        (gw) => 103 + gw - 50,
        (gw) => 108 + .8 * (gw - 55),
        (gw) => 112 + gw - 60,
        (gw) => 117 + .8 + (gw - 65),
        (gw) => 121 + .8 + (gw - 70),
        (gw) => 125 + gw - 75,
        () => 130
    ], // Conf 1 + F
    [
        () => 91,
        (gw) => 91 + gw - 40,
        (gw) => 96 + gw - 45,
        (gw) => 101 + .8 * (gw - 50),
        (gw) => 105 + gw - 55,
        (gw) => 110 + .8 * (gw - 60),
        (gw) => 114 + gw - 65,
        (gw) => 119 + .6 * (gw - 70),
        (gw) => 122 + .8 * (gw - 75),
        () => 126
    ], // Conf 2
    [
        (_, ldg) => 91 - ldg * 2,
        (gw, ldg) => 91 + gw - 40 - ldg * 2,
        (gw, ldg) => 96 + gw - 45 - ldg * 2,
        (gw, ldg) => 101 + .8 * (gw - 50) - ldg * 2,
        (gw, ldg) => 105 + gw - 55 - ldg * 2,
        (gw, ldg) => 110 + .8 * (gw - 60) - ldg * 2,
        (gw, ldg) => 114 + gw - 65 - ldg * 2,
        (gw, ldg) => 119 + .6 * (gw - 70) - ldg * 2,
        (gw, ldg) => 122 + .8 * (gw - 75) - ldg * 2,
        (_, ldg) => 126 - ldg * 2
    ], // Conf 3
    [
        () => 84,
        (gw) => 84 + .8 * (gw - 40),
        (gw) => 88 + gw - 45,
        (gw) => 93 + .8 * (gw - 50),
        (gw) => 97 + .8 * (gw - 55),
        (gw) => 101 + .8 * (gw - 60),
        (gw) => 105 + .8 * (gw - 65),
        (gw) => 109 + .8 * (gw - 70),
        (gw) => 113 + .6 * (gw - 75),
        () => 116
    ], // Conf Full
    [
        () => 102,
        (gw) => 102 + gw - 40,
        (gw) => 107 + gw - 45,
        (gw) => 112 + gw - 50,
        (gw) => 117 + 1.2 * (gw - 55),
        (gw) => 123 + .8 * (gw - 60),
        (gw) => 127 + gw - 65,
        (gw) => 132 + gw - 70,
        (gw) => 137 + .8 * (gw - 75),
        () => 141
    ] // Conf 1
];

const vls = [
    [
        () => 159,
        (gw) => 159 + 1.8 * (gw - 40),
        (gw) => 168 + 1.8 * (gw - 45),
        (gw) => 177 + 1.8 * (gw - 50),
        (gw) => 186 + 1.2 * (gw - 55),
        (gw) => 192 + 1.2 * (gw - 60),
        (gw) => 198 + 1.6 * (gw - 65),
        (gw) => 206 + 1.2 * (gw - 70),
        (gw) => 212 + 1.6 * (gw - 75),
        () => 220
    ], // Clean Config
    [
        () => 114,
        (gw) => 114 + 1.4 * (gw - 40),
        (gw) => 121 + 1.2 * (gw - 45),
        (gw) => 127 + 1.2 * (gw - 50),
        (gw) => 133 + gw - 55,
        (gw) => 138 + 1.2 * (gw - 60),
        (gw) => 144 + gw - 65,
        (gw) => 149 + gw - 70,
        (gw) => 154 + 1.2 * (gw - 75),
        () => 160
    ], // Config 1 + F
    [
        () => 110,
        (gw) => 110 + 1.8 * (gw - 40),
        (gw) => 119 + 1.2 * (gw - 45),
        (gw) => 125 + 1.2 * (gw - 50),
        (gw) => 131 + 1.2 * (gw - 55),
        (gw) => 137 + gw - 60,
        (gw) => 142 + .6 * (gw - 65),
        (gw) => 145 + .8 * (gw - 70),
        (gw) => 149 + gw - 75,
        () => 154
    ], // Config 2
    [
        (_, ldg) => 117 - ldg,
        (gw, ldg) => correctCg(gw, (gw, cg) => cg < 25 ? 117 + .4 * (gw - 40) : 117) - ldg,
        (gw, ldg) => correctCg(gw, (gw, cg) => cg < 25 ? 119 + 1.2 * (gw - 45) : 117 + 1.4 * (gw - 45)) - ldg,
        (gw, ldg) => correctCg(gw, (gw, cg) => cg < 25 ? 125 + 1.2 * (gw - 50) : 124 + 1.2 * (gw - 50)) - ldg,
        (gw, ldg) => correctCg(gw, (gw, cg) => cg < 25 ? 131 + 1.2 * (gw - 55) : 130 + gw - 55) - ldg,
        (gw, ldg) => correctCg(gw, (gw, cg) => cg < 25 ? 137 + gw - 60 : 135 + 1.2 * (gw - 60)) - ldg,
        (gw, ldg) => correctCg(gw, (gw, cg) => (cg < 25 ? 142 : 141) + gw - 65) - ldg,
        (gw, ldg) => correctCg(gw, (gw, cg) => (cg < 25 ? 147 : 146) + gw - 70) - ldg,
        (gw, ldg) => correctCg(gw, (gw, cg) => cg < 25 ? 152 + .8 * (gw - 75) : 151 + gw - 65) - ldg,
        (_, ldg) => 156 - ldg
    ], // Config 3
    [
        () => 116,
        () => 116,
        () => 116,
        (gw) => 116 + correctCg(gw, (gw, cg) => (cg < 25 ? .8 : .6) * (gw - 50)),
        (gw) => correctCg(gw, (gw, cg) => (cg < 25 ? 120 : 119) + gw - 55),
        (gw) => correctCg(gw, (gw, cg) => (cg < 25 ? 125 : 124) + gw - 60),
        (gw) => correctCg(gw, (gw, cg) => (cg < 25 ? 130 : 129) + gw - 65),
        (gw) => correctCg(gw, (gw, cg) => cg < 25 ? 135 + .8 * (gw - 70) : 134 + gw - 70),
        (gw) => 139 + .8 * (gw - 75),
        () => 143
    ], // Config Full
    [
        () => 125,
        (gw) => 125 + 1.4 * (gw - 40),
        (gw) => 132 + 1.2 * (gw - 45),
        (gw) => 138 + 1.2 * (gw - 50),
        (gw) => 144 + 1.4 * (gw - 55),
        (gw) => 151 + gw - 60,
        (gw) => 156 + 1.2 * (gw - 65),
        (gw) => 162 + 1.4 * (gw - 70),
        (gw) => 169 + .8 * (gw - 75),
        () => 173
    ] // Config 1
];

const vlsTo = [
    vls[0], // Clean Config
    [
        () => 105,
        (gw) => 105 + 1.2 * (gw - 40),
        (gw) => 111 + gw - 45,
        (gw) => 116 + 1.2 * (gw - 50),
        (gw) => 122 + gw - 55,
        (gw) => 127 + gw - 60,
        (gw) => 132 + gw - 65,
        (gw) => 137 + .8 * (gw - 70),
        (gw) => 141 + 1.2 * (gw - 75),
        () => 147
    ], // Config 1 + F
    [
        (_) => 101,
        (gw) => 101 + 1.4 * (gw - 40),
        (gw) => 108 + 1.2 * (gw - 45),
        (gw) => 114 + gw - 50,
        (gw) => 119 + 1.2 * (gw - 55),
        (gw) => 125 + gw - 60,
        (gw) => 130 + .4 * (gw - 65),
        (gw) => 132 + .8 * (gw - 70),
        (gw) => 136 + .8 * (gw - 75),
        () => 140
    ], // Config 2
    [
        () => 101,
        (gw) => 101 + 1.4 * (gw - 40),
        (gw) => 108 + 1.2 * (gw - 45),
        (gw) => 114 + gw - 50,
        (gw) => 119 + 1.2 * (gw - 55),
        (gw) => 125 + gw - 60,
        (gw) => 130 + .8 * (gw - 65),
        (gw) => 134 + gw - 70,
        (gw) => 139 + .6 * (gw - 75),
        () => 142
    ], // Config 3
    vls[4], // Config Full
    vls[5] // Config 1
];

/**
 * Checks if cg is defined
 * @param cg {number} center of gravity
 * @returns {number} validated center of gravity
 */
function getSafeCg(cg = SimVar.GetSimVarValue("CG PERCENT", "percent")) {
    return isNaN(cg) ? 24 : cg;
}

/**
 * Correct input function for cg
 * @param gw {number} gross weight (t)
 * @param f {function} function to be called with cg variable
 * @returns {number} cg corrected velocity (CAS)
 */
function correctCg(gw, f) {
    return f(gw, getSafeCg());
}

class A32NX_Vspeeds {
    constructor() {
        console.log('A32NX_VSPEEDS constructed');
    }

    init() {
        console.log('A32NX_VSPEEDS init');
        SimVar.SetSimVarValue("L:A32NX_VS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_VLS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_GD", "number", 0);
        this.lastGw = -1;
        this.lastFhi = -1;
        this.curFhi = -1;
        this.ldgPos = -1;
        this.alt = -1;
    }

    update(_deltaTime) {
        const gw = this.round(SimVar.GetSimVarValue("TOTAL WEIGHT", "kg")) / 1000;
        const fhi = Simplane.getFlapsHandleIndex();
        const ldg = Math.round(SimVar.GetSimVarValue("GEAR POSITION:0", "Enum"));
        const alt = this.round(Simplane.getAltitude());
        const fp = Simplane.getCurrentFlightPhase();
        if (fhi !== this.lastFhi) {
            this.curFhi = this.lastFhi === 0 && fp > FlightPhase.FLIGHT_PHASE_TAKEOFF ? 5 : fhi;
            this.lastFhi = fhi;
            this.updateVspeeds(gw, fp);
        } else if (gw !== this.lastGw) {
            this.lastGw = gw;
            this.updateVspeeds(gw, fp);
        } else if (ldg !== this.ldgPos) {
            this.ldgPos = ldg;
            this.updateVspeeds(gw, fp);
        } else if (alt !== this.alt) {
            this.updateVspeeds(gw, fp);
            this.alt = alt;
        }
    }

    /**
     * This method updates all SimVars with current Vspeeds
     * @param gw {number} gross weight (t)
     * @param fp {number} current flight phase
     */
    updateVspeeds(gw, fp) {
        const cgw = Math.ceil(((gw > 80 ? 80 : gw) - 40) / 5);
        SimVar.SetSimVarValue("L:A32NX_VS", "number", this.compensateForMachEffect(vs[this.curFhi][cgw](gw, this.ldgPos)));
        SimVar.SetSimVarValue("L:A32NX_VLS", "number", this.compensateForMachEffect(
            (fp < FlightPhase.FLIGHT_PHASE_CLIMB ? vlsTo : vls)[this.curFhi][cgw](gw, this.ldgPos))
        );
        SimVar.SetSimVarValue("L:A32NX_GD", "number", this.compensateForMachEffect(this.calculateGreenDotSpeed(gw)));
    }

    /**
     * Get aircraft takeoff and approach green dot speed
     * Calculation:
     * Gross weight (t) * 2 + 85 when below FL200
     * @returns {number}
     */
    calculateGreenDotSpeed(gw) {
        return gw * 2 + 85;
    }

    /**
     * Corrects velocity for mach effect by adding 1kt for every 1000ft above FL200
     * @param v {number} velocity in kt (CAS)
     * @returns {number} Mach corrected velocity in kt (CAS)
     */
    compensateForMachEffect(v) {
        return this.alt > 20000 ? v + (this.alt - 20000) / 1000 : v;
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
