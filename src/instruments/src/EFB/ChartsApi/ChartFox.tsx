export type ChartFoxChart = {
    name: string,
    type: string,
    runway: null | string,
    url: string,
}

export type ChartFoxAirportCharts = {
    arrival: ChartFoxChart[],
    approach: ChartFoxChart[],
    airport: ChartFoxChart[],
    departure: ChartFoxChart[],
    reference: ChartFoxChart[],
}

export default class ChartFoxClient {
    private static token = process.env.CHARTFOX_SECRET;

    public static sufficientEnv() {
        return !!ChartFoxClient.token;
    }

    public async getChartList(icao: string): Promise<ChartFoxAirportCharts> {
        if (ChartFoxClient.sufficientEnv()) {
            if (icao.length === 4) {
                const chartJsonResp = await fetch(`https://chartfox.org/api/charts/grouped/${icao}?token=${ChartFoxClient.token}`, { method: 'POST' }).catch(() => {
                    // eslint-disable-next-line no-console
                    console.warn('Token Authentication Failed. #CF101');
                });

                if (chartJsonResp.ok) {
                    const chartJson = await chartJsonResp.json();

                    const groundLayoutArray: ChartFoxChart[] = chartJson.charts['2'].charts.map((charts) => ({
                        name: charts.name,
                        type: charts.type,
                        runway: charts.runway,
                        url: charts.url,
                    }));

                    const generalArray: ChartFoxChart[] = chartJson.charts['0'].charts.map((charts) => ({
                        name: charts.name,
                        type: charts.type,
                        runway: charts.runway,
                        url: charts.url,
                    }));

                    const textualArray: ChartFoxChart[] = chartJson.charts['1'].charts.map((charts) => ({
                        name: charts.name,
                        type: charts.type,
                        runway: charts.runway,
                        url: charts.url,
                    }));

                    const sidArray: ChartFoxChart[] = chartJson.charts['6'].charts.map((charts) => ({
                        name: charts.name,
                        type: charts.type,
                        runway: charts.runway,
                        url: charts.url,
                    }));

                    const starArray: ChartFoxChart[] = chartJson.charts['7'].charts.map((charts) => ({
                        name: charts.name,
                        type: charts.type,
                        runway: charts.runway,
                        url: charts.url,
                    }));

                    const approachArray: ChartFoxChart[] = chartJson.charts['8'].charts.map((charts) => ({
                        name: charts.name,
                        type: charts.type,
                        runway: charts.runway,
                        url: charts.url,
                    }));

                    return {
                        arrival: starArray,
                        approach: approachArray,
                        airport: groundLayoutArray,
                        departure: sidArray,
                        reference: generalArray.concat(textualArray),
                    };
                }
            }
        }

        return {
            arrival: [],
            approach: [],
            airport: [],
            departure: [],
            reference: [],
        };
    }
}
