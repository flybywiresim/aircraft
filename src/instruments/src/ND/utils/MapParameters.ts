import { Coordinates, Xy } from '@fmgc/flightplanning/data/geo';
export class MapParameters {
    public centerCoordinates: Coordinates;
    public mapUpTrueDeg: number;
    public nmToPx: number;
    public version = 0;

    compute(centerCoordinates: Coordinates, nmRadius: number, pxRadius: number, mapUpTrueDeg: number): void {
        this.version++;

        this.mapUpTrueDeg = mapUpTrueDeg;
        this.centerCoordinates = centerCoordinates;
        this.nmToPx = pxRadius / nmRadius;
    }

    coordinatesToXYy(coordinates: Coordinates): Xy {
        const bearing = Avionics.Utils.computeGreatCircleHeading(this.centerCoordinates, coordinates) - this.mapUpTrueDeg - 90;
        const distance = Avionics.Utils.computeGreatCircleDistance(this.centerCoordinates, coordinates);

        const xNm = distance * Math.cos(bearing * Math.PI / 180);
        const yNm = distance * Math.sin(bearing * Math.PI / 180);

        return [
            xNm * this.nmToPx,
            yNm * this.nmToPx,
        ];
    }
}
