import { useSimVar } from './simVars';

export const useComputedSpeed = () => {
    const casSimVarValues = [
        useSimVar('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED', 'knots', 500)[0],
        useSimVar('L:A32NX_ADIRS_ADR_2_COMPUTED_AIRSPEED', 'knots', 500)[0],
        useSimVar('L:A32NX_ADIRS_ADR_3_COMPUTED_AIRSPEED', 'knots', 500)[0],
    ];

    const unavailable = -1000000;
    const cas = casSimVarValues.find((cas) => Math.abs(cas - unavailable) > 0.0001);

    return typeof cas === 'undefined' ? NaN : cas;
};
