
function isReady() {
    return SimVar.GetSimVarValue('L:A32NX_IS_READY', 'number') === 1;
}

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

class A32NX_GearStatus {
    constructor(gearIndex, gearPositionSimVar, brakePositionSimVar, wheelRPMSimVar) {
        this.gearIndex = gearIndex;
        this.gearPositionSimVar = gearPositionSimVar;
        this.gearPosition = 0;
        this.brakePositionSimVar = brakePositionSimVar;
        this.brakePosition = 0;
        this.wheelRPMSimVar = wheelRPMSimVar;
        this.wheelRPM = 0;
    }

    update(deltaTime) {
        this.gearPosition = SimVar.GetSimVarValue(this.gearPositionSimVar, "Percent Over 100");
        this.brakePosition =  SimVar.GetSimVarValue(this.brakePositionSimVar, "position 32k");
        this.wheelRPM = SimVar.GetSimVarValue(this.wheelRPMSimVar, "number");
    }

    extended() {
        return this.gearPosition >= 0.25;
    }

    fullyExtended() {
        console.log("GEAR POS", this.gearPosition)
        return this.gearPosition === 100;
    }

    brakePressed() {
        return this.brakePosition > 0;
    }

    wheelSpinning() {
        return this.wheelRPM > WHEEL_RPM_THRESHOLD
    }

    calculateHeatUpPerSecond() {
        return HEAT_UP_SCALE * (this.brakePosition / 32767.0) * ((this.wheelRPM * 1.14) ** 2);
    }
}


class A32NX_BrakeFan {
    constructor(brakeFanSimVar, brakeFanPressedSimVar, leftGearStatus) {
        this.brakeFanSimVar = brakeFanSimVar;
        this.brakeFan = false;
        this.brakeFanPressedSimVar = brakeFanPressedSimVar;
        this.brakeFanPressed = false;
        this.leftGearStatus = leftGearStatus;
    }

    update(deltaTime) {
        this.brakeFan = SimVar.GetSimVarValue(this.brakeFanSimVar, "Bool") === 0 ? false : true;
        this.brakeFanPressed = SimVar.GetSimVarValue(this.brakeFanPressedSimVar, "Bool") === 0 ? false : true;
        if(this.shouldBeOn()) {
            SimVar.SetSimVarValue(this.brakeFanSimVar, "Bool", true);
        } else {
            SimVar.SetSimVarValue(this.brakeFanSimVar, "Bool", false);
        }
    }

    shouldBeOn() {
        console.log("BRAKE SHLD", this.brakeFanPressed, this.leftGearStatus.fullyExtended(), this.brakeFanPressed && this.leftGearStatus.fullyExtended())
        return this.brakeFanPressed && this.leftGearStatus.fullyExtended();
    }

    fanMultiplier() {
        return this.shouldBeOn() ? 4.35 : 1.0;
    }

    fanDifferentialFactor() {
        return this.shouldBeOn() ? 0.28 : 1.0;
    }
}


/**
 * Scale factor for cool down
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

class A32NX_OneBrakeTemp {
    constructor(brakeIndex, brakeTempSimVar, reportedBrakeTempSimVar, gearStatus, brakeFan) {
        this.brakeIndex = brakeIndex;
        this.brakeTempSimVar = brakeTempSimVar;
        this.brakeTemp = null;
        this.reportedBrakeTempSimVar = reportedBrakeTempSimVar;
        this.reportedBrakeTemp = null;
        this.gearStatus = gearStatus;
        this.brakeFan = brakeFan;
    }

    calculateDeltaCoolDown(deltaTemp, speed, deltaTempFactor) {
        return (deltaTemp * (BASE_SPEED + this.gearStatus.extended() * SPEED_COOLDOWN_FACTOR * speed) * BASE_COOL_DOWN_FACTOR) * deltaTempFactor * this.brakeFan.fanMultiplier();
    }

    //the brake fan is actively cooling the temp probe faster than it is cooling the brakes
    coolProbe(finalTemp, currentReportedBrakeTemp) {
        return (finalTemp - currentReportedBrakeTemp) * BASE_COOL_DOWN_FACTOR;
    }
    //the brake fan is off, the temp probe is slowly reaching back up to brake temp
    equalizeProbe(currentReportedBrakeTemp, currentBrakeTemp) {
        return (currentBrakeTemp - currentReportedBrakeTemp) * BASE_HEAT_UP_FACTOR;
    }

    hot() {
        return this.brakeTemp > 300;
    }

    update(deltaTime, ambiantTemperature, airspeed) {
        const secondRatio = (deltaTime/1000);

        console.log("UPDATE STA", this.brakeIndex, this.brakeTemp)

        if (this.brakeTemp === null || this.reportedBrakeTemp === null) {
            this.brakeTemp = ambiantTemperature;
            this.reportedBrakeTemp = ambiantTemperature;
        } else {
            this.brakeTemp = SimVar.GetSimVarValue(this.brakeTempSimVar, "celsius");
            this.reportedBrakeTemp = SimVar.GetSimVarValue(this.reportedBrakeTempSimVar, "celsius");
        }

        // Don't need to check for spinning wheel of applied brakes, it's handled by calculateHeatUpPerSecond()
        const heatUpFactor = secondRatio * getRandomArbitrary(0.5, 1.5) * this.gearStatus.calculateHeatUpPerSecond() ;
        this.brakeTemp += heatUpFactor;
        this.reportedBrakeTemp += heatUpFactor;
        console.log("HEAT", this.brakeIndex, heatUpFactor)
        // Cooldown
        const deltaAmbiant = this.brakeTemp - ambiantTemperature;
        if (Math.abs(deltaAmbiant) > MIN_TEMP_DELTA) {
            const deltaTempFactor = 1 + Math.pow(deltaAmbiant, 2) * BASE_HEAT_DIFFERENTIAL_FACTOR * this.brakeFan.fanDifferentialFactor();
            const brakeCoolDown = secondRatio * getRandomArbitrary(0.8, 1.2) * this.calculateDeltaCoolDown(deltaAmbiant, airspeed,  deltaTempFactor);

            console.log("COOL", this.brakeIndex, brakeCoolDown)
            this.brakeTemp -= brakeCoolDown;
            this.reportedBrakeTemp -= brakeCoolDown;
        }

        console.log("TEST", this.brakeFan.shouldBeOn(), ambiantTemperature + deltaAmbiant / 2.0)

        if(this.brakeFan.shouldBeOn()) {
            const probeTargetTemp = ambiantTemperature + deltaAmbiant / 2.0
            console.log("FAN COOL", this.brakeIndex,  secondRatio * this.coolProbe(probeTargetTemp, this.reportedBrakeTemp))
            this.reportedBrakeTemp += secondRatio * getRandomArbitrary(0.8, 1.2) * this.coolProbe(probeTargetTemp, this.reportedBrakeTemp);
        } else {
            console.log("FAN EQL", this.brakeIndex,  secondRatio * this.equalizeProbe(this.reportedBrakeTemp, this.brakeTemp))
            this.reportedBrakeTemp += secondRatio * getRandomArbitrary(0.8, 1.2) * this.equalizeProbe(this.reportedBrakeTemp, this.brakeTemp);
        }

        SimVar.SetSimVarValue(this.brakeTempSimVar, "celsius", this.brakeTemp);
        SimVar.SetSimVarValue(this.reportedBrakeTempSimVar, "celsius", this.reportedBrakeTemp);
    }
}

class A32NX_BrakeTemp {

    constructor() {
        this.initializedAmbientBrakeTemp = false;
        this.gearLeft = new A32NX_GearStatus(0, "L:A32NX_GEAR_LEFT_POSITION", "BRAKE LEFT POSITION", "WHEEL RPM:1");
        this.gearRight = new A32NX_GearStatus(1, "L:A32NX_GEAR_RIGHT_POSITION", "BRAKE RIGHT POSITION", "WHEEL RPM:2");
        this.brakeFan = new A32NX_BrakeFan("L:A32NX_BRAKE_FAN", "L:A32NX_BRAKE_FAN_BTN_PRESSED", this.gearLeft)
        this.brakes = [
            new A32NX_OneBrakeTemp(0, "L:A32NX_BRAKE_TEMPERATURE_1", "L:A32NX_REPORTED_BRAKE_TEMPERATURE_1", this.gearLeft, this.brakeFan),
            new A32NX_OneBrakeTemp(1, "L:A32NX_BRAKE_TEMPERATURE_2", "L:A32NX_REPORTED_BRAKE_TEMPERATURE_2", this.gearLeft, this.brakeFan),
            new A32NX_OneBrakeTemp(2, "L:A32NX_BRAKE_TEMPERATURE_3", "L:A32NX_REPORTED_BRAKE_TEMPERATURE_3", this.gearLeft, this.brakeFan),
            new A32NX_OneBrakeTemp(3, "L:A32NX_BRAKE_TEMPERATURE_4", "L:A32NX_REPORTED_BRAKE_TEMPERATURE_4", this.gearLeft, this.brakeFan)
        ]
    }

    init() { }

    update(_deltaTime) {
        if(!isReady()) {
            return
        }
        const ambientTemperature = Simplane.getAmbientTemperature();
        const airspeed = SimVar.GetSimVarValue("AIRSPEED TRUE", "Meters per second");

        this.gearLeft.update(_deltaTime);
        this.gearRight.update(_deltaTime);
        this.brakeFan.update(_deltaTime);

        let someHot = false;

        this.brakes.forEach((brake) => {
            brake.update(_deltaTime, ambientTemperature, airspeed);
            someHot = someHot || brake.hot()
        })

        SimVar.SetSimVarValue("L:A32NX_BRAKES_HOT", "Bool", someHot);
    }
}
