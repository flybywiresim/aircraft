export type ChartFoxChartMeta = {
    id: string,
    parentId: string | null,
    name: string,
    type: number,
    typeKey: string,
    url: string,
    sourceUrl: string,
    sourceUrlType: number,
    georefs: ChartFoxGeoRef[],
    hasGeoreferences: boolean,
    updatedAt: string,
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
}

export type ChartFoxAirportCharts = {
    arrival: ChartFoxGroupedChart[],
    approach: ChartFoxGroupedChart[],
    airport: ChartFoxGroupedChart[],
    departure: ChartFoxGroupedChart[],
    reference: ChartFoxGroupedChart[],
}

export class ChartFoxClient {
    private static token = process.env.CHARTFOX_SECRET;

    public static sufficientEnv() {
        return !!ChartFoxClient.token;
    }

    public async getChartMeta(id: string): Promise<ChartFoxChartMeta> {
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
            };
        } catch (e) {
            console.log(`Error getting ChartFox chart: ${e}`);
        }

        return null;
    }

    public async getChartList(icao: string): Promise<ChartFoxAirportCharts> {
        const defaultResponse: ChartFoxAirportCharts = {
            arrival: [],
            approach: [],
            airport: [],
            departure: [],
            reference: [],
        };

        if (!ChartFoxClient.sufficientEnv() || icao.length !== 4) {
            return defaultResponse;
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
                return defaultResponse;
            }

            const chartJson = await chartJsonResp.json();

            const groundLayoutArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['3'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
            }));

            const unknownArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['0'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
            }));

            const sidArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['4'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
            }));

            const starArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['5'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
            }));

            const approachArray: ChartFoxGroupedChart[] = chartJson.props.groupedCharts['6'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
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

        return defaultResponse;
    }
}
