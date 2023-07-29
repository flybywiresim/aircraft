// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import { getAirframeType } from '../../../Efb';
import { A320Payload } from './A320_251N/A320Payload';
import { A380Payload } from './A380_842/A380Payload';

export const Payload = () => {
    switch (getAirframeType()) {
    case 'A380_842':
        return (
            <A380Payload />
        );
    case 'A320_251N':
    default:
        return (
            <A320Payload />
        );
    }
};
