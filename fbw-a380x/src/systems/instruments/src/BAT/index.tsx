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

    // mapping of knob (lvar) values to battery numbers to allow easy lvar and model values
    const batteryMap = [4, 3, 0, 1, 2]; // ESS, APU, OFF, BAT1, BAT2
    const batteryNumber = batteryMap[selectedBattery];

    // OVHD BAT selector is OFF
    if (batteryNumber === 0) {
        return (
            <></>
        );
    }

    return (
        <svg className="bat-svg" viewBox="0 0 200 100">
            <BatDisplay batteryNumber={batteryNumber} x="184" y="45"/>
        </svg>
    );
};

render(<BatRoot />);
