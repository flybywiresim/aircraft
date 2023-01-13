export interface PaxStationInfo {
    name: string,
    rows: RowInfo[],
    simVar: string,
    bitFlags: string,
    index: number,
    fill: number,
    stationIndex: number,
    position: number,
}

export interface CargoStationInfo {
    name: string,
    weight: number,
    simVar: string,
    index: number,
    stationIndex: number,
    progressBarWidth: number,
    position: number,
}

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
