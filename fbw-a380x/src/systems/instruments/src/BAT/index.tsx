// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import './style.scss';
import React from 'react';
import { render } from '@instruments/common/index';
import { BatDisplay } from '@flybywiresim/bat';
import { useSimVar } from '@flybywiresim/fbw-sdk';

const BatRoot = () => {
    const [selectedBattery, setSelectedBattery] = useSimVar('L:A32NX_OVHD_ELEC_BAT_DISPLAY_SELECTED', 'Number', 200);

    // set to OFF if the value is out of range
    if (selectedBattery < 0 || selectedBattery > 4) {
        setSelectedBattery(0);
    }

    // OVHD BAT selector is OFF
    if (selectedBattery === 0) {
        return (
            <></>
        );
    }

    return (
        <svg className="bat-svg" viewBox="0 0 200 100">
            <BatDisplay batteryNumber={selectedBattery} x="184" y="45"/>
        </svg>
    );
};

render(<BatRoot />);
