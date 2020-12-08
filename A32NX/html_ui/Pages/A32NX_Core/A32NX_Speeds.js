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
class A32NX_Speeds {
    constructor() {
        console.log('A32NX_VSPEEDS constructed');
    }

    init() {
        console.log('A32NX_VSPEEDS init');
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VLS", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_F", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_S", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_GD", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_LANDING_CONF3", "boolean", 0);
        this.lastGw = 50;
        this.lastFhi = -1;
        this.curFhi = -1;
        this.ldgPos = -1;
        this.alt = -1;
        this.cgw = 0;

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

            if (fhi === this.lastFhi && gw === this.lastGw && ldg === this.ldgPos && alt === this.alt) {
                return;
            }

            this.curFhi = this.lastFhi === 0 && fhi === 1 && fp > FlightPhase.FLIGHT_PHASE_TAKEOFF ? 5 : fhi;
            this.lastFhi = fhi;
            this.lastGw = gw;
            this.cgw = Math.ceil(((gw > 80 ? 80 : gw) - 40) / 5);
            this.ldgPos = ldg;
            this.alt = alt;

            const speeds = new NXSpeeds(gw, this.curFhi, ldg, fp < FlightPhase.FLIGHT_PHASE_CLIMB).compensateForMachEffect(alt);

            SimVar.SetSimVarValue("L:A32NX_SPEEDS_VS", "number", speeds.vs);
            SimVar.SetSimVarValue("L:A32NX_SPEEDS_VLS", "number", speeds.vls);
            SimVar.SetSimVarValue("L:A32NX_SPEEDS_F", "number", speeds.f);
            SimVar.SetSimVarValue("L:A32NX_SPEEDS_S", "number", speeds.s);
            SimVar.SetSimVarValue("L:A32NX_SPEEDS_GD", "number", speeds.gd);
        }, 500);
    }

    update() {
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
