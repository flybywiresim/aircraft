/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import Fuselage from '../../../Assets/320neo-outline-fuselage-wb.svg';
import { SeatConstants } from './Constants';
// @ts-ignore
import SVGSeat from '../../../Assets/seat.svg';

const TYPE = { AISLE: 0, ECO: 1, ECO_EMERG: 2 };
interface SeatInfo {
    type: number,
    x: number,
    y: number,
    active: boolean
}

interface RowInfo {
    x: number,
    y: number,
    xOffset: number,
    yOffset: number,
    seats: SeatInfo[],
}

const defaultRow: RowInfo = {
    x: 0,
    y: 0,
    xOffset: 0,
    yOffset: 0,
    seats: [
        { type: TYPE.ECO, x: 0, y: 0, active: false },
        { type: TYPE.ECO, x: 0, y: 0, active: false },
        { type: TYPE.ECO, x: 0, y: 0, active: false },
        { type: TYPE.AISLE, x: 0, y: 0, active: false },
        { type: TYPE.ECO, x: 0, y: 0, active: false },
        { type: TYPE.ECO, x: 0, y: 0, active: false },
        { type: TYPE.ECO, x: 0, y: 0, active: false },
    ],
};

const emergRow: RowInfo = {
    x: 0,
    y: 0,
    xOffset: 0,
    yOffset: 0,
    seats: [
        { type: TYPE.ECO_EMERG, x: 0, y: 0, active: false },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, active: false },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, active: false },
        { type: TYPE.AISLE, x: 0, y: 0, active: false },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, active: false },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, active: false },
        { type: TYPE.ECO_EMERG, x: 0, y: 0, active: false },
    ],
};

const defaultSeatMap: RowInfo[] = [
    defaultRow, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow,
    defaultRow, defaultRow, defaultRow, defaultRow, defaultRow, emergRow, emergRow,
    defaultRow, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow,
    defaultRow, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow,
];

// 222, 260
const x = 260;
const y = 225;
export const SeatMap = () => { // (x, y) => (
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [seatImg, setSeatImg] = useState<HTMLImageElement | null>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [seatMap, setSeatMap] = useState<RowInfo[]>(defaultSeatMap);

    const addXOffset = (xOff, i) => {
        xOff += seatMap[i].xOffset;
        let seatType = TYPE.AISLE;
        for (let j = 0; j < seatMap[i].seats.length; j++) {
            if (seatType < seatMap[i].seats[j].type) {
                seatType = seatMap[i].seats[j].type;
            }
        }
        if (i !== 0) {
            xOff += (SeatConstants[seatType].padX + SeatConstants[seatType].len);
        }
        return xOff;
    };

    const addYOffset = (yOff, i, j) => {
        yOff += seatMap[i].yOffset;
        const seatType = seatMap[i].seats[j].type;
        if (j !== 0) {
            yOff += (SeatConstants[seatType].padY + SeatConstants[seatType].wid);
        }
        return yOff;
    };

    const draw = () => {
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#fff';
            ctx.beginPath();

            for (let i = 0, xOff = 0; i < seatMap.length; i++) {
                xOff = addXOffset(xOff, i);
                drawRow(i, xOff, seatMap[i].seats);
            }
            drawRow(0, 0, defaultRow.seats);
            ctx.fill();
        }
    };

    const drawRow = (rowI: number, x: number, rowInfo: SeatInfo[]) => {
        for (let j = 0, yOff = 0; j < rowInfo.length; j++) {
            yOff = addYOffset(yOff, rowI, j);
            drawSeat(x, yOff, rowInfo[j]);
        }
    };

    const drawSeat = (x: number, y: number, seatInfo: SeatInfo) => {
        if (ctx && seatImg) {
            switch (seatInfo.type) {
            case TYPE.AISLE:
                break;
            case TYPE.ECO:
            case TYPE.ECO_EMERG:
            default:
                ctx.drawImage(seatImg, x, y, SeatConstants.ImageX, SeatConstants.ImageY);
            }
        }
    };

    useEffect(() => {
        const seatImg = new Image();
        seatImg.src = SVGSeat;
        setSeatImg(seatImg);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        let animationFrameId;
        if (canvas) {
            const width = 1000;
            const height = 150;
            const { devicePixelRatio: ratio = 1 } = window;
            setCtx(canvas.getContext('2d'));
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            ctx?.scale(ratio, ratio);
            const render = () => {
                draw();
                animationFrameId = window.requestAnimationFrame(render);
            };
            render();
            return () => {
                window.cancelAnimationFrame(animationFrameId);
            };
        }
        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [draw]);

    return (
        <div className="flex relative flex-col h-content-section-reduced">
            <img
                className="absolute w-full"
                src={Fuselage}
                alt="Fuselage"
            />

            <canvas className="absolute" ref={canvasRef} style={{ transform: `translateX(${x}px) translateY(${y}px)` }} />
        </div>
    );
};
