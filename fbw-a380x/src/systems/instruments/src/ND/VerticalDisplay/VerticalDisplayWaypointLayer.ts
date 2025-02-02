// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, NdSymbolTypeFlags, MathUtils } from '@flybywiresim/fbw-sdk';

import { BitFlags } from '@microsoft/msfs-sdk';
import { VerticalDisplay } from 'instruments/src/ND/VerticalDisplay/VerticalDisplay';
import { VerticalDisplayCanvasMap } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayCanvasMap';
import { VerticalDisplayMapLayer } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayMapLayer';
import { VerticalDisplayPaintUtils } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayPaintUtils';

export class VerticalDisplayWaypointLayer implements VerticalDisplayMapLayer<NdSymbol> {
  data: NdSymbol[] = [];

  constructor() {}

  paintShadowLayer(context: CanvasRenderingContext2D, vdRange: number, verticalRange: [number, number]) {
    for (const symbol of this.data) {
      if (!symbol.distanceFromAirplane || !symbol.predictedAltitude) {
        continue;
      }

      const rx = VerticalDisplayCanvasMap.distanceToX(symbol.distanceFromAirplane, vdRange);
      const ry = VerticalDisplay.altToY(symbol.predictedAltitude, verticalRange);

      if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.FixInfo | NdSymbolTypeFlags.FlightPlan)) {
        this.paintFlightPlanWaypoint(false, context, rx, ry, symbol);
      } else {
        this.paintWaypoint(false, context, rx, ry, symbol);
      }
    }
  }

  paintColorLayer(context: CanvasRenderingContext2D, vdRange: number, verticalRange: [number, number]) {
    for (const symbol of this.data) {
      if (!symbol.distanceFromAirplane || !symbol.predictedAltitude) {
        continue;
      }

      const rx = VerticalDisplayCanvasMap.distanceToX(symbol.distanceFromAirplane, vdRange);
      const ry = VerticalDisplay.altToY(symbol.predictedAltitude, verticalRange);

      if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.FixInfo | NdSymbolTypeFlags.FlightPlan)) {
        this.paintFlightPlanWaypoint(true, context, rx, ry, symbol);
      } else {
        this.paintWaypoint(true, context, rx, ry, symbol);
      }
    }
  }

  private paintWaypoint(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
  ) {
    this.paintWaypointShape(context, x, y, isColorLayer ? '#ff94ff' : '#000', isColorLayer ? 1.75 : 3.25);
    context.font = '21px Ecam';
    VerticalDisplayPaintUtils.paintText(isColorLayer, context, x + 15, y + 17, symbol.ident, '#ff94ff');
  }

  private paintFlightPlanWaypoint(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
  ) {
    const mainColor = symbol.type & NdSymbolTypeFlags.ActiveLegTermination ? '#fff' : '#0f0';

    this.paintWaypointShape(context, x, y, isColorLayer ? mainColor : '#000', isColorLayer ? 1.75 : 3.25);

    context.font = '21px Ecam';

    VerticalDisplayPaintUtils.paintText(isColorLayer, context, x + 15, y + 17, symbol.ident, mainColor);
  }

  private paintWaypointShape(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    lineWidth: number,
  ) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);
    context.rotate(45 * MathUtils.DEGREES_TO_RADIANS);
    context.strokeRect(-4.5, -4.5, 9, 9);
    context.resetTransform();
  }
}
