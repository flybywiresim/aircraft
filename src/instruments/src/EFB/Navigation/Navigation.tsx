import React, { useContext, useEffect, useState } from 'react';
import QRCode from 'qrcode.react';

import { IconArrowsMaximize, IconArrowsMinimize, IconMoon, IconSun } from '@tabler/icons';

import useInterval from '../../Common/useInterval';

import NavigraphClient, {
    AirportInfo,
    NavigraphAirportCharts,
    NavigraphChart,
    NavigraphContext,
    useNavigraph,
} from '../ChartsApi/Navigraph';
import ChartFoxClient, { ChartFoxAirportCharts, ChartFoxChart } from '../ChartsApi/ChartFox';

type Chart = NavigraphChart | ChartFoxChart;

type Charts = NavigraphAirportCharts | ChartFoxAirportCharts;

type ChartsUiProps = {
    enableNavigraph: boolean,
    chartFox: ChartFoxClient,
    icao: string,
    charts: Charts,
    setIcao: (string) => void,
    setCharts: (Charts) => void,
}

type NavigraphChartComponentProps = {
    chartLink: ChartDisplay,
    userInfo: string,
    isFullscreen: boolean,
    enableDarkCharts: boolean
    setIsFullscreen: (boolean) => void,
    setEnableDarkCharts: (boolean) => void,
}

type NavigraphChartSelectorProps = {
    selectedTab: OrganizedChartType,
    selectedChartId: string,
    handleChartClick: CallableFunction,
}

type OrganizedChartType = {
    name: string,
    charts: Chart[],
    bundleRunways?: boolean,
}

type RunwayOrganizedChartType = {
    name: string,
    charts: Chart[],
}

type ChartDisplay = {
    light: string,
    dark: string
}

const Loading = () => (
    <div className="flex flex-col items-center justify-center">
        <p className="text-white text-3xl">Loading...</p>
        <span
            className="text-teal-regular text-2xl"
            onClick={() => window.localStorage.setItem('refreshToken', '')}
        >
            Reset Refresh Token
        </span>
    </div>
);

const AuthUi = () => {
    const { auth } = useNavigraph();

    const hasQr = !!auth.qrLink;

    return (
        <div className="h-efb w-full bg-navy-lightest rounded-xl text-white shadow-lg mr-4 overflow-x-hidden">
            <div className="flex flex-col m-6">
                <p className="text-white text-center text-3xl mb-6">Authenticate with Navigraph</p>
                {hasQr
                    ? (
                        <>
                            <QRCode
                                value={auth.qrLink}
                                size={400}
                                className="ml-auto mr-auto"
                            />
                            <p className="mt-4 text-3xl ml-auto mr-auto text-white w-2/3 text-center">
                                Enter '
                                <span className="text-teal-regular">{auth.link}</span>
                                ' into your browser or scan the QR Code, enter the code below if using the website option
                            </p>
                            <p className="ml-auto mr-auto rounded-md bg-navy-medium px-4 py-2 mt-4 text-3xl text-center text-white">{auth.code}</p>
                        </>
                    )
                    : <Loading />}
            </div>
        </div>
    );
};

const NavigraphChartComponent = (props: NavigraphChartComponentProps) => (
    <div className={props.isFullscreen
        ? 'relative flex flex-row overflow-scroll'
        : 'relative flex flex-row overflow-scroll w-2/3'}
    >
        <div className="absolute z-10 m-3 bg-navy-light p-2 rounded-lg">
            <div onClick={() => props.setIsFullscreen(!props.isFullscreen)}>
                {!props.isFullscreen
                    ? <IconArrowsMaximize size={30} />
                    : <IconArrowsMinimize size={30} />}
            </div>
        </div>

        <div className="absolute top-0 right-0 z-10 m-3 bg-navy-light p-2 rounded-lg">
            <div onClick={() => props.setEnableDarkCharts(!props.enableDarkCharts)}>
                {!props.enableDarkCharts
                    ? <IconMoon size={30} />
                    : <IconSun size={30} />}
            </div>
        </div>

        <div className="m-auto relative">
            <span className="absolute mt-2 ml-6 text-red-600 font-bold">
                {`This chart is linked to ${props.userInfo}`}
            </span>
            {!props.enableDarkCharts
                ? <img src={props.chartLink.light} alt="chart" />
                : <img src={props.chartLink.dark} alt="chart" />}
        </div>
    </div>
);

const NavigraphChartSelector = (props: NavigraphChartSelectorProps) => {
    const noRunwayName = 'NONE';
    const [runwaySet, setRunwaySet] = useState<Set<string>>(() => new Set());
    const [organizedCharts, setOrganizedCharts] = useState<RunwayOrganizedChartType[]>([]);

    useEffect(() => {
        if (props.selectedTab.bundleRunways) {
            const runwayNumbers: string[] = [];

            props.selectedTab.charts.forEach((chart) => {
                const navigraphChart = (chart as NavigraphChart);

                if (navigraphChart.runway.length !== 0) {
                    navigraphChart.runway.forEach((runway) => {
                        runwayNumbers.push(runway);
                    });
                } else {
                    runwayNumbers.push(noRunwayName);
                }
            });

            setRunwaySet(new Set(runwayNumbers));
        } else {
            setRunwaySet(new Set());
        }
    }, [props.selectedTab.charts]);

    useEffect(() => {
        if (props.selectedTab.bundleRunways) {
            const organizedRunwayCharts: RunwayOrganizedChartType[] = [];

            runwaySet.forEach((runway) => {
                organizedRunwayCharts.push({
                    name: runway,
                    charts: props.selectedTab.charts.filter(
                        (chart) => (chart as NavigraphChart).runway.includes(runway)
                            || ((chart as NavigraphChart).runway.length === 0 && runway === noRunwayName),
                    ),
                });
            });

            setOrganizedCharts(organizedRunwayCharts);
        } else {
            setOrganizedCharts([]);
        }
    }, [runwaySet]);

    return (
        <>
            {props.selectedTab.bundleRunways
                ? (
                    <>
                        {organizedCharts.map((item) => (
                            <div className="flex flex-col text-lg rounded-lg bg-navy-light mr-4 pb-2">
                                <span className="p-1 bg-gray-700 text-center rounded-t-lg">{item.name}</span>
                                {item.charts.map((chart) => (
                                    <div
                                        className="flex flex-row bg-navy-light"
                                        onClick={() => props.handleChartClick((chart as NavigraphChart).fileDay, (chart as NavigraphChart).fileNight, (chart as NavigraphChart).id)}
                                        key={(chart as NavigraphChart).id}
                                    >
                                        {(chart as NavigraphChart).id === props.selectedChartId
                                            ? <div className="h-full w-2 bg-teal-light-contrast" />
                                            : <div className="h-full w-2 bg-navy-light" />}
                                        <div className="flex flex-col mx-2 my-2">
                                            <span className="">{(chart as NavigraphChart).procedureIdentifier}</span>
                                            <span
                                                className="mr-auto text-sm bg-gray-700 text-gray-400 rounded-md px-2 mt-0.5"
                                            >
                                                {(chart as NavigraphChart).indexNumber}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </>
                )
                : (
                    <>
                        {props.selectedTab.charts.map((chart) => (
                            <div
                                className="flex flex-row bg-navy-light text-lg rounded-lg mr-4"
                                onClick={() => props.handleChartClick((chart as NavigraphChart).fileDay, (chart as NavigraphChart).fileNight, (chart as NavigraphChart).id)}
                                key={(chart as NavigraphChart).id}
                            >
                                {(chart as NavigraphChart).id === props.selectedChartId
                                    ? <div className="h-full w-2 bg-teal-light-contrast rounded-l-lg" />
                                    : <div className="h-full w-2 bg-navy-light rounded-l-lg" />}
                                <div className="flex flex-col mx-2 my-1">
                                    <span className="">{(chart as NavigraphChart).procedureIdentifier}</span>
                                    <span
                                        className="mr-auto text-sm bg-gray-700 text-gray-400 rounded-md px-2"
                                    >
                                        {(chart as NavigraphChart).indexNumber}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
        </>
    );
};

const ChartsUi = (props: ChartsUiProps) => {
    const navigraph = useNavigraph();

    const [enableDarkCharts, setEnableDarkCharts] = useState<boolean>(true); // Navigraph Only
    const [userInfo, setUserInfo] = useState<string>(''); // Navigraph Only
    const [airportInfo, setAirportInfo] = useState<AirportInfo>({ name: '' }); // Navigraph Only

    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const [organizedCharts, setOrganizedCharts] = useState<OrganizedChartType[]>([
        { name: 'STAR', charts: props.charts.arrival },
        { name: 'APP', charts: props.charts.approach, bundleRunways: true },
        { name: 'TAXI', charts: props.charts.airport },
        { name: 'SID', charts: props.charts.departure },
        { name: 'REF', charts: props.charts.reference },
    ]);

    const [selectedTab, setSelectedTab] = useState<OrganizedChartType>(organizedCharts[0]);
    const [selectedChartName, setSelectedChartName] = useState<ChartDisplay>({ light: '', dark: '' });
    const [selectedChartId, setSelectedChartId] = useState<string>('');
    const [chartLink, setChartLink] = useState<ChartDisplay>({ light: '', dark: '' });

    useEffect(() => {
        if (props.enableNavigraph) {
            navigraph.getAirportInfo(props.icao).then((r) => setAirportInfo(r));
        }
    }, [props.charts]);

    useEffect(() => {
        if (props.enableNavigraph) {
            setOrganizedCharts([
                { name: 'STAR', charts: props.charts.arrival },
                { name: 'APP', charts: props.charts.approach, bundleRunways: true },
                { name: 'TAXI', charts: props.charts.airport },
                { name: 'SID', charts: props.charts.departure },
                { name: 'REF', charts: props.charts.reference },
            ]);
        }
    }, [props.charts]);

    useEffect(() => {
        if (props.enableNavigraph) {
            setSelectedTab(organizedCharts[0]);
        }
    }, [organizedCharts]);

    useEffect(() => {
        if (props.enableNavigraph) {
            const chartsGet = async () => {
                const light = await navigraph.chartCall(props.icao, selectedChartName.light);
                const dark = await navigraph.chartCall(props.icao, selectedChartName.dark);

                setChartLink({ light, dark });
            };

            chartsGet();
        }
    }, [selectedChartName]);

    useEffect(() => {
        if (props.enableNavigraph) {
            if (userInfo === '') {
                navigraph.userInfo().then((r) => setUserInfo(r));
            }
        }
    });

    const handleIcaoChange = (value: string) => {
        const newValue = value.toUpperCase();

        if (newValue.length === 4) {
            if (props.enableNavigraph) {
                navigraph.getChartList(newValue).then((r) => {
                    if (r) {
                        props.setCharts(r);
                    }
                });
            } else {
                props.chartFox.getChartList(newValue).then((r) => props.setCharts(r));
            }
        }

        props.setIcao(newValue);
    };

    const handleChartClick = (chartNameDay: string, chartNameNight: string, chartId: string) => {
        setSelectedChartId(chartId);

        setSelectedChartName({ light: chartNameDay, dark: chartNameNight });
    };

    return (
        <div className="flex flex-row h-efb w-full bg-navy-medium rounded-xl text-white shadow-lg mr-4 overflow-x-hidden">
            {!isFullscreen
                ? (
                    <>
                        <div className="flex flex-col w-1/3 h-full bg-navy-lightest">
                            <input
                                type="text"
                                placeholder="ICAO"
                                value={props.icao}
                                maxLength={4}
                                className="w-3/5 text-xl pb-1 mx-6 mt-6 bg-navy-lightest border-b-2 border-teal-light-contrast focus-within:outline-none focus-within:border-teal-medium"
                                onChange={(event) => handleIcaoChange(event.target.value)}
                            />
                            <div className="flex items-center w-full mt-5 h-9 bg-teal-light-contrast pl-7">
                                {props.icao.length !== 4
                                    ? <span className="text-xl">No Airport Selected</span>
                                    : <span className="text-xl">{airportInfo.name}</span>}
                            </div>
                            <div className="flex flex-col p-6">
                                <div className="flex flex-row justify-around bg-navy-light rounded-md">
                                    {organizedCharts.map((organizedChart) => (organizedChart.name === selectedTab.name
                                        ? (
                                            <span
                                                className="py-2 px-2 text-lg rounded-md bg-teal-light-contrast select-none"
                                                onClick={() => setSelectedTab(organizedChart)}
                                            >
                                                {organizedChart.name}
                                            </span>
                                        )
                                        : (
                                            <span
                                                className="py-2 px-2 text-lg rounded-md select-none"
                                                onClick={() => setSelectedTab(organizedChart)}
                                            >
                                                {organizedChart.name}
                                            </span>
                                        )))}
                                </div>
                                <div className="mt-5 h-144 space-y-4 overflow-scroll">
                                    {props.enableNavigraph
                                        ? (
                                            <NavigraphChartSelector
                                                selectedTab={selectedTab}
                                                selectedChartId={selectedChartId}
                                                handleChartClick={handleChartClick}
                                            />
                                        )
                                        : (
                                            <>
                                                {selectedTab.charts.map((chart) => (
                                                    <div className="mt-4">
                                                        <span>{(chart as ChartFoxChart).name}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                </div>
                            </div>
                        </div>
                        {chartLink.light
                            ? (
                                <NavigraphChartComponent
                                    chartLink={chartLink}
                                    userInfo={userInfo}
                                    isFullscreen={isFullscreen}
                                    enableDarkCharts={enableDarkCharts}
                                    setIsFullscreen={setIsFullscreen}
                                    setEnableDarkCharts={setEnableDarkCharts}
                                />
                            )
                            : <></>}
                    </>
                )
                : (
                    <NavigraphChartComponent
                        chartLink={chartLink}
                        userInfo={userInfo}
                        isFullscreen={isFullscreen}
                        enableDarkCharts={enableDarkCharts}
                        setIsFullscreen={setIsFullscreen}
                        setEnableDarkCharts={setEnableDarkCharts}
                    />
                )}
        </div>
    );
};

const NavigraphNav = (props: ChartsUiProps) => (
    <NavigraphContext.Consumer>
        {(navigraph) => (
            <>
                {NavigraphClient.sufficientEnv()
                    ? (
                        <>
                            {navigraph.hasToken()
                                ? (
                                    <ChartsUi
                                        enableNavigraph
                                        chartFox={props.chartFox}
                                        icao={props.icao}
                                        charts={props.charts}
                                        setIcao={props.setIcao}
                                        setCharts={props.setCharts}
                                    />
                                )
                                : <AuthUi />}
                        </>
                    )
                    : (
                        <div className="flex items-center justify-center h-efb w-full bg-navy-lightest rounded-xl shadow-lg mr-4 overflow-x-hidden">
                            <p className="text-3xl pt-6 text-white mb-6">Insufficient .env file</p>
                        </div>
                    )}
            </>
        )}
    </NavigraphContext.Consumer>
);

const ChartFoxNav = (props: ChartsUiProps) => (
    <ChartsUi
        enableNavigraph={false}
        chartFox={props.chartFox}
        icao={props.icao}
        charts={props.charts}
        setIcao={props.setIcao}
        setCharts={props.setCharts}
    />
);

const Navigation = () => {
    const navigraph = useContext(NavigraphContext);

    const [enableNavigraph] = useState<boolean>(true);
    const [chartFox] = useState(() => new ChartFoxClient());
    const [icao, setIcao] = useState<string>('');
    const [charts, setCharts] = useState<Charts>({
        arrival: [],
        approach: [],
        airport: [],
        departure: [],
        reference: [],
    });

    useInterval(() => {
        if (enableNavigraph) {
            if (!navigraph.hasToken()) {
                navigraph.getToken();
            }
        }
    }, (navigraph.auth.interval * 1000));

    useInterval(() => {
        if (enableNavigraph) {
            navigraph.getToken();
        }
    }, (navigraph.tokenRefreshInterval * 1000));

    return (
        <div className="w-full h-full">
            <div className="flex">
                <h1 className="text-3xl pt-6 text-white mb-6">Navigation & Charts</h1>
            </div>
            {enableNavigraph
                ? (
                    <NavigraphNav
                        enableNavigraph={enableNavigraph}
                        chartFox={chartFox}
                        icao={icao}
                        charts={charts}
                        setIcao={setIcao}
                        setCharts={setCharts}
                    />
                )
                : (
                    <ChartFoxNav
                        enableNavigraph={enableNavigraph}
                        chartFox={chartFox}
                        icao={icao}
                        charts={charts}
                        setIcao={setIcao}
                        setCharts={setCharts}
                    />
                )}
        </div>
    );
};

export default Navigation;
