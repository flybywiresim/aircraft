import React, { useEffect, useRef, useState } from 'react';
import { CanvasConst } from './Constants';

interface BalanceWeightProps {
    x: number,
    y: number,
    width: number,
    height: number,
}

export const BalanceWeight: React.FC<BalanceWeightProps> = ({ x, y, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    const draw = () => {
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#C9C9C9';
            ctx.strokeStyle = '#2B313B';

            // Borders
            ctx.beginPath();
            ctx.lineWidth = 5;
            ctx.moveTo(0, 0);
            ctx.lineTo(0, height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(width, height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(width, 0);
            ctx.lineTo(width, height);
            ctx.stroke();

            ctx.lineWidth = 1;

            const weightLines = 10;
            const cgLines = 28;

            const yStep = height / (weightLines - 1);
            const xStep = width / cgLines;
            const shiftX = -(width / 6);

            const weightToY = (weight) => (80 - (weight / 1000)) * yStep / 5;
            const cgToX = (cg) => ((cg - 12) * xStep);

            const cgWeightToXY = (cg, weight) => {
                const xStart = cgToX(cg);
                const y = weightToY(weight);

                const x = shiftX + xStart + ((300 - y) * Math.tan(15 / 16 * Math.PI + (cg - 12) * Math.PI / (cgLines * 8)));
                return [x, y];
            };

            // Weight Lines
            for (let y = 0; y < height; y += yStep) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.closePath();
                ctx.stroke();
            }

            // CG Lines
            ctx.lineWidth = 1;
            const cgWidth = width - shiftX;
            for (let cgPercent = 12, x = 0; x < cgWidth; x += xStep, cgPercent++) {
                if (x > (cgWidth * 0.17) && (x < (cgWidth) * 0.9)) {
                    const [x1, y1] = cgWeightToXY(cgPercent, 35000);
                    const [x2, y2] = cgWeightToXY(cgPercent, 80000);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.closePath();
                    ctx.stroke();
                }
            }

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.stroke();

            {
                const [x1, y1] = cgWeightToXY(21.5, 37000);
                const [x2, y2] = cgWeightToXY(19, 53000);
                const [x3, y3] = cgWeightToXY(20.35, 63000);
                const [x4, y4] = cgWeightToXY(20, 72000);
                const [x5, y5] = cgWeightToXY(22, 73000);
                const [x6, y6] = cgWeightToXY(30.8, 77000);
                const [x7, y7] = cgWeightToXY(35.8, 77000);
                const [x8, y8] = cgWeightToXY(38.3, 72000);
                const [x9, y9] = cgWeightToXY(37.7, 58000);
                const [x10, y10] = cgWeightToXY(33, 47500);
                const [x11, y11] = cgWeightToXY(32, 37000);
                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#00C9E4';
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.lineTo(x4, y4);
                ctx.lineTo(x5, y5);
                ctx.lineTo(x6, y6);
                ctx.lineTo(x7, y7);
                ctx.lineTo(x8, y8);
                ctx.lineTo(x9, y9);
                ctx.lineTo(x10, y10);
                ctx.lineTo(x11, y11);
                ctx.stroke();
            }
            {
                const [x1, y1] = cgWeightToXY(22.8, 37000);
                const [x2, y2] = cgWeightToXY(20.5, 48000);
                const [x3, y3] = cgWeightToXY(21, 53000);
                const [x4, y4] = cgWeightToXY(20.8, 55900);
                const [x5, y5] = cgWeightToXY(21.3, 60000);
                const [x6, y6] = cgWeightToXY(21.2, 62500);
                const [x7, y7] = cgWeightToXY(39, 62500);
                const [x8, y8] = cgWeightToXY(37, 37000);
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'white';
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.lineTo(x4, y4);
                ctx.lineTo(x5, y5);
                ctx.lineTo(x6, y6);
                ctx.lineTo(x7, y7);
                ctx.lineTo(x8, y8);
                ctx.stroke();
            }
            {
                const [x1, y1] = cgWeightToXY(20.4, 64500);
                const [x2, y2] = cgWeightToXY(38, 64500);
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#22C55E';
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            console.log('yStep', yStep);
            console.log('xStep', xStep);
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

    return (
        <div className="flex relative flex-col">
            <canvas className="absolute" ref={canvasRef} style={{ transform: `translateX(${x}px) translateY(${y}px)` }} />
        </div>
    );
};
