// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

import { customAlphabet } from 'nanoid';
import { render } from '@instruments/common/index';
import { readSettingsFromPersistentStorage, migrateSettings, EfbInstrument } from '@flybywiresim/flypad';
import { A320FailureDefinitions } from '@failures';

// TODO move all of this to fbw-common somehow

const setSessionId = () => {
    const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const SESSION_ID_LENGTH = 14;
    const nanoid = customAlphabet(ALPHABET, SESSION_ID_LENGTH);
    const generatedSessionID = nanoid();

    NXDataStore.set('A32NX_SENTRY_SESSION_ID', generatedSessionID);
};

const setup = () => {
    readSettingsFromPersistentStorage();
    migrateSettings();
    setSessionId();

    // Needed to fetch METARs from the sim
    RegisterViewListener('JS_LISTENER_FACILITY', () => {
        console.log('JS_LISTENER_FACILITY registered.');
    }, true);
};

if (process.env.VITE_BUILD) {
    window.addEventListener('AceInitialized', setup);
} else {
    setup();
}

render(
    <EfbInstrument failures={A320FailureDefinitions} />,
    true,
    true,
);
