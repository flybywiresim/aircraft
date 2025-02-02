export interface VerticalDisplayMapLayer<T> {
  data: T[];

  paintShadowLayer(context: CanvasRenderingContext2D, vdRange: number, verticalRange: [number, number]): void;

  paintColorLayer(context: CanvasRenderingContext2D, vdRange: number, verticalRange: [number, number]): void;
}
