// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len,react/no-this-in-sfc,no-console */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowClockwise,
  ArrowCounterclockwise,
  ArrowsExpand,
  ArrowsFullscreen,
  Dash,
  FullscreenExit,
  MoonFill,
  Plus,
  SunFill,
  XCircleFill,
} from 'react-bootstrap-icons';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { Chart } from 'navigraph/charts';
import { t } from '../Localization/translation';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { useAppDispatch, useAppSelector } from '../Store/store';
import {
  ChartProvider,
  editTabProperty,
  NavigationTab,
  ProviderTab,
  setBoundingBox,
  setProvider,
  setSelectedNavigationTabIndex,
  setUsingDarkTheme,
} from '../Store/features/navigationPage';
import { PageLink, PageRedirect, TabRoutes } from '../Utils/routing';
import { Navbar } from '../UtilComponents/Navbar';
import { NavigraphPage } from './Pages/NavigraphPage/NavigraphPage';
import { getPdfUrl, LocalFilesPage } from './Pages/LocalFilesPage/LocalFilesPage';
import { PinnedChartUI } from './Pages/PinnedChartsPage';
import { useNavigraphAuth } from '../../react/navigraph';
import { navigraphCharts } from '../../navigraph';

export const navigationTabs: (PageLink & { associatedTab: NavigationTab })[] = [
  { name: 'Navigraph', alias: '', component: <NavigraphPage />, associatedTab: NavigationTab.NAVIGRAPH },
  { name: 'Local Files', alias: '', component: <LocalFilesPage />, associatedTab: NavigationTab.LOCAL_FILES },
  { name: 'Pinned Charts', alias: '', component: <PinnedChartUI />, associatedTab: NavigationTab.PINNED_CHARTS },
];

export const Navigation = () => {
  const dispatch = useAppDispatch();

  if (navigationTabs) {
    navigationTabs[0].alias = t('NavigationAndCharts.Navigraph.Title');
    navigationTabs[1].alias = t('NavigationAndCharts.LocalFiles.Title');
    navigationTabs[2].alias = t('NavigationAndCharts.PinnedCharts.Title');
  }

  return (
    <div className="h-full w-full">
      <div className="relative">
        <h1 className="font-bold">{t('NavigationAndCharts.Title')}</h1>
        <Navbar
          className="absolute right-0 top-0"
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
  const { selectedNavigationTabIndex, usingDarkTheme, planeInFocus, boundingBox, provider } = useAppSelector(
    (state) => state.navigationTab,
  );

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

  // const [drawMode] = useState(false);
  // const [brushSize] = useState(10);

  const navigraphAuth = useNavigraphAuth();

  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLImageElement>(null);

  const [aircraftIconVisible, setAircraftIconVisible] = useState(false);
  const [aircraftIconPosition, setAircraftIconPosition] = useState<{ x: number; y: number; r: number }>({
    x: 0,
    y: 0,
    r: 0,
  });
  const [aircraftLatitude] = useSimVar('PLANE LATITUDE', 'degree latitude', 1000);
  const [aircraftLongitude] = useSimVar('PLANE LONGITUDE', 'degree longitude', 1000);
  const [aircraftTrueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 100);
  const [loading, setLoading] = useState(true);

  const [chartLightBlob, setChartLightBlob] = useState<Blob | null>(null);
  const chartLightUrl = useMemo(() => (chartLightBlob ? URL.createObjectURL(chartLightBlob) : null), [chartLightBlob]);

  const [chartDarkBlob, setChartDarkBlob] = useState<Blob | null>(null);
  const chartDarkUrl = useMemo(() => (chartLightBlob ? URL.createObjectURL(chartDarkBlob) : null), [chartDarkBlob]);

  useEffect(() => {
    let visible = false;

    if (
      boundingBox &&
      aircraftLatitude >= boundingBox.planview.latlng.lat1 &&
      aircraftLatitude <= boundingBox.planview.latlng.lat2 &&
      aircraftLongitude >= boundingBox.planview.latlng.lng1 &&
      aircraftLongitude <= boundingBox.planview.latlng.lng2
    ) {
      const dx = boundingBox.planview.pixels.x2 - boundingBox.planview.pixels.x1;
      const dy = boundingBox.planview.pixels.y1 - boundingBox.planview.pixels.y2;
      const dLat = boundingBox.planview.latlng.lat2 - boundingBox.planview.latlng.lat1;
      const dLon = boundingBox.planview.latlng.lng2 - boundingBox.planview.latlng.lng1;
      const x = dx * ((aircraftLongitude - boundingBox.planview.latlng.lng1) / dLon);
      const y = dy * ((boundingBox.planview.latlng.lat2 - aircraftLatitude) / dLat);

      setAircraftIconPosition({ x, y, r: aircraftTrueHeading });
      visible = true;
    }

    setAircraftIconVisible(visible);
  }, [
    boundingBox,
    chartLinks,
    aircraftLatitude.toFixed(2),
    aircraftLongitude.toFixed(2),
    aircraftTrueHeading.toFixed(1),
  ]);

  useEffect(() => {
    setLoading(true);
    navigraphCharts
      .getChartImage({
        chart: { image_day_url: chartLinks.light, image_night_url: chartLinks.dark } as Chart,
        theme: 'light',
      })
      .then((blob) => setChartLightBlob(blob));
    navigraphCharts
      .getChartImage({
        chart: { image_day_url: chartLinks.light, image_night_url: chartLinks.dark } as Chart,
        theme: 'dark',
      })
      .then((blob) => setChartDarkBlob(blob));
  }, [chartLinks]);

  const handleRotateRight = () => {
    dispatch(editTabProperty({ tab: currentTab, chartRotation: (chartRotation + 90) % 360 }));
  };

  const handleRotateLeft = () => {
    dispatch(editTabProperty({ tab: currentTab, chartRotation: (chartRotation - 90) % 360 }));
  };

  const chartImgRef = useCallback((node: HTMLImageElement) => {
    if (node) {
      node.onload = function () {
        const chartDimensions: { width: number; height: number } = {
          width: -1,
          height: -1,
        };

        chartDimensions.height = node.height;
        chartDimensions.width = node.width;

        dispatch(
          editTabProperty({
            tab: currentTab,
            chartDimensions,
          }),
        );
        setLoading(false);
      };
    }
  }, []);

  useEffect(() => {
    const { width, height } = chartDimensions;
    if (chartRef.current && width && height) {
      if (width > height) {
        chartRef.current.style.width = `${width}px`;
        chartRef.current.style.height = `${height}px`;
      }
      if (height > width) {
        chartRef.current.style.width = `${width}px`;
        chartRef.current.style.height = `${height}px`;
      }
    }
  }, [chartRef, chartDimensions]);

  useEffect(() => {
    if (pagesViewable > 1) {
      getPdfUrl(chartId, currentPage)
        .then((url) => {
          dispatch(editTabProperty({ tab: currentTab, chartName: { light: url, dark: url } }));
        })
        .catch((error) => {
          console.error(`Error: ${error}`);
        });
    }
  }, [currentPage]);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const planeRef = useRef(null);

  if (!chartLinks.light || !chartLinks.dark) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-lg bg-theme-accent ${!isFullScreen && 'ml-6 rounded-l-none'}`}
        style={{ width: `${isFullScreen ? '1278px' : '804px'}` }}
      >
        {isFullScreen && (
          <div
            className="absolute right-6 top-6 flex flex-row items-center rounded-md bg-theme-secondary p-4 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
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

  // noinspection PointlessBooleanExpressionJS
  return (
    <div
      className={`relative ${!isFullScreen && 'ml-6 rounded-l-none'}`}
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
        minScale={0.05}
        maxScale={5}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, setTransform, state }) => (
          <div
            className="h-full"
            onMouseUp={() => dispatch(editTabProperty({ tab: currentTab, chartPosition: { ...state } }))}
            style={{ display: loading ? 'none' : 'block' }}
          >
            {pagesViewable > 1 && (
              <div className="absolute left-6 top-6 z-40 flex flex-row items-center overflow-hidden rounded-md">
                <div
                  className={`bg-theme-secondary/40 flex h-14 cursor-pointer flex-row items-center justify-center transition duration-100 hover:bg-theme-highlight hover:text-theme-body ${currentPage === 1 && 'pointer-events-none opacity-50'}`}
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
                    dispatch(
                      editTabProperty({
                        tab: currentTab,
                        currentPage: value ? Number.parseInt(value) : 1,
                      }),
                    );
                  }}
                  className="h-14 w-16 rounded-none border-transparent"
                />
                <div className="flex h-14 shrink-0 items-center bg-theme-secondary px-2">{`of ${pagesViewable}`}</div>
                <div
                  className={`bg-theme-secondary/40 flex h-14 cursor-pointer flex-row items-center justify-center transition duration-100 hover:bg-theme-highlight hover:text-theme-body ${currentPage === pagesViewable && 'pointer-events-none opacity-50'}`}
                  onClick={() => dispatch(editTabProperty({ tab: currentTab, currentPage: currentPage + 1 }))}
                >
                  <Plus size={40} />
                </div>
              </div>
            )}

            <div className="absolute inset-y-6 right-6 z-20 flex cursor-pointer flex-col justify-between overflow-hidden rounded-md">
              <div className="flex flex-col overflow-hidden rounded-md">
                <TooltipWrapper text={t('NavigationAndCharts.TT.RotateLeft45Degrees')}>
                  <button
                    type="button"
                    onClick={handleRotateLeft}
                    className={`cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body ${planeInFocus && 'pointer-events-none text-theme-unselected'}`}
                  >
                    <ArrowCounterclockwise size={40} />
                  </button>
                </TooltipWrapper>
                <TooltipWrapper text={t('NavigationAndCharts.TT.RotateRight45Degrees')}>
                  <button
                    type="button"
                    onClick={handleRotateRight}
                    className={`cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body ${planeInFocus && 'pointer-events-none text-theme-unselected'}`}
                  >
                    <ArrowClockwise className="fill-current" size={40} />
                  </button>
                </TooltipWrapper>
              </div>
              <div className="flex flex-col overflow-hidden rounded-md">
                <TooltipWrapper text={t('NavigationAndCharts.TT.FitChartToHeight')}>
                  <button
                    type="button"
                    onClick={() => {
                      if (ref.current && chartRef.current) {
                        const rotated90degree = Math.abs(chartRotation) === 90 || Math.abs(chartRotation) === 270;
                        let newScale: number;
                        let offsetX = 0;
                        let offsetY = 0;

                        if (chartRef.current.clientHeight >= chartRef.current.clientWidth) {
                          // portrait
                          if (rotated90degree) {
                            newScale = ref.current.clientHeight / chartRef.current.clientWidth;
                            offsetX = (ref.current.clientWidth - ref.current.clientHeight) / 2;
                            offsetY = ((chartRef.current.clientWidth - chartRef.current.clientHeight) / 2) * newScale;
                          } else {
                            newScale = ref.current.clientHeight / chartRef.current.clientHeight;
                            offsetX = (ref.current.clientWidth - chartRef.current.clientWidth * newScale) / 2;
                          }
                        } else {
                          // landscape
                          // eslint-disable-next-line no-lonely-if
                          if (rotated90degree) {
                            newScale = ref.current.clientHeight / chartRef.current.clientWidth;
                            offsetY = ((chartRef.current.clientWidth - chartRef.current.clientHeight) / 2) * newScale;
                          } else {
                            newScale = ref.current.clientHeight / chartRef.current.clientHeight;
                            offsetX = (ref.current.clientWidth - chartRef.current.clientWidth * newScale) / 2;
                          }
                        }

                        setTransform(offsetX, offsetY, newScale);
                        dispatch(
                          editTabProperty({
                            tab: currentTab,
                            chartPosition: {
                              positionX: offsetX,
                              positionY: offsetY,
                              scale: newScale,
                            },
                          }),
                        );
                      }
                    }}
                    className="cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                  >
                    <ArrowsExpand size={40} />
                  </button>
                </TooltipWrapper>

                <TooltipWrapper text={t('NavigationAndCharts.TT.FitChartToWidth')}>
                  <button
                    type="button"
                    onClick={() => {
                      if (ref.current && chartRef.current) {
                        const rotated90degree = Math.abs(chartRotation) === 90 || Math.abs(chartRotation) === 270;
                        let newScale: number;
                        let offsetX = 0;
                        let offsetY = 0;

                        if (chartRef.current.clientHeight >= chartRef.current.clientWidth) {
                          // portrait
                          if (rotated90degree) {
                            newScale = ref.current.clientWidth / chartRef.current.clientHeight;
                            offsetX = ((chartRef.current.clientHeight - chartRef.current.clientWidth) / 2) * newScale;
                            offsetY = (ref.current.clientHeight - ref.current.clientWidth) / 2;
                          } else {
                            newScale = ref.current.clientWidth / chartRef.current.clientWidth;
                            offsetY = (ref.current.clientHeight - chartRef.current.clientHeight * newScale) / 2;
                          }
                        } else {
                          // landscape
                          // eslint-disable-next-line no-lonely-if
                          if (rotated90degree) {
                            newScale = ref.current.clientWidth / chartRef.current.clientHeight;
                            offsetX = ((chartRef.current.clientHeight - chartRef.current.clientWidth) / 2) * newScale;
                          } else {
                            newScale = ref.current.clientWidth / chartRef.current.clientWidth;
                            offsetY = (ref.current.clientHeight - chartRef.current.clientHeight * newScale) / 2;
                          }
                        }

                        setTransform(offsetX, offsetY, newScale);
                        dispatch(
                          editTabProperty({
                            tab: currentTab,
                            chartPosition: {
                              positionX: offsetX,
                              positionY: offsetY,
                              scale: newScale,
                            },
                          }),
                        );
                      }
                    }}
                    className="cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                  >
                    <ArrowsExpand className="rotate-90" size={40} />
                  </button>
                </TooltipWrapper>

                <TooltipWrapper text={t('NavigationAndCharts.TT.ResetMovement')}>
                  <button
                    type="button"
                    onClick={() => {
                      setTransform(0, 0, 1);
                      dispatch(editTabProperty({ tab: currentTab, chartRotation: 0 }));
                      dispatch(
                        editTabProperty({
                          tab: currentTab,
                          chartPosition: { ...chartPosition, positionX: 0, positionY: 0, scale: 1 },
                        }),
                      );
                    }}
                    className="cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                  >
                    <XCircleFill size={40} />
                  </button>
                </TooltipWrapper>

                <TooltipWrapper text={t('NavigationAndCharts.TT.ZoomIn')}>
                  <button
                    type="button"
                    onClick={() => zoomIn()}
                    className="cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                  >
                    <Plus size={40} />
                  </button>
                </TooltipWrapper>

                <TooltipWrapper text={t('NavigationAndCharts.TT.ZoomOut')}>
                  <button
                    type="button"
                    onClick={() => zoomOut()}
                    className="cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                  >
                    <Dash size={40} />
                  </button>
                </TooltipWrapper>
              </div>
              <div className="flex flex-col overflow-hidden rounded-md">
                <div
                  className="cursor-pointer rounded-md bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                  onClick={() => {
                    dispatch(editTabProperty({ tab: currentTab, isFullScreen: !isFullScreen }));
                    if (chartRef.current && ref.current) {
                      setTransform(0, 0, 1);
                      dispatch(
                        editTabProperty({
                          tab: currentTab,
                          chartPosition: { ...chartPosition, positionX: 0, positionY: 0, scale: 1 },
                        }),
                      );
                    }
                  }}
                >
                  {isFullScreen ? <FullscreenExit size={40} /> : <ArrowsFullscreen size={40} />}
                </div>

                {provider === 'NAVIGRAPH' && (
                  <div
                    className="mt-3 cursor-pointer rounded-md bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
                    onClick={() => dispatch(setUsingDarkTheme(!usingDarkTheme))}
                  >
                    {!usingDarkTheme ? <MoonFill size={40} /> : <SunFill size={40} />}
                  </div>
                )}
              </div>
            </div>

            <div
              className="grabbable no-scrollbar relative mx-auto flex h-full flex-row overflow-x-hidden overflow-y-scroll rounded-lg bg-theme-accent"
              ref={ref}
            >
              <TransformComponent wrapperStyle={{ height: ref.current?.clientHeight, width: ref.current?.clientWidth }}>
                {/* <DrawableCanvas */}
                {/*    className="absolute inset-0 z-10 transition duration-100" */}
                {/*    rotation={chartRotation} */}
                {/*    brushSize={brushSize} */}
                {/*    width={chartDimensions.width ?? 0} */}
                {/*    height={chartDimensions.height ?? 0} */}
                {/*    resolutionScalar={4} */}
                {/*    disabled={!drawMode} */}
                {/* /> */}

                <div
                  className="relative m-auto transition duration-100"
                  style={{ transform: `rotate(${chartRotation}deg)` }}
                >
                  {chartLinks && provider === 'NAVIGRAPH' && (
                    <p className="absolute left-0 top-0 -translate-y-full whitespace-nowrap font-bold text-theme-highlight transition duration-100">
                      This chart is linked to {navigraphAuth.user?.preferred_username ?? '<not logged in>'}
                    </p>
                  )}

                  {aircraftIconVisible && boundingBox && (
                    <svg
                      ref={planeRef}
                      width={boundingBox.planview.pixels.x2 - boundingBox.planview.pixels.x1}
                      height={Math.abs(boundingBox.planview.pixels.y1 - boundingBox.planview.pixels.y2)}
                      viewBox={`0 0 ${boundingBox.planview.pixels.x2 - boundingBox.planview.pixels.x1} ${Math.abs(boundingBox.planview.pixels.y1 - boundingBox.planview.pixels.y2)}`}
                      style={{ left: boundingBox.planview.pixels.x1, top: boundingBox.planview.pixels.y2 }}
                      className="absolute z-30"
                    >
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
                    {chartLightUrl && (
                      <img
                        className="absolute left-0 w-full select-none transition duration-100"
                        draggable={false}
                        src={chartLightUrl}
                        alt="chart"
                        ref={chartImgRef}
                      />
                    )}

                    {chartDarkUrl && (
                      <img
                        className={`absolute left-0 w-full select-none transition duration-100 ${usingDarkTheme && 'opacity-0'}`}
                        draggable={false}
                        src={chartDarkUrl}
                        alt="chart"
                        ref={chartImgRef}
                      />
                    )}
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
