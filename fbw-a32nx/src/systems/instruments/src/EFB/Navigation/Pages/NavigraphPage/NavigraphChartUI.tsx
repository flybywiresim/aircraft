// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { ArrowReturnRight } from 'react-bootstrap-icons';
import { emptyNavigraphCharts, NavigraphAirportCharts } from '@flybywiresim/fbw-sdk';
import { useNavigraph } from '../../../Apis/Navigraph/Navigraph';
import { t } from '../../../translation';
import { NavigraphChartSelector, OrganizedChart } from './NavigraphChartSelector';
import { NavigationTab, editTabProperty } from '../../../Store/features/navigationPage';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
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
        setStatusBarInfo(airportInfo?.name || t('NavigationAndCharts.Navigraph.AirportDoesNotExist'));
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
        if (chartName && (chartName.light !== '' || chartName.dark !== '')) {
            const fetchCharts = async () => {
                const light = await navigraph.chartCall(searchQuery, chartName.light);
                const dark = await navigraph.chartCall(searchQuery, chartName.dark);
                dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, chartLinks: { light, dark } }));
            };
            fetchCharts();
        }
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
                                        onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, selectedTabIndex: index }))}
                                        key={organizedChart.name}
                                        className="flex w-full justify-center"
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
