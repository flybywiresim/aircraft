import React, { useEffect, useRef, useState } from 'react';
import { BitFlags } from '@shared/bitFlags';
import { CanvasX, CanvasY, RowInfo, SeatConstants, SeatInfo, TYPE } from './Constants';
// @ts-ignore
import SVGFuselage from '../../../Assets/TopDownPayload.svg';
// @ts-ignore
import SVGSeat from '../../../Assets/seat.svg';
// @ts-ignore
import SVGSeatFilled from '../../../Assets/seatFilled.svg';

interface SeatMapProps {
    x: number,
    y: number,
    seatMap: RowInfo[][],
    activeFlags: BitFlags[],
}

export const SeatMap: React.FC<SeatMapProps> = ({ x, y, seatMap, activeFlags }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [seatImg, setSeatImg] = useState<HTMLImageElement | null>(null);
    const [seatFilledImg, setSeatFilledImg] = useState<HTMLImageElement | null>(null);

    const addXOffset = (xOff: number, sec: number, row: number) => {
        let seatType = TYPE.ECO;
        xOff += seatMap[sec][row].xOffset;
        for (let seat = 0; seat < seatMap[sec][row].seats.length; seat++) {
            if (seatType < seatMap[sec][row].seats[seat].type) {
                seatType = seatMap[sec][row].seats[seat].type;
            }
        }
        if (row !== 0 || sec !== 0) {
            xOff += (SeatConstants[seatType].padX + SeatConstants[seatType].len);
        }
        return xOff;
    };

    const addYOffset = (yOff: number, sec: number, row: number, seat: number) => {
        yOff += seatMap[sec][row].yOffset;
        yOff += seatMap[sec][row].seats[seat].yOffset;
        const seatType = seatMap[sec][row].seats[seat].type;
        if (seat !== 0) {
            yOff += (SeatConstants[seatType].padY + SeatConstants[seatType].wid);
        }
        return yOff;
    };

    const draw = () => {
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#fff';
            ctx.beginPath();

            let xOff = 0;
            for (let sec = 0; sec < seatMap.length; sec++) {
                let seatId = 0;
                for (let row = 0; row < seatMap[sec].length; row++) {
                    xOff = addXOffset(xOff, sec, row);
                    drawRow(xOff, sec, row, seatMap[sec][row], seatId);
                    seatId += seatMap[sec][row].seats.length;
                }
            }
            ctx.fill();
        }
    };

    const drawRow = (x: number, sec:number, rowI: number, rowInfo: RowInfo, seatId: number) => {
        const seatsInfo: SeatInfo[] = rowInfo.seats;
        for (let seat = 0, yOff = 0; seat < seatsInfo.length; seat++) {
            yOff = addYOffset(yOff, sec, rowI, seat);
            drawSeat(x, yOff, SeatConstants[seatsInfo[seat].type].imageX, SeatConstants[seatsInfo[seat].type].imageY, sec, seatId++);
        }
    };

    const drawSeat = (x: number, y: number, imageX: number, imageY: number, station: number, seatId: number) => {
        if (ctx && seatImg && seatFilledImg) {
            if (activeFlags[station].getBitIndex(seatId)) {
                ctx.drawImage(seatFilledImg, x, y, imageX, imageY);
            } else {
                ctx.drawImage(seatImg, x, y, imageX, imageY);
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
        <div className="flex relative flex-col">
            <img
                className="absolute w-full"
                src={SVGFuselage}
                alt="Fuselage"
            />

            <canvas className="absolute" ref={canvasRef} style={{ transform: `translateX(${x}px) translateY(${y}px)` }} />
        </div>
    );
};
