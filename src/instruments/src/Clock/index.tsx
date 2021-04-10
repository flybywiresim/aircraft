import './style.scss';
import React from 'react';
import { render } from '../Common';
import { useSimVar } from '../Common/simVars';
import { Chrono } from './Components/Chrono';
import { Clock } from './Components/Clock';
import { ElapsedTime } from './Components/ElapsedTime';

const ClockRoot = () => {
    const [powerAvailable] = useSimVar('L:DCPowerAvailable', 'bool', 250);

    return powerAvailable ? (
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
