export namespace VerticalDisplayPaintUtils {
  export function paintText(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    color: string,
  ) {
    context.save();
    context.translate(x, y);

    if (!isColorLayer) {
      context.strokeStyle = '#000';
      context.lineWidth = 3;
      context.strokeText(text, 0, 0);
    } else {
      context.fillStyle = color;
      context.fillText(text, 0, 0);
    }

    context.restore();
  }
}
