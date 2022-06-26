import { usePersistentProperty } from '@instruments/common/persistence';
import React, { useEffect, useRef, useState } from 'react';
import { CanvasConst, PerformanceEnvelope } from './Constants';

interface BalanceWeightProps {
    width: number,
    height: number,
    envelope: PerformanceEnvelope,
}

export const BalanceWeight: React.FC<BalanceWeightProps> = ({ width, height, envelope }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [theme] = usePersistentProperty('EFB_UI_THEME', 'blue');

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

    const draw = () => {
        if (ctx) {
            const [base, primary, secondary] = getTheme(theme);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#C9C9C9';
            ctx.strokeStyle = '#2B313B';
            ctx.lineWidth = 1;

            const yStep = height / (CanvasConst.weightLines - 1);
            const xStep = width / CanvasConst.cgLines;
            const shiftX = -(width / 6);

            const weightToY = (weight) => (80 - (weight / 1000)) * yStep / 5;
            const cgToX = (cg) => ((cg - 12) * xStep);

            const cgWeightToXY = (cg, weight) => {
                const xStart = cgToX(cg);
                const y = weightToY(weight);

                const x = shiftX + xStart + ((300 - y) * Math.tan(15 / 16 * Math.PI + (cg - 12) * Math.PI / (CanvasConst.cgLines * 8)));
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
                const cgWidth = width - shiftX;
                for (let cgPercent = 12, x = 0; x < cgWidth; x += xStep, cgPercent++) {
                    if (x > (cgWidth * 0.17) && (x < (cgWidth) * 0.9)) {
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
            };

            const drawMzfw = () => {
                // MZFW
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

            drawWeightLines();
            drawCgLines();
            drawMzfw();
            drawMlw();
            drawMtow();
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        let frameId;
        if (canvas) {
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
        }
        return () => {
        };
    }, [draw]);

    const mtow = { transform: `translateX(${0.6 * width}px) translateY(${height * -0.02}px)` };
    const mlw = { transform: `translateX(${0.6 * width}px) translateY(${height * 0.26}px)` };
    const mzfw = { transform: `translateX(${0.6 * width}px) translateY(${height * 0.4}px)` };

    const cgRow1 = { transform: `translateX(${0.04 * width}px) translateY(${height * -0.1}px)` };
    const cgRow2 = { transform: `translateX(${0.265 * width}px) translateY(${height * -0.1}px)` };
    const cgRow3 = { transform: `translateX(${0.49 * width}px) translateY(${height * -0.1}px)` };
    const cgRow4 = { transform: `translateX(${0.715 * width}px) translateY(${height * -0.1}px)` };
    const cgRow5 = { transform: `translateX(${0.94 * width}px) translateY(${height * -0.1}px)` };

    const wRow1 = { transform: `translateX(${-0.065 * width}px) translateY(${height * -0.04}px)` };
    const wRow2 = { transform: `translateX(${-0.065 * width}px) translateY(${height * 0.175}px)` };
    const wRow3 = { transform: `translateX(${-0.065 * width}px) translateY(${height * 0.39}px)` };
    const wRow4 = { transform: `translateX(${-0.065 * width}px) translateY(${height * 0.605}px)` };
    const wRow5 = { transform: `translateX(${-0.065 * width}px) translateY(${height * 0.82}px)` };

    return (
        <div>
            <canvas ref={canvasRef} />
            <text className="font-medium">
                <p className="absolute top-0" style={cgRow1}>20%</p>
                <p className="absolute top-0" style={cgRow2}>25%</p>
                <p className="absolute top-0" style={cgRow3}>30%</p>
                <p className="absolute top-0" style={cgRow4}>35%</p>
                <p className="absolute top-0" style={cgRow5}>40%</p>

                <p className="absolute top-0" style={wRow1}>80</p>
                <p className="absolute top-0" style={wRow2}>70</p>
                <p className="absolute top-0" style={wRow3}>60</p>
                <p className="absolute top-0" style={wRow4}>50</p>
                <p className="absolute top-0" style={wRow5}>40</p>

            </text>
            <text className="font-medium">
                <p className="absolute top-0 text-theme-highlight" style={mtow}>MTOW</p>
                <p className="absolute top-0 text-colors-lime-500" style={mlw}>MLW</p>
                <p className="absolute top-0 text-theme-text" style={mzfw}>MZFW</p>
            </text>
        </div>
    );
};
