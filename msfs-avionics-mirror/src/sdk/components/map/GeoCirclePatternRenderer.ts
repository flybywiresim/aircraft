import { GeoCircle } from '../../geo';
import { NullPathStream, PathPattern, PatternPathStream } from '../../graphics/path';
import { GeoCirclePathRenderer } from './GeoCirclePathRenderer';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';

/**
 * Renders arcs along geo circles as repeating patterns.
 */
export class GeoCirclePatternRenderer {
  private readonly pathRenderer = new GeoCirclePathRenderer();
  private readonly patternStream = new PatternPathStream(NullPathStream.INSTANCE, null);

  /**
   * Renders an arc along a geo circle to a canvas.
   * @param circle The geo circle containing the arc to render.
   * @param startLat The latitude of the start of the arc, in degrees.
   * @param startLon The longitude of the start of the arc, in degrees.
   * @param endLat The latitude of the end of the arc, in degrees.
   * @param endLon The longitude of the end of the arc, in degrees.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param pattern The pattern to render.
   * @param continuePath Whether to continue the previously rendered path. If true, a discontinuity in the rendered
   * path will not be inserted before the arc is rendered. This may lead to undesired artifacts if the previously
   * rendered path does not terminate at the point where the projected arc starts. Defaults to false.
   */
  public render(
    circle: GeoCircle,
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    pattern: PathPattern,
    continuePath = false
  ): void {
    this.patternStream.setPattern(pattern);
    streamStack.unshiftPostProjected(this.patternStream);
    this.pathRenderer.render(circle, startLat, startLon, endLat, endLon, streamStack, continuePath);
    streamStack.shiftPostProjected();
  }
}