import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode.react';
import useInterval from '@instruments/common/useInterval';
import { usePersistentProperty } from '@instruments/common/persistence';
import {
    ArrowClockwise,
    ArrowCounterclockwise,
    ArrowsFullscreen,
    Bullseye,
    CloudArrowDown,
    Dash,
    FullscreenExit,
    MoonFill,
    Plus,
    ShieldLock,
    SunFill,
} from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { toast } from 'react-toastify';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { SelectGroup, SelectItem } from '../UtilComponents/Form/Select';
import NavigraphClient, {
    AirportInfo,
    emptyNavigraphCharts,
    NavigraphAirportCharts,
    NavigraphChart,
    useNavigraph,
    NavigraphBoundingBox,
} from '../ChartsApi/Navigraph';
import ChartFoxClient, { ChartFoxAirportCharts, ChartFoxChart } from '../ChartsApi/ChartFox';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { simbriefDataIsInitialState } from '../Store/features/simbrief';
import { useAppSelector, useAppDispatch } from '../Store/store';
import {
    setIsFullScreen,
    setPlaneInFocus,
    setChartId,
    setChartLinks,
    setChartRotation,
    setTabIndex,
    setUsingDarkTheme,
    setChartDimensions,
    setIcao,
    setChartName,
    setBoundingBox,
} from '../Store/features/navigationTab';

type Chart = NavigraphChart | ChartFoxChart;

type Charts = NavigraphAirportCharts | ChartFoxAirportCharts;

interface ChartsUiProps {
    enableNavigraph: boolean;
    chartFox: ChartFoxClient;
    charts: Charts;
    setCharts: (Charts) => void;
}

interface NavigraphChartSelectorProps {
    selectedTab: OrganizedChartType;
    onChartClick: CallableFunction;
    loading?: boolean;
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

const Loading = () => {
    const navigraph = useNavigraph();
    const [, setRefreshToken] = usePersistentProperty('NAVIGRAPH_REFRESH_TOKEN');
    const [showResetButton, setShowResetButton] = useState(false);

    const handleResetRefreshToken = () => {
        setRefreshToken('');
        navigraph.authenticate();
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            setShowResetButton(true);
        }, 2_000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center">
            <div
                className="flex justify-center items-center rounded-md bg-theme-secondary"
                style={{ width: '400px', height: '400px' }}
            >
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
            <button
                type="button"
                className={`flex justify-center items-center p-2 mt-6 rounded-md focus:outline-none bg-theme-highlight transition duration-200 opacity-0 ${showResetButton && 'opacity-100'}`}
                style={{ width: '400px' }}
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

    useInterval(async () => {
        if (!navigraph.hasToken) {
            try {
                await navigraph.getToken();
            } catch (e) {
                toast.error(`Navigraph Authentication Error: ${e.message}`, { autoClose: 10_000 });
            }
        }
    }, (navigraph.auth.interval * 1000));

    return (
        <div className="flex overflow-x-hidden justify-center items-center p-6 w-full rounded-lg h-efb bg-theme-accent">
            <div className="flex flex-col justify-center items-center">
                <ShieldLock className="mr-2" size={40} />
                <h2 className="flex justify-center items-center mt-2">
                    Authenticate with Navigraph
                </h2>
                <p className="mt-6 w-2/3 text-center">
                    Scan the QR Code or open
                    {' '}
                    <span className="text-theme-highlight">{navigraph.auth.link}</span>
                    {' '}
                    into your browser and enter the code below
                </p>
                <h1
                    className="flex items-center px-4 mt-4 h-16 text-4xl font-bold tracking-wider rounded-md border-2 border-theme-highlight bg-theme-secondary"
                    style={{ minWidth: '200px' }}
                >
                    {navigraph.auth.code || 'LOADING'}
                </h1>
                <div className="mt-16">
                    {hasQr
                        ? (
                            <div className="p-3 bg-white rounded-md">
                                <QRCode
                                    value={navigraph.auth.qrLink}
                                    size={400}
                                />
                            </div>
                        )
                        : <Loading />}
                </div>
            </div>
        </div>
    );
};

const NavigraphChartComponent = () => {
    const dispatch = useAppDispatch();
    const {
        chartDimensions,
        chartLinks,
        chartRotation,
        isFullScreen,
        usingDarkTheme,
        planeInFocus,
        boundingBox,
    } = useAppSelector((state) => state.navigationTab);

    const { userName } = useNavigraph();
    const position = useRef({ top: 0, y: 0, left: 0, x: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const chartRef = useRef<HTMLImageElement>(null);

    const [aircraftIconVisible, setAircraftIconVisible] = useState(false);
    const [aircraftIconPosition, setAircraftIconPosition] = useState<{ x: number, y: number, r: number }>({ x: 0, y: 0, r: 0 });
    const [aircraftLatitude] = useSimVar('PLANE LATITUDE', 'degree latitude', 1000);
    const [aircraftLongitude] = useSimVar('PLANE LONGITUDE', 'degree longitude', 1000);
    const [aircraftTrueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 1000);

    useEffect(() => {
        let visible = false;

        if (boundingBox
            && aircraftLatitude >= boundingBox.bottomLeft.lat
            && aircraftLatitude <= boundingBox.topRight.lat
            && aircraftLongitude >= boundingBox.bottomLeft.lon
            && aircraftLongitude <= boundingBox.topRight.lon
        ) {
            const dx = boundingBox.topRight.xPx - boundingBox.bottomLeft.xPx;
            const dy = boundingBox.bottomLeft.yPx - boundingBox.topRight.yPx;
            const dLat = boundingBox.topRight.lat - boundingBox.bottomLeft.lat;
            const dLon = boundingBox.topRight.lon - boundingBox.bottomLeft.lon;
            const x = boundingBox.bottomLeft.xPx + dx * ((aircraftLongitude - boundingBox.bottomLeft.lon) / dLon);
            const y = boundingBox.topRight.yPx + dy * ((boundingBox.topRight.lat - aircraftLatitude) / dLat);

            setAircraftIconPosition({ x, y, r: aircraftTrueHeading });
            visible = true;
        }

        setAircraftIconVisible(visible);
    }, [boundingBox, chartLinks, aircraftLatitude.toFixed(2), aircraftLongitude.toFixed(2), aircraftTrueHeading]);

    useEffect(() => {
        const { width, height } = chartDimensions;

        if (chartRef.current) {
            if (width) {
                chartRef.current.style.width = `${width}px`;
            }

            if (height) {
                chartRef.current.style.height = `${height}px`;
            }

            if (!width && !height) {
                dispatch(setChartDimensions({ height: 875 }));
            }
        }
    }, [chartRef, chartDimensions]);

    useEffect(() => {
        if (planeInFocus) {
            dispatch(setChartRotation(360 - aircraftIconPosition.r));
            // TODO: implement the chart translation
            // if (ref.current) {
            //     ref.current.scrollTop = aircraftIconPosition.y + ((ref.current.clientHeight - aircraftIconPosition.y) / 2);
            //     ref.current.scrollLeft = -(ref.current.clientWidth - aircraftIconPosition.x) / 2;
            // }
        }
    }, [aircraftIconPosition.r, planeInFocus]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
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
        const currentHeight = chartRef.current!.clientHeight;
        if (currentHeight >= 2500) return;

        // TODO: maybe use width here eventually?
        dispatch(setChartDimensions({ height: currentHeight + 100 }));
    };

    const handleZoomOut = () => {
        const currentHeight = chartRef.current!.clientHeight;
        if (currentHeight <= 775) return;

        dispatch(setChartDimensions({ height: currentHeight - 100 }));
    };

    // The functions that handle rotation get the closest 45 degree angle increment to the current angle
    const handleRotateRight = () => {
        dispatch(setChartRotation(chartRotation + (45 - chartRotation % 45)));
    };

    const handleRotateLeft = () => {
        dispatch(setChartRotation(chartRotation - (45 + chartRotation % 45)));
    };

    if (!chartLinks.light) {
        return (
            <div
                className={`flex items-center justify-center bg-theme-accent rounded-lg ${!isFullScreen && 'rounded-l-none ml-6'}`}
                style={{ width: `${isFullScreen ? '1278px' : '804px'}` }}
            >
                There is no chart to display.
            </div>
        );
    }

    return (
        <div
            className={`relative flex flex-row overflow-x-hidden overflow-y-scroll mx-auto grabbable no-scrollbar bg-theme-accent rounded-lg ${!isFullScreen && 'rounded-l-none ml-6'}`}
            ref={ref}
            style={{ width: `${isFullScreen ? '1278px' : '804px'}` }}
            onMouseDown={handleMouseDown}
        >
            <div className="flex overflow-hidden fixed top-32 right-12 bottom-12 z-40 flex-col justify-between rounded-md cursor-pointer">
                <div className="flex overflow-hidden flex-col rounded-md">
                    <button
                        type="button"
                        onClick={handleRotateLeft}
                        className={`p-2 transition duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-unselected pointer-events-none'}`}
                    >
                        <ArrowCounterclockwise size={40} />
                    </button>
                    {boundingBox && (
                        <button
                            type="button"
                            onClick={() => dispatch(setPlaneInFocus(!planeInFocus))}
                            className={`p-2 transition duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-highlight  hover:text-theme-text'}`}
                        >
                            <Bullseye size={40} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleRotateRight}
                        className={`p-2 transition duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-unselected pointer-events-none'}`}
                    >
                        <ArrowClockwise className="fill-current" size={40} />
                    </button>
                </div>
                <div className="flex overflow-hidden flex-col rounded-md">
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        className="p-2 transition duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight"
                    >
                        <Plus size={40} />
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        className="p-2 transition duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight"
                    >
                        <Dash size={40} />
                    </button>
                </div>
                <div className="flex overflow-hidden flex-col rounded-md">
                    <div
                        className="p-2 rounded-md transition duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight"
                        onClick={() => dispatch(setIsFullScreen(!isFullScreen))}
                    >
                        {!isFullScreen
                            ? <ArrowsFullscreen size={40} />
                            : <FullscreenExit size={40} />}
                    </div>
                    <div
                        className="p-2 mt-3 rounded-md transition duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight"
                        onClick={() => dispatch(setUsingDarkTheme(!usingDarkTheme))}
                    >
                        {!usingDarkTheme ? <MoonFill size={40} /> : <SunFill size={40} />}
                    </div>
                </div>
            </div>

            <div
                className="relative m-auto transition duration-100"
                style={{ transform: `rotate(${chartRotation}deg)` }}
            >
                {chartLinks && (
                    <p
                        className="absolute top-0 left-0 font-bold whitespace-nowrap transition duration-100 transform -translate-y-full text-theme-highlight"
                    >
                        This chart is linked to
                        {' '}
                        {userName}
                    </p>
                )}

                { (aircraftIconVisible && boundingBox) && (
                    <svg viewBox={`0 0 ${boundingBox.width} ${boundingBox.height}`} style={{ position: 'absolute', top: 0, left: 0 }}>
                        <g
                            className="transition duration-100"
                            transform={`translate(${aircraftIconPosition.x} ${aircraftIconPosition.y}) rotate(${aircraftIconPosition.r})`}
                            strokeLinecap="square"
                        >
                            <path d="M-20,0 L20,0" stroke="black" strokeWidth="7" />
                            <path d="M-10,20 L10,20" stroke="black" strokeWidth="7" />
                            <path d="M0,-10 L0,30" stroke="black" strokeWidth="7" />
                            <path d="M-20,0 L20,0" stroke="yellow" strokeWidth="5" />
                            <path d="M-10,20 L10,20" stroke="yellow" strokeWidth="5" />
                            <path d="M0,-10 L0,30" stroke="yellow" strokeWidth="5" />
                        </g>
                    </svg>
                )}

                <img
                    className="max-w-none transition duration-100 select-none"
                    ref={chartRef}
                    draggable={false}
                    src={usingDarkTheme ? chartLinks.dark : chartLinks.light}
                    alt="chart"
                />
            </div>
        </div>
    );
};

const NavigraphChartSelector = ({ onChartClick, selectedTab, loading }: NavigraphChartSelectorProps) => {
    const NO_RUNWAY_NAME = 'NONE';
    const [runwaySet, setRunwaySet] = useState<Set<string>>(new Set());
    const [organizedCharts, setOrganizedCharts] = useState<RunwayOrganizedChartType[]>([]);

    const dispatch = useAppDispatch();

    const { chartId } = useAppSelector((state) => state.navigationTab);

    useEffect(() => {
        if (selectedTab.bundleRunways) {
            const runwayNumbers: string[] = [];

            selectedTab.charts.forEach((chart) => {
                const navigraphChart = (chart as NavigraphChart);

                if (navigraphChart.runway.length !== 0) {
                    navigraphChart.runway.forEach((runway) => {
                        runwayNumbers.push(runway);
                    });
                } else {
                    runwayNumbers.push(NO_RUNWAY_NAME);
                }
            });

            setRunwaySet(new Set(runwayNumbers));
        } else {
            setRunwaySet(new Set());
        }
    }, [selectedTab.charts]);

    useEffect(() => {
        if (selectedTab.bundleRunways) {
            const organizedRunwayCharts: RunwayOrganizedChartType[] = [];

            runwaySet.forEach((runway) => {
                organizedRunwayCharts.push({
                    name: runway,
                    charts: selectedTab.charts.filter(
                        (chart) => (chart as NavigraphChart).runway.includes(runway)
                            || ((chart as NavigraphChart).runway.length === 0 && runway === NO_RUNWAY_NAME),
                    ),
                });
            });

            setOrganizedCharts(organizedRunwayCharts);
        } else {
            setOrganizedCharts([]);
        }
    }, [runwaySet]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent">
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
        );
    }

    if (!selectedTab.charts.length) {
        return (
            <div className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent">
                <p>There are no charts to display.</p>
            </div>
        );
    }

    const handleChartClick = (chart: Chart) => {
        onChartClick(
            (chart as NavigraphChart).fileDay,
            (chart as NavigraphChart).fileNight,
            (chart as NavigraphChart).id,
            (chart as NavigraphChart).boundingBox,
        );

        if ((chart as NavigraphChart).id !== chartId) {
            dispatch(setChartDimensions({ height: 875 }));
        }
    };

    return (
        <>
            {selectedTab.bundleRunways
                ? (
                    <>
                        {organizedCharts.map((item) => (
                            <div className="flex overflow-hidden flex-col w-full text-lg rounded-md divide-y-2 divide-gray-700" key={item.name}>
                                <span className="p-1 text-center rounded-t-lg bg-theme-secondary">{item.name}</span>
                                {item.charts.map((chart) => (
                                    <div
                                        className="group flex flex-row bg-theme-accent"
                                        onClick={() => handleChartClick(chart)}
                                        key={(chart as NavigraphChart).id}
                                    >
                                        <span className={`w-2 transition duration-100 group-hover:bg-theme-highlight ${(chart as NavigraphChart).id === chartId
                                            ? 'bg-theme-highlight'
                                            : 'bg-theme-secondary'}`}
                                        />
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
                        {selectedTab.charts.map((chart) => (
                            <div
                                className="group flex overflow-hidden flex-row w-full rounded-md bg-theme-accent"
                                onClick={() => onChartClick(
                                    (chart as NavigraphChart).fileDay,
                                    (chart as NavigraphChart).fileNight,
                                    (chart as NavigraphChart).id,
                                    (chart as NavigraphChart).boundingBox,
                                )}
                                key={(chart as NavigraphChart).id}
                            >
                                <span className={`w-2 transition duration-100 group-hover:bg-theme-highlight ${(chart as NavigraphChart).id === chartId
                                    ? 'bg-theme-highlight'
                                    : 'bg-theme-secondary'}`}
                                />
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

const ChartsUi = ({ chartFox, charts, enableNavigraph, setCharts }: ChartsUiProps) => {
    const dispatch = useAppDispatch();

    const navigraph = useNavigraph();

    const [airportInfo, setAirportInfo] = useState<AirportInfo>({ name: '' }); // Navigraph Only

    const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);

    const [organizedCharts, setOrganizedCharts] = useState<OrganizedChartType[]>([
        { name: 'STAR', charts: charts.arrival },
        { name: 'APP', charts: charts.approach, bundleRunways: true },
        { name: 'TAXI', charts: charts.airport },
        { name: 'SID', charts: charts.departure },
        { name: 'REF', charts: charts.reference },
    ]);

    const { tabIndex, icao, chartName, isFullScreen } = useAppSelector((state) => state.navigationTab);

    const assignAirportInfo = async () => {
        if (enableNavigraph) {
            setIcaoAndNameDisagree(true);
            const airportInfo = await navigraph.getAirportInfo(icao);
            setAirportInfo(airportInfo);
            setIcaoAndNameDisagree(false);
        }
    };

    useEffect(() => {
        assignAirportInfo();
    }, [icao]);

    useEffect(() => {
        if (icao.length <= 3) {
            setAirportInfo({ name: '' });
            setCharts(emptyNavigraphCharts);
        }
    }, [icao]);

    useEffect(() => {
        if (enableNavigraph) {
            setOrganizedCharts([
                { name: 'STAR', charts: charts.arrival },
                { name: 'APP', charts: charts.approach, bundleRunways: true },
                { name: 'TAXI', charts: charts.airport },
                { name: 'SID', charts: charts.departure },
                { name: 'REF', charts: charts.reference },
            ]);
        }
    }, [charts]);

    useEffect(() => {
        if (enableNavigraph) {
            const chartsGet = async () => {
                const light = await navigraph.chartCall(icao, chartName.light);

                const dark = await navigraph.chartCall(icao, chartName.dark);

                dispatch(setChartLinks({ light, dark }));
            };

            chartsGet();
        }
    }, [chartName]);

    const handleIcaoChange = (value: string) => {
        if (value.length !== 4) return;

        const newValue = value.toUpperCase();

        if (enableNavigraph) {
            navigraph.getChartList(newValue).then((r) => {
                if (r) {
                    setCharts(r);
                }
            });
        } else {
            chartFox.getChartList(newValue).then((r) => setCharts(r));
        }

        dispatch(setIcao(newValue));
    };

    const onChartClick = (chartNameDay: string, chartNameNight: string, chartId: string, boundingBox?: NavigraphBoundingBox) => {
        dispatch(setChartId(chartId));

        dispatch(setChartName({ light: chartNameDay, dark: chartNameNight }));

        dispatch(setBoundingBox(boundingBox));
    };

    useEffect(() => {
        handleIcaoChange(icao);
    }, []);

    const AIRPORT_CHARACTER_LIMIT = 30;

    const loading = (!airportInfo.name.length || icaoAndNameDisagree) && icao.length === 4;

    const getAirportDisplayName = () => {
        if (icao.length !== 4) {
            return 'No Airport Selected';
        }

        if (loading) {
            return 'Please Wait';
        }

        return `${airportInfo.name.slice(0, AIRPORT_CHARACTER_LIMIT)}${airportInfo.name.length > AIRPORT_CHARACTER_LIMIT ? '...' : ''}`;
    };

    const isInitialState = simbriefDataIsInitialState();

    const { altIcao, departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);

    return (
        <div className="flex overflow-x-hidden flex-row w-full rounded-lg h-efb">
            <>
                {!isFullScreen && (
                    <div className="flex-shrink-0" style={{ width: '450px' }}>
                        <div className="flex flex-row justify-center items-center">
                            <SimpleInput
                                placeholder="ICAO"
                                value={icao}
                                noLabel
                                maxLength={4}
                                className={`w-full flex-shrink uppercase ${!isInitialState && 'rounded-r-none'}`}
                                onChange={handleIcaoChange}
                            />
                            {!isInitialState && (
                                <SelectGroup className="flex-shrink-0 rounded-l-none">
                                    <SelectItem
                                        selected={icao === departingAirport}
                                        onSelect={() => handleIcaoChange(departingAirport)}
                                    >
                                        FROM
                                    </SelectItem>
                                    <SelectItem
                                        selected={icao === arrivingAirport}
                                        onSelect={() => handleIcaoChange(arrivingAirport)}
                                    >
                                        TO
                                    </SelectItem>
                                    <SelectItem
                                        selected={icao === altIcao}
                                        onSelect={() => handleIcaoChange(altIcao)}
                                    >
                                        ALTN
                                    </SelectItem>
                                </SelectGroup>
                            )}
                        </div>
                        <div className="flex items-center px-4 mt-2 w-full h-11 rounded-md bg-theme-accent">
                            {getAirportDisplayName()}
                        </div>
                        <div className="mt-6">
                            <SelectGroup>
                                {organizedCharts.map((organizedChart, index) => (
                                    <SelectItem
                                        selected={index === tabIndex}
                                        onSelect={() => dispatch(setTabIndex(index))}
                                        key={organizedChart.name}
                                    >
                                        {organizedChart.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <ScrollableContainer className="mt-5" height={42.25}>
                                <div
                                    className="space-y-4"
                                >
                                    {enableNavigraph
                                        ? (
                                            <NavigraphChartSelector
                                                selectedTab={organizedCharts[tabIndex]}
                                                onChartClick={onChartClick}
                                                loading={loading}
                                            />
                                        )
                                        : (
                                            <>
                                                {organizedCharts[tabIndex].charts.map((chart) => (
                                                    <div className="mt-4" key={(chart as ChartFoxChart).name}>
                                                        <span>{(chart as ChartFoxChart).name}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                </div>
                            </ScrollableContainer>
                        </div>
                    </div>
                )}
                <NavigraphChartComponent />
            </>
        </div>
    );
};

const NavigraphNav = ({ chartFox, charts, setCharts }: ChartsUiProps) => {
    const navigraph = useNavigraph();

    return (
        <>
            {NavigraphClient.hasSufficientEnv
                ? (
                    <>
                        {navigraph.hasToken
                            ? (
                                <ChartsUi
                                    enableNavigraph
                                    chartFox={chartFox}
                                    charts={charts}
                                    setCharts={setCharts}
                                />
                            )
                            : <AuthUi />}
                    </>
                )
                : (
                    <div className="flex overflow-x-hidden justify-center items-center mr-4 w-full rounded-lg shadow-lg h-efb bg-theme-secondary">
                        <p className="pt-6 mb-6 text-3xl">Insufficient .env file</p>
                    </div>
                )}
        </>
    );
};

const ChartFoxNav = ({ chartFox, charts, setCharts }: ChartsUiProps) => (
    <ChartsUi
        enableNavigraph={false}
        chartFox={chartFox}
        charts={charts}
        setCharts={setCharts}
    />
);

export const Navigation = () => {
    const navigraph = useNavigraph();

    const [enableNavigraph] = useState(true);
    const [chartFox] = useState(new ChartFoxClient());
    const [charts, setCharts] = useState<Charts>({
        arrival: [],
        approach: [],
        airport: [],
        departure: [],
        reference: [],
    });

    useInterval(async () => {
        if (enableNavigraph) {
            try {
                await navigraph.getToken();
            } catch (e) {
                toast.error(`Navigraph Authentication Error: ${e.message}`, { autoClose: 10_000 });
            }
        }
    }, (navigraph.tokenRefreshInterval * 1000));

    useEffect(() => {
        if (enableNavigraph && !navigraph.hasToken) {
            navigraph.authenticate();
        }
    }, []);

    return (
        <div className="w-full h-full">
            <h1 className="mb-4 font-bold">Navigation & Charts</h1>
            {enableNavigraph
                ? (
                    <NavigraphNav
                        enableNavigraph={enableNavigraph}
                        chartFox={chartFox}
                        charts={charts}
                        setCharts={setCharts}
                    />
                )
                : (
                    <ChartFoxNav
                        enableNavigraph={enableNavigraph}
                        chartFox={chartFox}
                        charts={charts}
                        setCharts={setCharts}
                    />
                )}
        </div>
    );
};
