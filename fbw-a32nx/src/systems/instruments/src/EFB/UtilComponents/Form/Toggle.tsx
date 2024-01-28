// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

interface ToggleProps {
    value: boolean;
    onToggle: (value: boolean) => void;
    disabled?: boolean;
}

export const Toggle = ({ value, onToggle, disabled }: ToggleProps) => (
    <div className={`flex h-8 w-14 cursor-pointer items-center rounded-full ${disabled ? 'bg-theme-unselected' : 'bg-theme-accent'}`} onClick={() => !disabled && onToggle(!value)}>
        <div className={`mx-1.5 h-6 w-6 rounded-full bg-white transition duration-200${value && '!bg-theme-highlight translate-x-5'}`} />
    </div>
);
