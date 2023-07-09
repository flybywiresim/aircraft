// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from './flightplanning/new/FlightPlanService';
import { NavigationDatabase, NavigationDatabaseBackend } from './NavigationDatabase';
import { FlightPlanManager } from './flightplanning/FlightPlanManager';
import { FlightPhaseManager, getFlightPhaseManager } from './flightphase';
import { FlightPlanAsoboSync } from './flightplanning/FlightPlanAsoboSync';
import { GuidanceController } from './guidance/GuidanceController';
import { EfisSymbols } from './efis/EfisSymbols';
import { DescentPathBuilder } from './guidance/vnav/descent/DescentPathBuilder';
import { initComponents, updateComponents, recallMessageById } from './components';
import { WaypointBuilder } from './flightplanning/WaypointBuilder';
import { RawDataMapper } from './flightplanning/RawDataMapper';
import { Navigation, SelectedNavaidMode, SelectedNavaidType } from './navigation/Navigation';
import { WaypointFactory } from './flightplanning/new/waypoints/WaypointFactory';
import { WaypointEntryUtils } from './flightplanning/new/WaypointEntryUtils';
import { FlightPlanIndex } from './flightplanning/new/FlightPlanManager';
import { NavigationDatabaseService } from './flightplanning/new/NavigationDatabaseService';
import { SimBriefUplinkAdapter } from './flightplanning/new/uplink/SimBriefUplinkAdapter';

function initFmgcLoop(baseInstrument: BaseInstrument, flightPlanService: FlightPlanService): void {
    initComponents(baseInstrument, flightPlanService);
}

function updateFmgcLoop(deltaTime: number): void {
    updateComponents(deltaTime);
}

export {
    FlightPlanService,
    NavigationDatabase,
    NavigationDatabaseBackend,
    NavigationDatabaseService,
    FlightPlanIndex,
    FlightPhaseManager,
    getFlightPhaseManager,
    FlightPlanManager,
    FlightPlanAsoboSync,
    GuidanceController,
    initFmgcLoop,
    updateFmgcLoop,
    recallMessageById,
    EfisSymbols,
    DescentPathBuilder,
    WaypointBuilder,
    RawDataMapper,
    Navigation,
    SelectedNavaidMode,
    SelectedNavaidType,
    WaypointFactory,
    WaypointEntryUtils,
    SimBriefUplinkAdapter,
};
