// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { BitFlags, PaxStationInfo, PayloadSeatDisplay, RowInfo, SeatInfo, SeatType } from '@flybywiresim/fbw-sdk';
import { BusinessSeatLeft, BusinessSeatRight, Seat, SuiteLeft, SuiteRight } from '../../../../Assets/Seat';

interface SeatMapProps {
  payloadSeatDisplay: PayloadSeatDisplay[];
  seatMap: PaxStationInfo[];
  desiredFlags: BitFlags[];
  activeFlags: BitFlags[];
  width: number;
  height: number;
  canvasX: number;
  canvasY: number;
  theme: string[];
  isMainDeck: boolean;
  onClickSeat: (paxStation: number, section: number) => void;
}

const useCanvasEvent = (canvas: HTMLCanvasElement | null, event: string, handler: (e) => void, passive = false) => {
  useEffect(() => {
    canvas?.addEventListener(event, handler, passive);

    return function cleanup() {
      canvas?.removeEventListener(event, handler);
    };
  });
};

export const SeatMapWidget: React.FC<SeatMapProps> = ({
  payloadSeatDisplay,
  seatMap,
  desiredFlags,
  activeFlags,
  width,
  height,
  canvasX,
  canvasY,
  theme,
  isMainDeck,
  onClickSeat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  const getImageFromComponent = useMemo(
    () =>
      (component: React.ReactElement): HTMLImageElement => {
        const imageElement = new Image();
        imageElement.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(ReactDOMServer.renderToStaticMarkup(component))}`;
        return imageElement;
      },
    [],
  );

  const seatEmptyImg = useRef(getImageFromComponent(<Seat fill="none" stroke={theme[0]} opacity="1.0" />));
  const seatMinusImg = useRef(getImageFromComponent(<Seat fill={theme[0]} stroke="none" opacity="0.25" />));
  const seatAddImg = useRef(getImageFromComponent(<Seat fill={theme[1]} stroke="none" opacity="0.4" />));
  const seatFilledImg = useRef(getImageFromComponent(<Seat fill={theme[1]} stroke="none" opacity="1.0" />));

  const bizLeftSeatEmptyImg = useRef(
    getImageFromComponent(<BusinessSeatLeft fill="none" stroke={theme[0]} opacity="1.0" />),
  );
  const bizLeftSeatMinusImg = useRef(
    getImageFromComponent(<BusinessSeatLeft fill={theme[0]} stroke={theme[0]} opacity="0.25" />),
  );
  const bizLeftSeatAddImg = useRef(
    getImageFromComponent(<BusinessSeatLeft fill={theme[1]} stroke={theme[0]} opacity="0.4" />),
  );
  const bizLeftSeatFilledImg = useRef(
    getImageFromComponent(<BusinessSeatLeft fill={theme[1]} stroke={theme[0]} opacity="1.0" />),
  );

  const bizRightSeatEmptyImg = useRef(
    getImageFromComponent(<BusinessSeatRight fill="none" stroke={theme[0]} opacity="1.0" />),
  );
  const bizRightSeatMinusImg = useRef(
    getImageFromComponent(<BusinessSeatRight fill={theme[0]} stroke={theme[0]} opacity="0.25" />),
  );
  const bizRightSeatAddImg = useRef(
    getImageFromComponent(<BusinessSeatRight fill={theme[1]} stroke={theme[0]} opacity="0.4" />),
  );
  const bizRightSeatFilledImg = useRef(
    getImageFromComponent(<BusinessSeatRight fill={theme[1]} stroke={theme[0]} opacity="1.0" />),
  );

  const suiteRightSeatEmptyImg = useRef(
    getImageFromComponent(<SuiteRight fill="none" stroke={theme[0]} opacity="1.0" />),
  );
  const suiteRightSeatMinusImg = useRef(
    getImageFromComponent(<SuiteRight fill={theme[0]} stroke={theme[0]} opacity="0.25" />),
  );
  const suiteRightSeatAddImg = useRef(
    getImageFromComponent(<SuiteRight fill={theme[1]} stroke={theme[0]} opacity="0.4" />),
  );
  const suiteRightSeatFilledImg = useRef(
    getImageFromComponent(<SuiteRight fill={theme[1]} stroke={theme[0]} opacity="1.0" />),
  );

  const suiteLeftSeatEmptyImg = useRef(
    getImageFromComponent(<SuiteLeft fill="none" stroke={theme[0]} opacity="1.0" />),
  );
  const suiteLeftSeatMinusImg = useRef(
    getImageFromComponent(<SuiteLeft fill={theme[0]} stroke={theme[0]} opacity="0.25" />),
  );
  const suiteLeftSeatAddImg = useRef(
    getImageFromComponent(<SuiteLeft fill={theme[1]} stroke={theme[0]} opacity="0.4" />),
  );
  const suiteLeftSeatFilledImg = useRef(
    getImageFromComponent(<SuiteLeft fill={theme[1]} stroke={theme[0]} opacity="1.0" />),
  );

  const [xYMap, setXYMap] = useState<number[][][]>([]);

  const addXOffsetRow = useMemo(
    () => (xOff: number, rowInfo: RowInfo, station: number, row: number) => {
      // Use largest seat in this row to set seat pitch for the row
      let seatType: SeatType = SeatType.NarrowbodyEconomy;
      if (rowInfo.xOffset !== undefined) {
        xOff += rowInfo.xOffset;
      }
      for (let seat = 0; seat < rowInfo.seats.length; seat++) {
        if (seatType < rowInfo.seats[seat].type) {
          seatType = rowInfo.seats[seat].type;
        }
      }
      if (row !== 0 || station !== 0) {
        xOff += payloadSeatDisplay[seatType].padX + payloadSeatDisplay[seatType].len;
      }
      return xOff;
    },
    [payloadSeatDisplay, ctx],
  );

  const addYOffsetSeat = useMemo(
    () => (yOff: number, station: number, row: number, seat: number) => {
      if (
        seatMap[station].rows[row].yOffset !== undefined &&
        seatMap[station].rows[row].seats[seat].yOffset !== undefined
      ) {
        yOff += seatMap[station].rows[row].yOffset;
        yOff += seatMap[station].rows[row].seats[seat].yOffset;
      }
      const seatType = seatMap[station].rows[row].seats[seat].type;
      if (seat !== 0) {
        yOff += payloadSeatDisplay[seatType].padY + payloadSeatDisplay[seatType].wid;
      }
      return yOff;
    },
    [payloadSeatDisplay, ctx],
  );

  const draw = () => {
    const currDeck = isMainDeck ? 0 : 1;
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#fff';
      ctx.beginPath();

      let xOff = 0;
      for (let station = 0; station < seatMap.length; station++) {
        const deck = seatMap[station].deck;
        if (deck === currDeck) {
          let seatId = 0;
          for (let row = 0; row < seatMap[station].rows.length; row++) {
            const rowInfo = seatMap[station].rows[row];
            xOff = addXOffsetRow(xOff, rowInfo, station, row);
            drawRow(xOff, deck, station, row, rowInfo, seatId);
            seatId += seatMap[station].rows[row].seats.length;
          }
        }
      }
      ctx.fill();
    }
  };

  const drawRow = (x: number, deck: number, station: number, rowI: number, rowInfo: RowInfo, seatId: number) => {
    const seatsInfo: SeatInfo[] = rowInfo.seats;
    for (let seat = 0, yOff = 0; seat < seatsInfo.length; seat++) {
      yOff = addYOffsetSeat(yOff, station, rowI, seat);
      if (!xYMap[station]) {
        xYMap[station] = [];
      }
      xYMap[station][seatId] = [
        x + payloadSeatDisplay[seatsInfo[seat].type].imageX / 2,
        yOff + payloadSeatDisplay[seatsInfo[seat].type].imageY / 2,
        deck,
      ];
      setXYMap(xYMap);
      drawSeat(
        x,
        yOff,
        seatsInfo[seat].type,
        payloadSeatDisplay[seatsInfo[seat].type].imageX,
        payloadSeatDisplay[seatsInfo[seat].type].imageY,
        station,
        seatId++,
      );
    }
  };

  const drawSeat = (
    x: number,
    y: number,
    seatType: number,
    imageX: number,
    imageY: number,
    station: number,
    seatId: number,
  ) => {
    switch (seatType) {
      case SeatType.WidebodyBusinessFlatLeft:
        if (ctx && bizLeftSeatEmptyImg && bizLeftSeatMinusImg && bizLeftSeatAddImg && bizLeftSeatFilledImg) {
          if (desiredFlags[station].getBitIndex(seatId) && activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(bizLeftSeatFilledImg.current, x, y, imageX, imageY);
          } else if (activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(bizLeftSeatMinusImg.current, x, y, imageX, imageY);
          } else if (desiredFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(bizLeftSeatAddImg.current, x, y, imageX, imageY);
          } else {
            ctx.drawImage(bizLeftSeatEmptyImg.current, x, y, imageX, imageY);
          }
        }
        break;
      case SeatType.WidebodyBusinessFlatRight:
        if (ctx && bizRightSeatEmptyImg && bizRightSeatMinusImg && bizRightSeatAddImg && bizRightSeatFilledImg) {
          if (desiredFlags[station].getBitIndex(seatId) && activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(bizRightSeatFilledImg.current, x, y, imageX, imageY);
          } else if (activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(bizRightSeatMinusImg.current, x, y, imageX, imageY);
          } else if (desiredFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(bizRightSeatAddImg.current, x, y, imageX, imageY);
          } else {
            ctx.drawImage(bizRightSeatEmptyImg.current, x, y, imageX, imageY);
          }
        }
        break;
      case SeatType.WidebodySuiteRight:
        if (
          ctx &&
          suiteRightSeatEmptyImg &&
          suiteRightSeatMinusImg &&
          suiteRightSeatAddImg &&
          suiteRightSeatFilledImg
        ) {
          if (desiredFlags[station].getBitIndex(seatId) && activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(suiteRightSeatFilledImg.current, x, y, imageX, imageY);
          } else if (activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(suiteRightSeatMinusImg.current, x, y, imageX, imageY);
          } else if (desiredFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(suiteRightSeatAddImg.current, x, y, imageX, imageY);
          } else {
            ctx.drawImage(suiteRightSeatEmptyImg.current, x, y, imageX, imageY);
          }
        }
        break;
      case SeatType.WidebodySuiteLeft:
        if (ctx && suiteLeftSeatEmptyImg && suiteLeftSeatMinusImg && suiteLeftSeatAddImg && suiteLeftSeatFilledImg) {
          if (desiredFlags[station].getBitIndex(seatId) && activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(suiteLeftSeatFilledImg.current, x, y, imageX, imageY);
          } else if (activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(suiteLeftSeatMinusImg.current, x, y, imageX, imageY);
          } else if (desiredFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(suiteLeftSeatAddImg.current, x, y, imageX, imageY);
          } else {
            ctx.drawImage(suiteLeftSeatEmptyImg.current, x, y, imageX, imageY);
          }
        }
        break;
      default:
        if (ctx && seatEmptyImg && seatMinusImg && seatAddImg && seatFilledImg) {
          if (desiredFlags[station].getBitIndex(seatId) && activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(seatFilledImg.current, x, y, imageX, imageY);
          } else if (activeFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(seatMinusImg.current, x, y, imageX, imageY);
          } else if (desiredFlags[station].getBitIndex(seatId)) {
            ctx.drawImage(seatAddImg.current, x, y, imageX, imageY);
          } else {
            ctx.drawImage(seatEmptyImg.current, x, y, imageX, imageY);
          }
        }
        break;
    }
  };

  const mouseEvent = (e) => {
    let selectedStation = -1;
    let selectedSeat = -1;
    let shortestDistance = Number.POSITIVE_INFINITY;
    xYMap.forEach((station, i) => {
      station.forEach((seat, j) => {
        const distance = distSquared(e.offsetX, e.offsetY, seat[0], seat[1]);
        if (seat[2] === (isMainDeck ? 0 : 1) && distance < shortestDistance) {
          selectedStation = i;
          selectedSeat = j;
          shortestDistance = distance;
        }
      });
    });

    if (selectedStation !== -1 && selectedSeat !== -1) {
      onClickSeat(selectedStation, selectedSeat);
    }
  };

  useCanvasEvent(canvasRef.current, 'click', mouseEvent);

  useEffect(() => {
    const context = canvasRef.current.getContext('2d');
    let ratio = 1;
    ratio = window.devicePixelRatio;
    canvasRef.current.width = width * ratio;
    canvasRef.current.height = height * ratio;
    context.scale(ratio, ratio);
    setCtx(context);
  }, []);

  useEffect(() => {
    // work around rendering bug
    setTimeout(() => draw(), 10);
  }, [ctx]);

  useEffect(() => {
    draw();
  }, [seatMap, isMainDeck, desiredFlags, activeFlags, canvasX, canvasY]);

  const distSquared = useMemo(
    () =>
      (x1: number, y1: number, x2: number, y2: number): number => {
        const diffX = x1 - x2;
        const diffY = y1 - y2;
        return diffX * diffX + diffY * diffY;
      },
    [ctx],
  );

  return (
    <>
      <canvas
        className="absolute cursor-pointer"
        ref={canvasRef}
        style={{ transform: `translateX(${canvasX}px) translateY(${canvasY}px)` }}
      />
    </>
  );
};
