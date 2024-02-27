//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Waypoint } from './Waypoint';

export interface FlightStateData {
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  track: number;
  indicatedAirspeed: number;
  groundSpeed: number;
  verticalSpeed: number;
}

export interface AutopilotData {
  apActive: boolean;
  speed: number;
  machMode: boolean;
  altitude: number;
}

export interface EnvironmentData {
  windDirection: number;
  windSpeed: number;
  temperature: number;
}

export interface PositionReportData {
  flightState: FlightStateData;
  autopilot: AutopilotData;
  environment: EnvironmentData;
  lastWaypoint: Waypoint | null;
  activeWaypoint: Waypoint | null;
  nextWaypoint: Waypoint | null;
  destination: Waypoint | null;
}
