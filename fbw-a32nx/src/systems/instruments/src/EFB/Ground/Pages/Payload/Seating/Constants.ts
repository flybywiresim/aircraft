export enum ClassType {
    NarrowbodyEconomy = 0,
    NarrowbodyEconomyEmergency = 1,
    WidebodyEconomy = 2,
    WidebodyEconomyEmergency = 3,
    WidebodyBusinessFlatRight = 4,
    WidebodyBusinessFlatLeft = 5,
    WidebodySuiteRight = 6,
    WidebodySuiteLeft = 7,
}

export const CanvasConst = Object.freeze({
    width: 1000,
    height: 150,
});
export interface SeatInfo {
    type: number,
    x?: number,
    y?: number,
    yOffset?: number
}

export interface RowInfo {
    x?: number,
    y?: number,
    xOffset?: number,
    yOffset?: number,
    seats: SeatInfo[],
}

export interface PaxStationInfo {
    name: string,
    capacity: number,
    rows: RowInfo[],
    simVar: string,
    fill: number,
    stationIndex: number,
    position: number,
    deck: number
}

export interface CargoStationInfo {
    name: string,
    weight: number,
    simVar: string,
    stationIndex: number,
    progressBarWidth: number,
    position: number,
}

export const SeatConstants = Object.freeze({
    [ClassType.NarrowbodyEconomy]: {
        len: 25.4,
        wid: 19.2,
        padX: 6.8,
        padY: 0,
        imageX: 25.4,
        imageY: 19.2,
    },
    [ClassType.NarrowbodyEconomyEmergency]: {
        len: 25.4,
        wid: 19.2,
        padX: 13.8,
        padY: 0,
        imageX: 25.4,
        imageY: 19.2,
    },
    [ClassType.WidebodyEconomy]: {
        len: 16,
        wid: 12.125,
        padX: 2,
        padY: 0,
        imageX: 16,
        imageY: 12.125,
    },
    [ClassType.WidebodyEconomyEmergency]: {
        len: 16,
        wid: 12.125,
        padX: 2,
        padY: 0,
        imageX: 16,
        imageY: 12.125,
    },
    [ClassType.WidebodyBusinessFlatRight]: {
        len: 24,
        wid: 23.22,
        padX: 12,
        padY: 0,
        imageX: 24,
        imageY: 23.22,
    },
    [ClassType.WidebodyBusinessFlatLeft]: {
        len: 24,
        wid: 23.22,
        padX: 12,
        padY: 0,
        imageX: 24,
        imageY: 23.22,
    },
    [ClassType.WidebodySuiteRight]: {
        len: 35,
        wid: 20,
        padX: 2,
        padY: 0,
        imageX: 50,
        imageY: 50,
    },
    [ClassType.WidebodySuiteLeft]: {
        len: 35,
        wid: 20,
        padX: 5,
        padY: 0,
        imageX: 50,
        imageY: 50,
    },
});

export const Status = Object.freeze({
    Planned: 0,
    Loaded: 1,
});
