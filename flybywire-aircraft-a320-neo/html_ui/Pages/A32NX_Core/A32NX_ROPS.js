class A32NX_ROPS {
    constructor(_fmcMainDisplay) {
        console.log("A32NX_ROPS constructed");
        this.fmcMainDisplay = _fmcMainDisplay;
        this.fpm = this.fmcMainDisplay.flightPlanManager;
    }

    init() {
        console.log("A32NX_ROPS init");

        const ra = Simplane.getAltitudeAboveGround();
        const gs = Simplane.getGroundSpeed();

        if (ra > 2000) {
            ropsStateMachine.states.GROUND_INHIBIT.engageInflightInhibit();
        } else if (ra <= 2000 && ra > 400) {
            ropsStateMachine.states.FLIGHT_INHIBIT.activateROPS();
        } else if (ra <= 400 && !Simplane.getIsGrounded()) {
            ropsStateMachine.states.ROPS.armROW();
        } else if (Simplane.getIsGrounded()) {
            ropsStateMachine.states.ROP.engageGroundInhibit();
        }

        SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
        console.log(gs);
        console.log(ra);
        console.log(`CURRENT STATE: ${ropsStateMachine.currentState.value}`);
    }

    update() {

        try {
            this.updateState();
        } catch (error) {
            console.error(error);
        }
    }

    updateState() {
        const ra = Simplane.getAltitudeAboveGround();
        const gs = Simplane.getGroundSpeed();

        console.log(`GS: ${gs}`);
        console.log(`RA: ${ra}`);

        const state = ropsStateMachine.currentState;
        console.log(`CUR STATE: ${state.value}`);


        switch (state.value) {
            case 0:
                if (ra <= 2000 && ra > 400) {
                    state.activateROPS();
                }
                break;
            case 1:
                if (ra <= 400) {
                    state.armROW();
                }
                break;
            case 2:
                if (Simplane.getIsGrounded() && gs >= 30) {
                    state.engageROP();
                }
                break;
            case 3:
                if (gs < 30) {
                    state.engageGroundInhibit();
                }
                break;
            case 4:
                if (ra > 2000) {
                    state.engageInFlightInhibit();
                }
        }
    }
}

/*
    FLIGHT_INHIBIT: The ROPS is inhibited - active above 2000ft RA
    ROPS: The ROPS is actively detecting the landing runway
    ROW: The ROW function arms and continously calculates the required landing distance -> activates if the available distance drops below the "WET RUNWAY" threshold
    ROP: The ROP arms and continously calculates the required landing distance -> activates if the required distance is more than the distance available
    GROUND_INHIBIT: The ROPS is inhibited on the ground - activates when on ground and GS < 30 kts - stays active until RA > 2000 ft
 */
const ropsStateMachine = {
    currentState: null,
    states: {
        FLIGHT_INHIBIT: {
            value: 0,
            activateROPS: () => {
                ropsStateMachine.currentState = ropsStateMachine.states.ROPS;
                SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
            }
        },
        ROPS: {
            value: 1,
            armROW: () => {
                ropsStateMachine.currentState = ropsStateMachine.states.ROW;
                SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
            }
        },
        ROW: {
            value: 2,
            engageROP: () => {
                ropsStateMachine.currentState = ropsStateMachine.states.ROP;
                SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
            }
        },
        ROP: {
            value: 3,
            engageGroundInhibit: () => {
                ropsStateMachine.currentState = ropsStateMachine.states.GROUND_INHIBIT;
                SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
            }
        },
        GROUND_INHIBIT: {
            value: 4,
            engageInflightInhibit: () => {
                ropsStateMachine.currentState = ropsStateMachine.states.FLIGHT_INHIBIT;
                SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
            }
        }
    }
}
