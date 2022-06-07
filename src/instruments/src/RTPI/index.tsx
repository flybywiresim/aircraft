import './style.scss';
import React from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { render } from '../Common';
import { useSimVar } from '../Common/simVars';

const RTPIDisplay = () => {
    const [ltsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Bool', 400);
    const fac1RudderTrimPos = useArinc429Var('L:A32NX_FAC_1_RUDDER_TRIM_POS');
    const fac2RudderTrimPos = useArinc429Var('L:A32NX_FAC_2_RUDDER_TRIM_POS');

    const fac1DiscreteWord2 = useArinc429Var('L:A32NX_FAC_1_DISCRETE_WORD_2');
    const fac2DiscreteWord2 = useArinc429Var('L:A32NX_FAC_2_DISCRETE_WORD_2');

    const yawDamper1Engaged = fac1DiscreteWord2.getBitValueOr(11, false);
    const yawDamper2Engaged = fac2DiscreteWord2.getBitValueOr(11, false);

    const rudderTrimPosValid = fac1RudderTrimPos.isNormalOperation() || fac2RudderTrimPos.isNormalOperation();
    const rudderTrimPos = yawDamper1Engaged || !yawDamper2Engaged ? fac1RudderTrimPos.value : fac2RudderTrimPos.value;

    const directionText = rudderTrimPos <= 0 ? 'L' : 'R';

    return rudderTrimPosValid ? (
        <>
            <text x="0" y="110" className="direction">{ltsTest === 0 ? 'T' : directionText}</text>
            <text x="330" y="110" className="value">{ltsTest === 0 ? '88.8' : `${Math.abs(rudderTrimPos).toFixed(1)}`}</text>
        </>
    ) : null;
};

const RTPIRoot = () => {
    const [dc2IsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Boolean', 250);

    if (!dc2IsPowered) return null;

    return (
        <svg className="rtpi-svg" viewBox="0 0 338 128">
            <RTPIDisplay />
        </svg>
    );
};

render(<RTPIRoot />);
