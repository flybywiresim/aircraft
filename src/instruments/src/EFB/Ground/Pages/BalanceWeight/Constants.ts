export const CanvasConst = Object.freeze({
    weightLines: 10,
    cgLines: 28,
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
