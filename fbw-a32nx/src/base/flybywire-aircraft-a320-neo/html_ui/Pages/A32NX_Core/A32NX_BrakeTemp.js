// Say when simulation is ready to provide trustworthy ambient temperature - unsure if it works as expected
function isReady() {
    return SimVar.GetSimVarValue('L:A32NX_IS_READY', 'number') === 1;
}

// Return random value between min and max
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Scale factor for heat up
 */
const HEAT_UP_SCALE = 0.000035;

/**
 * Minimum RPM for counting a wheel set as spinning (brake temperature can increase)
 */
const WHEEL_RPM_THRESHOLD = 10;

/**
 * Represents a full landing gear
 */
class A32NX_GearStatus {
    /**
     *
     * @param {number} gearIndex Index from left to right, starts at zero
     * @param {string} gearPositionSimVar SimVar name for this gear's position
     * @param {string} brakePositionSimVar SimVar name for this gear's brake pedal position
     * @param {string} wheelRPMSimVar SimVar Name for this gear's wheel RPM
     */
    constructor(gearIndex, gearPositionSimVar, brakePositionSimVar, wheelRPMSimVar) {
        this.gearIndex = gearIndex;
        this.gearPositionSimVar = gearPositionSimVar;
        this.gearPosition = 0;
        this.brakePositionSimVar = brakePositionSimVar;
        this.brakePosition = 0;
        this.wheelRPMSimVar = wheelRPMSimVar;
        this.wheelRPM = 0;
    }

    /**
     * Update internal state from simulation values
     * @param {number} deltaTime
     */
    update(deltaTime) {
        this.gearPosition = SimVar.GetSimVarValue(this.gearPositionSimVar, 'Percent Over 100');
        this.brakePosition = SimVar.GetSimVarValue(this.brakePositionSimVar, 'position 32k');
        this.wheelRPM = SimVar.GetSimVarValue(this.wheelRPMSimVar, 'number');
    }

    /**
     * Check if gear has started extending
     * @returns {boolean} true if the gear as started extending
     */
    extended() {
        return this.gearPosition >= 0.25;
    }

    /**
     * Check if gear is fully extended
     * SimVar is documented to extend from 0.0 to 1.0 but fully extended position is 100
     * @returns {boolean} true if the gear has position "100"
     */
    fullyExtended() {
        return this.gearPosition === 100;
    }

    /**
     * Check if this gear's brake pedal is pressed
     * @returns {boolean} true if this gear's brake pedal is pressed
     */
    brakePressed() {
        return this.brakePosition > 0;
    }

    /**
     * Check if this gear's wheel is spinning
     * It checks RPM against a threshold
     * @returns {boolean} true if this gear's wheel is spinning
     */
    wheelSpinning() {
        return this.wheelRPM > WHEEL_RPM_THRESHOLD;
    }

    /**
     * Use some wizardry to compute how much does the brake heat up per second
     * given the brake pressure and wheel RPM
     * @returns {number} brake heat up in degrees per second
     */
    calculateHeatUpPerSecond() {
        return HEAT_UP_SCALE * (this.brakePosition / 32767.0) * ((this.wheelRPM * 1.14) ** 2);
    }
}

/**
 * Represents current brake fan status
 */
class A32NX_BrakeFan {
    /**
     *
     * @param {string} brakeFanSimVar SimVar name describing if brake fan is on
     * @param {string} brakeFanPressedSimVar SimVar name describing if brake fan button is pressed
     * @param {A32NX_GearStatus} leftGearStatus GearStatus object for the left gear
     */
    constructor(brakeFanSimVar, brakeFanPressedSimVar, leftGearStatus) {
        this.brakeFanSimVar = brakeFanSimVar;
        this.brakeFan = false;
        this.brakeFanPressedSimVar = brakeFanPressedSimVar;
        this.brakeFanPressed = false;
        this.leftGearStatus = leftGearStatus;
    }

    /**
     * Update internal state from simulation values
     * Manage Brake Fan status SimVar by checking button pressed or not
     * This probably shouldn't be the place where the brake fan is to be commanded
     * @param {number} _deltaTime
     */
    update(_deltaTime) {
        this.brakeFan = SimVar.GetSimVarValue(this.brakeFanSimVar, 'Bool') !== 0;
        this.brakeFanPressed = SimVar.GetSimVarValue(this.brakeFanPressedSimVar, 'Bool') !== 0;
        if (this.shouldBeOn() !== this.brakeFan) {
            SimVar.SetSimVarValue(this.brakeFanSimVar, 'Bool', this.shouldBeOn());
        }
    }

    /**
     * Says if the brake fan should be activated, that's when the button is pressed AND
     * the left gear is fully extended
     * @returns {boolean} true if brake fan should be on
     */
    shouldBeOn() {
        return this.brakeFanPressed && this.leftGearStatus.fullyExtended();
    }

    /**
     * Part of wizardry, vary if fan is on or off
     * @returns {number}
     */
    fanMultiplier() {
        return this.shouldBeOn() ? 4.35 : 1.0;
    }

    /**
     * Part of wizardry, vary if fan is on or off
     * @returns {number}
     */
    fanDifferentialFactor() {
        return this.shouldBeOn() ? 0.28 : 1.0;
    }
}

/**
 * Scale factor for cool down
 * And other wizardry factor
 */
const BASE_COOL_DOWN_FACTOR = 0.00085;

const BASE_SPEED = 0.113;

const SPEED_COOLDOWN_FACTOR = 0.00055;

const BASE_HEAT_DIFFERENTIAL_FACTOR = 0.000015;

const BASE_HEAT_UP_FACTOR = 0.003;

/**
* Minimum temperature delta at which cooling is applied
* */
const MIN_TEMP_DELTA = 0.1;

/**
 * Temperature above which brakes are considered hot
 */
const BRAKES_HOT_THRESHOLD = 300;

/**
 * Represents the temperature computation and status for one brake
 * Main logic for brake temperature computation
 */
class A32NX_OneBrakeTemp {
    /**
     *
     * @param {number} brakeIndex Index of this brake, from left to right, starts at zero
     * @param {string} brakeTempSimVar SimVar name for this brake's temperature
     * @param {string} reportedBrakeTempSimVar SimVar name for this brake's probe temperature
     * @param {A32NX_GearStatus} gearStatus GearStatus object representing the gear this brake is attached to
     * @param {A32NX_BrakeFan} brakeFan BrakeFan object representing the Brake Fan status
     */
    constructor(brakeIndex, brakeTempSimVar, reportedBrakeTempSimVar, gearStatus, brakeFan) {
        this.brakeIndex = brakeIndex;
        this.brakeTempSimVar = brakeTempSimVar;
        this.brakeTemp = null;
        this.reportedBrakeTempSimVar = reportedBrakeTempSimVar;
        this.reportedBrakeTemp = null;
        this.gearStatus = gearStatus;
        this.brakeFan = brakeFan;
    }

    /**
     * Wizardry that computes how much does the air flow cools down the brake
     * @param {number} deltaTemp Temperature difference between brake temperature and ambient temperature
     * @param {number} speed Current air speed
     * @param {number} deltaTempFactor Some wizardry
     * @returns {number} Degrees per second of cooldown
     */
    calculateDeltaCoolDown(deltaTemp, speed, deltaTempFactor) {
        return (deltaTemp * (BASE_SPEED + this.gearStatus.extended() * SPEED_COOLDOWN_FACTOR * speed) * BASE_COOL_DOWN_FACTOR) * deltaTempFactor * this.brakeFan.fanMultiplier();
    }

    /**
     * Used when the brake fan is actively cooling the temp probe faster than it is cooling the brakes
     * @param {number} finalTemp The equilibrium temperature between brake and ambient temperature
     * @param {*} currentReportedBrakeTemp Current reported temperature for brake's probe
     * @returns {number} Degrees per second of cooldown
     */
    coolProbe(finalTemp, currentReportedBrakeTemp) {
        return (finalTemp - currentReportedBrakeTemp) * BASE_COOL_DOWN_FACTOR;
    }

    /**
     * Used when the brake fan is off, the temp probe is slowly reaching back up to brake temp
     * @param {number} currentReportedBrakeTemp Current reported temperature for brake's probe
     * @param {number} currentBrakeTemp Current temperature of brakes
     * @returns {number} Degrees per second of temperature change
     */
    equalizeProbe(currentReportedBrakeTemp, currentBrakeTemp) {
        return (currentBrakeTemp - currentReportedBrakeTemp) * BASE_HEAT_UP_FACTOR;
    }

    /**
     * Check if brake temperature exceeds a threshold
     * @returns {boolean} true of brakes exceeds BRAKES_HOT_THRESHOLD degrees
     */
    hot() {
        return this.brakeTemp > BRAKES_HOT_THRESHOLD;
    }

    /**
     * Update simulation with new temperatures
     * @param {number} deltaTime
     * @param {number} ambientTemperature Ambient temperature as per the simulation
     * @param {number} airspeed Current aircraft air speed
     */
    update(deltaTime, ambientTemperature, airspeed) {
        const secondRatio = (deltaTime / 1000);

        // Initialize with ambientTemperature
        if (this.brakeTemp === null || this.reportedBrakeTemp === null) {
            this.brakeTemp = ambientTemperature;
            this.reportedBrakeTemp = ambientTemperature;
        } else {
            this.brakeTemp = SimVar.GetSimVarValue(this.brakeTempSimVar, 'celsius');
            this.reportedBrakeTemp = SimVar.GetSimVarValue(this.reportedBrakeTempSimVar, 'celsius');
        }

        // First, the heat up process

        // Don't need to check for spinning wheel of applied brakes, it's handled by calculateHeatUpPerSecond()
        const heatUpFactor = secondRatio * getRandomArbitrary(0.5, 1.5) * this.gearStatus.calculateHeatUpPerSecond();
        this.brakeTemp += heatUpFactor;
        this.reportedBrakeTemp += heatUpFactor;

        // Then the cooldown process
        const deltaAmbient = this.brakeTemp - ambientTemperature;
        // Cooldown from convection
        if (Math.abs(deltaAmbient) > MIN_TEMP_DELTA) {
            const deltaTempFactor = 1 + Math.pow(deltaAmbient, 2) * BASE_HEAT_DIFFERENTIAL_FACTOR * this.brakeFan.fanDifferentialFactor();
            const brakeCoolDown = secondRatio * getRandomArbitrary(0.8, 1.2) * this.calculateDeltaCoolDown(deltaAmbient, airspeed, deltaTempFactor);
            this.brakeTemp -= brakeCoolDown;
            this.reportedBrakeTemp -= brakeCoolDown;
        }

        if (this.brakeFan.shouldBeOn()) {
            // When fan is on, it will cool the probe faster than the brakes
            const probeTargetTemp = ambientTemperature + deltaAmbient / 2.0;
            this.reportedBrakeTemp += secondRatio * getRandomArbitrary(0.8, 1.2) * this.coolProbe(probeTargetTemp, this.reportedBrakeTemp);
        } else {
            // When fan is off, hot brakes will heat up the probe
            this.reportedBrakeTemp += secondRatio * getRandomArbitrary(0.8, 1.2) * this.equalizeProbe(this.reportedBrakeTemp, this.brakeTemp);
        }

        // Update simulation with new values
        SimVar.SetSimVarValue(this.brakeTempSimVar, 'celsius', this.brakeTemp);
        SimVar.SetSimVarValue(this.reportedBrakeTempSimVar, 'celsius', this.reportedBrakeTemp);
    }
}

/**
 * Main class handling all brakes
 * It owns one GearStatus per landing gear, a BrakeFan system and 4 brakes.
 */
class A32NX_BrakeTemp {
    constructor() {
        this.initializedAmbientBrakeTemp = false;
        this.gearLeft = new A32NX_GearStatus(0, 'L:A32NX_GEAR_LEFT_POSITION', 'BRAKE LEFT POSITION', 'WHEEL RPM:1');
        this.gearRight = new A32NX_GearStatus(1, 'L:A32NX_GEAR_RIGHT_POSITION', 'BRAKE RIGHT POSITION', 'WHEEL RPM:2');
        this.brakeFan = new A32NX_BrakeFan('L:A32NX_BRAKE_FAN', 'L:A32NX_BRAKE_FAN_BTN_PRESSED', this.gearLeft);
        this.brakes = [
            new A32NX_OneBrakeTemp(0, 'L:A32NX_BRAKE_TEMPERATURE_1', 'L:A32NX_REPORTED_BRAKE_TEMPERATURE_1', this.gearLeft, this.brakeFan),
            new A32NX_OneBrakeTemp(1, 'L:A32NX_BRAKE_TEMPERATURE_2', 'L:A32NX_REPORTED_BRAKE_TEMPERATURE_2', this.gearLeft, this.brakeFan),
            new A32NX_OneBrakeTemp(2, 'L:A32NX_BRAKE_TEMPERATURE_3', 'L:A32NX_REPORTED_BRAKE_TEMPERATURE_3', this.gearLeft, this.brakeFan),
            new A32NX_OneBrakeTemp(3, 'L:A32NX_BRAKE_TEMPERATURE_4', 'L:A32NX_REPORTED_BRAKE_TEMPERATURE_4', this.gearLeft, this.brakeFan),
        ];
    }

    /**
     * Update loop
     * Fail fast if simulation is not ready
     * Get ambient temperature and airspeed, then update gear/brake fan systems from simulation
     * Then compute brake temperature evolution
     * Finally compute if any brake can be considered HOT
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!isReady()) {
            return;
        }
        const ambientTemperature = Simplane.getAmbientTemperature();
        const airspeed = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Meters per second');

        this.gearLeft.update(deltaTime);
        this.gearRight.update(deltaTime);
        this.brakeFan.update(deltaTime);

        let someHot = false;

        this.brakes.forEach((brake) => {
            brake.update(deltaTime, ambientTemperature, airspeed);
            someHot = someHot || brake.hot();
        });

        SimVar.SetSimVarValue('L:A32NX_BRAKES_HOT', 'Bool', someHot);
    }
}
