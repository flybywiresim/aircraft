// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, NdSymbolTypeFlags, MathUtils } from '@flybywiresim/fbw-sdk';

import { MapLayer } from './MapLayer';
import { MapParameters } from '../utils/MapParameters';
import { PaintUtils } from './PaintUtils';

export class RunwayLayer implements MapLayer<NdSymbol> {
  public data: NdSymbol[] = [];

  paintShadowLayer(
    context: CanvasRenderingContext2D,
    mapWidth: number,
    mapHeight: number,
    mapParameters: MapParameters,
  ) {
    for (const symbol of this.data) {
      const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
      const rx = x + mapWidth / 2;
      const ry = y + mapHeight / 2;

      if (symbol.type & NdSymbolTypeFlags.Runway) {
        if (mapParameters.nmRadius < 80) {
          this.paintScaledRunway(false, context, rx, ry, symbol, mapParameters);
        } else {
          this.paintUnscaledRunway(false, context, rx, ry, symbol, mapParameters);
        }
      }
    }
  }

  paintColorLayer(
    context: CanvasRenderingContext2D,
    mapWidth: number,
    mapHeight: number,
    mapParameters: MapParameters,
  ) {
    for (const symbol of this.data) {
      const [x, y] = mapParameters.coordinatesToXYy(symbol.location);
      const rx = x + mapWidth / 2;
      const ry = y + mapHeight / 2;

      if (symbol.type & NdSymbolTypeFlags.Runway) {
        if (mapParameters.nmRadius < 80) {
          this.paintScaledRunway(true, context, rx, ry, symbol, mapParameters);
        } else {
          this.paintUnscaledRunway(true, context, rx, ry, symbol, mapParameters);
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
    mapParameters: MapParameters,
  ) {
    // Runway shape
    const length = symbol.length * mapParameters.nmToPx;
    const rotation = mapParameters.rotation(symbol.direction);

    context.save();

    context.translate(x, y);
    context.rotate(rotation * MathUtils.DEGREES_TO_RADIANS);
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

    this.paintRunwayIdentifier(isColorLayer, context, x, y, rotation, symbol);

    context.restore();
  }

  private paintUnscaledRunway(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
    mapParameters: MapParameters,
  ) {
    // Runway shape
    const rotation = mapParameters.rotation(symbol.direction);

    context.save();

    context.translate(x, y);
    context.rotate(rotation * MathUtils.DEGREES_TO_RADIANS);
    context.translate(-x, -y);

    context.lineWidth = isColorLayer ? 1.75 : 3.25;
    context.strokeStyle = isColorLayer ? '#fff' : '#000';

    context.strokeRect(x - 5, y - 12.5, 10, 25);

    this.paintRunwayIdentifier(isColorLayer, context, x, y, rotation, symbol);

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

    PaintUtils.paintText(isColorLayer, context, x + 40, y - 30, identIcao, 'white');
    PaintUtils.paintText(isColorLayer, context, x + 40, y - 10, identRwy.padEnd(4, '\xa0'), 'white');

    context.restore();
  }
}
