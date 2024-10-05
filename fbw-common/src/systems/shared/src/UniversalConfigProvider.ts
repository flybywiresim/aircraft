// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */

import JSON5 from 'json5';
import { AirframeInfo, CabinInfo, FlypadInfo } from './unifiedConfig';

/**
 * UniversalConfigProvider is a class that provides for fetching
 * airframe, flypad, cabin, etc. related markup from the VFS.
 * The data is fetched from the VFS and is cached for subsequent calls.
 */
export class UniversalConfigProvider {
  private static airframeInfo: AirframeInfo;

  private static flypadInfo: FlypadInfo;

  private static cabinInfo: CabinInfo;

  /**
   * Fetch base VFS JSON5 markup configuration for this A/C variant
   */
  private static fetchBaseVFSJson5(aircraft: string, variant: string, fileName: string): Promise<any> {
    return fetch(`/VFS/config/${aircraft}/${variant}/${fileName}.json5`)
      .then((response) => response.text())
      .then((text) => JSON5.parse(text))
      .catch((error) => {
        console.error(`Failed to read ${fileName}: ${error}`);
      });
  }

  /**
   * Fetch existing livery override JSON5 (TODO)
   */
  private static fetchVFSJson5(aircraft: string, variant: string, atcId: string, fileName: string): Promise<any> {
    // TODO: Override base VFS Logic goes here
    return this.fetchBaseVFSJson5(aircraft, variant, fileName);
  }

  /**
   * Fetch cached airframe data if it exists, otherwise fetch from VFS
   */
  public static async fetchAirframeInfo(aircraft: string, variant: string): Promise<AirframeInfo> {
    if (this.airframeInfo) {
      return this.airframeInfo;
    }

    const json = await this.fetchVFSJson5(aircraft, variant, '<atc_id>', 'airframe');
    this.airframeInfo = {
      developer: json._developer,
      name: json._name,
      variant: json._variant,
      icao: json._icao,
      engines: json._engines,
      designLimits: json.designLimits,
      dimensions: json._dimensions,
    };

    return this.airframeInfo;
  }

  /**
   * Fetch cached flypad data if it exists, otherwise fetch from VFS
   */
  public static async fetchFlypadInfo(aircraft: string, variant: string): Promise<FlypadInfo> {
    if (this.flypadInfo) {
      return this.flypadInfo;
    }

    const jsonPayload = await this.fetchVFSJson5(aircraft, variant, '<atc_id>', 'flypad-payload');
    this.flypadInfo = {
      payload: {
        chartLimits: jsonPayload.chartLimits,
        planeCanvas: jsonPayload._canvas,
        seatDisplay: jsonPayload.seatDisplay,
      },
    };

    return this.flypadInfo;
  }

  /**
   * Fetch cached cabin data if it exists, otherwise fetch from VFS
   */
  public static async fetchCabinInfo(aircraft: string, variant: string): Promise<CabinInfo> {
    if (this.cabinInfo) {
      return this.cabinInfo;
    }

    const json = await this.fetchVFSJson5(aircraft, variant, '<atc_id>', 'cabin');
    this.cabinInfo = {
      defaultPaxWeight: json.defaultPaxWeight,
      defaultBagWeight: json.defaultBagWeight,
      paxDecks: json._paxDecks,
      decks: json._decks,
      minPaxWeight: json._minPaxWeight,
      maxPaxWeight: json._maxPaxWeight,
      minBagWeight: json._minBagWeight,
      maxBagWeight: json._maxBagWeight,
      seatMap: json.seatMap,
      cargoMap: json.cargoMap,
    };

    return this.cabinInfo;
  }

  /**
   * Initialize the A/C config for all airframe, flypad, cabin, etc. related information
   *
   * @private
   */
  public static async initialize(aircraft: string, variant: string) {
    this.airframeInfo = await UniversalConfigProvider.fetchAirframeInfo(aircraft, variant);
    this.flypadInfo = await UniversalConfigProvider.fetchFlypadInfo(aircraft, variant);
    this.cabinInfo = await UniversalConfigProvider.fetchCabinInfo(aircraft, variant);
  }
}
