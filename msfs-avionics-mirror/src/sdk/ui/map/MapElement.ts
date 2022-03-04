/**
 * A common class for elements to be drawn on the map.
 */
export abstract class MapElement {
  public gpsPosition = new Float64Array(2);
  public screenPosition = new Float64Array(2);

  // TODO would be nicer using numbers
  public id = '';

  public isVisible = true;

  abstract update(): void;

  abstract draw(ctx: CanvasRenderingContext2D): void;
}
