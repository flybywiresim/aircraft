class ADIRS {
    static getNdSupplier(displayIndex, knobValue) {
        const adirs3ToCaptain = 0;
        const adirs3ToFO = 2;

        if (this.isCaptainSide(displayIndex)) {
            return knobValue === adirs3ToCaptain ? 3 : 1;
        }
        return knobValue === adirs3ToFO ? 3 : 2;
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
        return !Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LATITUDE`).isNormalOperation() ||
            !Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LONGITUDE`).isNormalOperation();
    }

    static getLatitude() {
        return ADIRS.getLocation('LATITUDE');
    }

    static getLongitude() {
        return ADIRS.getLocation('LONGITUDE');
    }

    static getLocation(type) {
        // In the real aircraft, FMGC 1 is supplied by ADIRU 1, and FMGC 2 by ADIRU 2. When any is unavailable
        // the FMGC switches to ADIRU 3. If only one ADIRU is available, both FMGCs use the same ADIRU.
        // As we don't have a split FMGC, we'll just use the following code for now.
        const fromAdiru = 1;
        const toAdiru = 3;
        for (let adiruNumber = fromAdiru; adiruNumber <= toAdiru; adiruNumber++) {
            const location = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${adiruNumber}_${type}`);
            if (location.isNormalOperation() || adiruNumber === toAdiru) {
                return location;
            }
        }
    }
}
