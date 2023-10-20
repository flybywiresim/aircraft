export enum NavigraphSubscriptionStatus {
    None,
    Unlimited,
    Unknown,
}

export interface NavigraphBoundingBox {
    bottomLeft: { lat: number, lon: number, xPx: number, yPx: number },
    topRight: { lat: number, lon: number, xPx: number, yPx: number },
    width: number,
    height: number,
}

export interface ChartType {
    code: string,
    category: string,
    details: string,
    precision: string,
    section: string,
}

export interface NavigraphChart {
    fileDay: string,
    fileNight: string,
    thumbDay: string,
    thumbNight: string,
    icaoAirportIdentifier: string,
    id: string,
    extId: string,
    fileName: string,
    type: ChartType,
    indexNumber: string,
    procedureIdentifier: string,
    runway: string[],
    boundingBox?: NavigraphBoundingBox,
}

export interface NavigraphAirportCharts {
    arrival: NavigraphChart[],
    approach: NavigraphChart[],
    airport: NavigraphChart[],
    departure: NavigraphChart[],
    reference: NavigraphChart[],
}

export interface AirportInfo {
    name: string,
}

export interface AuthType {
    code: string,
    link: string,
    qrLink: string,
    interval: number,
    disabled: boolean,
}
