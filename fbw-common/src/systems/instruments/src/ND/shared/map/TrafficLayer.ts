// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdTraffic } from '@flybywiresim/fbw-sdk';
import { MapLayer } from './MapLayer';
import { PaintUtils } from './PaintUtils';
import { CanvasMap } from './CanvasMap';

// TODO move this somewhere better, need to move TCAS stuff into fbw-sdk
enum TaRaIntrusion {
  TRAFFIC = 0,
  PROXIMITY = 1,
  TA = 2,
  RA = 3,
}

const DiamondHeight = 18;
const DiamondWidth = 12;
export class TrafficLayer implements MapLayer<NdTraffic> {
  public data: NdTraffic[] = [];

  constructor(private readonly canvasMap: CanvasMap) {}

  paintShadowLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number) {
    for (const intruder of this.data) {
      const x = intruder.posX;
      const y = intruder.posY;
      const rx = x + mapWidth / 2;
      const ry = y + mapHeight / 2;

      this.paintIntruder(false, context, rx, ry, intruder);
    }
  }

  paintColorLayer(context: CanvasRenderingContext2D, mapWidth: number, mapHeight: number) {
    for (const intruder of this.data) {
      const x = intruder.posX;
      const y = intruder.posY;
      const rx = x + mapWidth / 2;
      const ry = y + mapHeight / 2;

      this.paintIntruder(true, context, rx, ry, intruder);
    }
  }

  private paintIntruder(
    isColorLayer: boolean,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    intruder: NdTraffic,
  ) {
    let color;
    switch (intruder.intrusionLevel) {
      case TaRaIntrusion.TRAFFIC:
        // paint intruder symbol
        color = '#fff';
        this.paintNormalIntruder(context, x, y, isColorLayer ? color : '#040405', isColorLayer ? 1.6 : 3.5);
        break;
      case TaRaIntrusion.PROXIMITY:
        color = '#fff';
        this.paintProximityIntruder(context, x, y, isColorLayer ? color : '#040405', isColorLayer ? 1.6 : 3.5);
        break;
      case TaRaIntrusion.TA:
        color = '#e38c56';
        this.paintTaIntruder(context, x, y, isColorLayer ? color : '#040405', isColorLayer ? 1.6 : 3.5);
        break;
      case TaRaIntrusion.RA:
        color = '#ff0000';
        this.paintRaIntruder(context, x, y, isColorLayer ? color : '#040405', isColorLayer ? 1.6 : 3.5);
        break;
      default:
        break;
    }
    // paint vertical speed arrow (-/+ 500 fpm)
    this.paintVertArrow(intruder.vertSpeed, context, x, y, isColorLayer ? color : '#040405', isColorLayer ? 1.6 : 3.5);

    // paint relative altitude
    context.font = '21px Ecam';
    PaintUtils.paintText(
      isColorLayer,
      context,
      x - 24,
      y + (intruder.relativeAlt > 0 ? -12 : 25.5),
      `${intruder.relativeAlt > 0 ? '+' : '-'}${Math.abs(intruder.relativeAlt) < 10 ? '0' : ''}${Math.abs(intruder.relativeAlt)}`,
      color,
    );
  }

  private paintVertArrow(
    vertSpeed: number,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    lineWidth: number,
  ) {
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = lineWidth;

    const arrowOffset = 7;
    const arrowWidth = 5;
    const arrowHeight = 5.5;

    context.translate(x, y);

    if (vertSpeed <= -500 || vertSpeed >= 500) {
      context.beginPath();
      context.moveTo(DiamondWidth / 2 + arrowOffset - lineWidth / 4, DiamondHeight / 2 - arrowHeight / 2);
      context.lineTo(DiamondWidth / 2 + arrowOffset - lineWidth / 4, -DiamondHeight / 2 + arrowHeight / 2);
      context.stroke();
      context.closePath();
    }

    if (vertSpeed <= -500) {
      context.beginPath();
      context.moveTo(DiamondWidth / 2 + arrowOffset, DiamondHeight / 2);
      context.lineTo(DiamondWidth / 2 + arrowOffset - arrowWidth / 2, DiamondHeight / 2 - arrowHeight);
      context.lineTo(DiamondWidth / 2 + arrowOffset + arrowWidth / 2, DiamondHeight / 2 - arrowHeight);
      context.fill();
      context.stroke();
      context.closePath();
    } else if (vertSpeed >= 500) {
      context.beginPath();
      context.moveTo(DiamondWidth / 2 + arrowOffset, -DiamondHeight / 2);
      context.lineTo(DiamondWidth / 2 + arrowOffset - arrowWidth / 2, -DiamondHeight / 2 + arrowHeight);
      context.lineTo(DiamondWidth / 2 + arrowOffset + arrowWidth / 2, -DiamondHeight / 2 + arrowHeight);
      context.fill();
      context.stroke();
      context.closePath();
    }

    context.resetTransform();
  }

  private paintNormalIntruder(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    lineWidth: number,
  ) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);

    context.beginPath();
    context.moveTo(0, -DiamondHeight / 2);
    context.lineTo(-DiamondWidth / 2, 0);
    context.lineTo(0, DiamondHeight / 2);
    context.lineTo(DiamondWidth / 2, 0);
    context.lineTo(0, -DiamondHeight / 2);
    context.stroke();

    context.closePath();
    context.resetTransform();
  }

  private paintProximityIntruder(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    lineWidth: number,
  ) {
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);

    context.beginPath();
    context.moveTo(0, -DiamondHeight / 2);
    context.lineTo(-DiamondWidth / 2, 0);
    context.lineTo(0, DiamondHeight / 2);
    context.lineTo(DiamondWidth / 2, 0);
    context.lineTo(0, -DiamondHeight / 2);
    context.stroke();
    context.fill();

    context.closePath();
    context.resetTransform();
  }

  private paintTaIntruder(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);

    context.beginPath();
    context.arc(0, 0, 7.8, 0, 2 * Math.PI, false);
    context.fill();
    context.stroke();
    context.closePath();
    context.resetTransform();
  }

  private paintRaIntruder(context: CanvasRenderingContext2D, x: number, y: number, color: string, lineWidth: number) {
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = lineWidth;

    context.translate(x, y);
    context.beginPath();
    context.rect(-7.8, -7.8, 15.6, 15.6);
    context.fill();
    context.stroke();
    context.closePath();
    context.resetTransform();
  }
}
