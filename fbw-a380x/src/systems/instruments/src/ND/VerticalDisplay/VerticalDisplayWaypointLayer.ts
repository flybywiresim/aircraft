// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, NdSymbolTypeFlags, MathUtils, AltitudeDescriptor } from '@flybywiresim/fbw-sdk';

import { BitFlags } from '@microsoft/msfs-sdk';
import { VerticalDisplayCanvasMap } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayCanvasMap';
import { VerticalDisplayMapLayer } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayMapLayer';
import { VerticalDisplayPaintUtils } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayPaintUtils';
import { VERTICAL_DISPLAY_MAX_ALTITUDE, VERTICAL_DISPLAY_MIN_ALTITUDE } from './VerticalDisplay';

const BELOW_CONSTRAINT_PATH = new Path2D('M 0 0 l 5 -10 h -10 l 5 10');
const ABOVE_CONSTRAINT_PATH = new Path2D('M 0 0 l 5 10 h -10 l 5 -10');

export class VerticalDisplayWaypointLayer implements VerticalDisplayMapLayer<NdSymbol> {
  data: NdSymbol[] = [];

  constructor() {}

  paintShadowLayer(
    context: CanvasRenderingContext2D,
    vdRange: number,
    verticalRange: [number, number],
    distanceOffset: number,
    isSelectedModeVertical: boolean,
  ) {
    for (const symbol of this.data) {
      if (!symbol.distanceFromAirplane || !symbol.predictedAltitude) {
        continue;
      }

      const rx = VerticalDisplayCanvasMap.distanceToX(symbol.distanceFromAirplane, vdRange, distanceOffset);
      const ry = VerticalDisplayCanvasMap.altToY(symbol.predictedAltitude, verticalRange);

      if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.Airport | NdSymbolTypeFlags.Runway)) {
        this.paintAirport(false, context, rx, ry, symbol);
      } else if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.FixInfo | NdSymbolTypeFlags.FlightPlan)) {
        this.paintFlightPlanWaypoint(false, context, rx, ry, symbol, verticalRange, isSelectedModeVertical);
      } else {
        this.paintWaypoint(false, context, rx, ry, symbol);
      }
    }
  }

  paintColorLayer(
    context: CanvasRenderingContext2D,
    vdRange: number,
    verticalRange: [number, number],
    distanceOffset: number,
    isSelectedModeVertical: boolean,
  ) {
    for (const symbol of this.data) {
      if (!symbol.distanceFromAirplane || !symbol.predictedAltitude) {
        continue;
      }

      const rx = VerticalDisplayCanvasMap.distanceToX(symbol.distanceFromAirplane, vdRange, distanceOffset);
      const ry = VerticalDisplayCanvasMap.altToY(symbol.predictedAltitude, verticalRange);

      if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.Airport | NdSymbolTypeFlags.Runway)) {
        this.paintAirport(true, context, rx, ry, symbol);
      } else if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.FixInfo | NdSymbolTypeFlags.FlightPlan)) {
        this.paintFlightPlanWaypoint(true, context, rx, ry, symbol, verticalRange, isSelectedModeVertical);
      } else {
        this.paintWaypoint(true, context, rx, ry, symbol);
      }
    }
  }

  private paintAirport(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
  ) {
    const mainColor = symbol.type & NdSymbolTypeFlags.FlightPlan ? '#fff' : '#ff94ff';

    this.paintAirportShape(context, x, y, isColorLayer ? mainColor : '#000', isColorLayer ? 1.75 : 3.25);

    context.font = '21px Ecam';

    VerticalDisplayPaintUtils.paintText(isColorLayer, context, x + 13, y + 18, symbol.ident, mainColor);
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
    verticalRange: [number, number],
    isSelectedModeVertical: boolean,
  ) {
    const mainColor = symbol.type & NdSymbolTypeFlags.ActiveLegTermination ? '#fff' : '#0f0';

    this.paintWaypointShape(context, x, y, isColorLayer ? mainColor : '#000', isColorLayer ? 1.75 : 3.25);

    if (symbol.altConstraint) {
      const cst = symbol.altConstraint;
      const constraintStrokeColor = isSelectedModeVertical
        ? '#fff'
        : symbol.isAltitudeConstraintMet
          ? '#ff94ff'
          : '#e68000';
      const constraintFillColor = !isSelectedModeVertical && !symbol.isAltitudeConstraintMet ? '#e68000' : 'none';

      // If alt constraint not met, draw vertical dashed amber line
      if (!isSelectedModeVertical && !symbol.isAltitudeConstraintMet) {
        this.paintMissedConstraintDashedLine(context, x);
      }

      switch (cst.altitudeDescriptor) {
        case AltitudeDescriptor.AtAlt1:
        case AltitudeDescriptor.AtAlt1GsIntcptAlt2:
        case AltitudeDescriptor.AtAlt1AngleAlt2:
          if (cst.altitude1) {
            this.paintPath(
              context,
              x,
              VerticalDisplayCanvasMap.altToY(cst.altitude1, verticalRange),
              BELOW_CONSTRAINT_PATH,
              constraintStrokeColor,
              constraintFillColor,
            );
            this.paintPath(
              context,
              x,
              VerticalDisplayCanvasMap.altToY(cst.altitude1, verticalRange),
              ABOVE_CONSTRAINT_PATH,
              '#ff94ff',
            );
          }
          break;
        case AltitudeDescriptor.AtOrAboveAlt1:
        case AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2:
        case AltitudeDescriptor.AtOrAboveAlt1AngleAlt2:
          if (cst.altitude1) {
            this.paintPath(
              context,
              x,
              VerticalDisplayCanvasMap.altToY(cst.altitude1, verticalRange),
              ABOVE_CONSTRAINT_PATH,
              constraintStrokeColor,
              constraintFillColor,
            );
          }
          break;
        case AltitudeDescriptor.AtOrBelowAlt1:
        case AltitudeDescriptor.AtOrBelowAlt1AngleAlt2:
          console.log('at or below', cst);
          if (cst.altitude1) {
            this.paintPath(
              context,
              x,
              VerticalDisplayCanvasMap.altToY(cst.altitude1, verticalRange),
              BELOW_CONSTRAINT_PATH,
              constraintStrokeColor,
              constraintFillColor,
            );
          }
          break;
        case AltitudeDescriptor.BetweenAlt1Alt2:
          if (cst.altitude1 && cst.altitude2) {
            this.paintPath(
              context,
              x,
              VerticalDisplayCanvasMap.altToY(cst.altitude1, verticalRange),
              BELOW_CONSTRAINT_PATH,
              constraintStrokeColor,
              constraintFillColor,
            );
            this.paintPath(
              context,
              x,
              VerticalDisplayCanvasMap.altToY(cst.altitude2, verticalRange),
              ABOVE_CONSTRAINT_PATH,
              constraintStrokeColor,
              constraintFillColor,
            );
          }
          break;
        case AltitudeDescriptor.AtOrAboveAlt2:
          if (cst.altitude2) {
            this.paintPath(
              context,
              x,
              VerticalDisplayCanvasMap.altToY(cst.altitude2, verticalRange),
              ABOVE_CONSTRAINT_PATH,
              constraintStrokeColor,
              constraintFillColor,
            );
          }
          break;
        default:
          // No constraint
          break;
      }
    }

    context.font = '21px Ecam';

    VerticalDisplayPaintUtils.paintText(isColorLayer, context, x + 15, y + 17, symbol.ident, mainColor);
  }

  private paintAirportShape(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);
    context.beginPath();
    context.moveTo(-13, 0);
    context.lineTo(13, 0);
    context.moveTo(0, -13);
    context.lineTo(0, 13);
    context.rotate(45 * MathUtils.DEGREES_TO_RADIANS);
    context.moveTo(0, -13);
    context.lineTo(0, 13);
    context.rotate(90 * MathUtils.DEGREES_TO_RADIANS);
    context.moveTo(0, -13);
    context.lineTo(0, 13);
    context.closePath();
    context.stroke();
    context.resetTransform();
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

  private paintPath(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    path: Path2D,
    strokeColor: string,
    fillColor?: string,
  ) {
    context.strokeStyle = strokeColor;
    context.fillStyle = fillColor ?? 'none';
    context.lineWidth = 2;
    context.translate(x, y);
    context.beginPath();
    context.stroke(path);
    context.closePath();
    context.resetTransform();
  }

  private paintMissedConstraintDashedLine(context: CanvasRenderingContext2D, x: number) {
    context.strokeStyle = '#e68000';
    context.setLineDash([2, 2]);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 200);
    context.stroke();

    context.resetTransform();
    context.setLineDash([]);
  }
}
