class ADIRS {
    static getMfdSupplier(mfdIndex, knobValue) {
        const adirs3ToCaptain = 0;
        const adirs3ToFO = 2;

        if (this.isCaptainSide(mfdIndex)) {
            return knobValue === adirs3ToCaptain ? 3 : 1;
        }
        return knobValue === adirs3ToFO ? 3 : 2;
    }

    static getValue(name, type) {
        const value = SimVar.GetSimVarValue(name, type);
        return ADIRS.parseValue(value);
    }

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

    static getMfdInertialReferenceSource(mfdIndex) {
        return ADIRS.getMfdSupplier(mfdIndex, SimVar.GetSimVarValue('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'Enum'));
    }

    static getMfdAirDataReferenceSource(mfdIndex) {
        return ADIRS.getMfdSupplier(mfdIndex, SimVar.GetSimVarValue('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum'));
    }

    static isCaptainSide(mfdIndex) {
        return mfdIndex === 1;
    }

    static mapNotAvailable(mfdIndex) {
        const inertialReferenceSource = ADIRS.getMfdInertialReferenceSource(mfdIndex);
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
        for (let adiruNumber = 1; adiruNumber <= 3; adiruNumber++) {
            const longitude = ADIRS.getValue(`L:A32NX_ADIRS_IR_${adiruNumber}_${type.toUpperCase()}`, `degree ${type}`);
            if (!Number.isNaN(longitude)) {
                return longitude;
            }
        }

        return NaN;
    }
}
