export const TYPE = Object.freeze({ NB_ECO: 0, NB_ECO_EMERG: 1, WB_ECO: 2, WB_ECO_EMERG: 3 });

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
});

export const Status = Object.freeze({
    Planned: 0,
    Loaded: 1,
});
