class ADIRS {
    static getNdSupplier(displayIndex, knobValue) {
        const adirs3ToCaptain = 0;
        const adirs3ToFO = 2;

        if (this.isCaptainSide(displayIndex)) {
            return knobValue === adirs3ToCaptain ? 3 : 1;
        }
        return knobValue === adirs3ToFO ? 3 : 2;
    }

    /**
     * Retrieves an ADIRS value of the given name and type.
     *
     * @returns {(number|NaN)} Returns the value when available.
     * Returns NaN when the value is not available, for example due to the ADR being off.
     */
    static getValue(name, type) {
        const value = SimVar.GetSimVarValue(name, type);
        return ADIRS.parseValue(value);
    }

    /**
     * Parses the given ADIRS value. When the value indicates
     * "unavailable", it is converted into NaN.
     */
    static parseValue(value) {
        const unavailable = -1000000;
        return Math.abs(value - unavailable) < 0.0001 ? NaN : value;
    }

    static getVerticalSpeed(inertialReferenceSource, airDataReferenceSource) {
        // When available, the IR V/S has priority over the ADR barometric V/S.
        const verticalSpeed = ADIRS.getValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_VERTICAL_SPEED`, 'feet per minute');
        return !Number.isNaN(verticalSpeed)
            ? verticalSpeed
            : ADIRS.getValue(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_BAROMETRIC_VERTICAL_SPEED`, 'feet per minute');
    }

    static getNdInertialReferenceSource(displayIndex) {
        return ADIRS.getNdSupplier(displayIndex, SimVar.GetSimVarValue('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'Enum'));
    }

    static getNdAirDataReferenceSource(displayIndex) {
        return ADIRS.getNdSupplier(displayIndex, SimVar.GetSimVarValue('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum'));
    }

    static isCaptainSide(displayIndex) {
        return displayIndex === 1;
    }

    static mapNotAvailable(displayIndex) {
        const inertialReferenceSource = ADIRS.getNdInertialReferenceSource(displayIndex);
        return Number.isNaN(ADIRS.getValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LATITUDE`, 'degree')) ||
            Number.isNaN(ADIRS.getValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LONGITUDE`, 'degree'));
    }

    static getLatitude() {
        return ADIRS.getLocation('latitude');
    }

    static getLongitude() {
        return ADIRS.getLocation('longitude');
    }

    static getLocation(type) {
        // In the real aircraft, FMGC 1 is supplied by ADIRU 1, and FMGC 2 by ADIRU 2. When any is unavailable
        // the FMGC switches to ADIRU 3. If only one ADIRU is available, both FMGCs use the same ADIRU.
        // As we don't have a split FMGC, we'll just use the following code for now.
        return ADIRS.getFromAnyIr(type.toUpperCase(), `degree ${type}`);
    }

    static getMachSpeed() {
        return ADIRS.getFromAnyAdr('MACH', 'Mach');
    }

    static getTrueSpeed() {
        return ADIRS.getFromAnyAdr('TRUE_AIRSPEED', 'Knots');
    }

    static getComputedSpeed() {
        return ADIRS.getFromAnyAdr('COMPUTED_AIRSPEED', 'Knots');
    }

    /**
     * Gets the vertical speed according to the inertial system when available,
     * barometric vertical speed otherwise.
     */
    static getVerticalSpeed() {
        const irVerticalSpeed = ADIRS.getInertialVerticalSpeed();
        return !Number.isNaN(irVerticalSpeed)
            ? irVerticalSpeed
            : ADIRS.getBarometricVerticalSpeed();
    }

    static getInertialVerticalSpeed() {
        return ADIRS.getFromAnyIr('VERTICAL_SPEED', 'Feet per minute');
    }

    static getBarometricVerticalSpeed() {
        return ADIRS.getFromAnyAdr('BAROMETRIC_VERTICAL_SPEED', 'Feet per minute');
    }

    static getPitch() {
        return ADIRS.getFromAnyIr('PITCH', 'Degrees');
    }

    static getRoll() {
        return ADIRS.getFromAnyIr('ROLL', 'Degrees');
    }

    static getHeading() {
        return ADIRS.getFromAnyIr('HEADING', 'Degrees');
    }

    static fromKnotsToMetersPerSecond(value) {
        return value * 0.514444;
    }

    static getFromAnyAdr(name, type) {
        return ADIRS.getFromAny((number) => ADIRS.getValue(`L:A32NX_ADIRS_ADR_${number}_${name}`, type));
    }

    static getFromAnyIr(name, type) {
        return ADIRS.getFromAny((number) => ADIRS.getValue(`L:A32NX_ADIRS_IR_${number}_${name}`, type));
    }

    static getFromAny(getterFn) {
        for (let number = 1; number <= 3; number++) {
            const value = getterFn(number);
            if (!Number.isNaN(value)) {
                return value;
            }
        }

        return NaN;
    }
}
