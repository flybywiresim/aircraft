import { Coordinates } from '@fmgc/flightplanning/data/geo';

export class MapParameters {
    public centerCoordinates: Coordinates;

    public mapUpTrueDeg: number;

    public nmToPx: number;

    public mToPx: number;

    public nmRadius: number;

    public version = 0;

    public valid = false;

    compute(centerCoordinates: Coordinates, nmRadius: number, pxRadius: number, mapUpTrueDeg: number): void {
        this.version++;
        this.valid = Number.isFinite(centerCoordinates.lat) && Number.isFinite(centerCoordinates.long) && Number.isFinite(pxRadius) && Number.isFinite(mapUpTrueDeg);

        this.mapUpTrueDeg = mapUpTrueDeg;
        this.centerCoordinates = centerCoordinates;
        this.nmToPx = pxRadius / nmRadius;
        this.mToPx = this.nmToPx / 1852;
        this.nmRadius = nmRadius;
    }

    coordinatesToXYy(coordinates: Coordinates): [number, number] {
        const bearing = Avionics.Utils.computeGreatCircleHeading(this.centerCoordinates, coordinates) - this.mapUpTrueDeg - 90;
        const distance = Avionics.Utils.computeGreatCircleDistance(this.centerCoordinates, coordinates);

        const xNm = distance * Math.cos(bearing * Math.PI / 180);
        const yNm = distance * Math.sin(bearing * Math.PI / 180);

        return [
            xNm * this.nmToPx,
            yNm * this.nmToPx,
        ];
    }

    /**
     * Rotates a true bearing into the map orientation
     * @param trueBearing
     * @returns rotation to be applied
     */
    rotation(trueBearing: number): number {
        return trueBearing - this.mapUpTrueDeg;
    }
}
