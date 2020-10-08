/**
 * Minimum RPM for counting a wheel set as spinning (brake temperature can increase)
 */
const WHEEL_RPM_THRESHOLD = 10;

/**
 * Scale factor for heat up
 */
const HEAT_UP_SCALE = 0.000035;

/**
 * Scale factor for cool down
 */
const BASE_COOL_DOWN_FACTOR = 0.002;

const BASE_SPEED = 0.10;

const SPEED_COOLDOWN_FACTOR = 0.08;

/**
* Minimum temperature delta at which cooling is applied
* */
const MIN_TEMP_DELTA = 0.1;

class A32NX_BrakeTemp {

    /**
     * @param brakePosition {number}
     * @param wheelRpm {number}
     */
    calculateHeatUp(brakePosition, wheelRpm) {
        return HEAT_UP_SCALE * (brakePosition / 32767) * (wheelRpm ** 2);
    }

    calculateDeltaCoolDown(deltaTemp, speed, gearExtended) {
        return deltaTemp * (BASE_SPEED + gearExtended * SPEED_COOLDOWN_FACTOR * speed) * BASE_COOL_DOWN_FACTOR;
    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    constructor() {
        console.log("A32NX_BrakeTemp constructed");
    }

    init() {
        console.log("A32NX_BrakeTemp init");

        const ambientTemperature = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");

        // Initial brake temperatures

        SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_1", "celsius", ambientTemperature);
        SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_2", "celsius", ambientTemperature);
        SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_3", "celsius", ambientTemperature);
        SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_4", "celsius", ambientTemperature);
    }

    update(_deltaTime) {
        const currentBrakeLeft = SimVar.GetSimVarValue("BRAKE LEFT POSITION", "position 32k");
        const currentBrakeRight = SimVar.GetSimVarValue("BRAKE RIGHT POSITION", "position 32k");

        const currentBrakeTemps = [
            SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_1", "celsius"),
            SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_2", "celsius"),
            SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_3", "celsius"),
            SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_4", "celsius")
        ];

        const ambientTemperature = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
        const airspeed = SimVar.GetSimVarValue("AIRSPEED TRUE", "Meters per second");

        const GearLeftExtended = SimVar.GetSimVarValue("GEAR LEFT POSITION", "Percent Over 100") >= 0.25;
        const GearRightExtended = SimVar.GetSimVarValue("GEAR RIGHT POSITION", "Percent Over 100") >= 0.25;

        const wheelSet1Rpm = SimVar.GetSimVarValue("WHEEL RPM:1", "number");
        const wheelSet2Rpm = SimVar.GetSimVarValue("WHEEL RPM:2", "number");

        const wheelsAreSpinning = wheelSet1Rpm > WHEEL_RPM_THRESHOLD || wheelSet2Rpm > WHEEL_RPM_THRESHOLD;

        const anyBrakePressed = currentBrakeLeft > 0 || currentBrakeRight > 0;

        if (anyBrakePressed && wheelsAreSpinning) {
            // Apply heat up for each temperature

            const deltaHeatUpWheelSet1 = (_deltaTime / 1000) * this.calculateHeatUp(currentBrakeLeft, wheelSet1Rpm);

            if (currentBrakeLeft > 0) {
                currentBrakeTemps[0] += this.getRandomArbitrary(0.5, 1.5) * deltaHeatUpWheelSet1;
                currentBrakeTemps[1] += this.getRandomArbitrary(0.5, 1.5) * deltaHeatUpWheelSet1;
            }

            const deltaHeatUpWheelSet2 = (_deltaTime / 1000) * this.calculateHeatUp(currentBrakeLeft, wheelSet2Rpm);

            if (currentBrakeRight > 0) {
                currentBrakeTemps[2] += this.getRandomArbitrary(0.5, 1.5) * deltaHeatUpWheelSet2;
                currentBrakeTemps[3] += this.getRandomArbitrary(0.5, 1.5) * deltaHeatUpWheelSet2;
            }
        }

        const deltaTemp0 = currentBrakeTemps[0] - ambientTemperature;
        const deltaTemp1 = currentBrakeTemps[1] - ambientTemperature;
        const deltaTemp2 = currentBrakeTemps[2] - ambientTemperature;
        const deltaTemp3 = currentBrakeTemps[3] - ambientTemperature;

        // Apply cool down for each temperature
        if (Math.abs(deltaTemp0) > MIN_TEMP_DELTA) {
            currentBrakeTemps[0] -= _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.calculateDeltaCoolDown(deltaTemp0, airspeed, GearLeftExtended);
        }
        if (Math.abs(deltaTemp1) > MIN_TEMP_DELTA) {
            currentBrakeTemps[1] -= _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.calculateDeltaCoolDown(deltaTemp1, airspeed, GearLeftExtended);
        }
        if (Math.abs(deltaTemp2) > MIN_TEMP_DELTA) {
            currentBrakeTemps[2] -= _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.calculateDeltaCoolDown(deltaTemp2, airspeed, GearRightExtended);
        }
        if (Math.abs(deltaTemp3) > MIN_TEMP_DELTA) {
            currentBrakeTemps[3] -= _deltaTime / 1000 * this.getRandomArbitrary(0.8, 1.2) * this.calculateDeltaCoolDown(deltaTemp3, airspeed, GearRightExtended);
        }

        let brakesHot = 0;

        // Set simvars
        for (let i = 0; i < currentBrakeTemps.length; ++i) {
            SimVar.SetSimVarValue(`L:A32NX_BRAKE_TEMPERATURE_${i + 1}`, "celsius", currentBrakeTemps[i]);
            if (currentBrakeTemps[i] > 300) {
                brakesHot = 1;
            }
        }

        SimVar.SetSimVarValue("L:A32NX_BRAKES_HOT", "Bool", brakesHot);
    }
}