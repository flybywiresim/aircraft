declare class FacilityLoader {
    getFacility(icao, loadFacilitiesTransitively = false): Promise<WayPoint | undefined>;
    getFacilityRaw(icao: string, timeout?: number, skipIntersectionData?: boolean): Promise<RawFacility | undefined>;
}
