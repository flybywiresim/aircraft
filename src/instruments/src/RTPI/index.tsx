import './style.scss';
import React from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { render } from '../Common';
import { useSimVar } from '../Common/simVars';

const RTPIDisplay = () => {
    const [ltsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Bool', 400);
    const fac2DiscreteWord2 = useArinc429Var('L:A32NX_FAC_2_DISCRETE_WORD_2');

    const facSourceForTrim = fac2DiscreteWord2.getBitValueOr(13, false) ? 2 : 1;
    const trimPos = useArinc429Var(`L:A32NX_FAC_${facSourceForTrim}_RUDDER_TRIM_POS`);

    if (!trimPos.isFailureWarning() || ltsTest === 0) {
        const directionText = trimPos.value >= 0 ? 'L' : 'R';

        return (
            <>
                <text x="0" y="110" className="direction">{ltsTest === 0 ? 'T' : directionText}</text>
                <text x="330" y="110" className="value">{ltsTest === 0 ? '88.8' : `${Math.abs(trimPos.value).toFixed(1)}`}</text>
            </>
        );
    }
    return null;
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
