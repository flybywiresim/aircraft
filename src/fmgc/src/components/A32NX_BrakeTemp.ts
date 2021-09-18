/* eslint-disable camelcase */
/**
 * Minimum RPM for counting a wheel set as spinning (brake temperature can increase)
 */
const WHEEL_RPM_THRESHOLD = 10;
/**
 * Scale factor for heat up
 */
const HEAT_UP_SCALE = 0.000035;

const BASE_HEAT_UP_FACTOR = 0.003;

/**
 * Scale factor for cool down
 */
const BASE_COOL_DOWN_FACTOR = 0.00085;

const BASE_SPEED = 0.113;

const SPEED_COOLDOWN_FACTOR = 0.00055;

const BASE_HEAT_DIFFERENTIAL_FACTOR = 0.000015;

/**
* Minimum temperature delta at which cooling is applied
* */
const MIN_TEMP_DELTA = 0.1;

export class A32NX_BrakeTemp {
    initializedAmbientBrakeTemp: boolean;

    /**
     * @param brakePosition {number}
     * @param wheelRpm {number}
     */
    calculateHeatUp(brakePosition, wheelRpm) {
        return HEAT_UP_SCALE * (brakePosition / 32767) * ((wheelRpm / 2) ** 2);
    }

    calculateDeltaCoolDown(deltaTemp, speed, gearExtended, deltaTempFactor, fanMultiplier) {
        return (deltaTemp * (BASE_SPEED + gearExtended * SPEED_COOLDOWN_FACTOR * speed) * BASE_COOL_DOWN_FACTOR) * deltaTempFactor * fanMultiplier;
    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    // the brake fan is actively cooling the temp probe faster than it is cooling the brakes
    coolProbe(finalTemp, currentReportedBrakeTemp) {
        return (finalTemp - currentReportedBrakeTemp) * BASE_COOL_DOWN_FACTOR;
    }

    // the brake fan is off, the temp probe is slowly reaching back up to brake temp
    equalizeProbe(currentReportedBrakeTemp, currentBrakeTemp) {
        return (currentBrakeTemp - currentReportedBrakeTemp) * BASE_HEAT_UP_FACTOR;
    }

    constructor() {
        this.initializedAmbientBrakeTemp = false;
    }

    init() { }

    update(_deltaTime) {
        let currentBrakeTemps = [0, 0, 0, 0];
        let currentReportedBrakeTemps = [0, 0, 0, 0];
        if (!this.initializedAmbientBrakeTemp) {
            const ambientTemperature = Simplane.getAmbientTemperature();

            // Initial brake temperatures
            currentBrakeTemps.fill(ambientTemperature);
            currentReportedBrakeTemps.fill(ambientTemperature);
            this.initializedAmbientBrakeTemp = true;
        } else {
            // actual physical temperatures of the brakes
            currentBrakeTemps = [
                SimVar.GetSimVarValue('L:A32NX_BRAKE_TEMPERATURE_1', 'celsius'),
                SimVar.GetSimVarValue('L:A32NX_BRAKE_TEMPERATURE_2', 'celsius'),
                SimVar.GetSimVarValue('L:A32NX_BRAKE_TEMPERATURE_3', 'celsius'),
                SimVar.GetSimVarValue('L:A32NX_BRAKE_TEMPERATURE_4', 'celsius'),
            ];
            // temps reported by the thermal probes in the brake assembly
            currentReportedBrakeTemps = [
                SimVar.GetSimVarValue('L:A32NX_REPORTED_BRAKE_TEMPERATURE_1', 'celsius'),
                SimVar.GetSimVarValue('L:A32NX_REPORTED_BRAKE_TEMPERATURE_2', 'celsius'),
                SimVar.GetSimVarValue('L:A32NX_REPORTED_BRAKE_TEMPERATURE_3', 'celsius'),
                SimVar.GetSimVarValue('L:A32NX_REPORTED_BRAKE_TEMPERATURE_4', 'celsius'),
            ];
        }
        // FIXME: What's wrong here?
        const GearLeftPosition = SimVar.GetSimVarValue('GEAR LEFT POSITION', 'Percent Over 100');
        const GearLeftExtended = GearLeftPosition >= 0.25;
        // FIXME: What's wrong here?
        const GearRightExtended = SimVar.GetSimVarValue('GEAR RIGHT POSITION', 'Percent Over 100') >= 0.25;
        const currentBrakeFanState = SimVar.GetSimVarValue('L:A32NX_BRAKE_FAN', 'Bool');
        const brakeFanButtonIsPressed = SimVar.GetSimVarValue('L:A32NX_BRAKE_FAN_BTN_PRESSED', 'Bool');
        // if the fan button is pressed down and the left main gear is down and locked, the fan is on
        const brakeFanIsOn = brakeFanButtonIsPressed && (GearLeftPosition == 1);
        let fanMultiplier = 1;
        let fanDifferentialFactor = 1;
        if (brakeFanIsOn) {
            if (!currentBrakeFanState) {
                SimVar.SetSimVarValue('L:A32NX_BRAKE_FAN', 'Bool', true);
            }
            fanMultiplier = 4.35;
            fanDifferentialFactor = 0.28;
        } else if (currentBrakeFanState) {
            SimVar.SetSimVarValue('L:A32NX_BRAKE_FAN', 'Bool', false);
        }
        const currentBrakeLeft = SimVar.GetSimVarValue('BRAKE LEFT POSITION', 'position 32k');
        const currentBrakeRight = SimVar.GetSimVarValue('BRAKE RIGHT POSITION', 'position 32k');

        const ambientTemperature = Simplane.getAmbientTemperature();
        const airspeed = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Meters per second');

        const wheelSet1Rpm = SimVar.GetSimVarValue('WHEEL RPM:1', 'number');
        const wheelSet2Rpm = SimVar.GetSimVarValue('WHEEL RPM:2', 'number');

        const wheelsAreSpinning = wheelSet1Rpm > WHEEL_RPM_THRESHOLD || wheelSet2Rpm > WHEEL_RPM_THRESHOLD;

        const anyBrakePressed = currentBrakeLeft > 0 || currentBrakeRight > 0;

        if (anyBrakePressed && wheelsAreSpinning) {
            // Apply heat up for each temperature

            const deltaHeatUpWheelSet1 = (_deltaTime / 1000) * this.calculateHeatUp(currentBrakeLeft, wheelSet1Rpm);

            if (currentBrakeLeft > 0) {
                const brakeHeatUp0 = this.getRandomArbitrary(0.5, 1.5) * deltaHeatUpWheelSet1;
                const brakeHeatUp1 = this.getRandomArbitrary(0.5, 1.5) * deltaHeatUpWheelSet1;
                currentBrakeTemps[0] += brakeHeatUp0;
                currentBrakeTemps[1] += brakeHeatUp1;
                currentReportedBrakeTemps[0] += brakeHeatUp0;
                currentReportedBrakeTemps[1] += brakeHeatUp1;
            }

            const deltaHeatUpWheelSet2 = (_deltaTime / 1000) * this.calculateHeatUp(currentBrakeRight, wheelSet2Rpm);

            if (currentBrakeRight > 0) {
                const brakeHeatUp2 = this.getRandomArbitrary(0.5, 1.5) * deltaHeatUpWheelSet2;
                const brakeHeatUp3 = this.getRandomArbitrary(0.5, 1.5) * deltaHeatUpWheelSet2;
                currentBrakeTemps[2] += brakeHeatUp2;
                currentBrakeTemps[3] += brakeHeatUp3;
                currentReportedBrakeTemps[2] += brakeHeatUp2;
                currentReportedBrakeTemps[3] += brakeHeatUp3;
            }
        }

        const deltaTemp0 = currentBrakeTemps[0] - ambientTemperature;
        const deltaTemp1 = currentBrakeTemps[1] - ambientTemperature;
        const deltaTemp2 = currentBrakeTemps[2] - ambientTemperature;
        const deltaTemp3 = currentBrakeTemps[3] - ambientTemperature;

        // Apply cool down for each temperature
        if (Math.abs(deltaTemp0) > MIN_TEMP_DELTA) {
            const deltaTempFactor0 = 1 + (deltaTemp0 ** 2) * BASE_HEAT_DIFFERENTIAL_FACTOR * fanDifferentialFactor;
            const brakeCoolDown0 = _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.calculateDeltaCoolDown(deltaTemp0, airspeed, GearLeftExtended, deltaTempFactor0, fanMultiplier);
            currentBrakeTemps[0] -= brakeCoolDown0;
            currentReportedBrakeTemps[0] -= brakeCoolDown0;
        }
        if (Math.abs(deltaTemp1) > MIN_TEMP_DELTA) {
            const deltaTempFactor1 = 1 + (deltaTemp1 ** 2) * BASE_HEAT_DIFFERENTIAL_FACTOR * fanDifferentialFactor;
            const brakeCoolDown1 = _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.calculateDeltaCoolDown(deltaTemp1, airspeed, GearLeftExtended, deltaTempFactor1, fanMultiplier);
            currentBrakeTemps[1] -= brakeCoolDown1;
            currentReportedBrakeTemps[1] -= brakeCoolDown1;
        }
        if (Math.abs(deltaTemp2) > MIN_TEMP_DELTA) {
            const deltaTempFactor2 = 1 + (deltaTemp2 ** 2) * BASE_HEAT_DIFFERENTIAL_FACTOR * fanDifferentialFactor;
            const brakeCoolDown2 = _deltaTime / 1000
            * this.getRandomArbitrary(0.8, 1.2)
            * this.calculateDeltaCoolDown(deltaTemp2, airspeed, GearRightExtended, deltaTempFactor2, fanMultiplier);
            currentBrakeTemps[2] -= brakeCoolDown2;
            currentReportedBrakeTemps[2] -= brakeCoolDown2;
        }
        if (Math.abs(deltaTemp3) > MIN_TEMP_DELTA) {
            const deltaTempFactor3 = 1 + (deltaTemp3 ** 2) * BASE_HEAT_DIFFERENTIAL_FACTOR * fanDifferentialFactor;
            const brakeCoolDown3 = _deltaTime / 1000
            * this.getRandomArbitrary(0.8, 1.2)
            * this.calculateDeltaCoolDown(deltaTemp3, airspeed, GearRightExtended, deltaTempFactor3, fanMultiplier);
            currentBrakeTemps[3] -= brakeCoolDown3;
            currentReportedBrakeTemps[3] -= brakeCoolDown3;
        }
        if (brakeFanIsOn) {
            const brakeProbeFinalTemps = [
                ambientTemperature + deltaTemp0 / 2,
                ambientTemperature + deltaTemp1 / 2,
                ambientTemperature + deltaTemp2 / 2,
                ambientTemperature + deltaTemp3 / 2,
            ];
            currentReportedBrakeTemps[0] += _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.coolProbe(brakeProbeFinalTemps[0], currentReportedBrakeTemps[0]);
            currentReportedBrakeTemps[1] += _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.coolProbe(brakeProbeFinalTemps[1], currentReportedBrakeTemps[1]);
            currentReportedBrakeTemps[2] += _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.coolProbe(brakeProbeFinalTemps[2], currentReportedBrakeTemps[2]);
            currentReportedBrakeTemps[3] += _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.coolProbe(brakeProbeFinalTemps[3], currentReportedBrakeTemps[3]);
        } else {
            currentReportedBrakeTemps[0] += _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.equalizeProbe(currentReportedBrakeTemps[0], currentBrakeTemps[0]);
            currentReportedBrakeTemps[1] += _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.equalizeProbe(currentReportedBrakeTemps[1], currentBrakeTemps[1]);
            currentReportedBrakeTemps[2] += _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.equalizeProbe(currentReportedBrakeTemps[2], currentBrakeTemps[2]);
            currentReportedBrakeTemps[3] += _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.equalizeProbe(currentReportedBrakeTemps[3], currentBrakeTemps[3]);
        }

        let brakesHot = 0;

        // Set simvars
        for (let i = 0; i < currentBrakeTemps.length; ++i) {
            SimVar.SetSimVarValue(`L:A32NX_BRAKE_TEMPERATURE_${i + 1}`, 'celsius', currentBrakeTemps[i]);
            SimVar.SetSimVarValue(`L:A32NX_REPORTED_BRAKE_TEMPERATURE_${i + 1}`, 'celsius', currentReportedBrakeTemps[i]);
            if (currentReportedBrakeTemps[i] > 300) {
                brakesHot = 1;
            }
        }

        SimVar.SetSimVarValue('L:A32NX_BRAKES_HOT', 'Bool', brakesHot);
    }
}
