class A32NX_Autobrake {
    constructor() {
        console.log('A32NX_Autobrake constructed');
    }
    update() {
    	const currentAutobrakesLevel = SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Number");
    	const currentFlightPhase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "Enum");
        if (currentAutobrakesLevel > 0 && currentFlightPhase > 2) {
        	const currentBrakeLeft = SimVar.GetSimVarValue("BRAKE LEFT POSITION", "position 32k");
    		const currentBrakeRight = SimVar.GetSimVarValue("BRAKE RIGHT POSITION", "position 32k");
    		if (currentBrakeLeft >= 30000 || currentBrakeRight >= 30000) {
            	SimVar.SetSimVarValue("L:XMLVAR_Autobrakes_Level", "Number", 0)
            }
        }
    }
}
