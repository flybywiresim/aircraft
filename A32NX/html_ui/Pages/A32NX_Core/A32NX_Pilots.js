class A32NX_Pilots {
    init() {
        const storedPilotVis = parseInt(NXDataStore.get("CONFIG_PILOT_VISIBILITY", "0"));
        const storedCoPilotVis = parseInt(NXDataStore.get("CONFIG_COPILOT_VISIBILITY", "0"));

        SimVar.SetSimVarValue("L:A32NX_VIS_PILOT_0", "Number", storedPilotVis);
        SimVar.SetSimVarValue("L:A32NX_VIS_PILOT_1", "Number", storedCoPilotVis);
    }
}
