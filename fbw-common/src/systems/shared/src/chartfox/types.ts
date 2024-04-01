import { ChartFileType } from 'instruments/src/EFB/Store/features/navigationPage';

export type ChartFoxChart = {
    id: string,
    parentId: string | null,
    name: string,
    type: number,
    typeKey: string,
    url: string,
    sourceUrl: string,
    sourceUrlType: ChartFileType,
    georefs: ChartFoxGeoRef[],
    hasGeoreferences: boolean,
    updatedAt: string,
    runways: string[],
}

export type ChartFoxGeoRef = {
    tx: number,
    ty: number,
    k: number,
    transformAngle: number,
    pdfPageRotation: number,
    page: number,
}

export type ChartFoxGroupedChart = {
    id: string,
    name: string,
    type: number,
    typeKey: string,
    runways: string[],
}

export type ChartFoxAirportCharts = {
    arrival: ChartFoxGroupedChart[],
    approach: ChartFoxGroupedChart[],
    airport: ChartFoxGroupedChart[],
    departure: ChartFoxGroupedChart[],
    reference: ChartFoxGroupedChart[],
}

export type ChartFoxAirportIndex = {
    id: number,
    ident: string,
    icaoCode: string,
    iataCode: string,
    name: string,
    type: string,
    latitude: number,
    longitude: number,
    elevationFt: number,
    isoA2Country: string,
    hasCharts: boolean,
    hasSources: boolean,
    groupedCharts: ChartFoxAirportCharts,
}

export const emptyChartFoxCharts: ChartFoxAirportCharts = {
    arrival: [] as ChartFoxGroupedChart[],
    approach: [] as ChartFoxGroupedChart[],
    airport: [] as ChartFoxGroupedChart[],
    departure: [] as ChartFoxGroupedChart[],
    reference: [] as ChartFoxGroupedChart[],
};
