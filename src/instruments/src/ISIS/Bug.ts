export type Bug = {
    type: BugType;
    min: number;
    max: number;
    increment: number;
    value: number;
    isActive: boolean;
}

export enum BugType {
    SPD = 'SPD',
    ALT = 'ALT',
}

export const initialBugs: Bug[] = [
    { type: BugType.ALT, min: 0, max: 50000, increment: 100, value: 100, isActive: false },
    { type: BugType.ALT, min: 0, max: 50000, increment: 100, value: 100, isActive: false },
    { type: BugType.SPD, min: 30, max: 660, increment: 1, value: 30, isActive: false },
    { type: BugType.SPD, min: 30, max: 660, increment: 1, value: 30, isActive: false },
    { type: BugType.SPD, min: 30, max: 660, increment: 1, value: 30, isActive: false },
    { type: BugType.SPD, min: 30, max: 660, increment: 1, value: 30, isActive: false },
];
