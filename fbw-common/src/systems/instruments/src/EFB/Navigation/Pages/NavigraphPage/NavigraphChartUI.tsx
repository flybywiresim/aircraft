// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowReturnRight } from 'react-bootstrap-icons';

import { t } from '../../../Localization/translation';
import { NavigraphChartSelector, OrganizedChart } from './NavigraphChartSelector';
import { editTabProperty, NavigationTab } from '../../../Store/features/navigationPage';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { ChartViewer } from '../../Navigation';
import { navigraphCharts } from '../../../../navigraph';
import { ChartCategory } from '@flybywiresim/fbw-sdk';

export const NavigraphChartUI = () => {
  const dispatch = useAppDispatch();

  const [statusBarInfo, setStatusBarInfo] = useState('');

  const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);
  const [chartListDisagrees, setChartListDisagrees] = useState(false);

  const { availableCharts, isFullScreen, searchQuery, selectedTabType } = useAppSelector(
    (state) => state.navigationTab[NavigationTab.NAVIGRAPH],
  );

  const organizedCharts = useMemo(
    () =>
      ({
        STAR: { name: 'STAR', charts: availableCharts.STAR },
        APP: { name: 'APP', charts: availableCharts.APP, bundleRunways: true },
        TAXI: { name: 'TAXI', charts: availableCharts.TAXI },
        SID: { name: 'SID', charts: availableCharts.SID },
        REF: { name: 'REF', charts: availableCharts.REF },
      }) satisfies Record<ChartCategory, OrganizedChart>,
    [availableCharts],
  );

  const assignAirportInfo = async () => {
    setIcaoAndNameDisagree(true);
    const airportInfo = await navigraphCharts.getAirportInfo({ icao: searchQuery });
    setStatusBarInfo(airportInfo?.name || t('NavigationAndCharts.Navigraph.AirportDoesNotExist'));
    setIcaoAndNameDisagree(false);
  };

  useEffect(() => {
    if (searchQuery.length === 4) {
      assignAirportInfo();
    } else {
      setStatusBarInfo('');
      dispatch(
        editTabProperty({
          tab: NavigationTab.NAVIGRAPH,
          availableCharts: {
            STAR: [],
            APP: [],
            TAXI: [],
            SID: [],
            REF: [],
          },
        }),
      );
    }
  }, [searchQuery]);

  const handleIcaoChange = async (value: string) => {
    if (value.length !== 4) return;
    const newValue = value.toUpperCase();
    dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, searchQuery: newValue }));
    setChartListDisagrees(true);
    const chartList = await navigraphCharts.getChartsIndex({ icao: newValue });
    if (chartList) {
      dispatch(
        editTabProperty({
          tab: NavigationTab.NAVIGRAPH,
          availableCharts: {
            STAR: chartList.filter((it) => it.category === 'ARR'),
            APP: chartList.filter((it) => it.category === 'APP'),
            TAXI: chartList.filter((it) => it.category === 'APT'),
            SID: chartList.filter((it) => it.category === 'DEP'),
            REF: chartList.filter((it) => it.category === 'REF'),
          },
        }),
      );
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
    <div className="flex h-content-section-reduced w-full flex-row overflow-x-hidden rounded-lg">
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
                {(['STAR', 'APP', 'TAXI', 'SID', 'REF'] satisfies ChartCategory[]).map((tabType) => (
                  <SelectItem
                    selected={selectedTabType === tabType}
                    onSelect={() =>
                      dispatch(editTabProperty({ tab: NavigationTab.NAVIGRAPH, selectedTabType: tabType }))
                    }
                    key={tabType}
                    className="flex w-full justify-center"
                  >
                    {tabType}
                  </SelectItem>
                ))}
              </SelectGroup>
              <ScrollableContainer className="mt-5" height={42.75}>
                <NavigraphChartSelector selectedTab={organizedCharts[selectedTabType]} loading={loading} />
              </ScrollableContainer>
            </div>
          </div>
        )}

        <ChartViewer />
      </>
    </div>
  );
};
