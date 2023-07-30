export enum TYPE {
    NB_ECO = 0,
    NB_ECO_EMERG = 1,
    WB_ECO = 2,
    WB_ECO_EMERG = 3,
    WB_BIZ_FLAT_R = 4,
    WB_BIZ_FLAT_L = 5,
    WB_SUITE_R = 6,
    WB_SUITE_L = 7,
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
    [TYPE.NB_ECO]: {
        len: 25.4,
        wid: 19.2,
        padX: 6.8,
        padY: 0,
        imageX: 25.4,
        imageY: 19.2,
    },
    [TYPE.NB_ECO_EMERG]: {
        len: 25.4,
        wid: 19.2,
        padX: 13.8,
        padY: 0,
        imageX: 25.4,
        imageY: 19.2,
    },
    [TYPE.WB_ECO]: {
        len: 16,
        wid: 12.125,
        padX: 2,
        padY: 0,
        imageX: 16,
        imageY: 12.125,
    },
    [TYPE.WB_ECO_EMERG]: {
        len: 16,
        wid: 12.125,
        padX: 2,
        padY: 0,
        imageX: 16,
        imageY: 12.125,
    },
    [TYPE.WB_BIZ_FLAT_R]: {
        len: 24,
        wid: 23.22,
        padX: 12,
        padY: 0,
        imageX: 24,
        imageY: 23.22,
    },
    [TYPE.WB_BIZ_FLAT_L]: {
        len: 24,
        wid: 23.22,
        padX: 12,
        padY: 0,
        imageX: 24,
        imageY: 23.22,
    },
    [TYPE.WB_SUITE_R]: {
        len: 35,
        wid: 20,
        padX: 2,
        padY: 0,
        imageX: 50,
        imageY: 50,
    },
    [TYPE.WB_SUITE_L]: {
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
