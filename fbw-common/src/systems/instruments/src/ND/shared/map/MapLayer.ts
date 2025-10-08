// @ts-strict-ignore
import { MapParameters } from '../utils/MapParameters';

export interface MapLayer<T> {
  data: T[];

  paintShadowLayer(
    context: CanvasRenderingContext2D,
    mapWidth: number,
    mapHeight: number,
    mapParameters: MapParameters,
  );

  paintColorLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number, mapParameters: MapParameters);
}
