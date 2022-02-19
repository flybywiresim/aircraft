import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode.react';
import useInterval from '@instruments/common/useInterval';
import { usePersistentProperty } from '@instruments/common/persistence';
import {
    ArrowClockwise,
    ArrowCounterclockwise,
    ArrowReturnRight,
    ArrowsExpand,
    ArrowsFullscreen,
    Bullseye,
    CloudArrowDown,
    Dash,
    FullscreenExit,
    MoonFill,
    Pin,
    PinFill,
    Plus,
    ShieldLock,
    SunFill,
} from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { toast } from 'react-toastify';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { SelectGroup, SelectItem } from '../UtilComponents/Form/Select';
import NavigraphClient, {
    emptyNavigraphCharts,
    NavigraphAirportCharts,
    NavigraphChart,
    useNavigraph,
} from '../ChartsApi/Navigraph';
import { ChartFoxAirportCharts, ChartFoxChart } from '../ChartsApi/ChartFox';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { isSimbriefDataLoaded } from '../Store/features/simbrief';
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
    setPagesViewable,
    setCurrentPage,
    removedPinnedChart,
    addPinnedChart,
    isChartPinned,
} from '../Store/features/navigationPage';
import { PageLink, PageRedirect, pathify, TabRoutes } from '../Utils/routing';
import { TODCalculator } from '../TODCalculator/TODCalculator';
import { LandingWidget } from '../Performance/Widgets/LandingWidget';
import { Navbar } from '../UtilComponents/Navbar';

type LocalFileChart = {
    fileName: string;
    type: 'IMAGE' | 'PDF';
};
interface LocalFileCharts {
    images: LocalFileChart[];
    pdfs: LocalFileChart[];
}

type Chart = NavigraphChart | ChartFoxChart;
type Charts = NavigraphAirportCharts | ChartFoxAirportCharts;

interface NavigraphChartSelectorProps {
    selectedTab: OrganizedChartType;
    loading?: boolean;
}

interface LocalFileChartSelectorProps {
    selectedTab: LocalFileOrganizedCharts;
    loading?: boolean;
}

type OrganizedChartType = {
    name: string,
    charts: Chart[],
    bundleRunways?: boolean,
}

type LocalFileOrganizedCharts = {
    name: string,
    charts: LocalFileChart[],
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
                className="flex justify-center items-center bg-theme-secondary rounded-md"
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
        <div className="flex overflow-x-hidden justify-center items-center p-6 w-full h-content-section-reduced bg-theme-accent rounded-lg">
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
                    className="flex items-center px-4 mt-4 h-16 text-4xl font-bold tracking-wider bg-theme-secondary rounded-md border-2 border-theme-highlight"
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

const ChartComponent = () => {
    const dispatch = useAppDispatch();
    const {
        chartDimensions,
        chartLinks,
        chartRotation,
        isFullScreen,
        usingDarkTheme,
        planeInFocus,
        boundingBox,
        pagesViewable,
        chartId,
        currentPage,
    } = useAppSelector((state) => state.navigationTab);

    const { userName } = useNavigraph();
    const position = useRef({ top: 0, y: 0, left: 0, x: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const chartRef = useRef<HTMLDivElement>(null);

    const [aircraftIconVisible, setAircraftIconVisible] = useState(false);
    const [aircraftIconPosition, setAircraftIconPosition] = useState<{ x: number, y: number, r: number }>({ x: 0, y: 0, r: 0 });
    const [aircraftLatitude] = useSimVar('PLANE LATITUDE', 'degree latitude', 1000);
    const [aircraftLongitude] = useSimVar('PLANE LONGITUDE', 'degree longitude', 1000);
    const [aircraftTrueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 100);

    useEffect(() => {
        let visible = false;

        console.log(boundingBox, aircraftLatitude, aircraftLongitude);

        if (boundingBox
            && aircraftLatitude >= boundingBox.bottomLeft.lat
            && aircraftLatitude <= boundingBox.topRight.lat
            && aircraftLongitude >= boundingBox.bottomLeft.lon
            && aircraftLongitude <= boundingBox.topRight.lon) {
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
        if (!chartRef.current) return;

        const currentHeight = chartRef.current.clientHeight;
        const currentWidth = chartRef.current.clientWidth;
        if (currentHeight >= 2500) return;

        // TODO: maybe use width here eventually?
        dispatch(setChartDimensions({ height: currentHeight * 1.1, width: currentWidth * 1.1 }));
    };

    const handleZoomOut = () => {
        if (!chartRef.current) return;

        const currentHeight = chartRef.current!.clientHeight;
        const currenWidth = chartRef.current!.clientWidth;
        if (currentHeight <= 775) return;

        dispatch(setChartDimensions({ height: currentHeight * 0.9, width: currenWidth * 0.9 }));
    };

    const expandToHeight = () => {
        if (!ref.current || !chartRef.current) return;

        const scale = ref.current.clientHeight / chartRef.current.clientHeight;

        dispatch(setChartDimensions({ width: (chartDimensions.width ?? 0) * scale, height: ref.current!.clientHeight }));
    };

    const expandToWidth = () => {
        if (!ref.current || !chartRef.current) return;

        const scale = ref.current.clientWidth / chartRef.current.clientWidth;

        dispatch(setChartDimensions({ width: ref.current!.clientWidth, height: (chartDimensions.height ?? 0) * scale }));
    };

    // The functions that handle rotation get the closest 45 degree angle increment to the current angle
    const handleRotateRight = () => {
        dispatch(setChartRotation(chartRotation + (45 - chartRotation % 45)));
    };

    const handleRotateLeft = () => {
        dispatch(setChartRotation(chartRotation - (45 + chartRotation % 45)));
    };

    useEffect(() => {
        if (!chartDimensions.height && !chartDimensions.width) {
            const img = new Image();
            img.onload = function () {
                if (ref.current) {
                    // @ts-ignore
                    // eslint-disable-next-line react/no-this-in-sfc
                    dispatch(setChartDimensions({ width: this.width * (ref.current.clientHeight / this.height), height: ref.current.clientHeight }));
                }
            };
            img.src = chartLinks.light;
        }
    }, [chartLinks]);

    useEffect(() => {
        setCurrentPage(1);
    }, [chartId]);

    useEffect(() => {
        if (pagesViewable > 1) {
            getPdfUrl(chartId, currentPage).then((url) => {
                dispatch(setChartName({ light: url, dark: url }));
            });
        }
    }, [currentPage]);

    if (!chartLinks.light || !chartLinks.dark) {
        return (
            <div
                className={`flex relative items-center justify-center bg-theme-accent rounded-lg ${!isFullScreen && 'rounded-l-none ml-6'}`}
                style={{ width: `${isFullScreen ? '1278px' : '804px'}` }}
            >
                {isFullScreen && (
                    <div
                        className="flex absolute top-6 right-6 flex-row items-center p-4 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight rounded-md transition duration-100"
                        onClick={() => dispatch(setIsFullScreen(false))}
                    >
                        <FullscreenExit size={40} />
                        <p className="ml-4 text-current">Exit Fullscreen Mode</p>
                    </div>
                )}
                <p>There is no chart to display.</p>
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
            {pagesViewable > 1 && (
                <div className="flex overflow-hidden fixed top-32 right-32 z-40 flex-row items-center rounded-md">
                    <div
                        className={`flex flex-row justify-center items-center h-14 bg-opacity-40 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight ${currentPage === 1 && 'opacity-50 pointer-events-none'}`}
                        onClick={() => dispatch(setCurrentPage(currentPage - 1))}
                    >
                        <Dash size={40} />
                    </div>
                    <SimpleInput
                        min={1}
                        max={pagesViewable}
                        value={currentPage}
                        noLabel
                        number
                        onBlur={(value) => {
                            dispatch(setCurrentPage(Number.parseInt(value)));
                        }}
                        className="w-16 h-14 rounded-r-none rounded-l-none border-transparent"
                    />
                    <div className="flex flex-shrink-0 items-center px-2 h-14 bg-theme-secondary">
                        of
                        {' '}
                        {pagesViewable}
                    </div>
                    <div
                        className={`flex flex-row justify-center items-center h-14 bg-opacity-40 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight ${currentPage === pagesViewable && 'opacity-50 pointer-events-none'}`}
                        onClick={() => dispatch(setCurrentPage(currentPage + 1))}
                    >

                        <Plus size={40} />
                    </div>
                </div>
            )}

            <div className="flex overflow-hidden fixed top-32 right-12 bottom-12 z-30 flex-col justify-between rounded-md cursor-pointer">
                <div className="flex overflow-hidden flex-col rounded-md">
                    <button
                        type="button"
                        onClick={handleRotateLeft}
                        className={`p-2 transition hover:text-theme-body duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-unselected pointer-events-none'}`}
                    >
                        <ArrowCounterclockwise size={40} />
                    </button>
                    {boundingBox && (
                        <button
                            type="button"
                            onClick={() => dispatch(setPlaneInFocus(!planeInFocus))}
                            className={`p-2 transition hover:text-theme-body duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-highlight  hover:text-theme-text'}`}
                        >
                            <Bullseye size={40} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleRotateRight}
                        className={`p-2 transition hover:text-theme-body duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-unselected pointer-events-none'}`}
                    >
                        <ArrowClockwise className="fill-current" size={40} />
                    </button>
                </div>
                <div className="flex overflow-hidden flex-col rounded-md">
                    <button
                        type="button"
                        onClick={expandToHeight}
                        className="p-2 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight transition duration-100 cursor-pointer"
                    >
                        <ArrowsExpand size={40} />
                    </button>
                    <button
                        type="button"
                        onClick={expandToWidth}
                        className="p-2 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight transition duration-100 cursor-pointer"
                    >
                        <ArrowsExpand className="transform rotate-90" size={40} />
                    </button>

                    <button
                        type="button"
                        onClick={handleZoomIn}
                        className="p-2 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight transition duration-100 cursor-pointer"
                    >
                        <Plus size={40} />
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        className="p-2 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight transition duration-100 cursor-pointer"
                    >
                        <Dash size={40} />
                    </button>
                </div>
                <div className="flex overflow-hidden flex-col rounded-md">
                    <div
                        className="p-2 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight rounded-md transition duration-100 cursor-pointer"
                        onClick={() => {
                            if (chartRef.current && ref.current) {
                                if (chartRef.current.clientWidth === ref.current.clientWidth) {
                                    const width = isFullScreen ? 804 : 1278;

                                    const scale = width / (chartDimensions.width ?? 0);
                                    const height = (chartDimensions.height ?? 0) * scale;

                                    dispatch(setChartDimensions({ width, height }));
                                }
                            }
                            dispatch(setIsFullScreen(!isFullScreen));
                        }}
                    >
                        {isFullScreen
                            ? <FullscreenExit size={40} />
                            : <ArrowsFullscreen size={40} />}
                    </div>
                    <div
                        className="p-2 mt-3 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight rounded-md transition duration-100 cursor-pointer"
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
                        className="absolute top-0 left-0 font-bold text-theme-highlight whitespace-nowrap transition duration-100 transform -translate-y-full"
                    >
                        This chart is linked to
                        {' '}
                        {userName}
                    </p>
                )}

                { (aircraftIconVisible && boundingBox) && (
                    <svg viewBox={`0 0 ${boundingBox.width} ${boundingBox.height}`} className="absolute top-0 left-0 z-30">
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

                <div ref={chartRef}>
                    <img
                        className="absolute left-0 w-full transition duration-100 select-none"
                        draggable={false}
                        src={chartLinks.dark}
                        alt="chart"
                    />
                    <img
                        className={`absolute left-0 w-full transition duration-100 select-none ${usingDarkTheme && 'opacity-0'}`}
                        draggable={false}
                        src={chartLinks.light}
                        alt="chart"
                    />
                </div>
            </div>
        </div>
    );
};

const getPdfUrl = async (fileName: string, pageNumber: number): Promise<string> => {
    try {
        const resp = await fetch(`http://localhost:3838/utility/v1/pdf?filename=${fileName}&pagenumber=${pageNumber}`);

        if (!resp.ok) {
            toast.error('Failed to retrieve requested PDF Document.');
            return Promise.reject();
        }

        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    } catch (_) {
        toast.error('Failed to retrieve requested PDF Document.');
        return Promise.reject();
    }
};

const LocalFileChartSelector = ({ selectedTab, loading }: LocalFileChartSelectorProps) => {
    const dispatch = useAppDispatch();

    const { chartId } = useAppSelector((state) => state.navigationTab);

    if (loading) {
        return (
            <div
                className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent"
                style={{ height: '42.25rem' }}
            >
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
        );
    }

    if (!selectedTab.charts.length) {
        return (
            <div
                className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent"
                style={{ height: '42.25rem' }}
            >
                <p>There are no charts to display.</p>
            </div>
        );
    }

    const handleChartClick = async (chart: LocalFileChart) => {
        try {
            if (chart.type === 'PDF') {
                const pageNumResp = await fetch(`http://localhost:3838/utility/v1/pdf/numpages?filename=${chart.fileName}`);
                const numberOfPages = await pageNumResp.json();

                // TODO Implement several pages
                dispatch(setPagesViewable(numberOfPages));
            } else {
                dispatch(setPagesViewable(1));
            }

            const resp = await fetch(chart.type === 'PDF'
                ? `http://localhost:3838/utility/v1/pdf?filename=${chart.fileName}&pagenumber=1`
                : `http://localhost:3838/utility/v1/image?filename=${chart.fileName}`);

            if (!resp.ok) {
                if (chart.type === 'PDF') {
                    toast.error('Failed to retrieve requested PDF Document.');
                } else {
                    toast.error('Failed to retrieve requested image.');
                }
                return;
            }

            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);

            dispatch(setChartDimensions({ width: undefined, height: undefined }));
            dispatch(setChartName({ light: url, dark: url }));

            dispatch(setBoundingBox(undefined));
        } catch (_) {
            if (chart.type === 'PDF') {
                toast.error('Failed to retrieve requested PDF Document.');
            } else {
                toast.error('Failed to retrieve requested image.');
            }

            return;
        }
        dispatch(setCurrentPage(1));
        dispatch(setChartId(chart.fileName));
    };

    return (
        <div className="space-y-4">
            {selectedTab.charts.map((chart) => (
                <div
                    className="group flex overflow-hidden flex-row w-full bg-theme-accent rounded-md"
                    onClick={() => handleChartClick(chart)}
                    key={chart.fileName}
                >
                    <span className={`w-2 transition flex-shrink-0 duration-100 group-hover:bg-theme-highlight ${chart.fileName === chartId
                        ? 'bg-theme-highlight'
                        : 'bg-theme-secondary'}`}
                    />
                    <div className="flex flex-col m-2">
                        <span>{chart.fileName}</span>
                        <span
                            className="px-2 mr-auto text-sm text-theme-text bg-theme-secondary rounded-sm"
                        >
                            {chart.type}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const NavigraphChartSelector = ({ selectedTab, loading }: NavigraphChartSelectorProps) => {
    const NO_RUNWAY_NAME = 'NONE';
    const [runwaySet, setRunwaySet] = useState<Set<string>>(new Set());
    const [organizedCharts, setOrganizedCharts] = useState<RunwayOrganizedChartType[]>([]);

    const dispatch = useAppDispatch();

    const { chartId, icao, tabIndex } = useAppSelector((state) => state.navigationTab);

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

    const handleChartClick = (chart: NavigraphChart) => {
        dispatch(setPagesViewable(1));

        dispatch(setCurrentPage(1));

        dispatch(setChartId(chart.id));

        dispatch(setChartDimensions({ width: undefined, height: undefined }));
        dispatch(setChartName({ light: chart.fileDay, dark: chart.fileNight }));

        dispatch(setBoundingBox(chart.boundingBox));
    };

    if (loading) {
        return (
            <div
                className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent"
                style={{ height: '42.25rem' }}
            >
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
        );
    }

    if (!selectedTab.charts.length) {
        return (
            <div
                className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent"
                style={{ height: '42.25rem' }}
            >
                <p>There are no charts to display.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {selectedTab.bundleRunways
                ? (
                    <>
                        {organizedCharts.map((item) => (
                            <div className="flex overflow-hidden flex-col w-full rounded-md divide-y-2 divide-gray-700" key={item.name}>
                                <span className="p-1 text-center bg-theme-secondary rounded-t-lg">{item.name}</span>
                                {item.charts.map((chart) => (
                                    <div
                                        className="group flex flex-row bg-theme-accent"
                                        onClick={() => handleChartClick(chart as NavigraphChart)}
                                        key={(chart as NavigraphChart).id}
                                    >
                                        <div className="flex flex-row items-center">
                                            <div className={`w-2 h-full transition duration-100 group-hover:bg-theme-highlight ${(chart as NavigraphChart).id === chartId
                                                ? 'bg-theme-highlight'
                                                : 'bg-theme-secondary'}`}
                                            />
                                            <div
                                                className="flex items-center px-2 h-full hover:text-theme-body hover:bg-theme-highlight transition duration-100"
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (isChartPinned((chart as NavigraphChart).id)) {
                                                        dispatch(removedPinnedChart({
                                                            chartId: (chart as NavigraphChart).id,
                                                            chartName: { light: (chart as NavigraphChart).fileDay, dark: (chart as NavigraphChart).fileNight },
                                                            icao,
                                                            title: (chart as NavigraphChart).procedureIdentifier,
                                                            tabIndex,
                                                            timeAccessed: 0,
                                                        }));
                                                    } else {
                                                        dispatch(addPinnedChart({
                                                            chartId: (chart as NavigraphChart).id,
                                                            chartName: { light: (chart as NavigraphChart).fileDay, dark: (chart as NavigraphChart).fileNight },
                                                            icao,
                                                            title: (chart as NavigraphChart).procedureIdentifier,
                                                            tabIndex,
                                                            timeAccessed: 0,
                                                        }));
                                                    }
                                                }}
                                            >
                                                {
                                                    isChartPinned((chart as NavigraphChart).id)
                                                        ? <PinFill size={40} />
                                                        : <Pin size={40} />
                                                }
                                            </div>
                                        </div>
                                        <div className="flex flex-col m-2">
                                            <span>{(chart as NavigraphChart).procedureIdentifier}</span>
                                            <span className="px-2 mt-0.5 mr-auto text-sm text-theme-text bg-theme-secondary rounded-md">
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
                                className="group flex overflow-hidden flex-row w-full bg-theme-accent rounded-md"
                                onClick={() => handleChartClick(chart as NavigraphChart)}
                                key={(chart as NavigraphChart).id}
                            >
                                <div className="flex flex-row items-center">
                                    <div className={`w-2 h-full transition duration-100 group-hover:bg-theme-highlight ${(chart as NavigraphChart).id === chartId
                                        ? 'bg-theme-highlight'
                                        : 'bg-theme-secondary'}`}
                                    />
                                    <div
                                        className="flex items-center px-2 h-full hover:text-theme-body hover:bg-theme-highlight transition duration-100"
                                        onClick={(event) => {
                                            event.stopPropagation();

                                            if (isChartPinned((chart as NavigraphChart).id)) {
                                                dispatch(removedPinnedChart({
                                                    chartId: (chart as NavigraphChart).id,
                                                    chartName: { light: (chart as NavigraphChart).fileDay, dark: (chart as NavigraphChart).fileNight },
                                                    icao,
                                                    title: (chart as NavigraphChart).procedureIdentifier,
                                                    tabIndex,
                                                    timeAccessed: 0,
                                                }));
                                            } else {
                                                dispatch(addPinnedChart({
                                                    chartId: (chart as NavigraphChart).id,
                                                    chartName: { light: (chart as NavigraphChart).fileDay, dark: (chart as NavigraphChart).fileNight },
                                                    icao,
                                                    title: (chart as NavigraphChart).procedureIdentifier,
                                                    tabIndex,
                                                    timeAccessed: 0,
                                                }));
                                            }
                                        }}
                                    >
                                        {
                                            isChartPinned((chart as NavigraphChart).id)
                                                ? <PinFill size={40} />
                                                : <Pin size={40} />
                                        }
                                    </div>
                                </div>
                                <div className="flex flex-col m-2">
                                    <span>{(chart as NavigraphChart).procedureIdentifier}</span>
                                    <span
                                        className="px-2 mr-auto text-sm text-theme-text bg-theme-secondary rounded-sm"
                                    >
                                        {(chart as NavigraphChart).indexNumber}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
        </div>
    );
};

const NavigraphChartsUI = () => {
    const dispatch = useAppDispatch();

    const navigraph = useNavigraph();

    const [statusBarInfo, setStatusBarInfo] = useState('');

    const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);
    const [chartListDisagrees, setChartListDisagrees] = useState(false);

    const [charts, setCharts] = useState<Charts>({
        arrival: [],
        approach: [],
        airport: [],
        departure: [],
        reference: [],
    });

    const [organizedCharts, setOrganizedCharts] = useState<OrganizedChartType[]>([
        { name: 'STAR', charts: charts.arrival },
        { name: 'APP', charts: charts.approach, bundleRunways: true },
        { name: 'TAXI', charts: charts.airport },
        { name: 'SID', charts: charts.departure },
        { name: 'REF', charts: charts.reference },
    ]);
    const { tabIndex, icao, chartName, isFullScreen } = useAppSelector((state) => state.navigationTab);

    const assignAirportInfo = async () => {
        setIcaoAndNameDisagree(true);

        const airportInfo = await navigraph.getAirportInfo(icao);
        setStatusBarInfo(airportInfo.name);

        setIcaoAndNameDisagree(false);
    };

    useEffect(() => {
        if (icao.length === 4) {
            assignAirportInfo();
        } else {
            setStatusBarInfo('');
            setCharts(emptyNavigraphCharts);
        }
    }, [icao]);

    useEffect(() => {
        setOrganizedCharts([
            { name: 'STAR', charts: charts.arrival },
            { name: 'APP', charts: charts.approach, bundleRunways: true },
            { name: 'TAXI', charts: charts.airport },
            { name: 'SID', charts: charts.departure },
            { name: 'REF', charts: charts.reference },
        ]);
    }, [charts]);

    useEffect(() => {
        const fetchCharts = async () => {
            const light = await navigraph.chartCall(icao, chartName.light);

            const dark = await navigraph.chartCall(icao, chartName.dark);

            dispatch(setChartLinks({ light, dark }));
        };

        fetchCharts();
    }, [chartName]);

    const handleIcaoChange = async (value: string) => {
        if (value.length !== 4) return;

        const newValue = value.toUpperCase();

        dispatch(setIcao(newValue));

        setChartListDisagrees(true);
        const chartList = await navigraph.getChartList(newValue);

        if (chartList) {
            setCharts(chartList);
        }
        setChartListDisagrees(false);
    };

    useEffect(() => {
        handleIcaoChange(icao);
    }, []);

    const loading = (!statusBarInfo.length || icaoAndNameDisagree || chartListDisagrees) && icao.length === 4;

    const getStatusBarText = () => {
        if (icao.length !== 4) {
            return 'No Airport Selected';
        }

        if (loading) {
            return 'Please Wait';
        }

        return statusBarInfo;
    };

    const simbriefDataLoaded = isSimbriefDataLoaded();

    const { altIcao, departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);

    return (
        <div className="flex overflow-x-hidden flex-row w-full h-content-section-reduced rounded-lg">
            <>
                {!isFullScreen && (
                    <div className="flex-shrink-0" style={{ width: '450px' }}>
                        <div className="flex flex-row justify-center items-center">
                            <SimpleInput
                                placeholder="ICAO"
                                value={icao}
                                noLabel
                                maxLength={4}
                                className={`w-full flex-shrink uppercase ${simbriefDataLoaded && 'rounded-r-none'}`}
                                onChange={handleIcaoChange}
                            />
                            {(simbriefDataLoaded) && (
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
                        <div className="flex flex-row items-center w-full h-11">
                            <ArrowReturnRight size={30} />
                            <div className="block overflow-hidden px-4 w-full whitespace-nowrap" style={{ textOverflow: 'ellipsis' }}>
                                {getStatusBarText()}
                            </div>
                        </div>
                        <div className="mt-6">
                            <SelectGroup>
                                {organizedCharts.map((organizedChart, index) => (
                                    <SelectItem
                                        selected={index === tabIndex}
                                        onSelect={() => dispatch(setTabIndex(index))}
                                        key={organizedChart.name}
                                        className="flex justify-center w-full"
                                    >
                                        {organizedChart.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <ScrollableContainer className="mt-5" height={42.25}>
                                <NavigraphChartSelector
                                    selectedTab={organizedCharts[tabIndex]}
                                    loading={loading}
                                />
                            </ScrollableContainer>
                        </div>
                    </div>
                )}
                <ChartComponent />
            </>
        </div>
    );
};

const LocalFileChartUI = () => {
    const dispatch = useAppDispatch();

    const [statusBarInfo, setStatusBarInfo] = useState('');

    const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);

    const [charts, setCharts] = useState<LocalFileCharts>({
        images: [],
        pdfs: [],
    });

    const [organizedCharts, setOrganizedCharts] = useState<LocalFileOrganizedCharts[]>([
        { name: 'IMAGE', charts: charts.images },
        { name: 'PDF', charts: charts.pdfs },
        { name: 'BOTH', charts: [...charts.images, ...charts.pdfs] },
    ]);
    const { tabIndex, icao, chartName, isFullScreen } = useAppSelector((state) => state.navigationTab);

    const updateSearchStatus = async () => {
        setIcaoAndNameDisagree(true);

        const searchedCharts: string[] = [];

        if (tabIndex === 0 || tabIndex === 2) {
            searchedCharts.push(...charts.images.map((image) => image.fileName));
        }

        if (tabIndex === 1 || tabIndex === 2) {
            searchedCharts.push(...charts.pdfs.map((pdf) => pdf.fileName));
        }

        const numItemsFound = searchedCharts.filter((chartName) => {
            if (chartName.toUpperCase().includes(icao)) {
                return true;
            }
            return false;
        }).length;

        setStatusBarInfo(`${numItemsFound} ${numItemsFound === 1 ? 'Item' : 'Items'} Found`);

        setIcaoAndNameDisagree(false);
    };

    useEffect(() => {
        updateSearchStatus();
    }, [icao, tabIndex]);

    useEffect(() => {
        setOrganizedCharts([
            { name: 'IMAGE', charts: charts.images },
            { name: 'PDF', charts: charts.pdfs },
            { name: 'BOTH', charts: [...charts.pdfs, ...charts.images] },
        ]);
    }, [charts]);

    useEffect(() => {
        dispatch(setChartLinks({ light: chartName.light, dark: chartName.dark }));
    }, [chartName]);

    const getLocalFileChartList = async (searchQuery: string): Promise<LocalFileCharts> => {
        const pdfs: LocalFileChart[] = [];
        const images: LocalFileChart[] = [];

        try {
        // IMAGE or BOTH
            if (tabIndex === 0 || tabIndex === 2) {
                const resp = await fetch('http://localhost:3838/utility/v1/image/list');

                const imageNames: string[] = await resp.json();

                imageNames.forEach((imageName) => {
                    if (imageName.toUpperCase().includes(searchQuery)) {
                        images.push({
                            fileName: imageName,
                            type: 'IMAGE',
                        });
                    }
                });
            }

            // PDF or BOTH
            if (tabIndex === 1 || tabIndex === 2) {
                const resp = await fetch('http://localhost:3838/utility/v1/pdf/list');
                const pdfNames: string[] = await resp.json();

                pdfNames.forEach((pdfName) => {
                    if (pdfName.toUpperCase().includes(searchQuery)) {
                        pdfs.push({
                            fileName: pdfName,
                            type: 'PDF',
                        });
                    }
                });
            }
        } catch (err) {
            toast.error('Error encountered while fetching resources.');
        }

        return {
            images,
            pdfs,
        };
    };

    const handleIcaoChange = (value: string) => {
        const newValue = value.toUpperCase();

        dispatch(setIcao(newValue));

        getLocalFileChartList(newValue).then((r) => setCharts(r));
    };

    useEffect(() => {
        handleIcaoChange(icao);
    }, [tabIndex]);

    const loading = icaoAndNameDisagree;

    const getStatusBarText = () => {
        if (!icao.length) {
            return 'Showing All Items';
        }

        if (loading) {
            return 'Please Wait';
        }

        return statusBarInfo;
    };

    const simbriefDataLoaded = isSimbriefDataLoaded();

    const { altIcao, departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);

    return (
        <div className="flex overflow-x-hidden flex-row w-full h-content-section-reduced rounded-lg">
            <>
                {!isFullScreen && (
                    <div className="overflow-hidden flex-shrink-0" style={{ width: '450px' }}>
                        <div className="flex flex-row justify-center items-center">
                            <SimpleInput
                                placeholder="File Name"
                                value={icao}
                                noLabel
                                className={`w-full flex-shrink uppercase ${simbriefDataLoaded && 'rounded-r-none'}`}
                                onChange={handleIcaoChange}
                            />
                            {(simbriefDataLoaded) && (
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
                        <div className="flex flex-row items-center w-full h-11">
                            <ArrowReturnRight size={30} />
                            <div className="block overflow-hidden px-4 w-full whitespace-nowrap" style={{ textOverflow: 'ellipsis' }}>
                                {getStatusBarText()}
                            </div>
                        </div>
                        <div className="mt-6">
                            <SelectGroup>
                                {organizedCharts.map((organizedChart, index) => (
                                    <SelectItem
                                        selected={index === tabIndex}
                                        onSelect={() => dispatch(setTabIndex(index))}
                                        key={organizedChart.name}
                                        className="flex justify-center w-full"
                                    >
                                        {organizedChart.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <ScrollableContainer className="mt-5" height={42.25}>
                                <LocalFileChartSelector
                                    selectedTab={organizedCharts[Math.min(tabIndex, 2)]}
                                    loading={loading}
                                />
                            </ScrollableContainer>
                        </div>
                    </div>
                )}
                <ChartComponent />
            </>
        </div>
    );
};

const NavigraphNav = () => {
    const navigraph = useNavigraph();

    useInterval(async () => {
        try {
            await navigraph.getToken();
        } catch (e) {
            toast.error(`Navigraph Authentication Error: ${e.message}`, { autoClose: 10_000 });
        }
    }, (navigraph.tokenRefreshInterval * 1000));

    useEffect(() => {
        if (!navigraph.hasToken) {
            navigraph.authenticate();
        }
    }, []);

    return (
        <>
            {NavigraphClient.hasSufficientEnv
                ? (
                    <>
                        {navigraph.hasToken
                            ? (
                                <NavigraphChartsUI />
                            )
                            : <AuthUi />}
                    </>
                )
                : (
                    <div className="flex overflow-x-hidden justify-center items-center mr-4 w-full h-content-section-reduced bg-theme-secondary rounded-lg">
                        <p className="pt-6 mb-6 text-3xl">Insufficient .env file</p>
                    </div>
                )}
        </>
    );
};

const tabs: PageLink[] = [
    { name: 'Local Files', component: <LocalFileChartUI /> },
    { name: 'Navigraph', component: <NavigraphNav /> },
];

export const Navigation = () => {
    const dispatch = useAppDispatch();

    return (
        <div className="w-full h-full">
            <div className="relative">
                <h1 className="font-bold">Navigation & Charts</h1>
                <Navbar
                    className="absolute top-0 right-0"
                    tabs={tabs}
                    basePath="/navigation"
                    onSelected={() => {
                        dispatch(setChartLinks({ light: '', dark: '' }));
                        dispatch(setChartName({ light: '', dark: '' }));
                        dispatch(setTabIndex(0));
                    }}
                />
            </div>

            <div className="mt-4">
                <PageRedirect basePath="/navigation" tabs={tabs} />
                <TabRoutes basePath="/navigation" tabs={tabs} />
            </div>
        </div>
    );
};
