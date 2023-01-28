declare class FacilityLoader {
    getFacilityRaw(icao: string, timeout?: number, skipIntersectionData?: boolean): Promise<any>;
}
