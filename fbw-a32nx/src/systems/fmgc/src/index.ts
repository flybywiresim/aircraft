// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ApproachType, ApproachUtils, RadioUtils, RunwayUtils, a320EfisRangeSettings } from '@flybywiresim/fbw-sdk';
import { DataManager } from '@fmgc/flightplanning/DataManager';
import { CoRouteUplinkAdapter } from '@fmgc/flightplanning/uplink/CoRouteUplinkAdapter';
import { EfisInterface } from '@fmgc/efis/EfisInterface';
import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPlanRpcServer } from '@fmgc/flightplanning/rpc/FlightPlanRpcServer';
import { FlightPlanService } from './flightplanning/FlightPlanService';
import { NavigationDatabase, NavigationDatabaseBackend } from './NavigationDatabase';
import { FlightPhaseManager } from './flightphase';
import { GuidanceController } from './guidance/GuidanceController';
import { EfisSymbols } from './efis/EfisSymbols';
import { DescentPathBuilder } from './guidance/vnav/descent/DescentPathBuilder';
import { initComponents, updateComponents, recallMessageById } from './components';
import { Navigation, SelectedNavaidMode, SelectedNavaidType } from './navigation/Navigation';
import { WaypointFactory } from './flightplanning/waypoints/WaypointFactory';
import { WaypointEntryUtils } from './flightplanning/WaypointEntryUtils';
import { FlightPlanIndex } from './flightplanning/FlightPlanManager';
import { NavigationDatabaseService } from './flightplanning/NavigationDatabaseService';
import { SimBriefUplinkAdapter } from './flightplanning/uplink/SimBriefUplinkAdapter';
import { A320FlightPlanPerformanceData } from './flightplanning/plans/performance/FlightPlanPerformanceData';
import { A320AircraftConfig } from '@fmgc/flightplanning/A320AircraftConfig';
import { LandingSystemUtils } from './flightplanning/data/landingsystem';

function initFmgcLoop(
  baseInstrument: BaseInstrument,
  flightPlanService: FlightPlanService<A320FlightPlanPerformanceData>,
): void {
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
  FlightPlanRpcServer,
  A320FlightPlanPerformanceData,
  NavigationDatabase,
  NavigationDatabaseBackend,
  NavigationDatabaseService,
  FlightPlanIndex,
  FlightPhaseManager,
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
  WaypointFactory,
  WaypointEntryUtils,
  SimBriefUplinkAdapter,
  CoRouteUplinkAdapter,
  DataManager,
  EventBus,
  LandingSystemUtils,
  RadioUtils,
  a320EfisRangeSettings,
  A320AircraftConfig,
};
