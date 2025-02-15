// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, NdSymbolTypeFlags } from '@flybywiresim/fbw-sdk';

import { VerticalDisplayMapLayer } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayMapLayer';
import { VerticalDisplayCanvasMap } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayCanvasMap';

// eslint-disable-next-line max-len
const DECEL_PATH = new Path2D(
  'm 14.5125 0 c 0 8.015 -6.4975 14.5125 -14.5125 14.5125 c -8.015 0 -14.5125 -6.4975 -14.5125 -14.5125 c 0 -8.015 6.4975 -14.5125 14.5125 -14.5125 c 8.015 0 14.5125 6.4975 14.5125 14.5125 z m -12.15 -9.7875 h -7.7625 v 18.225 h 7.7625 l 2.7 -3.375 v -11.475 l -2.7 -3.375 z',
);

export class VdPseudoWaypointLayer implements VerticalDisplayMapLayer<NdSymbol> {
  data: NdSymbol[] = [];

  constructor() {}

  paintShadowLayer(
    context: CanvasRenderingContext2D,
    vdRange: number,
    verticalRange: [number, number],
    offsetDistance: number,
  ) {
    for (const symbol of this.data) {
      if (!symbol.distanceFromAirplane || !symbol.predictedAltitude) {
        continue;
      }

      const rx = VerticalDisplayCanvasMap.distanceToX(symbol.distanceFromAirplane, vdRange, offsetDistance);
      const ry = VerticalDisplayCanvasMap.altToY(symbol.predictedAltitude, verticalRange);

      this.paintPseudoWaypoint(false, context, rx, ry, symbol);
    }
  }

  paintColorLayer(
    context: CanvasRenderingContext2D,
    vdRange: number,
    verticalRange: [number, number],
    offsetDistance: number,
  ) {
    for (const symbol of this.data) {
      if (!symbol.distanceFromAirplane || !symbol.predictedAltitude) {
        continue;
      }

      const rx = VerticalDisplayCanvasMap.distanceToX(symbol.distanceFromAirplane, vdRange, offsetDistance);
      const ry = VerticalDisplayCanvasMap.altToY(symbol.predictedAltitude, verticalRange);

      this.paintPseudoWaypoint(true, context, rx, ry, symbol);
    }
  }

  private paintPseudoWaypoint(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
  ) {
    const color = isColorLayer ? typeFlagToColor(symbol.type) : '#000';
    context.strokeStyle = color;

    if (symbol.type & NdSymbolTypeFlags.PwpDecel) {
      this.paintPath(context, x, y, DECEL_PATH);
    } else if (symbol.type & NdSymbolTypeFlags.PwpSpeedChange) {
      context.fillStyle = color;
      context.strokeStyle = 'none';
      this.paintSpeedChange(context, x, y);
    }
  }

  private paintPath(context: CanvasRenderingContext2D, x: number, y: number, path: Path2D) {
    context.translate(x, y);
    context.beginPath();
    context.stroke(path);
    context.closePath();
    context.resetTransform();
  }

  private paintSpeedChange(context: CanvasRenderingContext2D, x: number, y: number) {
    context.beginPath();
    context.ellipse(x, y, 8, 8, 0, 0, Math.PI * 2);
    context.fill();
    context.closePath();
  }
}

const typeFlagToColor = (typeFlag: NdSymbolTypeFlags) => {
  if (typeFlag & NdSymbolTypeFlags.MagentaColor) {
    return '#ff94ff';
  }
  if (typeFlag & NdSymbolTypeFlags.AmberColor) {
    return '#e68000';
  }
  if (typeFlag & NdSymbolTypeFlags.CyanColor) {
    return '#00ffff';
  }

  return '#fff';
};
