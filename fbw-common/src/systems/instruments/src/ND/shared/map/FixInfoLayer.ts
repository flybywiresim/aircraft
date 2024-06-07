// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, MathUtils } from '@flybywiresim/fbw-sdk';

import { MapLayer } from './MapLayer';
import { MapParameters } from '../utils/MapParameters';

const FIX_INFO_DASHES = [15, 12];
const NO_DASHES = [];

export class FixInfoLayer implements MapLayer<NdSymbol> {
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

      const radials = symbol.radials;
      const radii = symbol.radii;

      context.setLineDash(FIX_INFO_DASHES);
      context.beginPath();

      for (const radial of radials) {
        if (Number.isFinite(radial)) {
          this.drawFixInfoRadial(context, rx, ry, Math.round(radial), mapParameters, '#000', 3.25);
        }
      }

      for (const radius of radii) {
        if (Number.isFinite(radius)) {
          this.drawFixInfoRadius(context, rx, ry, radius * mapParameters.nmToPx, '#000', 3.25);
        }
      }

      context.stroke();
      context.setLineDash(NO_DASHES);
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

      const radials = symbol.radials;
      const radii = symbol.radii;

      context.setLineDash(FIX_INFO_DASHES);
      context.beginPath();

      for (const radial of radials) {
        if (Number.isFinite(radial)) {
          this.drawFixInfoRadial(context, rx, ry, Math.round(radial), mapParameters, '#0ff', 1.75);
        }
      }

      for (const radius of radii) {
        if (Number.isFinite(radius)) {
          this.drawFixInfoRadius(context, rx, ry, radius * mapParameters.nmToPx, '#0ff', 1.75);
        }
      }

      context.stroke();
      context.setLineDash(NO_DASHES);
    }
  }

  private drawFixInfoRadial(
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bearing: number,
    mapParameters: MapParameters,
    color: string,
    lineWidth: number,
  ) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    const rotation = mapParameters.rotation(bearing) * MathUtils.DEGREES_TO_RADIANS;

    // TODO how long should a piece of string be?
    const x2 = Math.sin(rotation) * 800;
    const y2 = -Math.cos(rotation) * 800;

    context.moveTo(cx, cy);
    context.lineTo(cx + x2, cy + y2);
  }

  private drawFixInfoRadius(
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rPx: number,
    color: string,
    lineWidth: number,
  ) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    context.ellipse(cx, cy, rPx, rPx, 0, 0, Math.PI * 2);
  }
}
