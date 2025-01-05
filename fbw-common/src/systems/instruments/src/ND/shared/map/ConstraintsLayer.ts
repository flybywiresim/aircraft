// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, NdSymbolTypeFlags } from '@flybywiresim/fbw-sdk';

import { MapLayer } from './MapLayer';
import { MapParameters } from '../utils/MapParameters';

export class ConstraintsLayer implements MapLayer<NdSymbol> {
  data: NdSymbol[] = [];

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

      this.paintConstraintCircle(false, context, rx, ry, symbol);
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

      if (symbol.type & NdSymbolTypeFlags.Constraint) {
        this.paintConstraintCircle(true, context, rx, ry, symbol);
      }
    }
  }

  private paintConstraintCircle(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
  ) {
    if (isColorLayer) {
      if (symbol.type & NdSymbolTypeFlags.MagentaColor) {
        context.strokeStyle = '#ff94ff';
      } else if (symbol.type & NdSymbolTypeFlags.AmberColor) {
        context.strokeStyle = '#e68000';
      } else {
        context.strokeStyle = '#fff';
      }
    } else {
      context.strokeStyle = '#000';
    }

    context.beginPath();
    context.ellipse(x, y, 14, 14, 0, 0, Math.PI * 2);
    context.stroke();
    context.closePath();
  }
}
