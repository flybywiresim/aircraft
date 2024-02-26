// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { ArrowReturnRight } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { Viewer } from '@flybywiresim/fbw-sdk';
import { emptyChartFoxCharts, ChartFoxAirportCharts, useChartFox } from '../../../Apis/ChartFox/ChartFox';

import { t } from '../../../Localization/translation';
import { ChartFoxChartSelector, OrganizedChart } from './ChartFoxChartSelector';
import { ChartFileType, NavigationTab, editTabProperty } from '../../../Store/features/navigationPage';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { ChartViewer } from '../../Navigation';

export const getPdfImageUrl = async (url: string, pageNumber: number): Promise<string> => {
    const id = 'loading-file';
    try {
        toast.loading(t('NavigationAndCharts.LoadingPdf'), { toastId: id, pauseOnFocusLoss: false });
        const objectURL = await Viewer.getImageUrlFromPdfUrl(url, pageNumber);
        toast.update(id, { toastId: id, render: '', type: 'success', isLoading: false, pauseOnFocusLoss: false });
        toast.dismiss(id);
        return objectURL;
    } catch (err) {
        toast.dismiss(id);
        toast.error(t('NavigationAndCharts.LoadingPdfFailed'), { autoClose: 1000 });
        return Promise.reject();
    }
};

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
        { name: 'GEN', charts: charts.reference },
        { name: 'GND', charts: charts.airport },
        { name: 'SID', charts: charts.departure },
        { name: 'STAR', charts: charts.arrival },
        { name: 'APP', charts: charts.approach },
    ]);

    const { isFullScreen, searchQuery, chartId, selectedTabIndex, currentPage, pagesViewable } = useAppSelector((state) => state.navigationTab[NavigationTab.CHARTFOX]);

    useEffect(() => {
        setOrganizedCharts([
            { name: 'GEN', charts: charts.reference },
            { name: 'GND', charts: charts.airport, bundleRunways: charts.airport.some((chart) => chart.runways.length > 0) },
            { name: 'SID', charts: charts.departure, bundleRunways: charts.departure.some((chart) => chart.runways.length > 0) },
            { name: 'STAR', charts: charts.arrival, bundleRunways: charts.arrival.some((chart) => chart.runways.length > 0) },
            { name: 'APP', charts: charts.approach, bundleRunways: charts.approach.some((chart) => chart.runways.length > 0) },
        ]);
    }, [charts]);

    useEffect(() => {
        if (chartId) {
            const fetchCharts = async () => {
                const { sourceUrl, sourceUrlType } = await chartFox.getChart(chartId);
                let url = sourceUrl;
                let numPages = 1;
                if (sourceUrlType === ChartFileType.Pdf) {
                    url = await getPdfImageUrl(sourceUrl, pagesViewable > 1 ? currentPage : 1);
                    numPages = await Viewer.getPDFPageCountFromUrl(sourceUrl);
                }
                dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, pagesViewable: numPages }));
                // For PDFs, chartName will be the original PDF link. This will be needed for pagination later.
                dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, chartName: { light: sourceUrl, dark: sourceUrl, fileType: sourceUrlType } }));
                // For PDFs, chartLinks will be URIs to the converted image data for the current page.
                dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, chartLinks: { light: url, dark: url, fileType: sourceUrlType } }));
            };
            fetchCharts();
        }
    }, [chartId, currentPage]);

    const handleIcaoChange = async (value: string) => {
        if (value.length !== 4) {
            setStatusBarInfo('');
            setCharts(emptyChartFoxCharts);
            return;
        }
        const newValue = value.toUpperCase();
        dispatch(editTabProperty({ tab: NavigationTab.CHARTFOX, searchQuery: newValue }));

        setIcaoAndNameDisagree(true);
        setChartListDisagrees(true);
        const chartIndex = await chartFox.getChartIndex(newValue);
        setStatusBarInfo(chartIndex?.name || t('NavigationAndCharts.ChartFox.AirportDoesNotExist'));
        if (chartIndex?.groupedCharts) {
            setCharts(chartIndex.groupedCharts);
        }
        setIcaoAndNameDisagree(false);
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
