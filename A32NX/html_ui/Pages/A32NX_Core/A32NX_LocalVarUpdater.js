// Use this to create and sync local simvars that are derived from other simvars.
// To create and sync a new local simvar, you need to add a selector and an updater.
// The selector calculates the new value based on other simvars and some logic.
// The updater compares the new value from the selector with the current value from the local simvar,
// and then updates the local simvar if it changed.
const FLAPS_IN_MOTION_MIN_DELTA = 0.1;

class A32NX_LocalVarUpdater {
    constructor() {
        // Initial data for deltas
        this.lastFlapsPosition = SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT PERCENT", "percent");

        this.updaters = [
            {
                varName: "L:A32NX_NO_SMOKING_MEMO",
                type: "Bool",
                selector: this._noSmokingMemoSelector,
            },
            {
                varName: "L:A32NX_CKPT_TEMP",
                type: "celsius",
                selector: this._condTempSelector,
                index: 1
            },
            {
                varName: "L:A32NX_FWD_TEMP",
                type: "celsius",
                selector: this._condTempSelector,
                index : 2
            },
            {
                varName: "L:A32NX_AFT_TEMP",
                type: "celsius",
                selector: this._condTempSelector,
                index: 3
            },
            {
                varName: "L:A32NX_FLAPS_IN_MOTION",
                type: "Bool",
                selector: this._flapsInMotionSelector.bind(this)
            }
            // New updaters go here...
        ];
    }

    update() {
        this.updaters.forEach(this._runUpdater);
    }

    _runUpdater({varName, type, selector, index = null}) {
        const newValue = selector(index);
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

    _condTempSelector(_index) {
        // Temporary code until packs code is written and implemented
        // Uses position of AIR COND knobs as a surrogate
        const cabinKnobValue = SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_" + _index, "Position(0-6)");
        const cabinTemp = (18 + (0.12 * cabinKnobValue));
        return cabinTemp;
    }

    _flapsInMotionSelector() {
        const currentFlapsPosition = SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT PERCENT", "percent");
        const lastFlapsPosition = this.lastFlapsPosition;

        this.lastFlapsPosition = SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT PERCENT", "percent");

        return Math.abs(lastFlapsPosition - currentFlapsPosition) > FLAPS_IN_MOTION_MIN_DELTA;
    }

    // New selectors go here...
}
