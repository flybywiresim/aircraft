import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import { Units } from '@shared/units';
import React, { useEffect, useRef, useState } from 'react';
import { CanvasConst, PerformanceEnvelope } from './Constants';

interface ChartWidgetProps {
    width: number,
    height: number,
    envelope: PerformanceEnvelope,
    totalWeight: number,
    cg: number,
    mldw: number,
    mldwCg: number,
    zfw: number,
    zfwCg: number,
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
    width, height, envelope,
    totalWeight, cg,
    mldw, mldwCg,
    zfw, zfwCg,
}) => {
    const { usingMetric } = Units;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [theme] = usePersistentProperty('EFB_UI_THEME', 'blue');
    const [flightPhase] = useSimVar('L:A32NX_FMGC_FLIGHT_PHASE', 'enum');

    const getTheme = (theme: string): [string, string, string, string] => {
        let base = '#fff';
        let primary = '#00C9E4';
        let secondary = '#84CC16';
        let alt = '#000';
        switch (theme) {
        case 'dark':
            base = '#fff';
            primary = '#3B82F6';
            secondary = '#84CC16';
            alt = '#000';
            break;
        case 'light':
            base = '#000';
            primary = '#3B82F6';
            secondary = '#84CC16';
            alt = '#fff';
            break;
        default:
            break;
        }
        return [base, primary, secondary, alt];
    };

    const draw = () => {
        if (!ctx) return;

        const [base, primary, secondary, alt] = getTheme(theme);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#C9C9C9';
        ctx.strokeStyle = '#2B313B';
        ctx.lineWidth = 1;

        const yStep = height / (CanvasConst.weightLines - 1);
        const xStep = width / CanvasConst.cgLines;
        const shiftX = (width / 18);

        const weightToY = (weight: number) => (80 - (weight / 1000)) * yStep / 5;
        const cgToX = (cg: number) => ((cg - 12) * xStep);
        const cgWeightToXY = (cg: number, weight: number): [number, number] => {
            const xStart = cgToX(cg);
            const y = weightToY(weight);
            const x = shiftX + xStart + ((CanvasConst.yScale - y) * Math.tan(15 / 16 * Math.PI + (cg - 12) * CanvasConst.cgAngle));
            return [x, y];
        };

        const drawWeightLines = () => {
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#394049';
            for (let y = yStep; y < height; y += yStep) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.closePath();
                ctx.stroke();
            }
        };

        const drawCgLines = () => {
            ctx.lineWidth = 1;
            ctx.globalAlpha = (theme !== 'light') ? 0.5 : 0.25;
            const cgWidth = width - shiftX;
            for (let cgPercent = 12, x = 0; x < cgWidth; x += xStep, cgPercent++) {
                if (x > 0 && (x < cgWidth)) {
                    ctx.lineWidth = cgPercent % 5 ? 0.25 : 1;
                    ctx.strokeStyle = cgPercent % 5 ? '#2B313B' : '#394049';

                    const [x1, y1] = cgWeightToXY(cgPercent, 35000);
                    const [x2, y2] = cgWeightToXY(cgPercent, 80000);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
        };

        const drawMzfw = () => {
            ctx.lineWidth = 2;
            ctx.strokeStyle = base;
            const mzfw = envelope.mzfw;
            const [x, y] = cgWeightToXY(mzfw[0][0], mzfw[0][1]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let i = 1; i < mzfw.length; i++) {
                const [x, y] = cgWeightToXY(mzfw[i][0], mzfw[i][1]);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.closePath();
        };

        const drawMlw = () => {
            ctx.lineWidth = 4;
            ctx.strokeStyle = secondary;
            const mlw = envelope.mlw;
            const [x, y] = cgWeightToXY(mlw[0][0], mlw[0][1]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let i = 1; i < mlw.length; i++) {
                const [x, y] = cgWeightToXY(mlw[i][0], mlw[i][1]);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        const drawMtow = () => {
            ctx.lineWidth = 4;
            ctx.strokeStyle = primary;
            const mtow = envelope.mtow;
            const [x, y] = cgWeightToXY(mtow[0][0], mtow[0][1]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let i = 1; i < mtow.length; i++) {
                const [x, y] = cgWeightToXY(mtow[i][0], mtow[i][1]);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        const drawFlight = () => {
            ctx.lineWidth = 4;
            ctx.strokeStyle = primary;
            const mtow = envelope.flight;
            const [x, y] = cgWeightToXY(mtow[0][0], mtow[0][1]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let i = 1; i < mtow.length; i++) {
                const [x, y] = cgWeightToXY(mtow[i][0], mtow[i][1]);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        const drawPoints = () => {
            const drawDiamond = (cg: number, weight: number, color: string) => {
                ctx.fillStyle = color;
                ctx.strokeStyle = alt;
                ctx.lineWidth = 1;
                ctx.beginPath();
                const [cgX, cgY] = cgWeightToXY(cg, weight);
                ctx.moveTo(cgX, cgY - CanvasConst.diamondHeight);
                ctx.lineTo(cgX - CanvasConst.diamondWidth, cgY);
                ctx.lineTo(cgX, cgY + CanvasConst.diamondHeight);
                ctx.lineTo(cgX + CanvasConst.diamondWidth, cgY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            };

            // MLW
            drawDiamond(mldwCg, mldw, secondary);
            // MTOW
            drawDiamond(cg, totalWeight, primary);
            // MZFW
            drawDiamond(zfwCg, zfw, base);
        };

        drawWeightLines();
        drawCgLines();
        if (flightPhase > 1 && flightPhase < 7) {
            drawFlight();
        }
        drawMzfw();
        drawMlw();
        if (flightPhase <= 1 || flightPhase >= 7) {
            drawMtow();
        }
        drawPoints();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        let frameId;

        if (!canvas) {
            return undefined;
        }

        const w = width;
        const h = height;
        const { devicePixelRatio: ratio = 1 } = window;
        setCtx(canvas.getContext('2d'));
        canvas.width = w * ratio;
        canvas.height = h * ratio;
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
    }, [draw]);

    // TODO FIXME: Make Dynamic
    const mtow = { transform: `translateX(${(zfwCg < 32 ? 0.65 : 0.2) * width}px) translateY(${height * 0.02}px)` };
    const mlw = { transform: `translateX(${(zfwCg < 32 ? 0.65 : 0.2) * width}px) translateY(${height * 0.22}px)` };
    const mzfw = { transform: `translateX(${(zfwCg < 32 ? 0.65 : 0.2) * width}px) translateY(${height * 0.29}px)` };

    const cgRow1 = { transform: `translateX(${0.02 * width}px) translateY(${height * -0.1}px)` };
    const cgRow2 = { transform: `translateX(${0.2 * width}px) translateY(${height * -0.1}px)` };
    const cgRow3 = { transform: `translateX(${0.38 * width}px) translateY(${height * -0.1}px)` };
    const cgRow4 = { transform: `translateX(${0.56 * width}px) translateY(${height * -0.1}px)` };
    const cgRow5 = { transform: `translateX(${0.74 * width}px) translateY(${height * -0.1}px)` };
    const cgRow6 = { transform: `translateX(${0.92 * width}px) translateY(${height * -0.1}px)` };

    const wRow1 = { transform: `translateX(${-0.1 * width}px) translateY(${height * -0.01}px)` };
    const wRow2 = { transform: `translateX(${-0.1 * width}px) translateY(${height * 0.21}px)` };
    const wRow3 = { transform: `translateX(${-0.1 * width}px) translateY(${height * 0.43}px)` };
    const wRow4 = { transform: `translateX(${-0.1 * width}px) translateY(${height * 0.65}px)` };
    const wRow5 = { transform: `translateX(${-0.1 * width}px) translateY(${height * 0.87}px)` };
    const wUnits = { transform: `translateX(${-0.125 * width}px) translateY(${height * 0.95}px)` };

    return (
        <div>
            <canvas ref={canvasRef} />
            <p className="absolute top-0 text-sm font-medium" style={cgRow1}>15%</p>
            <p className="absolute top-0 text-sm font-medium" style={cgRow2}>20%</p>
            <p className="absolute top-0 text-sm font-medium" style={cgRow3}>25%</p>
            <p className="absolute top-0 text-sm font-medium" style={cgRow4}>30%</p>
            <p className="absolute top-0 text-sm font-medium" style={cgRow5}>35%</p>
            <p className="absolute top-0 text-sm font-medium" style={cgRow6}>40%</p>

            <p className="absolute top-0 text-sm font-medium" style={wRow1}>{Math.round(Units.kilogramToUser(80000) / 1000)}</p>
            <p className="absolute top-0 text-sm font-medium" style={wRow2}>{Math.round(Units.kilogramToUser(70000) / 1000)}</p>
            <p className="absolute top-0 text-sm font-medium" style={wRow3}>{Math.round(Units.kilogramToUser(60000) / 1000)}</p>
            <p className="absolute top-0 text-sm font-medium" style={wRow4}>{Math.round(Units.kilogramToUser(50000) / 1000)}</p>
            <p className="absolute top-0 text-sm font-medium" style={wRow5}>{Math.round(Units.kilogramToUser(40000) / 1000)}</p>
            <p className="absolute top-0 text-sm font-medium" style={wUnits}>{usingMetric ? 'x 1000 kg' : 'x 1000 lb'}</p>

            <p className="absolute top-0 font-medium drop-shadow text-theme-highlight" style={mtow}>{flightPhase <= 1 || flightPhase >= 7 ? 'MTOW' : 'FLIGHT'}</p>
            <p className="absolute top-0 font-medium text-colors-lime-500" style={mlw}>MLW</p>
            <p className="absolute top-0 font-medium text-theme-text" style={mzfw}>MZFW</p>
        </div>
    );
};
