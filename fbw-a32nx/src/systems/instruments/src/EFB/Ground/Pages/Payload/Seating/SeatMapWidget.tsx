import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { BitFlags, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { CanvasConst, SeatConstants, SeatInfo, PaxStationInfo, TYPE, RowInfo } from './Constants';
import { BusinessSeatLeft, BusinessSeatRight, Seat, SuiteLeft, SuiteRight } from '../../../../Assets/Seat';
import { A380SeatOutlineBg } from '../../../../Assets/A380SeatOutlineBg';
// import { t } from '../../../../../translation';

interface SeatMapProps {
    seatMap: PaxStationInfo[],
    desiredFlags: BitFlags[],
    activeFlags: BitFlags[],
    canvasX: number,
    canvasY: number,
    isMainDeck: boolean,
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

export const SeatMapWidget: React.FC<SeatMapProps> = ({ seatMap, desiredFlags, activeFlags, canvasX, canvasY, isMainDeck, onClickSeat }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    const getTheme = (theme: string): [string, string, string] => {
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

    const [theme] = usePersistentProperty('EFB_UI_THEME', 'blue');
    const [base, primary] = getTheme(theme);

    const getImageFromComponent = (component: React.ReactElement): HTMLImageElement => {
        const imageElement = new Image();
        imageElement.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(ReactDOMServer.renderToStaticMarkup(component))}`;
        return imageElement;
    };
    const seatEmptyImg = useRef(getImageFromComponent(<Seat fill="none" stroke={base} opacity="1.0" />));
    const seatMinusImg = useRef(getImageFromComponent(<Seat fill={base} stroke="none" opacity="0.25" />));
    const seatAddImg = useRef(getImageFromComponent(<Seat fill={primary} stroke="none" opacity="0.6" />));
    const seatFilledImg = useRef(getImageFromComponent(<Seat fill={primary} stroke="none" opacity="1.0" />));

    const bizLeftSeatEmptyImg = useRef(getImageFromComponent(<BusinessSeatLeft fill="none" stroke={base} opacity="1.0" />));
    const bizLeftSeatMinusImg = useRef(getImageFromComponent(<BusinessSeatLeft fill={base} stroke="none" opacity="0.25" />));
    const bizLeftSeatAddImg = useRef(getImageFromComponent(<BusinessSeatLeft fill={primary} stroke="none" opacity="0.6" />));
    const bizLeftSeatFilledImg = useRef(getImageFromComponent(<BusinessSeatLeft fill={primary} stroke="none" opacity="1.0" />));

    const bizRightSeatEmptyImg = useRef(getImageFromComponent(<BusinessSeatRight fill="none" stroke={base} opacity="1.0" />));
    const bizRightSeatMinusImg = useRef(getImageFromComponent(<BusinessSeatRight fill={base} stroke="none" opacity="0.25" />));
    const bizRightSeatAddImg = useRef(getImageFromComponent(<BusinessSeatRight fill={primary} stroke="none" opacity="0.6" />));
    const bizRightSeatFilledImg = useRef(getImageFromComponent(<BusinessSeatRight fill={primary} stroke="none" opacity="1.0" />));

    const suiteRightSeatEmptyImg = useRef(getImageFromComponent(<SuiteRight fill="none" stroke={base} opacity="1.0" />));
    const suiteRightSeatMinusImg = useRef(getImageFromComponent(<SuiteRight fill={base} stroke="none" opacity="0.25" />));
    const suiteRightSeatAddImg = useRef(getImageFromComponent(<SuiteRight fill={primary} stroke="none" opacity="0.6" />));
    const suiteRightSeatFilledImg = useRef(getImageFromComponent(<SuiteRight fill={primary} stroke="none" opacity="1.0" />));

    const suiteLeftSeatEmptyImg = useRef(getImageFromComponent(<SuiteLeft fill="none" stroke={base} opacity="1.0" />));
    const suiteLeftSeatMinusImg = useRef(getImageFromComponent(<SuiteLeft fill={base} stroke="none" opacity="0.25" />));
    const suiteLeftSeatAddImg = useRef(getImageFromComponent(<SuiteLeft fill={primary} stroke="none" opacity="0.6" />));
    const suiteLeftSeatFilledImg = useRef(getImageFromComponent(<SuiteLeft fill={primary} stroke="none" opacity="1.0" />));

    const [xYMap, setXYMap] = useState<number[][][]>([]);

    const addXOffsetRow = (xOff: number, rowInfo: RowInfo, station: number, row: number) => {
        let seatType: TYPE = TYPE.NB_ECO;
        if (rowInfo.xOffset !== undefined) {
            xOff += rowInfo.xOffset;
        }
        for (let seat = 0; seat < rowInfo.seats.length; seat++) {
            if (seatType < rowInfo.seats[seat].type) {
                seatType = rowInfo.seats[seat].type;
            }
        }
        if (row !== 0 || station !== 0) {
            xOff += (SeatConstants[seatType].padX + SeatConstants[seatType].len);
        }
        return xOff;
    };

    const addYOffsetSeat = (yOff: number, station: number, row: number, seat: number) => {
        if (seatMap[station].rows[row].yOffset !== undefined
            && seatMap[station].rows[row].seats[seat].yOffset !== undefined) {
            yOff += seatMap[station].rows[row].yOffset;
            yOff += seatMap[station].rows[row].seats[seat].yOffset;
        }
        const seatType = seatMap[station].rows[row].seats[seat].type;
        if (seat !== 0) {
            yOff += (SeatConstants[seatType].padY + SeatConstants[seatType].wid);
        }
        return yOff;
    };

    const draw = () => {
        const currDeck = isMainDeck ? 0 : 1;
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#fff';
            ctx.beginPath();

            let xOff = 0;
            for (let station = 0; station < seatMap.length; station++) {
                if (seatMap[station].deck === currDeck) {
                    let seatId = 0;
                    for (let row = 0; row < seatMap[station].rows.length; row++) {
                        const rowInfo = seatMap[station].rows[row];
                        xOff = addXOffsetRow(xOff, rowInfo, station, row);
                        drawRow(xOff, station, row, rowInfo, seatId);
                        seatId += seatMap[station].rows[row].seats.length;
                    }
                }
            }
            ctx.fill();
        }
    };

    const drawRow = (x: number, station: number, rowI: number, rowInfo: RowInfo, seatId: number) => {
        const seatsInfo: SeatInfo[] = rowInfo.seats;
        for (let seat = 0, yOff = 0; seat < seatsInfo.length; seat++) {
            yOff = addYOffsetSeat(yOff, station, rowI, seat);
            if (!xYMap[station]) {
                xYMap[station] = [];
            }
            xYMap[station][seatId] = [x + SeatConstants[seatsInfo[seat].type].imageX / 2, yOff + SeatConstants[seatsInfo[seat].type].imageY / 2];
            setXYMap(xYMap);
            drawSeat(x, yOff, seatsInfo[seat].type, SeatConstants[seatsInfo[seat].type].imageX, SeatConstants[seatsInfo[seat].type].imageY, station, seatId++);
        }
    };

    const drawSeat = (x: number, y: number, seatType: number, imageX: number, imageY: number, station: number, seatId: number) => {
        switch (seatType) {
        case TYPE.WB_BIZ_FLAT_L:
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
        case TYPE.WB_BIZ_FLAT_R:
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
        case TYPE.WB_SUITE_R:
            if (ctx && suiteRightSeatEmptyImg && suiteRightSeatMinusImg && suiteRightSeatAddImg && suiteRightSeatFilledImg) {
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
        case TYPE.WB_SUITE_L:
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

        if (!canvas) {
            return undefined;
        }

        const width = CanvasConst.width;
        const height = CanvasConst.height;
        const { devicePixelRatio: ratio = 1 } = window;
        setCtx(canvas.getContext('2d'));
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx?.scale(ratio, ratio);
        const render = () => {
            draw();
            // workaround for rendering bug
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
    }, [draw]);

    useEffect(() => {
        // Reset mouse map when switching decks
        setXYMap([]);
    }, [isMainDeck]);

    const distSquared = (x1: number, y1: number, x2: number, y2: number): number => {
        const diffX = x1 - x2;
        const diffY = y1 - y2;
        return (diffX * diffX + diffY * diffY);
    };

    return (
        <>
            <A380SeatOutlineBg stroke={getTheme(theme)[0]} highlight="#69BD45" />
            <canvas className="absolute cursor-pointer" ref={canvasRef} style={{ transform: `translateX(${canvasX}px) translateY(${canvasY}px)` }} />
        </>
    );
};
