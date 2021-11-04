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
                varName: "L:A32NX_CKPT_TRIM_TEMP",
                type: "celsius",
                selector: this._condTempSelector,
                refreshInterval: 1000,
                identifier: 1
            },
            {
                varName: "L:A32NX_FWD_TRIM_TEMP",
                type: "celsius",
                selector: this._condTempSelector,
                refreshInterval: 1000,
                identifier : 2
            },
            {
                varName: "L:A32NX_AFT_TRIM_TEMP",
                type: "celsius",
                selector: this._condTempSelector,
                refreshInterval: 1000,
                identifier: 3
            },
            {
                varName: "L:A32NX_CKPT_TEMP",
                type: "celsius",
                selector: this._condTrimOutletSelector.bind(this),
                refreshInterval: 2000,
                identifier: "CKPT"
            },
            {
                varName: "L:A32NX_FWD_TEMP",
                type: "celsius",
                selector: this._condTrimOutletSelector.bind(this),
                refreshInterval: 2000,
                identifier: "FWD"
            },
            {
                varName: "L:A32NX_AFT_TEMP",
                type: "celsius",
                selector: this._condTrimOutletSelector.bind(this),
                refreshInterval: 2000,
                identifier: "AFT"
            },
            {
                varName: "L:A32NX_FLAPS_IN_MOTION",
                type: "Bool",
                selector: this._flapsInMotionSelector.bind(this),
                refreshInterval: 50,
            },
            {
                varName: "L:A32NX_PACKS_1_IS_SUPPLYING",
                type: "Bool",
                selector: this._isPacksOneSupplying.bind(this),
                refreshInterval: 1000,
            },
            {
                varName: "L:A32NX_PACKS_2_IS_SUPPLYING",
                type: "Bool",
                selector: this._isPacksTwoSupplying.bind(this),
                refreshInterval: 1000,
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

    _condTempSelector(_deltaTime, _identifier) {
        // Temporary code until packs code is written and implemented
        // Uses position of AIR COND knobs to generate the trim air temperature
        let trimTemp = null;

        if (SimVar.GetSimVarValue("L:A32NX_AIRCOND_HOTAIR_TOGGLE", "Bool")) {
            const airconKnobValue = SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_" + _identifier, "number");
            trimTemp = (0.12 * airconKnobValue) + 18; // Map from knob range 0-100 to 18-30 degrees C
        } else {
            trimTemp = 18; // TODO replace placeholder with pack out temperature
        }

        return trimTemp;
    }

    _condTrimOutletSelector(_deltaTime, _compartment) {
        // Cabin initially has outside temperature
        if (!this.initializedCabinTemp[_compartment]) {
            this.initializedCabinTemp[_compartment] = true;

            return Simplane.getAmbientTemperature();
        }

        // Use outlet temperature of trim air valves to generate the cabin temperature
        const currentCabinTemp = SimVar.GetSimVarValue("L:A32NX_" + _compartment + "_TEMP", "celsius");
        const trimTemp = SimVar.GetSimVarValue("L:A32NX_" + _compartment + "_TRIM_TEMP", "celsius");

        const deltaTemp = trimTemp - currentCabinTemp;

        // temperature variation depends on packflow and compartment size
        let compartmentSizeModifier = 0.000005;

        if (_compartment == "CKPT") {
            compartmentSizeModifier = 0.00001;
        }

        const cabinTempVariationSpeed = compartmentSizeModifier * (SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position", "number") + 1);
        const cabinTemp = currentCabinTemp + ((deltaTemp * cabinTempVariationSpeed) * _deltaTime);

        return cabinTemp;
    }

    _flapsInMotionSelector() {
        const currentFlapsPosition = SimVar.GetSimVarValue("L:A32NX_LEFT_FLAPS_POSITION_PERCENT", "Percent");
        const lastFlapsPosition = this.lastFlapsPosition;

        this.lastFlapsPosition = currentFlapsPosition;

        return Math.abs(lastFlapsPosition - currentFlapsPosition) > FLAPS_IN_MOTION_MIN_DELTA;
    }

    _isPacksOneSupplying() {
        const xBleedPos = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position", "number");
        const engineModeSelector = SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "Enum");

        const engineOneState = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:1", "number");
        const engineTwoState = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:2", "number");

        const isEngineOneRunning = engineOneState === 1 || (engineOneState === 2 && SimVar.GetSimVarValue("L:A32NX_ENGINE_N1:1", "number") >= 18);
        const isEngineTwoRunning = engineTwoState === 1 || (engineTwoState === 2 && SimVar.GetSimVarValue("L:A32NX_ENGINE_N1:2", "number") >= 18);

        // As this function is used for sound effects, we use the raw APU N instead of the arinc 429 APU N.
        const isApuDelivering = SimVar.GetSimVarValue("L:A32NX_APU_N_RAW", "Percent") >= 95 && SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool") && engineModeSelector === 1;
        const isEngineOneDelivering = isEngineOneRunning && SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool");
        const isEngineTwoDelivering = isEngineTwoRunning && SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool");

        const isXBleedOpen = xBleedPos === 2 || (xBleedPos === 1 && (isApuDelivering || engineModeSelector !== 1));

        /**
         * Whether engine mode selector is set to norm or both engines are running -> return packOneHasSupply state; otherwise return false
         */
        const packOneHasAir = engineModeSelector === 1 || (isEngineOneRunning && isEngineTwoRunning) ? isApuDelivering || isEngineOneDelivering || (isEngineTwoDelivering && isXBleedOpen) : false;

        return packOneHasAir && SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "Bool") && !SimVar.GetSimVarValue("L:A32NX_OVHD_PRESS_DITCHING_PB_IS_ON", "Bool");
    }

    _isPacksTwoSupplying() {
        const xBleedPos = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position", "number");
        const engineModeSelector = SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "Enum");

        const engineOneState = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:1", "number");
        const engineTwoState = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:2", "number");

        const isEngineOneRunning = engineOneState === 1 || (engineOneState === 2 && SimVar.GetSimVarValue("L:A32NX_ENGINE_N1:1", "number") >= 18);
        const isEngineTwoRunning = engineTwoState === 1 || (engineTwoState === 2 && SimVar.GetSimVarValue("L:A32NX_ENGINE_N1:2", "number") >= 18);

        // As this function is used for sound effects, we use the raw APU N instead of the arinc 429 APU N.
        const isApuDelivering = SimVar.GetSimVarValue("L:A32NX_APU_N_RAW", "Percent") >= 95 && SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool") && engineModeSelector === 1;
        const isEngineOneDelivering = isEngineOneRunning && SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool");
        const isEngineTwoDelivering = isEngineTwoRunning && SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool");

        const isXBleedOpen = xBleedPos === 2 || (xBleedPos === 1 && (isApuDelivering || engineModeSelector !== 1));

        /**
         * Whether engine mode selector is set to norm or both engines are running -> return packsTwoHasSupply state; otherwise return false
         */
        const packTwoHasAir = engineModeSelector === 1 || (isEngineOneRunning && isEngineTwoRunning) ? isApuDelivering || isEngineTwoDelivering || (isEngineOneDelivering && isXBleedOpen) : false;

        return packTwoHasAir && SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_TOGGLE", "Bool") && !SimVar.GetSimVarValue("L:A32NX_OVHD_PRESS_DITCHING_PB_IS_ON", "Bool");
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
