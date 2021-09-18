/* eslint-disable no-underscore-dangle */
/**
 * Unit conversion utilities
 */

import { NXDataStore } from '@shared/persistence';

export class NXUnits {
    static _metricWeight: any;
    /* private static _metricWeight: boolean; */

    static get metricWeight() {
        if (NXUnits._metricWeight === undefined) {
            NXDataStore.getAndSubscribe('CONFIG_USING_METRIC_UNIT', (key, value) => {
                NXUnits._metricWeight = value === '1';
            }, '1');
        }
        return NXUnits._metricWeight;
    }

    static userToKg(value: number) {
        return NXUnits.metricWeight ? value : value / 2.20462;
    }

    static kgToUser(value: number) {
        return NXUnits.metricWeight ? value : value * 2.20462;
    }

    static userWeightUnit() {
        return NXUnits.metricWeight ? 'KG' : 'LBS'; // EIS uses S suffix on LB
    }
}
