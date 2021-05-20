class A32NX_ROPS {
    constructor(_fmcMainDisplay) {
        console.log("A32NX ROPS constructed");
        this.fmcMainDisplay = _fmcMainDisplay;
        this.fpm = this.fmcMainDisplay.flightPlanManager;
    }

    init() {
        console.log("A32NX ROPS init");
        SimVar.SetSimVarValue("L:A32NX_DEBUG_ROPS", "number", -1);
    }

    update() {
        try {
            this.arr = this.fpm.getApproachRunway();
        } catch (error) {
            console.log(error);
            return;
        }

        const aircraftLatLong = new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degrees latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees longitude"));

        const runwayIdent = this.fpm.getDestination().ident + Avionics.Utils.formatRunway(this.arr.designation);
        this.fmcMainDisplay.parseRunway(Avionics.Utils.formatRunway(runwayIdent), (onSuccess) => this.runwayLatLong = onSuccess.toLatLong(), (onError) => console.log(onError));

        const distance = Avionics.Utils.computeGreatCircleDistance(aircraftLatLong, this.runwayLatLong);

        console.log(`RWY LATLONG: ${this.runwayLatLong}`);
        console.log(`AC LATLONG: ${aircraftLatLong}`);
        console.log(`Distance: ${distance}`);

        this.inhibitStatus();
    }

    /* START OF DEBUG */
    inhibitStatus() {
        const ra = Simplane.getAltitudeAboveGround();
        const gs = Simplane.getGroundSpeed();

        console.log(`RA: ${ra}`);
        console.log(`GS: ${gs}`);

        if (ra > 2000) {
            console.log("SYSTEM OFF - TOO HIGH");
            SimVar.SetSimVarValue("L:A32NX_DEBUG_ROPS", "number", 0);
            return;
        } else if (ra <= 2000 && ra > 400) {
            console.log("SYSTEM ARMED");
            SimVar.SetSimVarValue("L:A32NX_DEBUG_ROPS", "number", 1);
            return;
        } else if (ra <= 400 && !Simplane.getIsGrounded()) {
            console.log("SYSTEM ACTIVE");
            SimVar.SetSimVarValue("L:A32NX_DEBUG_ROPS", "number", 2);
            return;
        } else if (Simplane.getIsGrounded() && gs > 30) {
            console.log("OVERRUN PREVENTION");
            SimVar.SetSimVarValue("L:A32NX_DEBUG_ROPS", "number", 3);
            return;
        } else if (Simplane.getIsGrounded() && gs < 30) {
            console.log("SYSTEM OFF - ON GROUND");
            SimVar.SetSimVarValue("L:A32NX_DEBUG_ROPS", "number", 4 );
            return;
        }
    }
    /* END OF DEBUG */

}
