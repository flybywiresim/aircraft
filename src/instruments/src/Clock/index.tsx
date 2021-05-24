import './style.scss';
import React from 'react';
import { render } from '@instruments/common/index';
import { useSimVar } from '@instruments/common/simVars';
import { Chrono } from './Components/Chrono';
import { Clock } from './Components/Clock';
import { ElapsedTime } from './Components/ElapsedTime';

const ClockRoot = () => {
    const [dcEssIsPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool', 250);
    const [dcHot1IsPowered] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'bool', 250);

    return dcEssIsPowered || dcHot1IsPowered ? (
        <svg version="1.1" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
            <Chrono />
            <Clock />
            <ElapsedTime />
        </svg>
    ) : null;
};

render(
    <ClockRoot />,
);
