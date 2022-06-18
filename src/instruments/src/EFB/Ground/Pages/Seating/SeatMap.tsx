/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import SVGFuselage from '../../../Assets/TopDownPayload.svg';
import { CanvasX, CanvasY, RowInfo, SeatConstants, SeatInfo, TYPE } from './Constants';
// @ts-ignore
import SVGSeat from '../../../Assets/seat.svg';
// @ts-ignore
import SVGSeatFilled from '../../../Assets/seatFilled.svg';

interface SeatMapProps {
    x: number,
    y: number,
    seatMap: RowInfo[]
}

export const SeatMap: React.FC<SeatMapProps> = ({ x, y, seatMap }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [seatImg, setSeatImg] = useState<HTMLImageElement | null>(null);
    const [seatFilledImg, setSeatFilledImg] = useState<HTMLImageElement | null>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    const addXOffset = (xOff: number, r: number) => {
        xOff += seatMap[r].xOffset;
        let seatType = TYPE.ECO;
        for (let s = 0; s < seatMap[r].seats.length; s++) {
            if (seatType < seatMap[r].seats[s].type) {
                seatType = seatMap[r].seats[s].type;
            }
        }
        if (r !== 0) {
            xOff += (SeatConstants[seatType].padX + SeatConstants[seatType].len);
        }
        return xOff;
    };

    const addYOffset = (yOff: number, r: number, s: number) => {
        yOff += seatMap[r].yOffset;
        yOff += seatMap[r].seats[s].yOffset;
        const seatType = seatMap[r].seats[s].type;
        if (s !== 0) {
            yOff += (SeatConstants[seatType].padY + SeatConstants[seatType].wid);
        }
        return yOff;
    };

    const draw = () => {
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#fff';
            ctx.beginPath();

            for (let r = 0, xOff = 0; r < seatMap.length; r++) {
                xOff = addXOffset(xOff, r);
                drawRow(r, xOff, seatMap[r].seats);
            }
            ctx.fill();
        }
    };

    const drawRow = (rowI: number, x: number, rowInfo: SeatInfo[]) => {
        for (let s = 0, yOff = 0; s < rowInfo.length; s++) {
            yOff = addYOffset(yOff, rowI, s);
            drawSeat(x, yOff, rowInfo[s]);
        }
    };

    const drawSeat = (x: number, y: number, seatInfo: SeatInfo) => {
        if (ctx && seatImg && seatFilledImg) {
            switch (seatInfo.active) {
            case true:
                ctx.drawImage(seatFilledImg, x, y, SeatConstants[seatInfo.type].imageX, SeatConstants[seatInfo.type].imageY);
                break;
            case false:
            default:
                ctx.drawImage(seatImg, x, y, SeatConstants[seatInfo.type].imageX, SeatConstants[seatInfo.type].imageY);
                break;
            }
        }
    };

    useEffect(() => {
        const seatImg = new Image();
        seatImg.src = SVGSeat;
        setSeatImg(seatImg);

        const seatFilledImg = new Image();
        seatFilledImg.src = SVGSeatFilled;
        setSeatFilledImg(seatFilledImg);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        let frameId;
        if (canvas) {
            const width = CanvasX;
            const height = CanvasY;
            const { devicePixelRatio: ratio = 1 } = window;
            setCtx(canvas.getContext('2d'));
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            ctx?.scale(ratio, ratio);
            const render = () => {
                draw();
                // workaround for bug
                if (!frameId || frameId < 10) {
                    frameId = window.requestAnimationFrame(render);
                }
            };
            render();
            return () => {
                if (frameId) {
                    window.cancelAnimationFrame(frameId);
                }
            };
        }
        return () => {
        };
    }, [draw]);

    return (
        <div className="flex relative flex-col h-content-section-reduced">
            <img
                className="absolute w-full"
                src={SVGFuselage}
                alt="Fuselage"
            />

            <canvas className="absolute" ref={canvasRef} style={{ transform: `translateX(${x}px) translateY(${y}px)` }} />
        </div>
    );
};
