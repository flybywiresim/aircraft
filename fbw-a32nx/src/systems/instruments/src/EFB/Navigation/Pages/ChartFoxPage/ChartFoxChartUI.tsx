// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { ArrowReturnRight } from 'react-bootstrap-icons';
import { emptyChartFoxCharts, ChartFoxAirportCharts, useChartFox } from '../../../Apis/ChartFox/ChartFox';

import { t } from '../../../translation';
import { ChartFoxChartSelector, OrganizedChart } from './ChartFoxChartSelector';
import { NavigationTab, editTabProperty } from '../../../Store/features/navigationPage';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { ChartViewer } from '../../Navigation';

export const ChartFoxChartUI = () => {
    const dispatch = useAppDispatch();

    const chartFox = useChartFox();

    const [statusBarInfo, setStatusBarInfo] = useState('');

    const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);
    const [chartListDisagrees, setChartListDisagrees] = useState(false);

    const [charts, setCharts] = useState<ChartFoxAirportCharts>({
        arrival: [],
        approach: [],
        airport: [],
        departure: [],
        reference: [],
    });

    const [organizedCharts, setOrganizedCharts] = useState<OrganizedChart[]>([
        { name: 'STAR', charts: charts.arrival },
        { name: 'APP', charts: charts.approach, bundleRunways: true },
        { name: 'TAXI', charts: charts.airport },
        { name: 'SID', charts: charts.departure },
        { name: 'REF', charts: charts.reference },
    ]);

    const { isFullScreen, searchQuery, chartId, selectedTabIndex } = useAppSelector((state) => state.navigationTab[NavigationTab.CHARTFOX]);

    const assignAirportInfo = async () => {
        setIcaoAndNameDisagree(true);
        const airportInfo = await chartFox.getAirportInfo(searchQuery);
        setStatusBarInfo(airportInfo?.name || t('NavigationAndCharts.ChartFox.AirportDoesNotExist'));
        setIcaoAndNameDisagree(false);
    };

    useEffect(() => {
        if (searchQuery.length === 4) {
            assignAirportInfo();
        } else {
            setStatusBarInfo('');
            setCharts(emptyChartFoxCharts);
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
        if (chartId) {
            const fetchCharts = async () => {
                const url = await chartFox.getChartUrl(chartId);
                dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, chartLinks: { light: url, dark: url } }));
            };
            fetchCharts();
        }
    }, [chartId]);

    const handleIcaoChange = async (value: string) => {
        if (value.length !== 4) return;
        const newValue = value.toUpperCase();
        dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, searchQuery: newValue }));
        setChartListDisagrees(true);
        const chartList = await chartFox.getChartList(newValue);
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
            return t('NavigationAndCharts.ChartFox.NoAirportSelected');
        }
        if (loading) {
            return t('NavigationAndCharts.PleaseWait');
        }
        return statusBarInfo;
    };

    const { altIcao, departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const simbriefDataLoaded = isSimbriefDataLoaded();

    return (
        <div className="h-content-section-reduced flex w-full flex-row overflow-x-hidden rounded-lg">
            <>
                {!isFullScreen && (
                    <div className="shrink-0" style={{ width: '450px' }}>
                        <div className="flex flex-row items-center justify-center">
                            <SimpleInput
                                placeholder="ICAO"
                                value={searchQuery}
                                maxLength={4}
                                className={`w-full shrink uppercase ${simbriefDataLoaded && 'rounded-r-none'}`}
                                onChange={handleIcaoChange}
                            />

                            {isSimbriefDataLoaded() && (
                                <SelectGroup className="shrink-0 rounded-l-none">
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

                        <div className="flex h-11 w-full flex-row items-center">
                            <ArrowReturnRight size={30} />
                            <div className="block w-full overflow-hidden whitespace-nowrap px-4" style={{ textOverflow: 'ellipsis' }}>
                                {getStatusBarText()}
                            </div>
                        </div>

                        <div className="mt-6">
                            <SelectGroup>
                                {organizedCharts.map((organizedChart, index) => (
                                    <SelectItem
                                        selected={index === selectedTabIndex}
                                        onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, selectedTabIndex: index }))}
                                        key={organizedChart.name}
                                        className="flex w-full justify-center"
                                    >
                                        {organizedChart.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <ScrollableContainer className="mt-5" height={42.75}>
                                <ChartFoxChartSelector
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
