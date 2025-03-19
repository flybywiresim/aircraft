// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NavigationDatabase, NavigationDatabaseBackend } from '../../NavigationDatabase';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export function setupTestDatabase() {
  NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Test);
}
