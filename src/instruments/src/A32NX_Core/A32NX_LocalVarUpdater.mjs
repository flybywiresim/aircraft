// Use this to create and sync local simvars that are derived from other simvars.
// To create and sync a new local simvar, you need to add a selector and an updater.
// The selector calculates the new value based on other simvars and some logic.
// The updater compares the new value from the selector with the current value from the local simvar,
// and then updates the local simvar if it changed.
const FLAPS_IN_MOTION_MIN_DELTA = 0.1;

export default class A32NX_LocalVarUpdater {
    constructor() {
        // Initial data for deltas
        this.lastFlapsPosition = SimVar.GetSimVarValue('TRAILING EDGE FLAPS LEFT PERCENT', 'percent');
        // track which compartment has gotten temperature initialization
        this.initializedCabinTemp = {
            CKPT: false,
            FWD: false,
            AFT: false,
        };

        this.updaters = [
            {
                varName: 'L:A32NX_NO_SMOKING_MEMO',
                type: 'Bool',
                selector: this._noSmokingMemoSelector,
            },
            {
                varName: 'L:A32NX_CKPT_TRIM_TEMP',
                type: 'celsius',
                selector: this._condTempSelector,
                identifier: 1,
            },
            {
                varName: 'L:A32NX_FWD_TRIM_TEMP',
                type: 'celsius',
                selector: this._condTempSelector,
                identifier: 2,
            },
            {
                varName: 'L:A32NX_AFT_TRIM_TEMP',
                type: 'celsius',
                selector: this._condTempSelector,
                identifier: 3,
            },
            {
                varName: 'L:A32NX_CKPT_TEMP',
                type: 'celsius',
                selector: this._condTrimOutletSelector.bind(this),
                identifier: 'CKPT',
            },
            {
                varName: 'L:A32NX_FWD_TEMP',
                type: 'celsius',
                selector: this._condTrimOutletSelector.bind(this),
                identifier: 'FWD',
            },
            {
                varName: 'L:A32NX_AFT_TEMP',
                type: 'celsius',
                selector: this._condTrimOutletSelector.bind(this),
                identifier: 'AFT',
            },
            {
                varName: 'L:A32NX_FLAPS_IN_MOTION',
                type: 'Bool',
                selector: this._flapsInMotionSelector.bind(this),
            },
            // New updaters go here...
        ];
    }

    update() {
        this.updaters.forEach(this._runUpdater);
    }

    _runUpdater({
        varName, type, selector, identifier = null,
    }) {
        const newValue = selector(identifier);
        const currentValue = SimVar.GetSimVarValue(varName, type);
        if (newValue !== currentValue) {
            SimVar.SetSimVarValue(varName, type, newValue);
        }
    }

    _noSmokingMemoSelector() {
        const gearPercent = SimVar.GetSimVarValue('GEAR CENTER POSITION', 'Percent');
        const noSmokingSwitch = SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'Position');

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

    _condTempSelector(_identifier) {
        // Temporary code until packs code is written and implemented
        // Uses position of AIR COND knobs to generate the trim air temperature
        let trimTemp = null;

        if (SimVar.GetSimVarValue('L:A32NX_AIRCOND_HOTAIR_TOGGLE', 'Bool')) {
            const airconKnobValue = SimVar.GetSimVarValue(`L:A320_Neo_AIRCOND_LVL_${_identifier}`, 'number');
            trimTemp = (0.12 * airconKnobValue) + 18; // Map from knob range 0-100 to 18-30 degrees C
        } else {
            trimTemp = 18; // TODO replace placeholder with pack out temperature
        }

        return trimTemp;
    }

    _condTrimOutletSelector(_compartment) {
        // Cabin initially has outside temperature
        if (!this.initializedCabinTemp[_compartment]) {
            this.initializedCabinTemp[_compartment] = true;

            return Simplane.getAmbientTemperature();
        }

        // Use outlet temperature of trim air valves to generate the cabin temperature
        const currentCabinTemp = SimVar.GetSimVarValue(`L:A32NX_${_compartment}_TEMP`, 'celsius');
        const trimTemp = SimVar.GetSimVarValue(`L:A32NX_${_compartment}_TRIM_TEMP`, 'celsius');

        const deltaTemp = trimTemp - currentCabinTemp;

        // temperature variation depends on packflow and compartment size
        let compartmentSizeModifier = 0.0001;

        if (_compartment === 'CKPT') {
            compartmentSizeModifier = 0.0002;
        }

        const cabinTempVariationSpeed = compartmentSizeModifier * (SimVar.GetSimVarValue('L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position', 'number') + 1);
        const cabinTemp = currentCabinTemp + deltaTemp * cabinTempVariationSpeed;

        return cabinTemp;
    }

    _flapsInMotionSelector() {
        const currentFlapsPosition = SimVar.GetSimVarValue('TRAILING EDGE FLAPS LEFT PERCENT', 'percent');
        const { lastFlapsPosition } = this;

        this.lastFlapsPosition = SimVar.GetSimVarValue('TRAILING EDGE FLAPS LEFT PERCENT', 'percent');

        return Math.abs(lastFlapsPosition - currentFlapsPosition) > FLAPS_IN_MOTION_MIN_DELTA;
    }

    // New selectors go here...
}
