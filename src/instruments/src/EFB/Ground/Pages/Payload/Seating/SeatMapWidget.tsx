import React, { useEffect, useRef, useState } from 'react';
import { BitFlags } from '@shared/bitFlags';
import * as ReactDOMServer from 'react-dom/server';
import { usePersistentProperty } from '@instruments/common/persistence';
import { CanvasConst, RowInfo, SeatConstants, SeatInfo, PaxStationInfo, TYPE } from './Constants';
import { Seat } from '../../../../Assets/Seat';
import { SeatOutlineBg } from '../../../../Assets/SeatOutlineBg';

interface SeatMapProps {
    seatMap: PaxStationInfo[],
    desiredFlags: BitFlags[],
    activeFlags: BitFlags[],
    onClickSeat: (paxStation: number, section: number) => void,
}

const useCanvasEvent = (canvas: HTMLCanvasElement | null, event: string, handler: (e) => void, passive = false) => {
    useEffect(() => {
        canvas?.addEventListener(event, handler, passive);

        return function cleanup() {
            canvas?.removeEventListener(event, handler);
        };
    });
};

export const SeatMapWidget: React.FC<SeatMapProps> = ({ seatMap, desiredFlags, activeFlags, onClickSeat }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [seatEmptyImg, setSeatEmptyImg] = useState<HTMLImageElement | null>(null);
    const [seatMinusImg, setSeatMinusImg] = useState<HTMLImageElement | null>(null);
    const [seatFilledImg, setSeatFilledImg] = useState<HTMLImageElement | null>(null);
    const [seatAddImg, setSeatAddImg] = useState<HTMLImageElement | null>(null);
    const [theme] = usePersistentProperty('EFB_UI_THEME', 'blue');
    const [xYMap, setXYMap] = useState<number[][][]>([]);

    const getTheme = (theme) => {
        let base = '#fff';
        let primary = '#00C9E4';
        let secondary = '#84CC16';
        switch (theme) {
        case 'dark':
            base = '#fff';
            primary = '#3B82F6';
            secondary = '#84CC16';
            break;
        case 'light':
            base = '#000000';
            primary = '#3B82F6';
            secondary = '#84CC16';
            break;
        default:
            break;
        }
        return [base, primary, secondary];
    };

    const addXOffset = (xOff: number, station: number, row: number) => {
        let seatType = TYPE.ECO;
        xOff += seatMap[station].rows[row].xOffset;
        for (let seat = 0; seat < seatMap[station].rows[row].seats.length; seat++) {
            if (seatType < seatMap[station].rows[row].seats[seat].type) {
                seatType = seatMap[station].rows[row].seats[seat].type;
            }
        }
        if (row !== 0 || station !== 0) {
            xOff += (SeatConstants[seatType].padX + SeatConstants[seatType].len);
        }
        return xOff;
    };

    const addYOffset = (yOff: number, station: number, row: number, seat: number) => {
        yOff += seatMap[station].rows[row].yOffset;
        yOff += seatMap[station].rows[row].seats[seat].yOffset;
        const seatType = seatMap[station].rows[row].seats[seat].type;
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
            for (let station = 0; station < seatMap.length; station++) {
                let seatId = 0;
                for (let row = 0; row < seatMap[station].rows.length; row++) {
                    xOff = addXOffset(xOff, station, row);
                    drawRow(xOff, station, row, seatMap[station].rows[row], seatId);
                    seatId += seatMap[station].rows[row].seats.length;
                }
            }
            ctx.fill();
        }
    };

    const drawRow = (x: number, station: number, rowI: number, rowInfo: RowInfo, seatId: number) => {
        const seatsInfo: SeatInfo[] = rowInfo.seats;
        for (let seat = 0, yOff = 0; seat < seatsInfo.length; seat++) {
            yOff = addYOffset(yOff, station, rowI, seat);
            if (!xYMap[station]) {
                xYMap[station] = [];
            }
            xYMap[station][seatId] = [x + SeatConstants[seatsInfo[seat].type].imageX / 2, yOff + SeatConstants[seatsInfo[seat].type].imageY / 2];
            setXYMap(xYMap);
            drawSeat(x, yOff, SeatConstants[seatsInfo[seat].type].imageX, SeatConstants[seatsInfo[seat].type].imageY, station, seatId++);
        }
    };

    const drawSeat = (x: number, y: number, imageX: number, imageY: number, station: number, seatId: number) => {
        if (ctx && seatEmptyImg && seatMinusImg && seatAddImg && seatFilledImg) {
            if (desiredFlags[station].getBitIndex(seatId) && activeFlags[station].getBitIndex(seatId)) {
                ctx.drawImage(seatFilledImg, x, y, imageX, imageY);
            } else if (activeFlags[station].getBitIndex(seatId)) {
                ctx.drawImage(seatMinusImg, x, y, imageX, imageY);
            } else if (desiredFlags[station].getBitIndex(seatId)) {
                ctx.drawImage(seatAddImg, x, y, imageX, imageY);
            } else {
                ctx.drawImage(seatEmptyImg, x, y, imageX, imageY);
            }
        }
    };

    useEffect(() => {
        const [base, primary] = getTheme(theme);

        const seatEmpty = <Seat fill="none" stroke={base} opacity="1.0" />;
        const seatEmptyElement = new Image();
        seatEmptyElement.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(ReactDOMServer.renderToStaticMarkup(seatEmpty))}`;
        setSeatEmptyImg(seatEmptyElement);

        const seatMinus = <Seat fill={base} stroke="none" opacity="0.25" />;
        const seatMinusElement = new Image();
        seatMinusElement.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(ReactDOMServer.renderToStaticMarkup(seatMinus))}`;
        setSeatMinusImg(seatMinusElement);

        const seatAdd = <Seat fill={primary} stroke="none" opacity="0.6" />;
        const seatAddElement = new Image();
        seatAddElement.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(ReactDOMServer.renderToStaticMarkup(seatAdd))}`;
        setSeatAddImg(seatAddElement);

        const imgFilled = <Seat fill={primary} stroke="none" opacity="1.0" />;
        const imgFilledElement = new Image();
        imgFilledElement.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(ReactDOMServer.renderToStaticMarkup(imgFilled))}`;
        setSeatFilledImg(imgFilledElement);
    }, []);

    const mouseEvent = (e) => {
        let selectedStation = -1;
        let selectedSeat = -1;
        let shortestDistance = Number.POSITIVE_INFINITY;
        xYMap.forEach((station, i) => {
            station.forEach((seat, j) => {
                const distance = distSquared(e.offsetX, e.offsetY, seat[0], seat[1]);
                if (distance < shortestDistance) {
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
        const canvas = canvasRef.current;
        let frameId;
        if (canvas) {
            const width = CanvasConst.width;
            const height = CanvasConst.height;
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

    const distSquared = (x1, y1, x2, y2) => {
        const diffX = x1 - x2;
        const diffY = y1 - y2;
        return (diffX * diffX + diffY * diffY);
    };

    return (
        <div className="flex relative flex-col">
            <SeatOutlineBg stroke={getTheme(theme)[0]} highlight="#69BD45" />
            <canvas className="absolute cursor-pointer" ref={canvasRef} style={{ transform: `translateX(${CanvasConst.xTransform}) translateY(${CanvasConst.yTransform})` }} />
        </div>
    );
};
