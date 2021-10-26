import React, { useContext, useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode.react';
import { IconArrowsMaximize, IconArrowsMinimize, IconLock, IconMoon, IconSun, IconPlus, IconMinus } from '@tabler/icons';
import useInterval from '../../Common/useInterval';
import NavigraphClient, {
    AirportInfo,
    emptyNavigraphCharts,
    NavigraphAirportCharts,
    NavigraphChart,
    NavigraphContext,
    useNavigraph,
} from '../ChartsApi/Navigraph';
import ChartFoxClient, { ChartFoxAirportCharts, ChartFoxChart } from '../ChartsApi/ChartFox';
import navigraphLogo from '../Assets/navigraph-logo.svg';
import { usePersistentProperty } from '../../Common/persistence';
import SimpleInput from '../Components/Form/SimpleInput/SimpleInput';

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
    isFullscreen: boolean,
    enableDarkCharts: boolean
    setIsFullscreen: (boolean) => void,
    setEnableDarkCharts: (boolean) => void,
}

type NavigraphChartSelectorProps = {
    selectedTab: OrganizedChartType,
    selectedChartId: string,
    onChartClick: CallableFunction,
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

const Loading = () => {
    const navigraph = useNavigraph();
    const [, setRefreshToken] = usePersistentProperty('NAVIGRAPH_REFRESH_TOKEN');

    const handleResetRefreshToken = () => {
        setRefreshToken('');
        navigraph.authenticate();
    };

    return (
        <div className="flex flex-col justify-center items-center">
            <p className="text-xl text-white">Loading...</p>
            <button
                type="button"
                className="flex justify-center items-center p-2 mt-6 w-64 text-white rounded-lg focus:outline-none bg-teal-light"
                onClick={handleResetRefreshToken}
            >
                Reset Navigraph Authentication
            </button>
        </div>
    );
};

const AuthUi = () => {
    const navigraph = useNavigraph();

    const hasQr = !!navigraph.auth.qrLink;

    useInterval(() => {
        if (!navigraph.hasToken()) {
            navigraph.getToken();
        }
    }, (navigraph.auth.interval * 1000));

    return (
        <div className="flex overflow-x-hidden justify-center items-center p-6 w-full text-white rounded-2xl shadow-lg h-efb bg-navy-lighter">
            <div className="flex flex-col">
                <p className="flex justify-center items-center mb-6 text-2xl text-white">
                    <IconLock className="mr-2" size={24} stroke={1.5} strokeLinejoin="miter" />
                    Authenticate with
                    {' '}
                    <img src={navigraphLogo} className="ml-3 h-10" alt="Navigraph Logo" />
                </p>
                {hasQr
                    ? (
                        <>
                            <div className="p-3 mr-auto ml-auto bg-white rounded-xl">
                                <QRCode
                                    value={navigraph.auth.qrLink}
                                    size={400}
                                />
                            </div>
                            <p className="mt-8 mr-auto ml-auto w-2/3 text-xl text-center text-white">
                                Scan the QR Code or open '
                                <span className="text-teal-regular">{navigraph.auth.link}</span>
                                ' into your browser and enter the code below
                            </p>
                            <h1 className="py-2 px-4 mt-4 mr-auto ml-auto text-center text-white rounded-md bg-navy-medium">{navigraph.auth.code}</h1>
                        </>
                    )
                    : <Loading />}
            </div>
        </div>
    );
};

const NavigraphChartComponent = (props: NavigraphChartComponentProps) => {
    const navigraph = useNavigraph();
    const position = useRef({ top: 0, y: 0, left: 0, x: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseDown = (event) => {
        position.current.top = ref.current ? ref.current.scrollTop : 0;
        position.current.y = event.clientY;
        position.current.left = ref.current ? ref.current.scrollLeft : 0;
        position.current.x = event.clientX;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (event) => {
        const dy = event.clientY - position.current.y;
        const dx = event.clientX - position.current.x;
        if (ref.current) {
            ref.current.scrollTop = position.current.top - dy;
            ref.current.scrollLeft = position.current.left - dx;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    const handleZoomIn = () => {
        const chart :any = document.getElementById('chart');
        const currWidth = chart.clientWidth;
        if (currWidth === 2500) return;

        chart.style.width = `${currWidth + 100}px`;
    };

    const handleZoomOut = () => {
        const chart :any = document.getElementById('chart');
        const currWidth = chart.clientWidth;
        if (currWidth === 100) return;

        chart.style.width = `${currWidth - 100}px`;
    };

    return (
        <div
            className={props.isFullscreen
                ? 'relative flex flex-row overflow-x-hidden overflow-y-scroll w-full max-w-6xl mx-auto grabbable no-scrollbar'
                : 'relative flex flex-row overflow-x-hidden overflow-y-scroll w-2/3 max-w-3xl mx-auto grabbable no-scrollbar'}
            ref={ref}
            onMouseDown={handleMouseDown}
        >
            <div className="flex fixed top-40 right-12 z-40 flex-col justify-end">
                <div className="p-2 mb-2 bg-opacity-50 rounded-lg bg-navy-lighter">
                    <div onClick={() => props.setIsFullscreen(!props.isFullscreen)}>
                        {!props.isFullscreen
                            ? <IconArrowsMaximize size={30} />
                            : <IconArrowsMinimize size={30} />}
                    </div>
                </div>

                <div className="p-2 bg-opacity-50 rounded-lg bg-navy-lighter">
                    <div onClick={() => props.setEnableDarkCharts(!props.enableDarkCharts)}>
                        {!props.enableDarkCharts
                            ? <IconMoon size={30} />
                            : <IconSun size={30} />}
                    </div>
                </div>
            </div>

            <div className="flex fixed right-12 bottom-16 z-40 flex-col justify-end">
                <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-2 mb-2 bg-opacity-50 rounded-lg bg-navy-regular"
                >
                    <IconPlus size={30} />
                </button>
                <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-2 bg-opacity-50 rounded-lg bg-navy-regular"
                >
                    <IconMinus size={30} />
                </button>
            </div>

            <div className="relative m-auto">
                <span className="absolute mt-2 ml-6 font-bold text-red-600">
                    {`This chart is linked to ${navigraph.userName}`}
                </span>
                {!props.enableDarkCharts
                    ? <img className="max-w-none" id="chart" draggable={false} src={props.chartLink.light} alt="chart" />
                    : <img className="max-w-none" id="chart" draggable={false} src={props.chartLink.dark} alt="chart" />}
            </div>
        </div>
    );
};

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
                            <div className="flex flex-col pb-2 mr-4 text-lg rounded-2xl divide-y divide-gray-700 bg-navy-lighter" key={item.name}>
                                <span className="p-1 text-center bg-gray-700 rounded-t-lg">{item.name}</span>
                                {item.charts.map((chart) => (
                                    <div
                                        className="flex flex-row bg-navy-medium"
                                        onClick={() => props.onChartClick((chart as NavigraphChart).fileDay, (chart as NavigraphChart).fileNight, (chart as NavigraphChart).id)}
                                        key={(chart as NavigraphChart).id}
                                    >
                                        {(chart as NavigraphChart).id === props.selectedChartId
                                            ? <span className="w-2 bg-teal-light-contrast"> </span>
                                            : <span className="w-2 bg-navy-medium"> </span>}
                                        <div className="flex flex-col m-2">
                                            <span className="">{(chart as NavigraphChart).procedureIdentifier}</span>
                                            <span
                                                className="px-2 mt-0.5 mr-auto text-sm text-gray-400 bg-gray-700 rounded-md"
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
                                className="flex flex-row mr-4 text-lg rounded-lg bg-navy-medium"
                                onClick={() => props.onChartClick((chart as NavigraphChart).fileDay, (chart as NavigraphChart).fileNight, (chart as NavigraphChart).id)}
                                key={(chart as NavigraphChart).id}
                            >
                                {(chart as NavigraphChart).id === props.selectedChartId
                                    ? <span className="w-2 rounded-l-lg bg-teal-light-contrast"> </span>
                                    : <span className="w-2 rounded-l-lg bg-navy-medium"> </span>}
                                <div className="flex flex-col m-2">
                                    <span className="">{(chart as NavigraphChart).procedureIdentifier}</span>
                                    <span
                                        className="px-2 mr-auto text-sm text-gray-400 bg-gray-700 rounded-md"
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
    }, [props.icao]);

    useEffect(() => {
        if (props.icao.length <= 3) {
            setAirportInfo({ name: '' });
            props.setCharts(emptyNavigraphCharts);
        }
    }, [props.icao]);

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

    const onChartClick = (chartNameDay: string, chartNameNight: string, chartId: string) => {
        setSelectedChartId(chartId);

        setSelectedChartName({ light: chartNameDay, dark: chartNameNight });
    };

    const position = useRef({ top: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseDown = (event) => {
        position.current.top = ref.current ? ref.current.scrollTop : 0;
        position.current.y = event.clientY;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (event) => {
        const dy = event.clientY - position.current.y;
        if (ref.current) {
            ref.current.scrollTop = position.current.top - dy;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    return (
        <div className="flex overflow-x-hidden flex-row mr-4 w-full text-white rounded-2xl shadow-lg h-efb bg-navy-medium">
            {!isFullscreen
                ? (
                    <>
                        <div className="flex flex-col p-6 w-1/3 bg-navy-lighter">
                            <SimpleInput
                                placeholder="ICAO"
                                value={props.icao}
                                noLabel
                                maxLength={4}
                                className="w-full"
                                onChange={(event) => handleIcaoChange(event)}
                            />
                            <div className="flex items-center px-6 mt-6 w-full h-9 rounded-lg bg-teal-light-contrast">
                                {props.icao.length !== 4
                                    ? <span className="text-xl">No Airport Selected</span>
                                    : <span className="text-xl">{airportInfo.name.slice(0, 20)}</span>}
                            </div>
                            <div className="flex flex-col mt-6">
                                <div className="flex flex-row justify-around text-base rounded-lg bg-navy-lighter">
                                    {organizedCharts.map((organizedChart) => (organizedChart.name === selectedTab.name
                                        ? (
                                            <span
                                                className={`flex items-center px-4 py-2 text-white bg-white bg-opacity-5 rounded-lg ${organizedChart.name === 'REF' ? '' : 'mr-2'}`}
                                                onClick={() => setSelectedTab(organizedChart)}
                                                key={organizedChart.name}
                                            >
                                                {organizedChart.name}
                                            </span>
                                        )
                                        : (
                                            <span
                                                className={`flex items-center px-4 py-2 text-white hover:bg-white hover:bg-opacity-5 transition
                                                duration-300 rounded-lg ${organizedChart.name === 'REF' ? '' : 'mr-2'}`}
                                                onClick={() => setSelectedTab(organizedChart)}
                                                key={organizedChart.name}
                                            >
                                                {organizedChart.name}
                                            </span>
                                        )))}
                                </div>
                                <div
                                    className="overflow-x-hidden overflow-y-scroll mt-5 space-y-4 rounded-lg h-124 grabbable scrollbar"
                                    ref={ref}
                                    onMouseDown={handleMouseDown}
                                >
                                    {props.enableNavigraph
                                        ? (
                                            <NavigraphChartSelector
                                                selectedTab={selectedTab}
                                                selectedChartId={selectedChartId}
                                                onChartClick={onChartClick}
                                            />
                                        )
                                        : (
                                            <>
                                                {selectedTab.charts.map((chart) => (
                                                    <div className="mt-4" key={(chart as ChartFoxChart).name}>
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
                        <div className="flex overflow-x-hidden justify-center items-center mr-4 w-full rounded-2xl shadow-lg h-efb bg-navy-lighter">
                            <p className="pt-6 mb-6 text-3xl text-white">Insufficient .env file</p>
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

export const Navigation = () => {
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
            navigraph.getToken();
        }
    }, (navigraph.tokenRefreshInterval * 1000));

    return (
        <div className="w-full h-full">
            <div className="flex">
                <h1 className="mb-6 text-white">Navigation & Charts</h1>
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
