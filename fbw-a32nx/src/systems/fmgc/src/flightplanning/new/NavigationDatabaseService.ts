// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NavigationDatabase } from '@fmgc/NavigationDatabase';

export class NavigationDatabaseService {
    static version = 0;

    static _activeDatabase: NavigationDatabase;

    static get activeDatabase(): NavigationDatabase {
        return this._activeDatabase;
    }

    static set activeDatabase(db: NavigationDatabase) {
        this._activeDatabase = db;
        this.version++;
    }
}
