// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowReturnRight } from 'react-bootstrap-icons';

import { t } from '../../../Localization/translation';
import { MsfsChartSelector, OrganizedChart } from './MsfsChartSelector';
import {
  ChartProvider,
  editTabProperty,
  MsfsChartCategory,
  NavigationTab,
} from '../../../Store/features/navigationPage';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { ChartViewer } from '../../Navigation';
import { BuiltInChartProvider, ChartImageErrorCode } from '@microsoft/msfs-sdk';
import { getAirport } from '../../../Performance/Data/Runways';
import { MsfsChartUtils } from './MsfsChartUtils';
import { toast } from 'react-toastify';

export interface MsfsChartUIProps {
  msfsProvider: BuiltInChartProvider;
  tab: NavigationTab.FAA | NavigationTab.LIDO;
  provider: ChartProvider.FAA | ChartProvider.LIDO;
}

let airportOpId = 0;
let chartsOpId = 0;

export const MsfsChartUI = ({ msfsProvider, tab, provider }: MsfsChartUIProps) => {
  const dispatch = useAppDispatch();

  const [statusBarInfo, setStatusBarInfo] = useState('');

  const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);
  const [chartListDisagrees, setChartListDisagrees] = useState(false);

  const { availableCharts, isFullScreen, searchQuery, selectedTabType } = useAppSelector(
    (state) => state.navigationTab[tab],
  );

  const organizedCharts = useMemo(
    () =>
      ({
        SID: { name: 'SID', charts: availableCharts.SID, bundleRunways: true },
        STAR: { name: 'STAR', charts: availableCharts.STAR, bundleRunways: true },
        APPR: { name: 'APPR', charts: availableCharts.APPR, bundleRunways: true },
        ARPT: { name: 'ARPT', charts: availableCharts.ARPT },
      }) satisfies Record<MsfsChartCategory, OrganizedChart>,
    [availableCharts],
  );

  useEffect(() => {
    if (searchQuery.length === 4) {
      const icao = searchQuery.toUpperCase();
      updateAirport(icao);
      updateCharts(icao);
    } else {
      setStatusBarInfo('');
      dispatch(
        editTabProperty({
          tab,
          availableCharts: {
            SID: [],
            STAR: [],
            APPR: [],
            ARPT: [],
          },
        }),
      );
    }
  }, [searchQuery]);

  const updateAirport = async (airportIcao: string) => {
    setIcaoAndNameDisagree(true);
    try {
      const opId = ++airportOpId;
      const airport = await getAirport(airportIcao);
      if (opId !== airportOpId) {
        // another async request started after us
        return;
      }
      setStatusBarInfo(Utils.Translate(airport.name) ?? airport.name);
    } catch (_e) {
      setStatusBarInfo(t('NavigationAndCharts.Navigraph.AirportDoesNotExist'));
    }
    setIcaoAndNameDisagree(false);
  };

  const updateCharts = async (airportIcao: string) => {
    dispatch(editTabProperty({ tab, searchQuery: airportIcao }));
    setChartListDisagrees(true);
    try {
      const opId = ++chartsOpId;
      const chartList = await MsfsChartUtils.getChartsForAirport(airportIcao, msfsProvider);
      if (opId !== chartsOpId) {
        // another async request started after us
        return;
      }
      dispatch(
        editTabProperty({
          tab,
          availableCharts: chartList,
        }),
      );
    } catch (e: unknown) {
      if (
        e === ChartImageErrorCode.Timeout ||
        e === ChartImageErrorCode.Unknown ||
        e === ChartImageErrorCode.UnspecifiedNoRetry ||
        e === ChartImageErrorCode.UnspecifiedRetry
      ) {
        toast.error(t('NavigationAndCharts.FailedToGetCharts'));
      }

      dispatch(
        editTabProperty({
          tab,
          availableCharts: {
            SID: [],
            STAR: [],
            APPR: [],
            ARPT: [],
          },
        }),
      );
    }
    setChartListDisagrees(false);
  };

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
                onChange={updateCharts}
              />

              {isSimbriefDataLoaded() && (
                <SelectGroup className="shrink-0 rounded-l-none">
                  <SelectItem
                    className="uppercase"
                    selected={searchQuery === departingAirport}
                    onSelect={() => updateCharts(departingAirport)}
                  >
                    {t('NavigationAndCharts.From')}
                  </SelectItem>
                  <SelectItem
                    className="uppercase"
                    selected={searchQuery === arrivingAirport}
                    onSelect={() => updateCharts(arrivingAirport)}
                  >
                    {t('NavigationAndCharts.To')}
                  </SelectItem>
                  {!!altIcao && (
                    <SelectItem
                      className="uppercase"
                      selected={searchQuery === altIcao}
                      onSelect={() => updateCharts(altIcao)}
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
                {(['SID', 'STAR', 'APPR', 'ARPT'] satisfies MsfsChartCategory[]).map((tabType) => (
                  <SelectItem
                    selected={selectedTabType === tabType}
                    onSelect={() => dispatch(editTabProperty({ tab, selectedTabType: tabType }))}
                    key={tabType}
                    className="flex w-full justify-center"
                  >
                    {tabType}
                  </SelectItem>
                ))}
              </SelectGroup>
              <ScrollableContainer className="mt-5" height={42.75}>
                <MsfsChartSelector
                  selectedTab={organizedCharts[selectedTabType]}
                  provider={provider}
                  tab={tab}
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
