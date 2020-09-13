/**
 * Minimum RPM for counting a wheel set as spinning (brake temperature can increase)
 */
const WHEEL_RPM_THRESHOLD = 10;

/**
 * Weight of wheel set RPM in heat up calculation
 */
const HEAT_UP_RPM_FACTOR = 0.001;

/**
 * Scale factor for heat up
 */
const HEAT_UP_SCALE = 1.75;

/**
 * Scale factor for cool down
 */
const COOL_DOWN_SCALE = 1;

class A32NX_BrakeTemp {

    /**
     * @param brakePosition {number}
     * @param wheelRpm {number}
     */
    calculateHeatUp(brakePosition, wheelRpm) {
        return (((brakePosition / 32767) + (wheelRpm * HEAT_UP_RPM_FACTOR)) * HEAT_UP_SCALE) ** 2;
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
        const currentParkingBrake = SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool");
        const currentBrakeLeft = SimVar.GetSimVarValue("BRAKE LEFT POSITION", "position 32k");
        const currentBrakeRight = SimVar.GetSimVarValue("BRAKE RIGHT POSITION", "position 32k");

        const currentBrakeTemps = [
            SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_1", "celsius"),
            SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_2", "celsius"),
            SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_3", "celsius"),
            SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_4", "celsius")
        ];

        const ambientTemperature = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");

        const wheelSet1Rpm = SimVar.GetSimVarValue("WHEEL RPM:1", "number");
        const wheelSet2Rpm = SimVar.GetSimVarValue("WHEEL RPM:2", "number");

        const wheelsAreSpinning = wheelSet1Rpm > WHEEL_RPM_THRESHOLD || wheelSet2Rpm > WHEEL_RPM_THRESHOLD;

        const anyBrakePressed = currentBrakeLeft > 0 || currentBrakeRight > 0

        if (anyBrakePressed && wheelsAreSpinning && !currentParkingBrake) {
            // Apply heat up for each temperature

            const deltaHeatUpWheelSet1 = (_deltaTime / 1000) * this.calculateHeatUp(currentBrakeLeft, wheelSet1Rpm);

            if (currentBrakeLeft > 0) {
                SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_1", "celsius", currentBrakeTemps[0] + Math.random() * deltaHeatUpWheelSet1);
                SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_2", "celsius", currentBrakeTemps[1] + Math.random() * deltaHeatUpWheelSet1);
            }

            const deltaHeatUpWheelSet2 = (_deltaTime / 1000) * this.calculateHeatUp(currentBrakeLeft, wheelSet2Rpm);

            if (currentBrakeRight > 0) {
                SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_3", "celsius", currentBrakeTemps[2] + Math.random() * deltaHeatUpWheelSet2);
                SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_4", "celsius", currentBrakeTemps[3] + Math.random() * deltaHeatUpWheelSet2);
            }
        } else {
            // Apply cool down for each temperature

            const deltaCoolDown = (_deltaTime / 1000) * COOL_DOWN_SCALE;

            if (!wheelsAreSpinning || currentBrakeLeft <= 0) {
                if (currentBrakeTemps[0] > ambientTemperature) {
                    SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_1", "celsius", currentBrakeTemps[0] - Math.random() * deltaCoolDown);
                }

                if (currentBrakeTemps[1] > ambientTemperature) {
                    SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_2", "celsius", currentBrakeTemps[1] - Math.random() * deltaCoolDown);
                }
            }

            if (!wheelsAreSpinning || currentBrakeRight <= 0) {
                if (currentBrakeTemps[2] > ambientTemperature) {
                    SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_3", "celsius", currentBrakeTemps[2] - Math.random() * deltaCoolDown);
                }

                if (currentBrakeTemps[3] > ambientTemperature) {
                    SimVar.SetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_4", "celsius", currentBrakeTemps[3] - Math.random() * deltaCoolDown);
                }
            }
        }
    }

}