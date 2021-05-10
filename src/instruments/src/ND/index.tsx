import React, { useState } from 'react';
import { DisplayUnit } from '@instruments/common/displayUnit';
import { FlightPlanProvider } from '@instruments/common/flightplan';
import { render } from '../Common';
import { ArcMode } from './ArcMode';
import { DebugInfo } from './DebugInfo';

import './styles.scss';

const NavigationDisplay: React.FC = () => {
    const [displayIndex] = useState(() => {
        const url = document.getElementsByTagName('a32nx-nd-element')[0].getAttribute('url');

        return parseInt(url?.substring(url.length - 1) ?? '1', 10);
    });

    return (
        <DisplayUnit
            electricitySimvar={displayIndex === 1 ? 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED' : 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED'}
            potentiometerIndex={displayIndex === 1 ? 89 : 91}
        >
            <FlightPlanProvider>
                <svg className="pfd-svg" version="1.1" viewBox="0 0 768 768">
                    <ArcMode />

                    <DebugInfo />
                </svg>
            </FlightPlanProvider>
        </DisplayUnit>
    );
};

render(<NavigationDisplay />);
