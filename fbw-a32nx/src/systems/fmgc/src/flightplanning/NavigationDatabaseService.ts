// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NavigationDatabase } from '@fmgc/NavigationDatabase';

export class NavigationDatabaseService {
  static version = 0;

  private static activeDb: NavigationDatabase;

  static get activeDatabase(): NavigationDatabase {
    return this.activeDb;
  }

  static set activeDatabase(db: NavigationDatabase) {
    this.activeDb = db;
    this.version++;
  }
}
