import React, { useEffect, useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { ArrowReturnRight, CloudArrowDown, Pin, PinFill, ShieldLock } from 'react-bootstrap-icons';
import useInterval from '@instruments/common/useInterval';
import { toast } from 'react-toastify';
import QRCode from 'qrcode.react';
import NavigraphClient, {
    emptyNavigraphCharts,
    NavigraphAirportCharts,
    NavigraphChart,
    useNavigraph,
} from '../../ChartsApi/Navigraph';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
    addPinnedChart,
    ChartProvider,
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
import { ChartFoxAirportCharts, ChartFoxChart } from '../../ChartsApi/ChartFox';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { ChartComponent, navigationTabs } from '../Navigation';

type Chart = NavigraphChart | ChartFoxChart;
type Charts = NavigraphAirportCharts | ChartFoxAirportCharts;

type OrganizedChartType = {
    name: string,
    charts: Chart[],
    bundleRunways?: boolean,
}

interface NavigraphChartSelectorProps {
    selectedTab: OrganizedChartType;
    loading?: boolean;
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

const NavigraphChartSelector = ({ selectedTab, loading }: NavigraphChartSelectorProps) => {
    const NO_RUNWAY_NAME = 'NONE';
    const [runwaySet, setRunwaySet] = useState<Set<string>>(new Set());
    const [organizedCharts, setOrganizedCharts] = useState<RunwayOrganizedChartType[]>([]);

    const dispatch = useAppDispatch();

    const { selectedNavigationTabIndex } = useAppSelector((state) => state.navigationTab);

    const { chartId, searchQuery } = useAppSelector((state) => state.navigationTab[NavigationTab.NAVIGRAPH]);

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
        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, pagesViewable: 1 }));

        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, currentPage: 1 }));

        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, chartId: chart.id }));

        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, chartDimensions: { width: undefined, height: undefined } }));
        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, chartName: { light: chart.fileDay, dark: chart.fileNight } }));

        dispatch(setBoundingBox(chart.boundingBox));

        dispatch(setProvider(ChartProvider.NAVIGRAPH));
    };

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
                                        className="flex flex-row bg-theme-accent"
                                        onClick={() => handleChartClick(chart as NavigraphChart)}
                                        key={(chart as NavigraphChart).id}
                                    >
                                        <div className="flex flex-row items-center">
                                            <div className={`w-2 h-full transition duration-100 ${(chart as NavigraphChart).id === chartId
                                                ? 'bg-theme-highlight'
                                                : 'bg-theme-secondary'}`}
                                            />
                                            <div
                                                className="flex items-center px-2 h-full hover:text-theme-body hover:bg-theme-highlight transition duration-100"
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (isChartPinned((chart as NavigraphChart).id)) {
                                                        dispatch(removedPinnedChart({ chartId: (chart as NavigraphChart).id }));
                                                    } else {
                                                        dispatch(addPinnedChart({
                                                            chartId: (chart as NavigraphChart).id,
                                                            chartName: { light: (chart as NavigraphChart).fileDay, dark: (chart as NavigraphChart).fileNight },
                                                            title: searchQuery,
                                                            subTitle: (chart as NavigraphChart).procedureIdentifier,
                                                            tabIndex: selectedNavigationTabIndex,
                                                            timeAccessed: 0,
                                                            tag: selectedTab.name,
                                                            provider: ChartProvider.NAVIGRAPH,
                                                            pagesViewable: 1,
                                                            boundingBox: (chart as NavigraphChart).boundingBox,
                                                            pageIndex: navigationTabs.findIndex((tab) => tab.associatedTab === NavigationTab.NAVIGRAPH),
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
                                className="flex overflow-hidden flex-row w-full bg-theme-accent rounded-md"
                                onClick={() => handleChartClick(chart as NavigraphChart)}
                                key={(chart as NavigraphChart).id}
                            >
                                <div className="flex flex-row items-center">
                                    <div className={`w-2 h-full transition duration-100 ${(chart as NavigraphChart).id === chartId
                                        ? 'bg-theme-highlight'
                                        : 'bg-theme-secondary'}`}
                                    />
                                    <div
                                        className="flex items-center px-2 h-full hover:text-theme-body hover:bg-theme-highlight transition duration-100"
                                        onClick={(event) => {
                                            event.stopPropagation();

                                            if (isChartPinned((chart as NavigraphChart).id)) {
                                                dispatch(removedPinnedChart({ chartId: (chart as NavigraphChart).id }));
                                            } else {
                                                dispatch(addPinnedChart({
                                                    chartId: (chart as NavigraphChart).id,
                                                    chartName: { light: (chart as NavigraphChart).fileDay, dark: (chart as NavigraphChart).fileNight },
                                                    title: searchQuery,
                                                    subTitle: (chart as NavigraphChart).procedureIdentifier,
                                                    tabIndex: selectedNavigationTabIndex,
                                                    timeAccessed: 0,
                                                    tag: selectedTab.name,
                                                    provider: ChartProvider.NAVIGRAPH,
                                                    pagesViewable: 1,
                                                    boundingBox: (chart as NavigraphChart).boundingBox,
                                                    pageIndex: navigationTabs.findIndex((tab) => tab.associatedTab === NavigationTab.NAVIGRAPH),
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

    const { isFullScreen, searchQuery, chartName, selectedTabIndex } = useAppSelector((state) => state.navigationTab[NavigationTab.NAVIGRAPH]);

    const assignAirportInfo = async () => {
        setIcaoAndNameDisagree(true);

        const airportInfo = await navigraph.getAirportInfo(searchQuery);
        setStatusBarInfo(airportInfo.name);

        setIcaoAndNameDisagree(false);
    };

    useEffect(() => {
        if (searchQuery.length === 4) {
            assignAirportInfo();
        } else {
            setStatusBarInfo('');
            setCharts(emptyNavigraphCharts);
        }
    }, [searchQuery]);

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
            const light = await navigraph.chartCall(searchQuery, chartName.light);

            const dark = await navigraph.chartCall(searchQuery, chartName.dark);

            dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, chartLinks: { light, dark } }));
        };

        fetchCharts();
    }, [chartName]);

    const handleIcaoChange = async (value: string) => {
        if (value.length !== 4) return;

        const newValue = value.toUpperCase();

        dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, searchQuery: newValue }));

        setChartListDisagrees(true);
        const chartList = await navigraph.getChartList(newValue);

        if (chartList) {
            setCharts(chartList);
        }
        setChartListDisagrees(false);
    };

    useEffect(() => {
        handleIcaoChange(searchQuery);
    }, []);

    const loading = (!statusBarInfo.length || icaoAndNameDisagree || chartListDisagrees) && searchQuery.length === 4;

    const getStatusBarText = () => {
        if (searchQuery.length !== 4) {
            return 'No Airport Selected';
        }

        if (loading) {
            return 'Please Wait';
        }

        return statusBarInfo;
    };

    const { altIcao, departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const simbriefDataLoaded = isSimbriefDataLoaded();

    return (
        <div className="flex overflow-x-hidden flex-row w-full h-content-section-reduced rounded-lg">
            <>
                {!isFullScreen && (
                    <div className="flex-shrink-0" style={{ width: '450px' }}>
                        <div className="flex flex-row justify-center items-center">
                            <SimpleInput
                                placeholder="ICAO"
                                value={searchQuery}
                                maxLength={4}
                                className={`w-full flex-shrink uppercase ${simbriefDataLoaded && 'rounded-r-none'}`}
                                onChange={handleIcaoChange}
                            />
                            {(isSimbriefDataLoaded()) && (
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
                                        onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, selectedTabIndex: index }))}
                                        key={organizedChart.name}
                                        className="flex justify-center w-full"
                                    >
                                        {organizedChart.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <ScrollableContainer className="mt-5" height={42.75}>
                                <NavigraphChartSelector
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

export const NavigraphNav = () => {
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
