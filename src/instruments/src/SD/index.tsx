import { DisplayUnit } from '@instruments/common/displayUnit';
import React, { useState } from 'react';
import { render } from '@instruments/common/index';
import { useInteractionEvent } from '@instruments/common/hooks';
import './style.scss';

import { useSimVar } from '@instruments/common/simVars';
import { PagesContainer } from './PagesContainer';
import { StatusArea } from './StatusArea/StatusArea';

const Idle = () => {
    const [inop, setInop] = useState(false);

    useInteractionEvent('A32NX_DCDU_BTN_INOP', () => {
        if (!inop) {
            setInop(true);
            setTimeout(() => {
                setInop(false);
            }, 3000);
        }
    });

    return (
        <div id="Mainframe">
            <svg className="sd-svg" viewBox="0 0 600 600">
                <PagesContainer />
            </svg>

            <StatusArea />
        </div>
    );
};

render(
    <DisplayUnit
        electricitySimvar="L:A32NX_ELEC_AC_2_BUS_IS_POWERED"
        potentiometerIndex={91}
    >
        <Idle />
    </DisplayUnit>,
);
