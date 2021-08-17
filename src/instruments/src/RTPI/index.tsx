import './style.scss';
import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { render } from '../Common';

const RTPIDisplay = () => {
    const [ltsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Bool', 400);
    const [rudderTrim] = useSimVar('RUDDER TRIM', 'degrees', 100);

    const directionText = rudderTrim <= 0 ? 'L' : 'R';

    return (
        <>
            <text x="0" y="110" className="direction">{ltsTest === 0 ? 'T' : directionText}</text>
            <text x="330" y="110" className="value">{ltsTest === 0 ? '88.8' : `${Math.abs(rudderTrim).toFixed(1)}`}</text>
        </>
    );
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
