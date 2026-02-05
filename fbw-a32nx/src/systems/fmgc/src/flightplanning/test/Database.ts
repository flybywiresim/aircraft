// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { NavigationDatabase, NavigationDatabaseBackend } from '../../NavigationDatabase';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

const eventBus = new EventBus();

export function setupTestDatabase() {
  NavigationDatabaseService.activeDatabase = new NavigationDatabase(eventBus, NavigationDatabaseBackend.Test);
}
