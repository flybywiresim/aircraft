import React, { useContext } from 'react';
import pkce from '@navigraph/pkce';

import { NXDataStore } from '@shared/persistence';

export interface NavigraphBoundingBox {
    bottomLeft: { lat: number, lon: number, xPx: number, yPx: number },
    topRight: { lat: number, lon: number, xPx: number, yPx: number },
    width: number,
    height: number,
}

export interface NavigraphChart {
    fileUrlDay: string,
    fileUrlNight: string,
    thumbDay: string,
    thumbNight: string,
    icaoAirportIdentifier: string,
    id: string,
    category: string,
    indexNumber: string,
    name: string,
    runways: string[],
    boundingBox?: NavigraphBoundingBox,
}

export type NavigraphAirportCharts = {
    arrival: NavigraphChart[],
    approach: NavigraphChart[],
    airport: NavigraphChart[],
    departure: NavigraphChart[],
    reference: NavigraphChart[],
};

export type AirportInfo = {
    name: string,
}

export type AuthType = {
    code: string,
    link: string,
    qrLink: string,
    interval: number,
    disabled: boolean,
}

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

export default class NavigraphClient {
    private static clientId = process.env.CLIENT_ID;

    private static clientSecret = process.env.CLIENT_SECRET;

    private pkce;

    private deviceCode: string;

    private refreshToken: string | null;

    public tokenRefreshInterval = 3600;

    private accessToken: string;

    public auth: AuthType = {
        code: '',
        link: '',
        qrLink: '',
        interval: 5,
        disabled: false,
    }

    public userName = '';

    public static get hasSufficientEnv() {
        return !(NavigraphClient.clientSecret === undefined || NavigraphClient.clientId === undefined);
    }

    constructor() {
        if (NavigraphClient.hasSufficientEnv) {
            this.pkce = pkce();

            const token = NXDataStore.get('NAVIGRAPH_REFRESH_TOKEN');

            if (token) {
                this.refreshToken = token;
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
            }
        } catch (_) {
            console.log('Unable to Authorize Device. #NV101');
        }
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
                scope: 'openid charts offline_access',
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

    public async getChartImage(url: string): Promise<string> {
        if (url.length !== 0) {
            const callResp = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
            if (callResp.ok) {
                const blob = await callResp.blob();
                const objectUrl = URL.createObjectURL(blob);
                return Promise.resolve(objectUrl);
            }
            // Unauthorized
            if (callResp.status === 401) {
                await this.getToken();
                return this.getChartImage(url);
            }
        }
        return Promise.reject();
    }

    public async getChartList(icao: string): Promise<NavigraphAirportCharts> {
        if (this.hasToken) {
            const chartJsonResp = await fetch(`https://api.navigraph.com/v2/charts/${icao}?version=CAO`, { headers: { Authorization: `Bearer ${this.accessToken}` } });

            if (chartJsonResp.ok) {
                const chartJson = await chartJsonResp.json();

                const chartArray: NavigraphChart[] = chartJson.charts.map((chart) => ({
                    fileUrlDay: chart.image_day_url,
                    fileUrlNight: chart.image_night_url,
                    thumbDay: chart.thumb_day,
                    thumbNight: chart.thumb_night,
                    icaoAirportIdentifier: chart.icao_airport_identifier,
                    id: chart.id,
                    category: chart.category,
                    indexNumber: chart.index_number,
                    name: chart.name,
                    runways: chart.runways,
                    boundingBox: chart.bounding_boxes?.planview ? {
                        bottomLeft: {
                            lat: chart.bounding_boxes.planview.latlng.lat1,
                            lon: chart.bounding_boxes.planview.latlng.lng1,
                            xPx: chart.bounding_boxes.planview.pixels.x1,
                            yPx: chart.bounding_boxes.planview.pixels.y1,
                        },
                        topRight: {
                            lat: chart.bounding_boxes.planview.latlng.lat2,
                            lon: chart.bounding_boxes.planview.latlng.lng2,
                            xPx: chart.bounding_boxes.planview.pixels.x2,
                            yPx: chart.bounding_boxes.planview.pixels.y2,
                        },
                        width: chart.width,
                        height: chart.height,
                    } : undefined,
                }));

                return {
                    arrival: chartArray.filter((chart) => chart.category === 'ARR'),
                    approach: chartArray.filter((chart) => chart.category === 'APP'),
                    airport: chartArray.filter((chart) => chart.category === 'APT'),
                    departure: chartArray.filter((chart) => chart.category === 'DEP'),
                    reference: chartArray.filter((chart) => chart.category === 'REF'),
                };
            }
        }

        return emptyNavigraphCharts;
    }

    public async getAirportInfo(icao: string): Promise<AirportInfo | null> {
        if (this.hasToken) {
            const airportJsonResp = await fetch(`https://api.navigraph.com/v2/airport/${icao}`, { headers: { Authorization: `Bearer ${this.accessToken}` } });

            if (airportJsonResp.ok) {
                const airportJson = await airportJsonResp.json();

                return { name: airportJson.name };
            }
        }

        return null;
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
                }
            } catch (_) {
                console.log('Unable to Fetch User Info. #NV103');
            }
        }
    }

    public async subscriptionStatus(): Promise<string> {
        if (this.hasToken) {
            try {
                const subscriptionResp = await fetch('https://subscriptions.api.navigraph.com/2/subscriptions/valid', { headers: { Authorization: `Bearer ${this.accessToken}` } });

                if (subscriptionResp.ok) {
                    const subscriptionJson = await subscriptionResp.json();

                    return subscriptionJson.subscription_name;
                }
            } catch (_) {
                console.log('Unable to Fetch Subscription Status. #NV104');
            }
        }

        return '';
    }
}

export const NavigraphContext = React.createContext<NavigraphClient>(undefined!);

export const useNavigraph = () => useContext(NavigraphContext);
