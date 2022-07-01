export const CanvasConst = Object.freeze({
    yScale: 200,
    weightLines: 10,
    cgLines: 35,
    cgAngle: Math.PI / 224,
    diamondWidth: 10,
    diamondHeight: 10,
});

export interface PerformanceEnvelope {
    mlw: number[][],
    mzfw: number[][],
    mtow: number[][],
}

export interface CgPoints {
    mlw: CgWeight
    mzfw: CgWeight
    mtow: CgWeight
}

interface CgWeight {
    cg: number,
    weight: number
}

export const Coord = Object.freeze({
    x: 0,
    y: 1,
});
