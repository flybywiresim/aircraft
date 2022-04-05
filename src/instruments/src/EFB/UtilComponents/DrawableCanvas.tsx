import React, { useCallback, useEffect, useRef } from 'react';

interface DrawableCanvasProps {
    width: number;
    height: number;
    className?: string;
    brushColor?: string;
    brushSize?: number;
    rotation?: number;
    resolutionScalar?: number;
    disabled?: boolean;
}

export const DrawableCanvas = ({
    width,
    height,
    className,
    brushColor = 'black',
    brushSize = 10,
    rotation = 0,
    resolutionScalar = 1,
    disabled,
}: DrawableCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            console.log(canvasRef.current.getContext('2d'));
        }
    }, [canvasRef.current]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (disabled) return;

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');

            event.stopPropagation();

            const brushOffset = brushSize / 2;
            const posX = (event.offsetX * resolutionScalar) - brushOffset;
            const posY = (event.offsetY * resolutionScalar) - brushOffset;

            if (ctx) {
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.lineWidth = brushSize;
                ctx.shadowColor = brushColor;
                ctx.fillStyle = brushColor;
                ctx.shadowColor = 'rgba(0,0,0,.5)';
                ctx.shadowBlur = 2;
                ctx.beginPath();
                ctx.lineTo(posX, posY);
                ctx.stroke();
            }
        }
    }, [canvasRef.current, brushColor, brushSize, width, height, resolutionScalar, disabled]);

    const handleMouseDown = () => {
        document.addEventListener('mousemove', handleMouseMove);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
    };

    return (
        <canvas
            ref={canvasRef}
            className={className}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            width={width * resolutionScalar}
            height={height * resolutionScalar}
            style={{ width: `${width}px`, height: `${height}px`, transform: `rotate(${rotation}deg)` }}
        />
    );
};
