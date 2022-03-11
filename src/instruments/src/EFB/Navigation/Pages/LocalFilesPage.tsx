/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ArrowReturnRight, CloudArrowDown, Pin, PinFill } from 'react-bootstrap-icons';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
    addPinnedChart,
    ChartProvider,
    editPinnedChart,
    editTabProperty,
    isChartPinned,
    NavigationTab,
    removedPinnedChart,
    setBoundingBox,
    setProvider,
} from '../../Store/features/navigationPage';
import { isSimbriefDataLoaded } from '../../Store/features/simBrief';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { ChartComponent, navigationTabs } from '../Navigation';

type LocalFileChart = {
    fileName: string;
    type: 'IMAGE' | 'PDF';
};

interface LocalFileChartSelectorProps {
    selectedTab: LocalFileOrganizedCharts;
    loading?: boolean;
}

type LocalFileOrganizedCharts = {
    name: string,
    charts: LocalFileChart[],
}

interface LocalFileCharts {
    images: LocalFileChart[];
    pdfs: LocalFileChart[];
}

export const getPdfUrl = async (fileName: string, pageNumber: number): Promise<string> => {
    try {
        const resp = await fetch(`http://localhost:8380/api/v1/utility/pdf?filename=${fileName}&pagenumber=${pageNumber}`);

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

    const { chartId, selectedTabIndex } = useAppSelector((state) => state.navigationTab[NavigationTab.LOCAL_FILES]);
    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);

    if (loading) {
        return (
            <div
                className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent"
                style={{ height: '42.75rem' }}
            >
                <CloudArrowDown className="animate-bounce" size={40} />
            </div>
        );
    }

    if (!selectedTab.charts.length) {
        return (
            <div
                className="flex justify-center items-center h-full rounded-md border-2 border-theme-accent"
                style={{ height: '42.75rem' }}
            >
                <p>There are no charts to display.</p>
            </div>
        );
    }

    const getChartResourceUrl = async (chart: LocalFileChart) => {
        const resp = await fetch(chart.type === 'PDF'
            ? `http://localhost:8380/api/v1/utility/pdf?filename=${chart.fileName}&pagenumber=1`
            : `http://localhost:8380/api/v1/utility/image?filename=${chart.fileName}`);

        if (!resp.ok) {
            return Promise.reject();
        }

        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    };

    const getPagesViewable = async (chart: LocalFileChart): Promise<number> => {
        if (chart.type === 'PDF') {
            const pageNumResp = await fetch(`http://localhost:8380/api/v1/utility/pdf/numpages?filename=${chart.fileName}`);
            return pageNumResp.json();
        }

        return 1;
    };

    const handleChartClick = async (chart: LocalFileChart) => {
        try {
            const pagesViewable = await getPagesViewable(chart);
            dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, pagesViewable }));

            const url = await getChartResourceUrl(chart);

            dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartDimensions: { width: undefined, height: undefined } }));
            dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartName: { light: url, dark: url } }));
            dispatch(setBoundingBox(undefined));
        } catch (_) {
            if (chart.type === 'PDF') {
                toast.error('Failed to retrieve requested PDF Document.');
            } else {
                toast.error('Failed to retrieve requested image.');
            }

            return;
        }
        dispatch(setProvider(ChartProvider.LOCAL_FILES));

        dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, currentPage: 1 }));
        dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartId: chart.fileName }));
    };

    return (
        <div className="space-y-4">
            {selectedTab.charts.map((chart) => (
                <div
                    className="flex overflow-hidden flex-row w-full rounded-md bg-theme-accent"
                    onClick={() => handleChartClick(chart)}
                    key={chart.fileName}
                >
                    <div className="flex flex-row items-center">
                        <div className={`w-2 h-full transition flex-shrink-0 duration-100 ${chart.fileName === chartId
                            ? 'bg-theme-highlight'
                            : 'bg-theme-secondary'}`}
                        />
                        <div
                            className="flex items-center px-2 h-full transition duration-100 hover:text-theme-body hover:bg-theme-highlight"
                            onClick={(event) => {
                                event.stopPropagation();

                                if (isChartPinned(chart.fileName)) {
                                    dispatch(removedPinnedChart({ chartId: chart.fileName }));
                                } else {
                                    /**
                                     * Pinning the chart with temporary values for chartName and pagesViewable
                                     * and editing them later to give a snappier experience as these values take time to be resolved.
                                     */
                                    dispatch(addPinnedChart({
                                        chartId: chart.fileName,
                                        chartName: { light: '', dark: '' },
                                        title: chart.fileName,
                                        subTitle: '',
                                        tabIndex: selectedTabIndex,
                                        timeAccessed: 0,
                                        tag: chart.type,
                                        provider: ChartProvider.LOCAL_FILES,
                                        pagesViewable: 1,
                                        pageIndex: navigationTabs.findIndex((tab) => tab.associatedTab === NavigationTab.LOCAL_FILES),
                                    }));

                                    Promise.all([getChartResourceUrl(chart), getPagesViewable(chart)]).then(([url, numPages]) => {
                                        dispatch(editPinnedChart({
                                            chartId: chart.fileName,
                                            chartName: { light: url, dark: url },
                                            pagesViewable: numPages,
                                        }));
                                    }).catch(() => {
                                        dispatch(removedPinnedChart({ chartId: chart.fileName }));
                                        toast.error('Unable to generate necessary resource to pin this item.');
                                    });
                                }
                            }}
                        >
                            {
                                pinnedCharts.some((pinnedChart) => pinnedChart.chartId === chart.fileName)
                                    ? <PinFill size={40} />
                                    : <Pin size={40} />
                            }
                        </div>
                    </div>
                    <div className="flex flex-col m-2">
                        <span>{chart.fileName}</span>
                        <span
                            className="px-2 mr-auto text-sm rounded-sm text-theme-text bg-theme-secondary"
                        >
                            {chart.type}
                        </span>
                    </div>
                </div>
            ))}
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

    const { searchQuery, isFullScreen, chartName, selectedTabIndex } = useAppSelector((state) => state.navigationTab[NavigationTab.LOCAL_FILES]);

    const updateSearchStatus = async () => {
        setIcaoAndNameDisagree(true);

        const searchableCharts: string[] = [];

        if (selectedTabIndex === 0 || selectedTabIndex === 2) {
            searchableCharts.push(...charts.images.map((image) => image.fileName));
        }

        if (selectedTabIndex === 1 || selectedTabIndex === 2) {
            searchableCharts.push(...charts.pdfs.map((pdf) => pdf.fileName));
        }

        const numItemsFound = searchableCharts.filter((chartName) => chartName.toUpperCase().includes(searchQuery)).length;

        setStatusBarInfo(`${numItemsFound} ${numItemsFound === 1 ? 'Item' : 'Items'} Found`);

        setIcaoAndNameDisagree(false);
    };

    const handleIcaoChange = (value: string) => {
        const newValue = value.toUpperCase();

        dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, searchQuery: newValue }));

        getLocalFileChartList(newValue).then((r) => setCharts(r));
    };

    useEffect(() => {
        handleIcaoChange(searchQuery);
    }, [selectedTabIndex]);

    useEffect(() => {
        updateSearchStatus();
    }, [charts]);

    useEffect(() => {
        setOrganizedCharts([
            { name: 'IMAGE', charts: charts.images },
            { name: 'PDF', charts: charts.pdfs },
            { name: 'BOTH', charts: [...charts.pdfs, ...charts.images] },
        ]);
    }, [charts]);

    useEffect(() => {
        dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartLinks: { light: chartName.light, dark: chartName.dark } }));
    }, [chartName]);

    const getLocalFileChartList = async (searchQuery: string): Promise<LocalFileCharts> => {
        const pdfs: LocalFileChart[] = [];
        const images: LocalFileChart[] = [];

        try {
            // IMAGE or BOTH
            if (selectedTabIndex === 0 || selectedTabIndex === 2) {
                const resp = await fetch('http://localhost:8380/api/v1/utility/image/list');

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
            if (selectedTabIndex === 1 || selectedTabIndex === 2) {
                const resp = await fetch('http://localhost:8380/api/v1/utility/pdf/list');
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

    const loading = icaoAndNameDisagree;

    const getStatusBarText = () => {
        if (!searchQuery.length) {
            return 'Showing All Items';
        }

        if (loading) {
            return 'Please Wait';
        }

        return statusBarInfo;
    };

    const { altIcao, departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const simbriefDataLoaded = isSimbriefDataLoaded();

    return (
        <div className="flex overflow-x-hidden flex-row w-full rounded-lg h-content-section-reduced">
            <>
                {!isFullScreen && (
                    <div className="overflow-hidden flex-shrink-0" style={{ width: '450px' }}>
                        <div className="flex flex-row justify-center items-center">
                            <SimpleInput
                                placeholder="File Name"
                                value={searchQuery}
                                className={`w-full flex-shrink uppercase ${simbriefDataLoaded && 'rounded-r-none'}`}
                                onChange={handleIcaoChange}
                            />
                            {simbriefDataLoaded && (
                                <SelectGroup className="flex-shrink-0 rounded-l-none">
                                    <SelectItem
                                        selected={searchQuery === departingAirport}
                                        onSelect={() => handleIcaoChange(departingAirport)}
                                    >
                                        FROM
                                    </SelectItem>
                                    <SelectItem
                                        selected={searchQuery === arrivingAirport}
                                        onSelect={() => handleIcaoChange(arrivingAirport)}
                                    >
                                        TO
                                    </SelectItem>
                                    {!!altIcao && (
                                        <SelectItem
                                            selected={searchQuery === altIcao}
                                            onSelect={() => handleIcaoChange(altIcao)}
                                        >
                                            ALTN
                                        </SelectItem>
                                    )}
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
                                        selected={index === selectedTabIndex}
                                        onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, selectedTabIndex: index }))}
                                        key={organizedChart.name}
                                        className="flex justify-center w-full"
                                    >
                                        {organizedChart.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <ScrollableContainer className="mt-5" height={42.75}>
                                <LocalFileChartSelector
                                    selectedTab={organizedCharts[selectedTabIndex]}
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

enum ConnectionState {
    ATTEMPTING,
    FAILED,
    ESTABLISHED,
}

export const LocalFileRoot = () => {
    const [connectionState, setConnectionState] = useState(ConnectionState.ATTEMPTING);

    const setConnectedState = async () => {
        try {
            const healthRes = await fetch('http://localhost:8380/health');
            const healthJson = await healthRes.json();

            if (healthJson.info.api.status === 'up') {
                setConnectionState(ConnectionState.ESTABLISHED);
            } else {
                setConnectionState(ConnectionState.FAILED);
            }
        } catch (_) {
            setConnectionState(ConnectionState.FAILED);
        }
    };

    const handleConnectionRetry = () => {
        setConnectionState(ConnectionState.ATTEMPTING);

        setConnectedState();
    };

    useEffect(() => {
        setConnectedState();
    }, []);

    switch (connectionState) {
    case ConnectionState.ATTEMPTING:
        return (
            <div className="flex flex-col justify-center items-center space-y-8 rounded-lg border-2 border-theme-accent h-content-section-reduced">
                <h1>Establishing Connection</h1>
                <CloudArrowDown size={40} className="animate-bounce" />
            </div>
        );
    case ConnectionState.ESTABLISHED:
        return <LocalFileChartUI />;
    case ConnectionState.FAILED:
        return (
            <div className="flex flex-col justify-center items-center space-y-4 rounded-lg border-2 border-theme-accent h-content-section-reduced">
                <h1>Failed to Establish Connection.</h1>
                <button
                    type="button"
                    className="flex justify-center items-center py-2 px-8 space-x-4 rounded-lg border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                    onClick={handleConnectionRetry}
                >
                    Retry
                </button>
            </div>
        );
    default: return <></>;
    }
};
