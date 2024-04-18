// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class A32NX_FADEC {
    constructor(engine) {
        this.engine = engine;
        this.fadecTimer = -1;
        this.dcEssPoweredInPreviousUpdate = false;
        this.lastActiveIgniterAutostart = 0; // 0 = A, 1 = B
    }

    init() {
        this.updateSimVars();
    }

    update(deltaTime) {
        const dcEssIsPowered = this.isDcEssPowered();
        const ignitionState = SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "Enum") === 2;
        const engineState = SimVar.GetSimVarValue(`L:A32NX_ENGINE_STATE:${this.engine}`, "Number");
        const n2Percent = SimVar.GetSimVarValue(`L:A32NX_ENGINE_N2:${this.engine}`, "Number");

        if ((this.dcEssPoweredInPreviousUpdate !== dcEssIsPowered && dcEssIsPowered === 1) ||
            (this.lastEngineState !== engineState && engineState === 4)) {
            this.fadecTimer = 5 * 60;
        }
        if ((this.lastEngineState === 2 || this.lastEngineState === 3) && engineState !== 2 && engineState !== 3) {
            this.lastActiveIgniterAutostart ^= 1; // toggles Igniter
        }

        this.igniting = ignitionState && (engineState === 2 || engineState === 3) && n2Percent > 25 && n2Percent < 55;

        if (this.lastIgnitionState !== ignitionState && !ignitionState) {
            this.fadecTimer = Math.max(30, this.fadecTimer);
        }
        this.fadecTimer -= deltaTime / 1000;
        this.updateSimVars();
        this.dcEssPoweredInPreviousUpdate = dcEssIsPowered;
    }

    updateSimVars() {
        this.lastIgnitionState = SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "Enum") === 2;
        this.lastEngineState = SimVar.GetSimVarValue(`L:A32NX_ENGINE_STATE:${this.engine}`,"Number");
        SimVar.SetSimVarValue(`L:A32NX_FADEC_POWERED_ENG${this.engine}`, "Bool", this.isPowered() ? 1 : 0);
        SimVar.SetSimVarValue(`L:A32NX_FADEC_IGNITER_A_ACTIVE_ENG${this.engine}`, "Bool", this.igniting && this.lastActiveIgniterAutostart === 0 ? 1 : 0);
        SimVar.SetSimVarValue(`L:A32NX_FADEC_IGNITER_B_ACTIVE_ENG${this.engine}`, "Bool", this.igniting && this.lastActiveIgniterAutostart === 1 ? 1 : 0);
    }

    isPowered() {
        if (SimVar.GetSimVarValue(`L:A32NX_FIRE_BUTTON_ENG${this.engine}`, "Bool") === 1) {
            return false;
        }
        if (SimVar.GetSimVarValue(`TURB ENG N2:${this.engine}`, "Percent") > 15) {
            return true;
        }
        if (SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "Enum") !== 1) {
            return true;
        }
        if (SimVar.GetSimVarValue(`L:A32NX_OVHD_FADEC_${this.engine}`, "Bool")) {
            return true;
        }
        if (this.fadecTimer > 0) {
            return true;
        }
        return false;
    }

    isDcEssPowered() {
        // This will have to be revisited when implementing the FADEC. One shouldn't consider this reference
        // to DC ESS valuable: it might be powered by multiple buses or related to other things altogether.
        return SimVar.GetSimVarValue("L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED", "Bool");
    }
}
