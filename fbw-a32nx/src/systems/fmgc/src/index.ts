// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ApproachType, ApproachUtils, RunwayUtils, a320EfisRangeSettings } from '@flybywiresim/fbw-sdk';
import { DataManager } from '@fmgc/flightplanning/new/DataManager';
import { CoRouteUplinkAdapter } from '@fmgc/flightplanning/new/uplink/CoRouteUplinkAdapter';
import { EfisInterface } from '@fmgc/efis/EfisInterface';
import { EventBus } from '@microsoft/msfs-sdk';
import { A320AircraftConfig } from '@fmgc/flightplanning/new/A320AircraftConfig';
import { A380AircraftConfig } from '@fmgc/flightplanning/new/A380AircraftConfig';
import { FlightPlanService } from './flightplanning/new/FlightPlanService';
import { NavigationDatabase, NavigationDatabaseBackend } from './NavigationDatabase';
import { FlightPhaseManager, getFlightPhaseManager } from './flightphase';
import { GuidanceController } from './guidance/GuidanceController';
import { EfisSymbols } from './efis/EfisSymbols';
import { DescentPathBuilder } from './guidance/vnav/descent/DescentPathBuilder';
import { initComponents, updateComponents, recallMessageById } from './components';
import { Navigation, SelectedNavaidMode, SelectedNavaidType } from './navigation/Navigation';
import { WaypointFactory } from './flightplanning/new/waypoints/WaypointFactory';
import { WaypointEntryUtils } from './flightplanning/new/WaypointEntryUtils';
import { FlightPlanIndex } from './flightplanning/new/FlightPlanManager';
import { NavigationDatabaseService } from './flightplanning/new/NavigationDatabaseService';
import { SimBriefUplinkAdapter } from './flightplanning/new/uplink/SimBriefUplinkAdapter';
import { A320FlightPlanPerformanceData } from './flightplanning/new/plans/performance/FlightPlanPerformanceData';

function initFmgcLoop(baseInstrument: BaseInstrument, flightPlanService: FlightPlanService<A320FlightPlanPerformanceData>): void {
    initComponents(baseInstrument, flightPlanService);
}

function updateFmgcLoop(deltaTime: number): void {
    updateComponents(deltaTime);
}

export {
    ApproachUtils,
    RunwayUtils,
    ApproachType,
    FlightPlanService,
    A320FlightPlanPerformanceData,
    NavigationDatabase,
    NavigationDatabaseBackend,
    NavigationDatabaseService,
    FlightPlanIndex,
    FlightPhaseManager,
    getFlightPhaseManager,
    GuidanceController,
    initFmgcLoop,
    updateFmgcLoop,
    recallMessageById,
    EfisInterface,
    EfisSymbols,
    DescentPathBuilder,
    Navigation,
    SelectedNavaidMode,
    SelectedNavaidType,
    a320EfisRangeSettings,
    WaypointFactory,
    WaypointEntryUtils,
    SimBriefUplinkAdapter,
    CoRouteUplinkAdapter,
    DataManager,
    EventBus,
    A320AircraftConfig,
    A380AircraftConfig,
};
