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
        return NXUnits.metricWeight ? value : value / 2.204625;
    }

    static kgToUser(value) {
        return NXUnits.metricWeight ? value : value * 2.204625;
    }

    static poundsToUser(value) {
        return NXUnits.metricWeight ? value / 2.204625 : value;
    }

    static userWeightUnit() {
        return NXUnits.metricWeight ? 'KG' : 'LBS'; // EIS uses S suffix on LB
    }
}
