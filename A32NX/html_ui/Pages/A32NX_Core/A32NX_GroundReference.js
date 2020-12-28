class A32NX_GroundReference {
    constructor() {
        console.log('A32NX_GroundReference constructed');
    }
    init() {
        console.log('A32NX_GroundReference init');
    }
    update(_dTime, _core) {
        const groundReference = Simplane.getAltitude() - Simplane.getAltitudeAboveGround();
        SimVar.SetSimVarValue("L:A32NX_ALTIMETER_GROUND_REFERENCE", "feet", groundReference);
    }
}