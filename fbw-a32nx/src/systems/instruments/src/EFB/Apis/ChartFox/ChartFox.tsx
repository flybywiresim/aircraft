import React, { useContext } from 'react';

export const ChartFoxContext = React.createContext<ChartFoxClient>(undefined!);

export const useChartFox = () => useContext(ChartFoxContext);

export enum SourceUrlType {
    Pdf = 0,
    Image = 1
}

export type ChartFoxChart = {
    id: string,
    parentId: string | null,
    name: string,
    type: number,
    typeKey: string,
    url: string,
    sourceUrl: string,
    sourceUrlType: SourceUrlType,
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

export const emptyChartFoxCharts = {
    arrival: [],
    approach: [],
    airport: [],
    departure: [],
    reference: [],
};

export type AirportInfo = {
    name: string,
}

export class ChartFoxClient {
    private static token = process.env.CHARTFOX_SECRET;

    public static sufficientEnv() {
        return !!ChartFoxClient.token;
    }

    public async getChartUrl(id: string): Promise<string> {
        const chart = await this.getChart(id);

        // let url = chart.url;
        const url = chart.url;
        if (chart.sourceUrlType === SourceUrlType.Pdf) {
            // turn the pdf into an image and use createObjectURL()
        }

        return url;
    }

    public async getChart(id: string): Promise<ChartFoxChart> {
        if (!ChartFoxClient.sufficientEnv() || id === '') {
            return null;
        }

        try {
            const jsonResp = await fetch(`https://api.chartfox.org/v2/charts/${id}`, {
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${ChartFoxClient.token}`,
                },
            });

            if (!jsonResp.ok) {
                return null;
            }

            const jsonValue = await jsonResp.json();

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
                runways: jsonValue.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            };
        } catch (e) {
            console.log(`Error getting ChartFox chart: ${e}`);
        }

        return null;
    }

    public async getAirportInfo(icao: string): Promise<AirportInfo | null> {
        if (!ChartFoxClient.sufficientEnv() || icao.length !== 4) {
            return null;
        }

        try {
            const chartJsonResp = await fetch(`https://chartfox.org/${icao}`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${ChartFoxClient.token}`,
                },
            });

            if (!chartJsonResp.ok) {
                return null;
            }

            const chartJson = await chartJsonResp.json();
            return { name: chartJson.airport.name };
        } catch (_) {
            console.log('Token Authentication Failed. #CF101');
        }

        return null;
    }

    public async getChartList(icao: string): Promise<ChartFoxAirportCharts> {
        if (!ChartFoxClient.sufficientEnv() || icao.length !== 4) {
            return emptyChartFoxCharts;
        }

        try {
            const chartJsonResp = await fetch(`https://chartfox.org/${icao}`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${ChartFoxClient.token}`,
                },
            });

            if (!chartJsonResp.ok) {
                return emptyChartFoxCharts;
            }

            const chartJson = await chartJsonResp.json();

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
                arrival: starArray,
                approach: approachArray,
                airport: groundLayoutArray,
                departure: sidArray,
                reference: unknownArray,
            };
        } catch (_) {
            console.log('Token Authentication Failed. #CF101');
        }

        return emptyChartFoxCharts;
    }
}
