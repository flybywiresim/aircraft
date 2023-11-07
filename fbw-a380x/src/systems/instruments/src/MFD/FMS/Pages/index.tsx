import { Page as DataStatus } from './Data/Status';
import { Page as DataAirport } from './Data/Airport';
import { Page as DataWaypoint } from './Data/Waypoint';
import { Page as DataNavaid } from './Data/Navaid';
import { Page as ActiveFpln } from './Active/Fpln';
import { Page as ActiveFplnDepartures } from './Active/Fpln/Departures';
import { Page as ActiveFplnArrivals } from './Active/Fpln/Arrivals';
import { Page as ActiveInit } from './Active/Init';
import { Page as ActiveFuelLoad } from './Active/FuelLoad';
import { Page as ActiveFplnAirways } from './Active/Fpln/Airways';

export const Pages = {
    Active: {
        Init: ActiveInit,
        Fuelload: ActiveFuelLoad,
        Fpln: ActiveFpln,
        FplnDepartures: ActiveFplnDepartures,
        FplnArrivals: ActiveFplnArrivals,
        FplnAirways: ActiveFplnAirways,
    },
    Data: {
        Status: DataStatus,
        Navaid: DataNavaid,
        Airport: DataAirport,
        Waypoint: DataWaypoint,
    },
};
