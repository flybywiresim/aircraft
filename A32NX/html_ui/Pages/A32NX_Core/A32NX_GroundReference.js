class A32NX_GroundReference {
    constructor() {
        console.log('A32NX_GroundReference constructed');
    }
    init() {
        console.log('A32NX_GroundReference init');
        this._delayedAltitude = 0;
    }
    update(_dTime, _core) {
        // This stuff makes the altimeter do a smooth rise to the actual altitude after alignment reaches a certain point
        let indicatedAltitude = Simplane.getAltitude();
        const desiredDisplayedAltitude = SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") === 0
            ? 0
            : indicatedAltitude;
        const delta = desiredDisplayedAltitude - this._delayedAltitude;
        if (Math.abs(delta) > 0.01) {
            this._delayedAltitude += delta * Math.min(1, (4 * (_dTime / 1000)));
            indicatedAltitude = this._delayedAltitude;
        }

        const groundReference = indicatedAltitude - Simplane.getAltitudeAboveGround();
        SimVar.SetSimVarValue("L:A32NX_ALTIMETER_GROUND_REFERENCE", "feet", groundReference);
    }
}