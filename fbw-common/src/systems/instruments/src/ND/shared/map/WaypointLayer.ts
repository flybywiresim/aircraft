// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, NdSymbolTypeFlags, MathUtils } from '@flybywiresim/fbw-sdk';

import { BitFlags } from '@microsoft/msfs-sdk';
import { MapLayer } from './MapLayer';
import { MapParameters } from '../utils/MapParameters';
import { PaintUtils } from './PaintUtils';
import { CanvasMap } from './CanvasMap';
import { MapOptions } from '../../types/MapOptions';

const VOR_DME_PATH = new Path2D(
  'M -7,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0 M 0,-15 L 0,-7 M 0,15 L 0,7 M -15,0 L -7,0 M 15,0 L 7,0',
);
const DME_PATH = new Path2D('M -7,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0');
const NDB_PATH = new Path2D('M -10,10 L 0,-10 L 10,10 L -10,10');
const COURSE_REVERSAL_ARC_PATH_LEFT = new Path2D('M 0, 0 a 21, 21 0 0 0 -42, 0');
const COURSE_REVERSAL_ARC_PATH_RIGHT = new Path2D('M 0, 0 a 21, 21 0 0  1 42, 0');

export class WaypointLayer implements MapLayer<NdSymbol> {
  data: NdSymbol[] = [];

  private readonly options: MapOptions;

  constructor(
    private readonly canvasMap: CanvasMap,
    options?: Partial<MapOptions>,
  ) {
    this.options = {
      waypointBoxing: !!options?.waypointBoxing,
    };
  }

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

      if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.Airport | NdSymbolTypeFlags.Runway)) {
        this.paintAirport(false, context, rx, ry, symbol);
      } else if (
        BitFlags.isAny(
          symbol.type,
          NdSymbolTypeFlags.VorDme | NdSymbolTypeFlags.Vor | NdSymbolTypeFlags.Dme | NdSymbolTypeFlags.Ndb,
        )
      ) {
        this.paintNavaid(false, context, rx, ry, symbol);
      } else if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.FixInfo | NdSymbolTypeFlags.FlightPlan)) {
        this.paintFlightPlanWaypoint(false, context, rx, ry, symbol, mapParameters);
      } else {
        this.paintWaypoint(false, context, rx, ry, symbol);
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

      if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.Airport | NdSymbolTypeFlags.Runway)) {
        this.paintAirport(true, context, rx, ry, symbol);
      } else if (
        BitFlags.isAny(
          symbol.type,
          NdSymbolTypeFlags.VorDme | NdSymbolTypeFlags.Vor | NdSymbolTypeFlags.Dme | NdSymbolTypeFlags.Ndb,
        )
      ) {
        this.paintNavaid(true, context, rx, ry, symbol);
      } else if (BitFlags.isAny(symbol.type, NdSymbolTypeFlags.FixInfo | NdSymbolTypeFlags.FlightPlan)) {
        this.paintFlightPlanWaypoint(true, context, rx, ry, symbol, mapParameters);
      } else {
        this.paintWaypoint(true, context, rx, ry, symbol);
        if (this.options.waypointBoxing) {
          this.paintWaypointBox(context, rx, ry, symbol);
        }
      }

      if (symbol.constraints) {
        this.paintSymbolConstraints(context, rx, ry, symbol);
      }
    }
  }

  private paintSymbolConstraints(context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
    context.fillStyle = '#ff94ff';

    for (let i = 0; i < symbol.constraints.length; i++) {
      const line = symbol.constraints[i];

      PaintUtils.paintText(true, context, x + 15, y + 35 + 18 * i, line, '#ff94ff');
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

    PaintUtils.paintText(isColorLayer, context, x + 13, y + 18, symbol.ident, mainColor);
  }

  private paintNavaid(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
  ) {
    let mainColor = '#000';
    if (isColorLayer) {
      if (symbol.type & NdSymbolTypeFlags.Tuned) {
        mainColor = '#0ff';
      } else {
        mainColor = '#ff94ff';
      }
    }

    if (symbol.type & NdSymbolTypeFlags.VorDme) {
      this.paintVorDmeShape(context, x, y, mainColor, isColorLayer ? 1.75 : 3.25);
    } else if (symbol.type & NdSymbolTypeFlags.Vor) {
      this.paintVorShape(context, x, y, mainColor, isColorLayer ? 1.75 : 3.25);
    } else if (symbol.type & NdSymbolTypeFlags.Dme) {
      this.paintDmeShape(context, x, y, mainColor, isColorLayer ? 1.75 : 3.25);
    } else if (symbol.type & NdSymbolTypeFlags.Ndb) {
      this.paintNdbShape(context, x, y, mainColor, isColorLayer ? 1.75 : 3.25);
    }

    context.font = '21px Ecam';

    PaintUtils.paintText(isColorLayer, context, x + 13, y + 17, symbol.ident, mainColor);
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

    PaintUtils.paintText(isColorLayer, context, x + 15, y + 17, symbol.ident, '#ff94ff');
  }

  private paintWaypointBox(context: CanvasRenderingContext2D, x: number, y: number, symbol: NdSymbol) {
    const px = this.canvasMap.pointerX;
    const py = this.canvasMap.pointerY;

    const TEXT_LENGTH = Math.max(110, symbol.ident.length * 13.5);
    if (px > x - 7 && px < x + 13 + TEXT_LENGTH && py > y - 10 && py < y + 22) {
      context.strokeStyle = '#0ff';
      context.lineWidth = 1.75;
      context.strokeRect(x - 7, y - 10, 10 + 13 + TEXT_LENGTH, 29);
    }
  }

  private paintFlightPlanWaypoint(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
    mapParameters: MapParameters,
  ) {
    const mainColor = symbol.type & NdSymbolTypeFlags.ActiveLegTermination ? '#fff' : '#0f0';

    this.paintWaypointShape(context, x, y, isColorLayer ? mainColor : '#000', isColorLayer ? 1.75 : 3.25);

    context.font = '21px Ecam';

    PaintUtils.paintText(isColorLayer, context, x + 15, y + 17, symbol.ident, mainColor);

    if (symbol.type & (NdSymbolTypeFlags.CourseReversalLeft | NdSymbolTypeFlags.CourseReversalRight)) {
      this.paintCourseReversal(context, x, y, symbol, mapParameters);
    }
  }

  private paintCourseReversal(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: NdSymbol,
    mapParameters: MapParameters,
  ) {
    const left = symbol.type & NdSymbolTypeFlags.CourseReversalLeft;
    const arcEnd = left ? -42 : 42;
    const rotation = mapParameters.rotation(symbol.direction);
    context.strokeStyle = '#fff';
    context.lineWidth = 1.75;
    context.translate(x, y);
    context.rotate(rotation * MathUtils.DEGREES_TO_RADIANS);
    context.beginPath();
    context.moveTo(arcEnd, 0);
    context.lineTo(arcEnd - 4, -4);
    context.moveTo(arcEnd, 0);
    context.lineTo(arcEnd + 4, -4);
    context.stroke();
    context.stroke(left ? COURSE_REVERSAL_ARC_PATH_LEFT : COURSE_REVERSAL_ARC_PATH_RIGHT);
    context.closePath();
    context.resetTransform();
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

  private paintVorDmeShape(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);
    context.stroke(VOR_DME_PATH);
    context.resetTransform();
  }

  private paintVorShape(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);
    context.beginPath();
    context.moveTo(0, -15);
    context.lineTo(0, 15);
    context.moveTo(-15, 0);
    context.lineTo(15, 0);
    context.closePath();
    context.stroke();
    context.resetTransform();
  }

  private paintDmeShape(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);
    context.stroke(DME_PATH);
    context.resetTransform();
  }

  private paintNdbShape(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);
    context.stroke(NDB_PATH);
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
}
