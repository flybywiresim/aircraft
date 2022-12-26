declare class Runway {
    latitude: number;
    longitude: number;
    elevation: number;
    direction: number;
    designation: string;
    designatorCharPrimary: number;
    designatorCharSecondary: number;
    length: number;
    width: number;
    surface: number;
    lighting: number;
    beginningCoordinates: LatLongAlt;
    endCoordinates: LatLongAlt;
    primaryILSFrequency: Frequency;
    secondaryILSFrequency: Frequency;
    cosDirection: number;
    sinDirection: number;
    splitIfTwoWays(): Runway[];
    getSurfaceString(): string;
}
