//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessage, AtsuMessageType, AtsuMessageSerializationFormat } from './AtsuMessage';

export interface IFlightPlanChunkBase {
    instruction: string,
}

export interface IFlightPlanAirwayChunk extends IFlightPlanChunkBase {
    instruction: 'airway',
    ident: string,
    locationHint: {
        lat: number,
        long: number,
    },
}

export interface IFlighPlanAirwayTerminateChunk extends IFlightPlanChunkBase {
    instruction: 'airwayTermination',
    ident: string,
}

export interface IFlightPlanWaypointChunk extends IFlightPlanChunkBase {
    instruction: 'waypoint',
    ident: string,
    locationHint: {
        lat: number,
        long: number,
    },
}

export interface IFlightPlanLatLongChunk extends IFlightPlanChunkBase {
    instruction: 'latlong',
    lat: number,
    long: number,
}

export interface IFlightPlanDirectChunk extends IFlightPlanChunkBase {
    instruction: 'dct',
}

export interface IFlightPlanProcedureRChunk extends IFlightPlanChunkBase {
    instruction: 'procedure',
    ident: string,
}

export interface IFlightPlanSidEnrouteTransitionChunk extends IFlightPlanChunkBase {
    instruction: 'sidEnrouteTransition',
    ident: string,
    locationHint: {
        lat: number,
        long: number,
    },
}

export interface IFlightPlanStarEnrouteTransitionChunk extends IFlightPlanChunkBase {
    instruction: 'starEnrouteTransition',
    ident: string,
}

export type FlightPlanRouteChunk =
    | IFlightPlanAirwayChunk
    | IFlighPlanAirwayTerminateChunk
    | IFlightPlanWaypointChunk
    | IFlightPlanLatLongChunk
    | IFlightPlanDirectChunk
    | IFlightPlanProcedureRChunk
    | IFlightPlanSidEnrouteTransitionChunk
    | IFlightPlanStarEnrouteTransitionChunk;

export class FlightPlanMessage extends AtsuMessage {
    public Flightnumber: string = '';

    public Callsign: string = '';

    public Origin: { icao: string, runway: string } = { icao: '', runway: '' };

    public Destination: { icao: string, runway: string } = { icao: '', runway: '' };

    public Alternate: { icao: string, runway: string } = { icao: '', runway: '' };

    public RouteChunks: FlightPlanRouteChunk[] = [];

    public EstimatedTimeEnroute: number = 0;

    constructor() {
        super();
        this.Type = AtsuMessageType.FlightPlan;
        this.Station = 'AOC';
    }

    public serialize(_format: AtsuMessageSerializationFormat): string {
        let message = `FLTNO:${this.Flightnumber}\n`
            + `C/S:${this.Callsign}\n`
            + `ORIG:${this.Origin.icao}/${this.Origin.runway}\n`
            + `DEST:${this.Destination.icao}/${this.Destination.runway}\n`
            + `ALTN:${this.Alternate.icao}/${this.Alternate.runway}\n`
            + `ETE:${this.EstimatedTimeEnroute}\n`
            + 'RTE:\n';

        this.RouteChunks.forEach((chunk) => {
            message += `${chunk}\n`;
        });

        return message;
    }
}
