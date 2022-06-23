export const TYPE = Object.freeze({ ECO: 0, ECO_EMERG: 1 });
export interface SeatInfo {
    type: number,
    x: number,
    y: number,
    yOffset: number
}

export interface RowInfo {
    x: number,
    y: number,
    xOffset: number,
    yOffset: number,
    seats: SeatInfo[],
}

export const CanvasX = 1000;
export const CanvasY = 150;

export const SeatConstants = Object.freeze({
    [TYPE.ECO]: {
        len: 19.2,
        wid: 19.2,
        padX: 13,
        padY: 0,
        imageX: 25.4,
        imageY: 19.2,
    },
    [TYPE.ECO_EMERG]: {
        len: 19.2,
        wid: 19.2,
        padX: 20,
        padY: 0,
        imageX: 25.4,
        imageY: 19.2,
    },
});

export const Status = {
    Planned: 0,
    Loaded: 1,
};
