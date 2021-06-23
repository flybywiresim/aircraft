import React, { useState } from 'react';
import { DisplayUnit } from '@instruments/common/displayUnit';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { render } from '../Common';
import { ArtificialHorizon } from './ArtificialHorizon';
import { BugSetup } from './BugSetup';

import './style.scss';

const ISISDisplay: React.FC = () => {
    const [dcEssLive] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool');
    const [dcHotLive] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'bool');
    const [ias] = useSimVar('AIRSPEED INDICATED', 'knots');
    const [bugsActive, setBugsActive] = useSimVar('L:A32NX_ISIS_BUGS_ACTIVE', 'enum');
    const [mode, setMode] = useState('AHI');

    useInteractionEvent('A32NX_ISIS_BUGS_PRESSED', () => {
        if (mode === 'AHI') {
            setBugsActive(1);
            setMode('BUG');
        } else {
            setBugsActive(0);
            setMode('AHI');
        }
    });

    if (ias > 50 && dcHotLive || dcEssLive) {
        return (
            <svg className="isis-svg" version="1.1" viewBox="0 0 512 512">
                {{
                    AHI: <ArtificialHorizon />,
                    BUG: <BugSetup />,
                }[mode]}
            </svg>
        );
    }
    return <></>;
};

render(<ISISDisplay />);
