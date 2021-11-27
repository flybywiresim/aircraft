// Use this to create and sync local simvars that are derived from other simvars.
// To create and sync a new local simvar, you need to add a selector and an updater.
// The selector calculates the new value based on other simvars and some logic.
// The updater compares the new value from the selector with the current value from the local simvar,
// and then updates the local simvar if it changed.

const FLAPS_IN_MOTION_MIN_DELTA = 0.1;

class A32NX_LocalVarUpdater {
    constructor() {
        // Initial data for deltas
        this.lastFlapsPosition = SimVar.GetSimVarValue("L:A32NX_LEFT_FLAPS_POSITION_PERCENT", "Percent");
        // track which compartment has gotten temperature initialization
        this.initializedCabinTemp = {
            "CKPT":false,
            "FWD":false,
            "AFT":false
        };

        this.updaters = [
            {
                varName: "L:A32NX_NO_SMOKING_MEMO",
                type: "Bool",
                selector: this._noSmokingMemoSelector,
                refreshInterval: 1000,
            },
            {
                varName: "L:A32NX_FLAPS_IN_MOTION",
                type: "Bool",
                selector: this._flapsInMotionSelector.bind(this),
                refreshInterval: 50,
            },
            {
                varName: "L:A32NX_SLIDES_ARMED",
                type: "Bool",
                selector: this._areSlidesArmed.bind(this),
                refreshInterval: 100,
            },
            // New updaters go here...
        ];

        this.updaterThrottlers = {};
        this.updaters.forEach((updater) => {
            this.updaterThrottlers[updater.varName] = new UpdateThrottler(updater.refreshInterval);
        });
    }

    update(deltaTime) {
        this.updaters.forEach(updater => this._runUpdater(deltaTime, updater));
    }

    _runUpdater(deltaTime, {varName, type, selector, identifier = null}) {
        const selectorDeltaTime = this.updaterThrottlers[varName].canUpdate(deltaTime);

        if (selectorDeltaTime === -1) {
            return;
        }

        const newValue = selector(selectorDeltaTime, identifier);
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

    _flapsInMotionSelector() {
        const currentFlapsPosition = SimVar.GetSimVarValue("L:A32NX_LEFT_FLAPS_POSITION_PERCENT", "Percent");
        const lastFlapsPosition = this.lastFlapsPosition;

        this.lastFlapsPosition = currentFlapsPosition;

        return Math.abs(lastFlapsPosition - currentFlapsPosition) > FLAPS_IN_MOTION_MIN_DELTA;
    }

    _areSlidesArmed() {

        return !SimVar.GetSimVarValue('SIM ON GROUND', 'bool') ||
        SimVar.GetSimVarValue('ON ANY RUNWAY', 'bool') ||
        (SimVar.GetSimVarValue('LIGHT BEACON ON', 'bool') &&
            SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') < 5 && // Pilot side front door for ramp/stairs
            SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:3', 'percent') < 5 && // Rear door, FO side for catering
            SimVar.GetSimVarValue('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'bool') // Cargo door FO side
        );
    }

    // New selectors go here...
}
