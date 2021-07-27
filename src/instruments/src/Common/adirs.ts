import { useSimVar } from '@instruments/common/simVars';

export class ADIRS {
    static getNdSupplier(displayIndex: number, knobValue: number): number {
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
    static getValue(name: string, type: string): number {
        const value = SimVar.GetSimVarValue(name, type);
        return ADIRS.parseValue(value);
    }

    static updateValue(name: string, type: string, time: number) {
        const [value] = useSimVar(name, type, time);
        return ADIRS.parseValue(value);
    }

    /**
     * Parses the given ADIRS value. When the value indicates
     * "unavailable", it is converted into NaN.
     */
    static parseValue(value: number): number {
        const unavailable = -1000000;
        return Math.abs(value - unavailable) < 0.0001 ? NaN : value;
    }

    static getVerticalSpeed(inertialReferenceSource: number, airDataReferenceSource: number): number {
        // When available, the IR V/S has priority over the ADR barometric V/S.
        const verticalSpeed = ADIRS.getValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_VERTICAL_SPEED`, 'feet per minute');
        return !Number.isNaN(verticalSpeed)
            ? verticalSpeed
            : ADIRS.getValue(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_BAROMETRIC_VERTICAL_SPEED`, 'feet per minute');
    }

    static getNdInertialReferenceSource(displayIndex: number): number {
        return ADIRS.getNdSupplier(displayIndex, SimVar.GetSimVarValue('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'Enum'));
    }

    static getNdAirDataReferenceSource(displayIndex: number): number {
        return ADIRS.getNdSupplier(displayIndex, SimVar.GetSimVarValue('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum'));
    }

    static isCaptainSide(displayIndex: number) {
        return displayIndex === 1;
    }

    static mapNotAvailable(displayIndex: number) {
        const inertialReferenceSource = ADIRS.getNdInertialReferenceSource(displayIndex);
        return Number.isNaN(ADIRS.getValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LATITUDE`, 'degree'))
            || Number.isNaN(ADIRS.getValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_LONGITUDE`, 'degree'));
    }

    static getLatitude() {
        return ADIRS.getLocation('latitude');
    }

    static getLongitude() {
        return ADIRS.getLocation('longitude');
    }

    static getLocation(type: string) {
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
