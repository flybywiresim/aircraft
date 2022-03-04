import { MapElement } from './MapElement';

/**
 * A common class for elements to be drawn on the map.
 */
export class CanvasMapElement extends MapElement {

  public static img = new Image();

  /**
   * Updates the canvas map element.
   */
  public update(): void {
    // noop
  }

  /**
   * Renders the map element to the canvas using the supplied context.
   * @param ctx The canvas context to render to.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public draw(ctx: CanvasRenderingContext2D): void {
    /** virtual */
  }
}
