// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */

import JSON5 from 'json5';
import { AirframeInfo, CabinInfo, FlypadInfo } from './unifiedConfig';

export class UniversalConfigProvider {
    private static airframeInfo: AirframeInfo;

    private static flypadInfo: FlypadInfo;

    private static cabinInfo: CabinInfo;

    private static fetchBaseVFSJson5(aircraft: string, variant: string, fileName: string): Promise<any> {
        return fetch(`/VFS/config/${aircraft}/${variant}/${fileName}.json5`)
            .then((response) => response.text())
            .then((text) => JSON5.parse(text))
            .catch((error) => {
                console.error(`Failed to read ${fileName}: ${error}`);
            });
    }

    private static fetchVFSJson5(aircraft: string, variant: string, atcId: string, fileName: string): Promise<any> {
        // TODO: Override base VFS Logic goes here
        return this.fetchBaseVFSJson5(aircraft, variant, fileName);
    }

    public static async fetchAirframeInfo(aircraft: string, variant: string): Promise<AirframeInfo> {
        if (this.airframeInfo) {
            return this.airframeInfo;
        }

        const json = await this.fetchVFSJson5(aircraft, variant, '<atc_id>', 'airframe');
        this.airframeInfo = (
            {
                developer: json._developer,
                name: json._name,
                variant: json._variant,
                icao: json._icao,
                engines: json._engines,
                designLimits: json.designLimits,
            }
        );

        return this.airframeInfo;
    }

    public static async fetchFlypadInfo(aircraft: string, variant: string): Promise<FlypadInfo> {
        if (this.flypadInfo) {
            return this.flypadInfo;
        }

        const jsonPayload = await this.fetchVFSJson5(aircraft, variant, '<atc_id>', 'flypad-payload');
        const jsonMisc = await this.fetchVFSJson5(aircraft, variant, '<atc_id>', 'flypad-misc');
        this.flypadInfo = (
            {
                payload: {
                    chartLimits: jsonPayload.chartLimits,
                    planeCanvas: jsonPayload._canvas,
                    seatDisplay: jsonPayload.seatDisplay,
                },
                throttle: jsonMisc._throttle,
                pushback: jsonMisc._pushback,
            }
        );

        return this.flypadInfo;
    }

    public static async fetchCabinInfo(aircraft: string, variant: string): Promise<CabinInfo> {
        if (this.cabinInfo) {
            return this.cabinInfo;
        }

        const json = await this.fetchVFSJson5(aircraft, variant, '<atc_id>', 'cabin');
        this.cabinInfo = (
            {
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
            }
        );

        return this.cabinInfo;
    }

    /**
     * Initialize the A/C config for all airframe, flypad, cabin, etc. related information
     *
     * @private
     */
    public static async initialize(aircraft: string, variant: string) {
        this.airframeInfo = await UniversalConfigProvider.fetchAirframeInfo(
            aircraft,
            variant,
        );
        this.flypadInfo = await UniversalConfigProvider.fetchFlypadInfo(
            aircraft,
            variant,
        );
        this.cabinInfo = await UniversalConfigProvider.fetchCabinInfo(
            aircraft,
            variant,
        );
    }
}
