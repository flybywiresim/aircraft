// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, NdSymbolTypeFlags, MathUtils } from '@flybywiresim/fbw-sdk';
import { VerticalDisplayCanvasMap } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayCanvasMap';
import { VerticalDisplayMapLayer } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayMapLayer';
import { VerticalDisplayPaintUtils } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayPaintUtils';

export class VerticalDisplayRunwayLayer implements VerticalDisplayMapLayer<NdSymbol> {
  public data: NdSymbol[] = [];

  paintShadowLayer(
    context: CanvasRenderingContext2D,
    vdRange: number,
    verticalRange: [number, number],
    distanceOffset: number,
  ) {
    for (const symbol of this.data) {
      if (!symbol.distanceFromAirplane || !symbol.predictedAltitude) {
        continue;
      }

      const rx = VerticalDisplayCanvasMap.distanceToX(symbol.distanceFromAirplane, vdRange, distanceOffset);
      const ry = VerticalDisplayCanvasMap.altToY(symbol.predictedAltitude, verticalRange);

      if (symbol.type & NdSymbolTypeFlags.Runway) {
        if (vdRange < 160) {
          this.paintScaledRunway(false, context, rx, ry, symbol, vdRange);
        } else {
          this.paintUnscaledRunway(false, context, rx, ry, symbol);
        }
      }
    }
  }

  paintColorLayer(
    context: CanvasRenderingContext2D,
    vdRange: number,
    verticalRange: [number, number],
    distanceOffset: number,
  ) {
    for (const symbol of this.data) {
      if (!symbol.distanceFromAirplane || !symbol.predictedAltitude) {
        continue;
      }

      const rx = VerticalDisplayCanvasMap.distanceToX(symbol.distanceFromAirplane, vdRange, distanceOffset);
      const ry = VerticalDisplayCanvasMap.altToY(symbol.predictedAltitude, verticalRange);

      if (symbol.type & NdSymbolTypeFlags.Runway) {
        if (vdRange < 160) {
          this.paintScaledRunway(true, context, rx, ry, symbol, vdRange);
        } else {
          this.paintUnscaledRunway(true, context, rx, ry, symbol);
        }
      }
    }
  }

  private paintScaledRunway(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
    vdRange: number,
  ) {
    // Runway shape
    const length = VerticalDisplayCanvasMap.distanceToX(symbol.length ?? 0.5, vdRange);

    context.save();

    context.translate(x, y);
    context.rotate(90 * MathUtils.DEGREES_TO_RADIANS);
    context.translate(-x, -y);

    context.lineWidth = isColorLayer ? 1.75 : 3.25;
    context.strokeStyle = isColorLayer ? '#fff' : '#000';

    context.beginPath();
    context.moveTo(x - 5, y);
    context.lineTo(x - 5, y - length);
    context.moveTo(x + 5, y);
    context.lineTo(x + 5, y - length);
    context.stroke();
    context.closePath();

    this.paintRunwayIdentifier(isColorLayer, context, x, y, 90, symbol);

    context.restore();
  }

  private paintUnscaledRunway(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
  ) {
    // Runway shape
    context.save();

    context.translate(x, y);
    context.rotate(90 * MathUtils.DEGREES_TO_RADIANS);
    context.translate(-x, -y);

    context.lineWidth = isColorLayer ? 1.75 : 3.25;
    context.strokeStyle = isColorLayer ? '#fff' : '#000';

    context.strokeRect(x - 5, y - 12.5, 10, 25);

    this.paintRunwayIdentifier(isColorLayer, context, x, y, 90, symbol);

    context.restore();
  }

  private paintRunwayIdentifier(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number,
    symbol: NdSymbol,
  ) {
    const identIcao = symbol.ident.substring(0, 4);
    const identRwy = symbol.ident.substring(4);

    context.save();

    context.font = '20px Ecam';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.translate(x + 40, y - 20);
    context.rotate(-rotation * MathUtils.DEGREES_TO_RADIANS);
    context.translate(-(x + 40), -(y - 20));

    VerticalDisplayPaintUtils.paintText(isColorLayer, context, x + 40, y - 100, identIcao, 'white');
    VerticalDisplayPaintUtils.paintText(isColorLayer, context, x + 40, y - 80, identRwy.padEnd(4, '\xa0'), 'white');

    context.restore();
  }
}
