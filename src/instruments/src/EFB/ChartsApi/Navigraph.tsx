import React, { useContext } from 'react';
// @ts-ignore
import pkce from '@navigraph/pkce';

import { NXDataStore } from '@shared/persistence';

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

    public tokenRefreshInterval: number = 3600;

    private accessToken: string;

    public auth: AuthType = {
        code: '',
        link: '',
        qrLink: '',
        interval: 5,
        disabled: false,
    }

    public userName: string = '';

    public static sufficientEnv() {
        return !(NavigraphClient.clientSecret === undefined || NavigraphClient.clientId === undefined);
    }

    constructor() {
        if (NavigraphClient.sufficientEnv()) {
            this.pkce = pkce();

            const token = NXDataStore.get<string>('NAVIGRAPH_REFRESH_TOKEN');

            if (token === undefined || token === null || token === '') {
                this.authenticate();
            } else {
                this.refreshToken = token;
                this.getToken();
            }
        }
    }

    public authenticate() {
        this.pkce = pkce();
        this.refreshToken = null;

        const secret = {
            client_id: NavigraphClient.clientId,
            client_secret: NavigraphClient.clientSecret,
            code_challenge: this.pkce.code_challenge,
            code_challenge_method: 'S256',
        };

        fetch('https://identity.api.navigraph.com/connect/deviceauthorization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: formatFormBody(secret),
        }).then((resp) => {
            if (resp.ok) {
                resp.json().then((r) => {
                    this.auth.code = r.user_code;
                    this.auth.link = r.verification_uri;
                    this.auth.qrLink = r.verification_uri_complete;
                    this.auth.interval = r.interval;
                    this.deviceCode = r.device_code;
                });
            }
        }).catch(() => {
            console.log('Unable to Authorize Device. #NV101');
        });
    }

    private tokenCall(body) {
        if (this.deviceCode || !this.auth.disabled) {
            fetch('https://identity.api.navigraph.com/connect/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: formatFormBody(body),
            }).then((resp) => {
                if (resp.ok) {
                    resp.json().then((r) => {
                        const refreshToken = r.refresh_token;

                        this.refreshToken = refreshToken;
                        NXDataStore.set('NAVIGRAPH_REFRESH_TOKEN', refreshToken);
                        this.userInfo();

                        this.accessToken = r.access_token;
                    });
                } else {
                    resp.text().then((respText) => {
                        const parsedText = JSON.parse(respText);

                        const { error } = parsedText;

                        if (error === 'slow_down') {
                            this.auth.interval += 5;
                        } else if (error === 'authorization_pending') {
                            console.log('Token Authorization Pending');
                        } else if (error === 'access_denied') {
                            this.auth.disabled = true;
                        } else if (error === 'expired_token') {
                            this.authenticate();
                        }
                    });
                }
            }).catch(() => {
                console.log('Token Authentication Failed. #NV102');
            });
        }
    }

    public getToken() {
        if (NavigraphClient.sufficientEnv()) {
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
                this.tokenCall(newTokenBody);
            } else {
                this.tokenCall(refreshTokenBody);
            }
        }
    }

    public async chartCall(icao: string, item: string): Promise<string> {
        if (icao.length === 4) {
            const callResp = await fetch(`https://charts.api.navigraph.com/2/airports/${icao}/signedurls/${item}`, { headers: { Authorization: `Bearer ${this.accessToken}` } });

            if (callResp.ok) {
                return callResp.text();
            }
        }
        return Promise.reject();
    }

    public async getChartList(icao: string): Promise<NavigraphAirportCharts> {
        if (this.hasToken()) {
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

    public async getAirportInfo(icao: string): Promise<AirportInfo> {
        if (this.hasToken()) {
            const chartJsonUrl = await this.chartCall(icao, 'airport.json');

            const chartJsonResp = await fetch(chartJsonUrl);

            if (chartJsonResp.ok) {
                const chartJson = await chartJsonResp.json();

                return { name: chartJson.name };
            }
        }

        return { name: 'AIRPORT DOES NOT EXIST' };
    }

    public hasToken() {
        return !!this.accessToken;
    }

    public async userInfo() {
        if (this.hasToken()) {
            const userInfoResp = await fetch('https://identity.api.navigraph.com/connect/userinfo', { headers: { Authorization: `Bearer ${this.accessToken}` } }).catch(() => {
                console.log('Unable to Fetch User Info. #NV103');
            });

            if (userInfoResp.ok) {
                const userInfoJson = await userInfoResp.json();

                this.userName = userInfoJson.preferred_username;
            }
        }

        return '';
    }

    public async subscriptionStatus() {
        if (this.hasToken()) {
            const subscriptionResp = await fetch('https://subscriptions.api.navigraph.com/2/subscriptions/valid', { headers: { Authorization: `Bearer ${this.accessToken}` } }).catch(() => {
                console.log('Unable to Fetch Subscription Status. #NV104');
            });

            if (subscriptionResp.ok) {
                const subscriptionJson = await subscriptionResp.json();

                return subscriptionJson.subscription_name;
            }
        }

        return '';
    }
}

export const NavigraphContext = React.createContext<NavigraphClient>(undefined!);

export const useNavigraph = () => useContext(NavigraphContext);
