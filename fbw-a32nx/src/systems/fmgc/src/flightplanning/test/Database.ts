// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';

export function setupNavigraphDatabase() {
  NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Navigraph);
}
