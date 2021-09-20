declare class FacilityLoader {
    getFacilityRaw(icao: string, timeout?: number): Promise<any>;
    getAirport(icao: string, loadFacilitiesTransitively?: boolean = false): Promise<Waypoint>
    getFacility(icao: string, loadFacilitiesTransitively?: boolean = false): Promise<any>
}
