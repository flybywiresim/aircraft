class A32NX_Electricity {
    constructor() {
        console.log('A32NX_Electricity constructed');
    }
    init() {
        console.log('A32NX_Electricity init');
    }
    update(_deltaTime, _core) {
        if (_core.ACPowerStateChange) {
            const ACPowerAvailable = SimVar.GetSimVarValue("L:ACPowerAvailable","Bool");
            const screenBlueLightsCircuitOn = SimVar.GetSimVarValue("A:CIRCUIT ON:79","Bool");
            if (ACPowerAvailable) {
                if (!screenBlueLightsCircuitOn) {
                    SimVar.SetSimVarValue("K:ELECTRICAL_CIRCUIT_TOGGLE", "number", 79);
                }
            } else {
                if (screenBlueLightsCircuitOn) {
                    SimVar.SetSimVarValue("K:ELECTRICAL_CIRCUIT_TOGGLE", "number", 79);
                }
            }
        }
    }
}