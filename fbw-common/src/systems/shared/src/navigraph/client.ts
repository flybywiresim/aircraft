import pkce from '@navigraph/pkce';
import { AmdbAirportSearchResponse, AmdbProjection, AmdbResponse, FeatureTypeString } from '../amdb';
import { AirportInfo, AuthType, NavigraphAirportCharts, NavigraphChart, NavigraphSubscriptionStatus } from './types';
import { NXDataStore } from '../persistence';

const NAVIGRAPH_API_SCOPES = 'openid charts amdb offline_access';

const NAVIGRAPH_DEFAULT_AUTH_STATE = {
    code: '',
    link: '',
    qrLink: '',
    interval: 5,
    disabled: false,
};

export const emptyNavigraphCharts = {
    arrival: [],
    approach: [],
    airport: [],
    departure: [],
    reference: [],
};

function formatFormBody(body: Object) {
    return Object.keys(body).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`).join('&');
}

export class NavigraphClient {
    private static clientId = process.env.CLIENT_ID;

    private static clientSecret = process.env.CLIENT_SECRET;

    private pkce: ReturnType<typeof pkce>;

    private deviceCode: string;

    private refreshToken: string | null = null;

    public tokenRefreshInterval = 3600;

    private accessToken: string | null = null;

    public auth: AuthType = NAVIGRAPH_DEFAULT_AUTH_STATE;

    public userName = '';

    public static get hasSufficientEnv() {
        if (NavigraphClient.clientSecret === undefined || NavigraphClient.clientId === undefined) {
            return false;
        }
        return !(NavigraphClient.clientSecret === '' || NavigraphClient.clientId === '');
    }

    constructor() {
        if (NavigraphClient.hasSufficientEnv) {
            this.pkce = pkce();

            const token = NXDataStore.get('NAVIGRAPH_REFRESH_TOKEN');
            const deviceCode = NXDataStore.get('NAVIGRAPH_DEVICE_CODE');

            if (token) {
                this.refreshToken = token;
                this.deviceCode = deviceCode || undefined;
                this.getToken();
            }
        }
    }

    public async authenticate(): Promise<void> {
        this.pkce = pkce();
        this.refreshToken = null;

        const secret = {
            client_id: NavigraphClient.clientId,
            client_secret: NavigraphClient.clientSecret,
            code_challenge: this.pkce.code_challenge,
            code_challenge_method: 'S256',
        };

        try {
            const authResp = await fetch('https://identity.api.navigraph.com/connect/deviceauthorization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: formatFormBody(secret),
            });

            if (authResp.ok) {
                const json = await authResp.json();

                this.auth.code = json.user_code;
                this.auth.link = json.verification_uri;
                this.auth.qrLink = json.verification_uri_complete;
                this.auth.interval = json.interval;
                this.deviceCode = json.device_code;
                NXDataStore.set('NAVIGRAPH_DEVICE_CODE', this.deviceCode);
            }
        } catch (_) {
            console.log('Unable to Authorize Device. #NV101');
        }
    }

    public deAuthenticate() {
        this.refreshToken = null;
        this.accessToken = null;
        this.userName = '';
        this.auth = NAVIGRAPH_DEFAULT_AUTH_STATE;
        NXDataStore.set('NAVIGRAPH_REFRESH_TOKEN', '');
        NXDataStore.set('NAVIGRAPH_USERNAME', '');
    }

    private async tokenCall(body): Promise<void> {
        if (this.deviceCode || !this.auth.disabled) {
            try {
                const tokenResp = await fetch('https://identity.api.navigraph.com/connect/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    body: formatFormBody(body),
                });

                if (tokenResp.ok) {
                    const json = await tokenResp.json();

                    const refreshToken = json.refresh_token;

                    this.refreshToken = refreshToken;
                    NXDataStore.set('NAVIGRAPH_REFRESH_TOKEN', refreshToken);

                    this.accessToken = json.access_token;

                    await this.assignUserName();
                } else {
                    const respText = await tokenResp.text();

                    const parsedText = JSON.parse(respText);

                    const { error } = parsedText;

                    switch (error) {
                    case 'authorization_pending': {
                        console.log('Token Authorization Pending');
                        break;
                    }
                    case 'slow_down': {
                        this.auth.interval += 5;
                        break;
                    }
                    case 'access_denied': {
                        this.auth.disabled = true;
                        throw new Error('Access Denied');
                    }
                    default: {
                        await this.authenticate();
                    }
                    }
                }
            } catch (e) {
                console.log('Token Authentication Failed. #NV102');
                if (e.message === 'Access Denied') {
                    throw e;
                }
            }
        }
    }

    public async getToken(): Promise<void> {
        if (NavigraphClient.hasSufficientEnv) {
            const newTokenBody = {
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                device_code: this.deviceCode,
                client_id: NavigraphClient.clientId,
                client_secret: NavigraphClient.clientSecret,
                scope: NAVIGRAPH_API_SCOPES,
                code_verifier: this.pkce.code_verifier,
            };

            const refreshTokenBody = {
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken,
                client_id: NavigraphClient.clientId,
                client_secret: NavigraphClient.clientSecret,
            };

            if (!this.refreshToken) {
                await this.tokenCall(newTokenBody);
            } else {
                await this.tokenCall(refreshTokenBody);
            }
        }
    }

    public async chartCall(icao: string, item: string): Promise<string> {
        if (icao.length === 4) {
            const callResp = await fetch(`https://charts.api.navigraph.com/2/airports/${icao}/signedurls/${item}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${this.accessToken}`,
                    },
                });
            if (callResp.ok) {
                return callResp.text();
            }
            // Unauthorized
            if (callResp.status === 401) {
                await this.getToken();
                return this.chartCall(icao, item);
            }
        }
        return Promise.reject();
    }

    public async amdbCall(query: string, recurseCount = 0): Promise<string> {
        const callResp = await fetch(`https://amdb.api.navigraph.com/v1/${query}`,
            {
                headers: {
                    Authorization:
                            `Bearer ${this.accessToken}`,
                },
            });

        if (callResp.ok) {
            return callResp.text();
        }

        // Unauthorized
        if (callResp.status === 401 && recurseCount === 0) {
            await this.getToken();

            return this.amdbCall(query, recurseCount + 1);
        }

        return Promise.reject();
    }

    public async getChartList(icao: string): Promise<NavigraphAirportCharts> {
        if (this.hasToken) {
            const chartJsonUrl = await this.chartCall(icao, 'charts.json');

            const chartJsonResp = await fetch(chartJsonUrl);

            if (chartJsonResp.ok) {
                const chartJson = await chartJsonResp.json();

                const chartArray: NavigraphChart[] = chartJson.charts.map((chart) => ({
                    fileDay: chart.file_day,
                    fileNight: chart.file_night,
                    thumbDay: chart.thumb_day,
                    thumbNight: chart.thumb_night,
                    icaoAirportIdentifier: chart.icao_airport_identifier,
                    id: chart.id,
                    extId: chart.ext_id,
                    fileName: chart.file_name,
                    type: {
                        code: chart.type.code,
                        category: chart.type.category,
                        details: chart.type.details,
                        precision: chart.type.precision,
                        section: chart.type.section,
                    },
                    indexNumber: chart.index_number,
                    procedureIdentifier: chart.procedure_identifier,
                    runway: chart.runway,
                    boundingBox: chart.planview ? {
                        bottomLeft: {
                            lat: chart.planview.bbox_geo[1],
                            lon: chart.planview.bbox_geo[0],
                            xPx: chart.planview.bbox_local[0],
                            yPx: chart.planview.bbox_local[1],
                        },
                        topRight: {
                            lat: chart.planview.bbox_geo[3],
                            lon: chart.planview.bbox_geo[2],
                            xPx: chart.planview.bbox_local[2],
                            yPx: chart.planview.bbox_local[3],
                        },
                        width: chart.bbox_local[2],
                        height: chart.bbox_local[1],
                    } : undefined,
                }));

                return {
                    arrival: chartArray.filter((chart) => chart.type.category === 'ARRIVAL'),
                    approach: chartArray.filter((chart) => chart.type.category === 'APPROACH'),
                    airport: chartArray.filter((chart) => chart.type.category === 'AIRPORT'),
                    departure: chartArray.filter((chart) => chart.type.category === 'DEPARTURE'),
                    reference: chartArray.filter((chart) => (
                        (chart.type.category !== 'ARRIVAL')
                        && (chart.type.category !== 'APPROACH')
                        && (chart.type.category !== 'AIRPORT')
                        && (chart.type.category !== 'DEPARTURE')
                    )),
                };
            }
        }

        return emptyNavigraphCharts;
    }

    public async getAirportInfo(icao: string): Promise<AirportInfo | null> {
        if (this.hasToken) {
            const chartJsonUrl = await this.chartCall(icao, 'airport.json');

            const chartJsonResp = await fetch(chartJsonUrl);

            if (chartJsonResp.ok) {
                const chartJson = await chartJsonResp.json();

                return { name: chartJson.name };
            }
        }

        return null;
    }

    public async searchAmdbAirports(queryString: string): Promise<AmdbAirportSearchResponse> {
        let query = 'search';

        query += `?q=${queryString}`;

        const response = await this.amdbCall(query);

        return JSON.parse(response);
    }

    public async getAmdbData(
        icao: string,
        includeFeatureTypes?: FeatureTypeString[],
        excludeFeatureTypes?: FeatureTypeString[],
        projection = AmdbProjection.ArpAzeq,
    ): Promise<AmdbResponse> {
        let query = icao;

        const excludeString = excludeFeatureTypes ? excludeFeatureTypes.join(',') : '';
        const includeString = includeFeatureTypes ? includeFeatureTypes.join(',') : '';

        query += `?projection=${projection}`;
        query += '&format=geojson';
        query += `&exclude=${excludeString}`;
        query += `&include=${includeString}`;

        const response = await this.amdbCall(query);

        return JSON.parse(response);
    }

    public get hasToken(): boolean {
        return !!this.accessToken;
    }

    public async assignUserName(): Promise<void> {
        if (this.hasToken) {
            try {
                const userInfoResp = await fetch('https://identity.api.navigraph.com/connect/userinfo', { headers: { Authorization: `Bearer ${this.accessToken}` } });

                if (userInfoResp.ok) {
                    const userInfoJson = await userInfoResp.json();

                    this.userName = userInfoJson.preferred_username;
                    NXDataStore.set('NAVIGRAPH_USERNAME', this.userName);
                }
            } catch (_) {
                console.log('Unable to Fetch User Info. #NV103');
            }
        }
    }

    public async fetchSubscriptionStatus(): Promise<NavigraphSubscriptionStatus> {
        if (this.hasToken) {
            const decodedToken = JSON.parse(atob(this.accessToken.split('.')[1]));

            const subscriptionTypes = decodedToken.subscriptions as string[];

            if (subscriptionTypes.includes('fmsdata') && subscriptionTypes.includes('charts')) {
                return NavigraphSubscriptionStatus.Unlimited;
            }
        }

        return NavigraphSubscriptionStatus.None;
    }
}
