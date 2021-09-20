/**
 * Calculates and shares Vs, Vls, F, S and GD.
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
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VMAX", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VFEN", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC", "number", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_ALPHA_MAX_CALC", "number", 0);
        this.lastGw = 50;
        this.lastFhi = -1;
        this.curFhi = -1;
        this.ldgPos = -1;
        this.alt = -1;
        this.cgw = 0;
        this.isTo = false;
    }

    update() {
        const fp = SimVar.GetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "Enum");
        let fhi = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Enum");
        /** Using true fhi for comparison */
        const isTo = fhi === SimVar.GetSimVarValue("L:A32NX_TO_CONFIG_FLAPS", "number");
        /** Change fhi to differentiate between 1 and 1 + F */
        if (fhi === 1 && SimVar.GetSimVarValue("L:A32NX_FLAPS_CONF_HANDLE_INDEX_HELPER", "Enum") === 1) {
            fhi = 5;
        }
        const gw = this.round(SimVar.GetSimVarValue("TOTAL WEIGHT", "kg")) / 1000;
        const ldg = Math.round(SimVar.GetSimVarValue("GEAR POSITION:0", "Enum"));
        const alt = this.round(Simplane.getAltitude());

        if (fhi === this.lastFhi && gw === this.lastGw && ldg === this.ldgPos && alt === this.alt && isTo === this.isTo) {
            return;
        }

        /** During Take Off allow to change this.isTo
         * Otherwise if we are in take off config and change the fhi, we no longer are in take off config */
        if (fp === FmgcFlightPhases.TAKEOFF && Simplane.getAltitudeAboveGround() < 1.5) {
            this.isTo = isTo;
        } else if (this.isTo && this.lastFhi !== fhi) {
            this.isTo = false;
        }

        this.lastFhi = fhi;
        this.lastGw = gw;
        this.cgw = Math.ceil(((gw > 80 ? 80 : gw) - 40) / 5);
        this.ldgPos = ldg;
        this.alt = alt;

        const speeds = new NXSpeeds(gw, this.lastFhi, ldg, this.isTo);
        speeds.compensateForMachEffect(alt);

        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VS", "number", speeds.vs);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VLS", "number", speeds.vls);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_F", "number", speeds.f);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_S", "number", speeds.s);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_GD", "number", speeds.gd);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VMAX", "number", speeds.vmax);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VFEN", "number", speeds.vfeN);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC", "number", speeds.vs * 1.1);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_ALPHA_MAX_CALC", "number", speeds.vs * 1.03);
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
