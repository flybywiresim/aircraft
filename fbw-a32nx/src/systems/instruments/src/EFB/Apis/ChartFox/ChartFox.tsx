import React, { useContext } from 'react';
import { ChartFileType } from 'instruments/src/EFB/Store/features/navigationPage';
import { sampleData } from './Samples';

export const ChartFoxContext = React.createContext<ChartFoxClient>(undefined!);

export const useChartFox = () => useContext(ChartFoxContext);

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

export const emptyChartFoxCharts = {
    arrival: [] as ChartFoxGroupedChart[],
    approach: [] as ChartFoxGroupedChart[],
    airport: [] as ChartFoxGroupedChart[],
    departure: [] as ChartFoxGroupedChart[],
    reference: [] as ChartFoxGroupedChart[],
};

const emptyAirportIndex: ChartFoxAirportIndex = {
    id: 0,
    ident: '',
    icaoCode: '',
    iataCode: '',
    name: '',
    type: '',
    latitude: 0,
    longitude: 0,
    elevationFt: 0,
    isoA2Country: '',
    hasCharts: false,
    hasSources: false,
    groupedCharts: emptyChartFoxCharts,
};

export const UseChartFoxSamples = true;

export class ChartFoxClient {
    private static token = '';

    public static sufficientEnv() {
        // return !!ChartFoxClient.token;
        return true;
    }

    public async getChart(id: string): Promise<ChartFoxChart> {
        if (!ChartFoxClient.sufficientEnv() || id === '') {
            return null;
        }

        try {
            let jsonValue;
            if (UseChartFoxSamples) {
                jsonValue = sampleData[id];
            } else {
                const jsonResp = await fetch(`https://api.chartfox.org/v2/charts/${id}`, {
                    headers: {
                        'content-type': 'application/json',
                        'authorization': `Bearer ${ChartFoxClient.token}`,
                    },
                });

                if (!jsonResp.ok) {
                    return null;
                }

                jsonValue = await jsonResp.json();
            }
            return {
                id: jsonValue.id,
                parentId: jsonValue.parent_id,
                name: jsonValue.name,
                type: jsonValue.type,
                typeKey: jsonValue.type_key,
                url: jsonValue.url,
                sourceUrl: jsonValue.source_url,
                sourceUrlType: jsonValue.source_url_type,
                georefs: jsonValue.georefs.map((georef) => ({
                    tx: georef.tx,
                    ty: georef.ty,
                    k: georef.k,
                    transformAngle: georef.transform_angle,
                    pdfPageRotation: georef.pdf_page_rotation,
                    page: georef.page,
                })),
                hasGeoreferences: jsonValue.has_georeferences,
                updatedAt: jsonValue.updated_at,
                runways: jsonValue.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            };
        } catch (e) {
            console.log(`Error getting ChartFox chart: ${e}`);
        }

        return null;
    }

    public async getChartIndex(icao: string): Promise<ChartFoxAirportIndex> {
        if (!ChartFoxClient.sufficientEnv() || icao.length !== 4) {
            return emptyAirportIndex;
        }

        try {
            let chartJson;
            if (UseChartFoxSamples) {
                chartJson = sampleData[icao];
            } else {
                const chartJsonResp = await fetch(`https://chartfox.org/${icao}`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'authorization': `Bearer ${ChartFoxClient.token}`,
                    },
                });

                if (!chartJsonResp.ok) {
                    return emptyAirportIndex;
                }

                chartJson = await chartJsonResp.json();
            }
            const groundLayoutArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['3'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            const unknownArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['0'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            const sidArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['4'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            const starArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['5'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            const approachArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['6'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            return {
                id: chartJson.props.airport.id,
                ident: chartJson.props.airport.ident,
                icaoCode: chartJson.props.airport.icao_code,
                iataCode: chartJson.props.airport.iata_code,
                name: chartJson.props.airport.name,
                type: chartJson.props.airport.type,
                latitude: chartJson.props.airport.latitude,
                longitude: chartJson.props.airport.longitude,
                elevationFt: chartJson.props.airport.elevation_ft,
                isoA2Country: chartJson.props.airport.iso_a2_country,
                hasCharts: chartJson.props.airport.has_charts,
                hasSources: chartJson.props.airport.has_sources,
                groupedCharts: {
                    arrival: starArray,
                    approach: approachArray,
                    airport: groundLayoutArray,
                    departure: sidArray,
                    reference: unknownArray,
                },
            };
        } catch (e) {
            // console.log('Token Authentication Failed. #CF101');
            console.log(e);
        }

        return emptyAirportIndex;
    }
}
