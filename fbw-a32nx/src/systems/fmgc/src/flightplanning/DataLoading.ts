// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Approach, Arrival, Departure, Runway } from '@flybywiresim/fbw-sdk';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';

/**
 * Loads an airport from the navigation database
 *
 * @param icao 4-char airport icao code
 *
 * @throws if the airport is not found
 */
export async function loadAirport(icao: string): Promise<Airport> {
  const db = NavigationDatabaseService.activeDatabase.backendDatabase;

  const airports = await db.getAirports([icao]);
  const matchingAirport = airports.find((a) => a.ident === icao);

  if (!matchingAirport) {
    throw new Error(`[FMS/FPM] Can't find airport with ICAO '${icao}'`);
  }

  return matchingAirport;
}

/**
 * Loads all runways for an airport
 *
 * @param airport Airport object
 */
export async function loadAllRunways(airport: Airport): Promise<Runway[]> {
  const db = NavigationDatabaseService.activeDatabase.backendDatabase;

  const runways = await db.getRunways(airport.ident);

  return runways;
}

/**
 * Loads a runway from the navigation database
 *
 * @param airport     Airport object
 * @param runwayIdent runway identifier
 *
 * @throws if the runway is not found
 */
export async function loadRunway(airport: Airport, runwayIdent: string): Promise<Runway> {
  const db = NavigationDatabaseService.activeDatabase.backendDatabase;

  const runways = await db.getRunways(airport.ident);
  const matchingRunway = runways.find((runway) => runway.ident === runwayIdent);

  if (!matchingRunway) {
    throw new Error(`[FMS/FPM] Can't find runway '${runwayIdent}' at ${airport.ident}`);
  }

  return matchingRunway;
}

/**
 * Loads all SIDs for an airport
 *
 * @param airport Airport object
 */
export async function loadAllDepartures(airport: Airport | undefined): Promise<Departure[]> {
  if (!airport) {
    return [];
  }

  const db = NavigationDatabaseService.activeDatabase.backendDatabase;

  const proceduresAtAirport = await db.getDepartures(airport.ident);

  return proceduresAtAirport;
}

/**
 * Loads all STARs for an airport
 *
 * @param airport Airport object
 */
export async function loadAllArrivals(airport: Airport | undefined): Promise<Arrival[]> {
  if (!airport) {
    return [];
  }

  const db = NavigationDatabaseService.activeDatabase.backendDatabase;

  const proceduresAtAirport = await db.getArrivals(airport.ident);

  return proceduresAtAirport;
}

/**
 * Loads all approaches for an airport
 *
 * @param airport Airport object
 */
export async function loadAllApproaches(airport: Airport | undefined): Promise<Approach[]> {
  if (!airport) {
    return [];
  }

  const db = NavigationDatabaseService.activeDatabase.backendDatabase;

  const proceduresAtAirport = await db.getApproaches(airport.ident);

  return proceduresAtAirport;
}
