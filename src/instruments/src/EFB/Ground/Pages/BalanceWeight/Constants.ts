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
    flight: number[][],
}

export interface CgPoints {
    mtow: CgWeight
    mtowDesired: CgWeight
    mzfw: CgWeight
    mzfwDesired: CgWeight
    mlw: CgWeight
    mlwDesired: CgWeight
}

interface CgWeight {
    cg: number,
    weight: number
}

export const Coord = Object.freeze({
    x: 0,
    y: 1,
});
