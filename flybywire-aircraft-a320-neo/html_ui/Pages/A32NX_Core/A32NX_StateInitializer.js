class A32NX_StateInitializer {
    constructor(flightPhaseManager) {
        this.flightPhaseManager = flightPhaseManager;
        this.useManagedSpeed = null;
        this.selectedSpeed = null;
        this.selectedAlt = null;
        this.freezeState = null;
        this.hasPushedAthr = null;
    }

    init() {
        this.useManagedSpeed = SimVar.GetSimVarValue("L:A32NX_STATE_INIT_USE_MANAGED_SPEED", "Number");
        this.selectedSpeed = Math.max(140, SimVar.GetSimVarValue("L:A32NX_STATE_INIT_SELECTED_SPEED", "Number"));
        this.selectedAlt = Math.max(2000, SimVar.GetSimVarValue("L:A32NX_STATE_INIT_SELECTED_ALT", "Number"));
        this.freezeState = -1;
        this.hasPushedAthr = false;
    }

    async update() {
        if (SimVar.GetSimVarValue("L:A32NX_STATE_INIT_ACTIVE", "Bool") !== 1) {
            return;
        }

        if (this.freezeState === -1) {
            await SimVar.SetSimVarValue("K:FREEZE_LATITUDE_LONGITUDE_SET", "number", 1);
            await SimVar.SetSimVarValue("K:FREEZE_ALTITUDE_SET", "number", 1);
            await SimVar.SetSimVarValue("K:FREEZE_ATTITUDE_SET", "number", 1);
            await SimVar.SetSimVarValue("K:TOGGLE_FLIGHT_DIRECTOR", "number", 1);
            await SimVar.SetSimVarValue("K:TOGGLE_FLIGHT_DIRECTOR", "number", 2);
            this.freezeState = 1;
            console.log("Froze!");
        }

        const ll_freeze_active = SimVar.GetSimVarValue("IS LATITUDE LONGITUDE FREEZE ON", "bool") === 1;
        const alt_freeze_active = SimVar.GetSimVarValue("IS ALTITUDE FREEZE ON", "bool") === 1;
        const att_freeze_active = SimVar.GetSimVarValue("IS ATTITUDE FREEZE ON", "bool") === 1;
        const fd1_active = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE:1", "bool") === 1;
        const fd2_active = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE:2", "bool") === 1;
        const all_freezes_active = ll_freeze_active && alt_freeze_active && att_freeze_active;
        const all_fd_active = fd1_active && fd2_active;

        if (all_freezes_active && !all_fd_active && SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_STATUS", "Number") === 0) {
            await this.setThrustLevers(25);
            console.log("Set throttles to climb!");
            if (!this.hasPushedAthr) {
                await SimVar.SetSimVarValue("K:A32NX.FCU_ATHR_PUSH", "number", 1);
                console.log("Pushed autothrust!");
                this.hasPushedAthr = true;
            }

            if (this.useManagedSpeed === 1) {
                await SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "knots", 140);
            } else {
                await SimVar.SetSimVarValue("K:A32NX.FCU_SPD_PULL", "number", 0);
                await SimVar.SetSimVarValue("K:A32NX.FCU_SPD_SET", "number", this.selectedSpeed);
                console.log("Pulled speed!");
            }
        }

        if (
            SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_STATUS", "Number") === 2
            && ((this.useManagedSpeed === 0 && SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_MODE", "Number") === 7 && SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_SPEED_SELECTED", "Number") === this.selectedSpeed)
            || this.useManagedSpeed === 1)
        ) {
            this.flightPhaseManager.changePhase(FmgcFlightPhases.APPROACH);
            if (this.useManagedSpeed === 1) {
                await SimVar.SetSimVarValue("K:A32NX.FCU_SPD_PUSH", "number", 1);
                console.log("Pushed speed!");
            }

            // Enable TRK/FPA mode
            if (SimVar.GetSimVarValue("L:A32NX_TRK_FPA_MODE_ACTIVE", "number") === 0) {
                await SimVar.SetSimVarValue("L:A32NX_TRK_FPA_MODE_ACTIVE", "number", 1);
            }

            // Unfreeze aircraft
            if (this.freezeState === 1) {
                if (SimVar.GetSimVarValue("IS LATITUDE LONGITUDE FREEZE ON", "bool") === 1) {
                    await SimVar.SetSimVarValue("K:FREEZE_LATITUDE_LONGITUDE_TOGGLE", "number", 1);
                }
                if (SimVar.GetSimVarValue("IS LATITUDE LONGITUDE FREEZE ON", "bool") === 1) {
                    await SimVar.SetSimVarValue("K:FREEZE_ALTITUDE_TOGGLE", "number", 1);
                }
                if (SimVar.GetSimVarValue("IS LATITUDE LONGITUDE FREEZE ON", "bool") === 1) {
                    await SimVar.SetSimVarValue("K:FREEZE_ATTITUDE_TOGGLE", "number", 1);
                }
                this.freezeState = 0;
                console.log("Unfroze!");
            }

            // Remove GPS PRIMARY message from ND
            if (SimVar.GetSimVarValue("L:A32NX_EFIS_L_ND_FM_MESSAGE_FLAGS", "number") !== 0) {
                SimVar.SetSimVarValue("L:A32NX_EFIS_L_ND_FM_MESSAGE_FLAGS", "number", 0);
            }
            if (SimVar.GetSimVarValue("L:A32NX_EFIS_R_ND_FM_MESSAGE_FLAGS", "number") !== 0) {
                SimVar.SetSimVarValue("L:A32NX_EFIS_R_ND_FM_MESSAGE_FLAGS", "number", 0);
            }

            // Prevent this loop from running again if everything is complete
            if (this.freezeState === 0 &&
            !SimVar.GetSimVarValue("IS LATITUDE LONGITUDE FREEZE ON", "bool") &&
            !SimVar.GetSimVarValue("IS ALTITUDE FREEZE ON", "bool") &&
            !SimVar.GetSimVarValue("IS ATTITUDE FREEZE ON", "bool")) {
                await SimVar.SetSimVarValue("L:A32NX_STATE_INIT_ACTIVE", "Bool", 0);
                console.log("Set init active to 0!");
            }
        }
    }

    async setThrustLevers(tlaPercent) {
        await Promise.all([
            SimVar.SetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "Number", tlaPercent),
            SimVar.SetSimVarValue("L:A32NX_AUTOTHRUST_TLA:2", "Number", tlaPercent)
        ]);
    }
}