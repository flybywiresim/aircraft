// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { NXDataStore } from '@flybywiresim/fbw-sdk';

export const fetchGsxMenu = () => fetch('../../../ingamepanels/fsdt_gsx_panel/menu')
    .then((response) => response.text())
    .then((text) => text.split(/\r?\n/))
    .catch((error) => console.error(`Failed to open GSX Menu due to ${error}`));

export const openGsxMenu = () => {
    SimVar.SetSimVarValue('L:FSDT_GSX_MENU_OPEN', 'number', 1).then(() => console.log('GSX Check: Menu Opened'));
};

export const setGsxMenuChoice = (choice: number) => {
    SimVar.SetSimVarValue('L:FSDT_GSX_MENU_CHOICE', 'number', choice).then(() => console.log(`GSX Check: Menu choice set to: ${choice}`));
};

export const payLoadSyncEnabled = NXDataStore.get('GSX_FUEL_SYNC', '0') === '1';

export const refuelSyncEnabled = NXDataStore.get('GSX_PAYLOAD_SYNC', '0') === '1';
