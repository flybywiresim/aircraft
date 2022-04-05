class A32NX_Pushback {
    constructor() {}

    init() {
        SimVar.SetSimVarValue('L:A32NX_PUSHBACK_TUG_DIRECTION_FACTOR', 'number', -1);
        console.log("A32NX Pushback Initialized.");
    }

    update(_deltaTime) {
        const simOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'number');
        const pushBackAttached = SimVar.GetSimVarValue('Pushback Attached', 'bool');

        if (!(pushBackAttached && simOnGround)) {
            return;
        }
        console.log(SimVar.GetSimVarValue('A:RUDDER POSITION', 'number'));
        const tugSpeed = SimVar.GetSimVarValue('L:A32NX_TUG_SPEED', 'number');
        const parkingBrakeEngaged = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
        const commandedTugDirectionFactor = SimVar.GetSimVarValue('L:A32NX_PUSHBACK_TUG_DIRECTION_FACTOR', 'number');
        const commandedTugHeadingFactor = SimVar.GetSimVarValue('L:A32NX_PUSHBACK_TUG_HEADING_FACTOR', 'number');

        SimVar.SetSimVarValue('VELOCITY BODY X', 'Number', 0);
        SimVar.SetSimVarValue('VELOCITY BODY Y', 'Number', 0);
        SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', tugSpeed * (parkingBrakeEngaged ? 0.75 : 8) * commandedTugDirectionFactor);

        SimVar.SetSimVarValue('ROTATION VELOCITY BODY X', 'Number', 0);
        SimVar.SetSimVarValue('ROTATION VELOCITY BODY Y', 'Number', tugSpeed * (parkingBrakeEngaged ? 0.015 : 0.16) * commandedTugHeadingFactor * commandedTugDirectionFactor);
        SimVar.SetSimVarValue('ROTATION VELOCITY BODY Z', 'Number', 0);
    }
}
