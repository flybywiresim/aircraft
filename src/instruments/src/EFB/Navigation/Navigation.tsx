/* eslint-disable max-len,react/no-this-in-sfc */
import React, { useEffect, useRef, useState } from 'react';
import {
    ArrowClockwise,
    ArrowCounterclockwise,
    ArrowsExpand,
    ArrowsFullscreen,
    Dash,
    FullscreenExit,
    MoonFill,
    Plus,
    SunFill, XCircleFill,
} from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { useTranslation } from 'react-i18next';
import i18next from '../i18n';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';
import { DrawableCanvas } from '../UtilComponents/DrawableCanvas';
import { useNavigraph } from '../ChartsApi/Navigraph';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { useAppDispatch, useAppSelector } from '../Store/store';
import {
    NavigationTab,
    setBoundingBox,
    setUsingDarkTheme,
    setSelectedNavigationTabIndex,
    editTabProperty,
    ProviderTab,
    setProvider,
    ChartProvider,
} from '../Store/features/navigationPage';
import { PageLink, PageRedirect, TabRoutes } from '../Utils/routing';
import { Navbar } from '../UtilComponents/Navbar';
import { NavigraphPage } from './Pages/NavigraphPage/NavigraphPage';
import { getPdfUrl, LocalFilesPage } from './Pages/LocalFilesPage/LocalFilesPage';
import { PinnedChartUI } from './Pages/PinnedChartsPage';

export const navigationTabs: (PageLink & {associatedTab: NavigationTab})[] = [
    { name: 'Navigraph', alias: i18next.t('NavigationAndCharts.Navigraph.Title'), component: <NavigraphPage />, associatedTab: NavigationTab.NAVIGRAPH },
    { name: 'Local Files', alias: i18next.t('NavigationAndCharts.LocalFiles.Title'), component: <LocalFilesPage />, associatedTab: NavigationTab.LOCAL_FILES },
    { name: 'Pinned Charts', alias: i18next.t('NavigationAndCharts.PinnedCharts.Title'), component: <PinnedChartUI />, associatedTab: NavigationTab.PINNED_CHARTS },
];

export const Navigation = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    return (
        <div className="w-full h-full">
            <div className="relative">
                <h1 className="font-bold">{t('NavigationAndCharts.Title')}</h1>
                <Navbar
                    className="absolute top-0 right-0"
                    tabs={navigationTabs}
                    basePath="/navigation"
                    onSelected={(index) => {
                        const associatedTab = ChartProvider[navigationTabs[index].associatedTab];

                        dispatch(setSelectedNavigationTabIndex(index));
                        dispatch(setBoundingBox(undefined));
                        dispatch(setProvider(associatedTab));
                    }}
                />
            </div>

            <div className="mt-4">
                <PageRedirect basePath="/navigation" tabs={navigationTabs} />
                <TabRoutes basePath="/navigation" tabs={navigationTabs} />
            </div>
        </div>
    );
};

export const ChartViewer = () => {
    const dispatch = useAppDispatch();
    const {
        selectedNavigationTabIndex,
        usingDarkTheme,
        planeInFocus,
        boundingBox,
        provider,
    } = useAppSelector((state) => state.navigationTab);

    const currentTab = navigationTabs[selectedNavigationTabIndex].associatedTab as ProviderTab;
    const {
        isFullScreen,
        chartDimensions,
        chartLinks,
        chartId,
        pagesViewable,
        currentPage,
        chartPosition,
        chartRotation,
    } = useAppSelector((state) => state.navigationTab[currentTab]);

    const [drawMode] = useState(false);
    const [brushSize] = useState(10);

    const { userName } = useNavigraph();

    const ref = useRef<HTMLDivElement>(null);

    const chartRef = useRef<HTMLDivElement>(null);

    const { t } = useTranslation();

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
            dispatch(editTabProperty({ tab: currentTab, chartRotation: 360 - aircraftIconPosition.r }));
            // TODO: implement the chart translation
            // if (ref.current) {
            //     ref.current.scrollTop = aircraftIconPosition.y + ((ref.current.clientHeight - aircraftIconPosition.y) / 2);
            //     ref.current.scrollLeft = -(ref.current.clientWidth - aircraftIconPosition.x) / 2;
            // }
        }
    }, [aircraftIconPosition.r, planeInFocus]);

    // The functions that handle rotation get the closest 45 degree angle increment to the current angle
    const handleRotateRight = () => {
        dispatch(editTabProperty({ tab: currentTab, chartRotation: chartRotation + (45 - chartRotation % 45) }));
    };

    const handleRotateLeft = () => {
        dispatch(editTabProperty({ tab: currentTab, chartRotation: chartRotation - (45 + chartRotation % 45) }));
    };

    useEffect(() => {
        if (!chartDimensions.height && !chartDimensions.width) {
            const img = new Image();
            img.onload = function () {
                if (ref.current) {
                    const chartDimensions: {width: number, height: number} = {
                        width: -1,
                        height: -1,
                    };

                    // @ts-ignore
                    if (this.height * (ref.current.clientWidth / this.width) < ref.current.clientHeight) {
                        // @ts-ignore
                        chartDimensions.width = this.width * (ref.current.clientHeight / this.height);
                        chartDimensions.height = ref.current.clientHeight;
                    } else {
                        chartDimensions.width = ref.current.clientWidth;
                        // @ts-ignore
                        chartDimensions.height = this.height * (ref.current.clientWidth / this.width);
                    }

                    dispatch(editTabProperty({
                        tab: currentTab,
                        chartDimensions,
                    }));
                }
            };
            img.src = chartLinks.light;
        }
    }, [chartLinks]);

    useEffect(() => {
        if (pagesViewable > 1) {
            getPdfUrl(chartId, currentPage).then((url) => {
                dispatch(editTabProperty({ tab: currentTab, chartName: { light: url, dark: url } }));
            });
        }
    }, [currentPage]);

    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const planeRef = useRef(null);

    if (!chartLinks.light || !chartLinks.dark) {
        return (
            <div
                className={`flex relative items-center justify-center bg-theme-accent rounded-lg ${!isFullScreen && 'rounded-l-none ml-6'}`}
                style={{ width: `${isFullScreen ? '1278px' : '804px'}` }}
            >
                {isFullScreen && (
                    <div
                        className="flex absolute top-6 right-6 flex-row items-center p-4 rounded-md transition duration-100 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                        onClick={() => dispatch(editTabProperty({ tab: currentTab, isFullScreen: false }))}
                    >
                        <FullscreenExit size={40} />
                        <p className="ml-4 text-current">{t('NavigationAndCharts.ExitFullscreenMode')}</p>
                    </div>
                )}
                <p>{t('NavigationAndCharts.ThereIsNoChartToDisplay')}</p>
            </div>
        );
    }

    return (
        <div
            className={`relative ${!isFullScreen && 'rounded-l-none ml-6'}`}
            style={{ width: `${isFullScreen ? '1278px' : '804px'}` }}
        >
            <TransformWrapper
                ref={transformRef}
                initialScale={chartPosition.scale}
                initialPositionX={chartPosition.positionX}
                initialPositionY={chartPosition.positionY}
                velocityAnimation={{
                    disabled: true,
                    sensitivity: 0,
                }}
            >
                {({ zoomIn, zoomOut, setTransform, state }) => (
                    <div
                        className="h-full"
                        onMouseUp={() => dispatch(editTabProperty({ tab: currentTab, chartPosition: { ...state } }))}
                    >
                        {/* <div className="overflow-hidden absolute bottom-6 left-6 z-30 rounded-md">
                            {drawMode && (
                                <Slider min={1} max={30} value={brushSize} onChange={(value) => setBrushSize(value)} />
                            )}
                            <button
                                type="button"
                                onClick={() => setDrawMode((old) => !old)}
                                className={`p-2 transition hover:text-theme-body duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${drawMode && 'text-theme-body bg-theme-highlight'}`}
                            >
                                <PencilFill className="fill-current" size={40} />
                            </button>
                        </div> */}

                        {pagesViewable > 1 && (
                            <div className="flex overflow-hidden absolute top-6 left-6 z-40 flex-row items-center rounded-md">
                                <div
                                    className={`flex flex-row justify-center items-center h-14 bg-opacity-40 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight ${currentPage === 1 && 'opacity-50 pointer-events-none'}`}
                                    onClick={() => dispatch(editTabProperty({ tab: currentTab, currentPage: currentPage - 1 }))}
                                >
                                    <Dash size={40} />
                                </div>
                                <SimpleInput
                                    min={1}
                                    max={pagesViewable}
                                    value={currentPage}
                                    number
                                    onBlur={(value) => {
                                        dispatch(editTabProperty({ tab: currentTab, currentPage: Number.parseInt(value) }));
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
                                    onClick={() => dispatch(editTabProperty({ tab: currentTab, currentPage: currentPage + 1 }))}
                                >

                                    <Plus size={40} />
                                </div>
                            </div>
                        )}

                        <div className="flex overflow-hidden absolute top-6 right-6 bottom-6 z-30 flex-col justify-between rounded-md cursor-pointer">
                            <div className="flex overflow-hidden flex-col rounded-md">
                                <TooltipWrapper text="Rotate Left 45 Degrees">
                                    <button
                                        type="button"
                                        onClick={handleRotateLeft}
                                        className={`p-2 transition hover:text-theme-body duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-unselected pointer-events-none'}`}
                                    >
                                        <ArrowCounterclockwise size={40} />
                                    </button>
                                </TooltipWrapper>
                                {/* {boundingBox && (
                                    <button
                                        type="button"
                                        onClick={() => dispatch(setPlaneInFocus(!planeInFocus))}
                                        className={`p-2 transition hover:text-theme-body duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-highlight  hover:text-theme-text'}`}
                                    >
                                        <Bullseye size={40} />
                                    </button>
                                )} */}
                                <TooltipWrapper text="Rotate Right 45 Degrees">
                                    <button
                                        type="button"
                                        onClick={handleRotateRight}
                                        className={`p-2 transition hover:text-theme-body duration-100 cursor-pointer bg-theme-secondary hover:bg-theme-highlight ${planeInFocus && 'text-theme-unselected pointer-events-none'}`}
                                    >
                                        <ArrowClockwise className="fill-current" size={40} />
                                    </button>
                                </TooltipWrapper>
                            </div>
                            <div className="flex overflow-hidden flex-col rounded-md">
                                <TooltipWrapper text="Expand Chart Vertically">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (ref.current && chartRef.current) {
                                                const newScale = ref.current.clientHeight / chartRef.current.clientHeight;
                                                const chartWidthExceedsBoundary = chartRef.current.clientWidth > ref.current.clientWidth;
                                                const offsetX = chartWidthExceedsBoundary ? 0 : (ref.current.clientWidth - (chartRef.current.clientWidth * newScale)) / 2;

                                                setTransform(offsetX, 0, newScale);
                                                dispatch(editTabProperty({
                                                    tab: currentTab,
                                                    chartPosition: {
                                                        positionX: offsetX,
                                                        positionY: 0,
                                                        scale: newScale,
                                                    },
                                                }));
                                            }
                                        }}
                                        className="p-2 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                                    >
                                        <ArrowsExpand size={40} />
                                    </button>
                                </TooltipWrapper>

                                <TooltipWrapper text="Expand Chart Horizontally">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (ref.current && chartRef.current) {
                                                const newScale = ref.current.clientWidth / chartRef.current.clientWidth;
                                                const chartHeightExceedsBoundary = chartRef.current.clientHeight > ref.current.clientHeight;
                                                const offsetY = chartHeightExceedsBoundary ? 0 : (ref.current.clientHeight - (chartRef.current.clientHeight * newScale)) / 2;

                                                setTransform(0, offsetY, newScale);
                                                dispatch(editTabProperty({
                                                    tab: currentTab,
                                                    chartPosition: {
                                                        positionX: 0,
                                                        positionY: offsetY,
                                                        scale: newScale,
                                                    },
                                                }));
                                            }
                                        }}
                                        className="p-2 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                                    >
                                        <ArrowsExpand className="transform rotate-90" size={40} />
                                    </button>
                                </TooltipWrapper>

                                <TooltipWrapper text="Reset Transformation">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTransform(0, 0, 1);
                                            dispatch(editTabProperty({ tab: currentTab, chartPosition: { ...chartPosition, positionX: 0, positionY: 0, scale: 1 } }));
                                        }}
                                        className="p-2 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                                    >
                                        <XCircleFill size={40} />
                                    </button>
                                </TooltipWrapper>

                                <TooltipWrapper text="Zoom In">
                                    <button
                                        type="button"
                                        onClick={() => zoomIn()}
                                        className="p-2 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                                    >
                                        <Plus size={40} />
                                    </button>
                                </TooltipWrapper>

                                <TooltipWrapper text="Zoom Out">
                                    <button
                                        type="button"
                                        onClick={() => zoomOut()}
                                        className="p-2 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                                    >
                                        <Dash size={40} />
                                    </button>
                                </TooltipWrapper>
                            </div>
                            <div className="flex overflow-hidden flex-col rounded-md">
                                <div
                                    className="p-2 rounded-md transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                                    onClick={() => {
                                        // TODO: THIS NEEDS TO WORK BETTER
                                        dispatch(editTabProperty({ tab: currentTab, isFullScreen: !isFullScreen }));

                                        if (chartRef.current && ref.current) {
                                            const newScale = ref.current.clientWidth / chartRef.current.clientWidth;

                                            const chartHeightExceedsBoundary = chartRef.current.clientHeight > ref.current.clientHeight;

                                            const offsetY = chartHeightExceedsBoundary ? 0 : (ref.current.clientHeight - (chartRef.current.clientHeight * newScale)) / 2;
                                            console.log(state.scale, newScale);
                                            if (state.scale === newScale) {
                                                console.log('called');
                                                setTransform(0, offsetY, newScale);
                                                dispatch(editTabProperty({
                                                    tab: currentTab,
                                                    chartPosition: {
                                                        positionX: 0,
                                                        positionY: offsetY,
                                                        scale: newScale,
                                                    },
                                                }));
                                            }
                                        }
                                    }}
                                >
                                    {isFullScreen
                                        ? <FullscreenExit size={40} />
                                        : <ArrowsFullscreen size={40} />}
                                </div>

                                {provider === 'NAVIGRAPH' && (
                                    <div
                                        className="p-2 mt-3 rounded-md transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                                        onClick={() => dispatch(setUsingDarkTheme(!usingDarkTheme))}
                                    >
                                        {!usingDarkTheme ? <MoonFill size={40} /> : <SunFill size={40} />}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            className="flex overflow-x-hidden overflow-y-scroll relative flex-row mx-auto h-full rounded-lg bg-theme-accent grabbable no-scrollbar"
                            ref={ref}
                        >
                            <TransformComponent wrapperStyle={{ height: ref.current?.clientHeight, width: ref.current?.clientWidth }}>
                                <DrawableCanvas
                                    className="absolute inset-0 z-10 transition duration-100"
                                    rotation={chartRotation}
                                    brushSize={brushSize}
                                    width={chartDimensions.width ?? 0}
                                    height={chartDimensions.height ?? 0}
                                    resolutionScalar={4}
                                    disabled={!drawMode}
                                />

                                <div
                                    className="relative m-auto transition duration-100"
                                    style={{ transform: `rotate(${chartRotation}deg)` }}
                                >
                                    {(chartLinks && provider === 'NAVIGRAPH') && (
                                        <p
                                            className="absolute top-0 left-0 font-bold whitespace-nowrap transition duration-100 transform -translate-y-full text-theme-highlight"
                                        >
                                            This chart is linked to
                                            {' '}
                                            {userName}
                                        </p>
                                    )}

                                    { (aircraftIconVisible && boundingBox) && (
                                        <svg ref={planeRef} viewBox={`0 0 ${boundingBox.width} ${boundingBox.height}`} className="absolute top-0 left-0 z-30">
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
                            </TransformComponent>
                        </div>
                    </div>
                )}
            </TransformWrapper>
        </div>
    );
};
