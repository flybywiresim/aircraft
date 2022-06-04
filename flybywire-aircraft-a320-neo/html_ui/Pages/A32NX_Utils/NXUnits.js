/**
 * Unit conversion utilities
 */

class NXUnits {
    /* private static _metricWeight: boolean; */

    static get metricWeight() {
        if (NXUnits._metricWeight === undefined) {
            NXDataStore.getAndSubscribe('CONFIG_USING_METRIC_UNIT', (key, value) => {
                NXUnits._metricWeight = value === '1';
            }, '1');
        }
        return NXUnits._metricWeight;
    }

    static userToKg(value) {
        return NXUnits.metricWeight ? value : value * 0.4535934;
    }

    static kgToUser(value) {
        return NXUnits.metricWeight ? value : value / 0.4535934;
    }

    static userWeightUnit() {
        return NXUnits.metricWeight ? 'KG' : 'LBS'; // EIS uses S suffix on LB
    }

    /**
     * Converts meter into ft if imperial units are selected
     * @param value {number} in unit Meters
     * @returns {number} in metric or ft
     */
    static mToUser(value) {
        return NXUnits.metricWeight ? value : value * 3.28084;
    }

    /**
     * Returns 'M' for meters and 'FT' for feet depending on the unit system selected
     * @returns {string} 'M' (meter) OR 'FT' (feet)
     */
    static userDistanceUnit() {
        return NXUnits.metricWeight ? 'M' : 'FT';
    }
}
