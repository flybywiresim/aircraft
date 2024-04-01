import { omit, merge } from 'lodash';
import { sampleData } from './samples';
import { ChartFoxAirportIndex, ChartFoxChart, ChartFoxGroupedChart, emptyChartFoxCharts } from './types';
import { NXDataStore } from '../persistence';

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

// const baseUrl = 'https://api.flybywiresim.com';
const baseUrl = 'http://localhost:3000';

export const UseChartFoxSamples = false;

export enum ChartFoxStatus {
    LoggedOut,
    Pending,
    LoggedIn,
}

export type OnUpdateParams = {
    status: ChartFoxStatus
}

export type OnUpdateFunc = (params: OnUpdateParams) => void;

export type ConstructorParams = {
    onUpdate: OnUpdateFunc
}

export type ChartFoxData = {
    client: ChartFoxClient,
    status: ChartFoxStatus,
}

export class ChartFoxClient {
    private accessToken: string | null = null;

    private sessionId: string | null = null;

    private pollIntervalId: NodeJS.Timeout | null = null;

    private tokenExpiryDate: Date | null = null;

    private onUpdate: (params: OnUpdateParams) => void;

    constructor(params: ConstructorParams) {
        this.onUpdate = params.onUpdate;
        const token = NXDataStore.get('CHARTFOX_ACCESS_TOKEN');

        if (token) {
            this.accessToken = token;
            this.onUpdate({ status: ChartFoxStatus.LoggedIn });
        }
    }

    public async authenticate(): Promise<void> {
        this.accessToken = null;
        this.onUpdate({ status: ChartFoxStatus.Pending });
        this.sessionId = null;

        try {
            const sessResp = await fetch(`${baseUrl}/chartfox/session`, { method: 'POST' });

            if (sessResp.ok) {
                const { id } = await sessResp.json();
                this.sessionId = id;
            }
        } catch (e) {
            console.log('Unable to Authorize Device. #CF101');
            throw e;
        }

        if (!this.sessionId) {
            throw new Error('got back empty session id');
        }

        // TODO: wait a second or so first?
        Coherent.trigger('OPEN_WEB_BROWSER', `${baseUrl}/chartfox/auth?session_id=${this.sessionId}`);

        this.pollIntervalId = setInterval(() => {
            this.checkSession();
        }, 1000);
    }

    private async loginFailed() {
        this.sessionId = null;
        this.accessToken = null;
        this.onUpdate({ status: ChartFoxStatus.LoggedOut });
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
        }
        // TODO: toast?
    }

    private async checkSession() {
        try {
            const resp = await fetch(`${baseUrl}/chartfox/session/${this.sessionId}`);
            if (resp.ok) {
                const { status, accessToken, tokenExpiryDate } = await resp.json();
                if (status === 'created' || status === 'processing') {
                    return;
                }
                if (status === 'failed') {
                    console.log('status: failed');
                    this.loginFailed();
                    return;
                }
                if (status !== 'completed') {
                    console.log(`unknown status ${status}`);
                    this.loginFailed();
                    return;
                }
                if (!accessToken) {
                    console.log('received no access token');
                    this.loginFailed();
                    return;
                }

                this.accessToken = accessToken;
                this.onUpdate({ status: ChartFoxStatus.LoggedIn });
                this.tokenExpiryDate = new Date(tokenExpiryDate);
                if (this.pollIntervalId) {
                    clearInterval(this.pollIntervalId);
                }
            }
        } catch (e) {
            console.log(e);
            this.loginFailed();
        }
    }

    public deAuthenticate() {
        this.accessToken = null;
        this.onUpdate({ status: ChartFoxStatus.LoggedOut });
        this.sessionId = null;
        this.tokenExpiryDate = null;
        NXDataStore.set('CHARTFOX_ACCESS_TOKEN', '');
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
        }
    }

    public async getChart(id: string): Promise<ChartFoxChart> {
        if (id === '') {
            console.log('no chart id');
            return null;
        }

        try {
            let jsonValue;
            if (UseChartFoxSamples) {
                jsonValue = sampleData[id];
            } else {
                if (!this.accessToken) {
                    throw new Error('log in first');
                }

                const jsonResp = await fetch(`https://api.chartfox.org/v2/charts/${id}`, {
                    headers: {
                        accept: 'application/json',
                        authorization: `Bearer ${this.accessToken}`,
                    },
                });

                if (!jsonResp.ok) {
                    console.log('network error');
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
        if (icao.length !== 4) {
            return emptyAirportIndex;
        }

        try {
            let groupedCharts;
            if (UseChartFoxSamples) {
                groupedCharts = sampleData[icao].props.groupedCharts;
            } else {
                if (!this.accessToken) {
                    throw new Error('log in first');
                }
                const chartJsonResp = await fetch(`https://chartfox.org/v2/airports/${icao}/grouped`, {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        authorization: `Bearer ${this.accessToken}`,
                    },
                });

                if (!chartJsonResp.ok) {
                    return emptyAirportIndex;
                }

                const { data } = await chartJsonResp.json();
                groupedCharts = data;
            }
            const groundLayoutArray: ChartFoxGroupedChart[] = groupedCharts['3'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            const unknownArray: ChartFoxGroupedChart[] = groupedCharts['0'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            const sidArray: ChartFoxGroupedChart[] = groupedCharts['4'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            const starArray: ChartFoxGroupedChart[] = groupedCharts['5'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            const approachArray: ChartFoxGroupedChart[] = groupedCharts['6'].map((chart) => ({
                id: chart.id,
                name: chart.name,
                type: chart.type,
                typeKey: chart.type_key,
                runways: chart.meta.find((meta) => meta.type_key === 'Runways')?.value ?? [],
            }));

            // TODO: change this if we're able to get airport info
            return merge(omit(emptyAirportIndex, ['groupedCharts']), {
                groupedCharts: {
                    arrival: starArray,
                    approach: approachArray,
                    airport: groundLayoutArray,
                    departure: sidArray,
                    reference: unknownArray,
                },
            });
            // return {
            //     id: chartJson.props.airport.id,
            //     ident: chartJson.props.airport.ident,
            //     icaoCode: chartJson.props.airport.icao_code,
            //     iataCode: chartJson.props.airport.iata_code,
            //     name: chartJson.props.airport.name,
            //     type: chartJson.props.airport.type,
            //     latitude: chartJson.props.airport.latitude,
            //     longitude: chartJson.props.airport.longitude,
            //     elevationFt: chartJson.props.airport.elevation_ft,
            //     isoA2Country: chartJson.props.airport.iso_a2_country,
            //     hasCharts: chartJson.props.airport.has_charts,
            //     hasSources: chartJson.props.airport.has_sources,
            //     groupedCharts: {
            //         arrival: starArray,
            //         approach: approachArray,
            //         airport: groundLayoutArray,
            //         departure: sidArray,
            //         reference: unknownArray,
            //     },
            // };
        } catch (e) {
            // console.log('Token Authentication Failed. #CF101');
            console.log(e);
        }

        return emptyAirportIndex;
    }

    public get hasToken(): boolean {
        return !!this.accessToken;
    }
}
