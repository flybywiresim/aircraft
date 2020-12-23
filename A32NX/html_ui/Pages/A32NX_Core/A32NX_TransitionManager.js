class A32NX_TransitionManager {
    init() {
        console.log('A32NX_TransitionManager init');
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");
        if (mode!=AUTO) {
            this.transitionManual();
        }
    }
    update(_deltaTime, _core) {
        this.transitionSelector(deltaTime);
    }
    transitionSelector(deltaTime) {
        const mode = NXDataStore.get("CONFIG_TRANSALT", "AUTO");

        if (mode == "AUTO") {
            
        }
    }
    transitionManual() {
        const storedDepartTransAlt = NXDataStore.get("CONFIG_DEPART_TRANSALT", "10000");
        const storedArrivalTransAlt = NXDataStore.get("CONFIG_ARRIVAL_TRANSALT", "10000");

        SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", storedDepartTransAlt);
        SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", storedArrivalTransAlt);
    }
}
