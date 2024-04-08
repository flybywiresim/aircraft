// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import {ChecklistProvider, NXDataStore} from '@flybywiresim/fbw-sdk';

import { customAlphabet } from 'nanoid';
import { render } from '@instruments/common/index';
import { readSettingsFromPersistentStorage, migrateSettings, EfbInstrument } from '@flybywiresim/flypad';
import {A380FailureDefinitions} from "../../../failures";

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

ChecklistProvider.getInstance().readChecklist()
    .then((aircraftChecklistsFromJson) => {
        console.log('Checklists loaded');
        render(<EfbInstrument failures={A380FailureDefinitions} aircraftChecklists={aircraftChecklistsFromJson} />,);
    })
    .catch((error) => {
        console.error('Failed to load checklists', error);
    });
