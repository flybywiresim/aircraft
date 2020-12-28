// Use this to create and sync local simvars that are derived from other simvars.
// To create and sync a new local simvar, you need to add a selector and an updater.
// The selector calculates the new value based on other simvars and some logic.
// The updater compares the new value from the selector with the current value from the local simvar,
// and then updates the local simvar if it changed.
class A32NX_LocalVarUpdater {
    constructor() {
        this.updaters = [
            {
                varName: "L:A32NX_NO_SMOKING_MEMO",
                type: "Bool",
                selector: this._noSmokingMemoSelector,
            },
            // New updaters go here...
        ];
    }

    update() {
        this.updaters.forEach(this._runUpdater);
    }

    _runUpdater({varName, type, selector}) {
        const newValue = selector();
        const currentValue = SimVar.GetSimVarValue(varName, type);
        if (newValue !== currentValue) {
            SimVar.SetSimVarValue(varName, type, newValue);
        }
    }

    _noSmokingMemoSelector() {
        const gearPercent = SimVar.GetSimVarValue("GEAR CENTER POSITION", "Percent");
        const noSmokingSwitch = SimVar.GetSimVarValue("L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position", "Position");

        // Switch is ON
        if (noSmokingSwitch === 0) {
            return true;
        }

        // Switch is AUTO and gear more than 50% down
        if (noSmokingSwitch === 1 && gearPercent > 50) {
            return true;
        }

        return false;
    }

    // New selectors go here...
}