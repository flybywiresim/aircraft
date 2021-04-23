import './style.scss';
import React from 'react';
import { render } from '../Common';
import { useSimVar } from '../Common/simVars';

const RTPIDisplay = () => {
    const [ltsTest] = useSimVar('L:XMLVAR_LTS_Test', 'Bool', 400);
    const [rudderTrim] = useSimVar('RUDDER TRIM', 'degrees', 100);

    const directionText = rudderTrim <= 0 ? 'L' : 'R';

    return (
        <>
            <text x="0" y="115" className="direction">{ltsTest ? '8' : directionText}</text>
            <text x="330" y="115" className="value">{ltsTest ? '88.8' : `${Math.abs(rudderTrim).toFixed(1)}`}</text>
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
