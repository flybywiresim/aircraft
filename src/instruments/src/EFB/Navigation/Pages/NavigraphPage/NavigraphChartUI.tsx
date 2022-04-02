import React, { useEffect, useState } from 'react';
import { ArrowReturnRight } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { NavigraphChartSelector, OrganizedChart } from './NavigraphChartSelector';
import { NavigationTab, editTabProperty } from '../../../Store/features/navigationPage';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { useNavigraph, emptyNavigraphCharts, NavigraphAirportCharts } from '../../../ChartsApi/Navigraph';
import { ChartViewer } from '../../Navigation';

export const NavigraphChartUI = () => {
    const dispatch = useAppDispatch();

    const navigraph = useNavigraph();

    const [statusBarInfo, setStatusBarInfo] = useState('');

    const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);
    const [chartListDisagrees, setChartListDisagrees] = useState(false);

    const [charts, setCharts] = useState<NavigraphAirportCharts>({
        arrival: [],
        approach: [],
        airport: [],
        departure: [],
        reference: [],
    });

    const { t } = useTranslation();

    const [organizedCharts, setOrganizedCharts] = useState<OrganizedChart[]>([
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
            return t('NavigationAndCharts.Navigraph.NoAirportSelected');
        }

        if (loading) {
            return t('NavigationAndCharts.Navigraph.PleaseWait');
        }

        return statusBarInfo;
    };

    const { altIcao, departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const simbriefDataLoaded = isSimbriefDataLoaded();

    return (
        <div className="flex overflow-x-hidden flex-row w-full rounded-lg h-content-section-reduced">
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

                            {isSimbriefDataLoaded() && (
                                <SelectGroup className="flex-shrink-0 rounded-l-none">
                                    <SelectItem
                                        className="uppercase"
                                        selected={searchQuery === departingAirport}
                                        onSelect={() => handleIcaoChange(departingAirport)}
                                    >
                                        {t('NavigationAndCharts.From')}
                                    </SelectItem>
                                    <SelectItem
                                        className="uppercase"
                                        selected={searchQuery === arrivingAirport}
                                        onSelect={() => handleIcaoChange(arrivingAirport)}
                                    >
                                        {t('NavigationAndCharts.To')}
                                    </SelectItem>
                                    {!!altIcao && (
                                        <SelectItem
                                            className="uppercase"
                                            selected={searchQuery === altIcao}
                                            onSelect={() => handleIcaoChange(altIcao)}
                                        >
                                            {t('NavigationAndCharts.Altn')}
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

                <ChartViewer />
            </>
        </div>
    );
};
