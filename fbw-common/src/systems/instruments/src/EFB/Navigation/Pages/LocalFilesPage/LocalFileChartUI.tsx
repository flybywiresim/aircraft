// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { ArrowReturnRight } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { Viewer } from '@flybywiresim/fbw-sdk';
import { t } from '../../../Localization/translation';
import { LocalFileChart, LocalFileChartSelector, LocalFileOrganizedCharts } from './LocalFileChartSelector';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { NavigationTab, editTabProperty, LocalChartCategoryToIndex } from '../../../Store/features/navigationPage';
import { ChartViewer } from '../../Navigation';

interface LocalFileCharts {
  images: LocalFileChart[];
  pdfs: LocalFileChart[];
}

export const LocalFileChartUI = () => {
  const dispatch = useAppDispatch();
  const [statusBarInfo, setStatusBarInfo] = useState('');
  const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);
  const [charts, setCharts] = useState<LocalFileCharts>({
    images: [],
    pdfs: [],
  });
  const [organizedCharts, setOrganizedCharts] = useState<LocalFileOrganizedCharts[]>([
    { name: 'IMAGE', alias: t('NavigationAndCharts.LocalFiles.Image'), charts: charts.images },
    { name: 'PDF', alias: t('NavigationAndCharts.LocalFiles.Pdf'), charts: charts.pdfs },
    { name: 'BOTH', alias: t('NavigationAndCharts.LocalFiles.Both'), charts: [...charts.images, ...charts.pdfs] },
  ]);
  const { searchQuery, isFullScreen, chartName, selectedTabType } = useAppSelector(
    (state) => state.navigationTab[NavigationTab.LOCAL_FILES],
  );

  const updateSearchStatus = async () => {
    setIcaoAndNameDisagree(true);

    const searchableCharts: string[] = [];

    if (selectedTabType === 'IMAGE' || selectedTabType === 'BOTH') {
      searchableCharts.push(...charts.images.map((image) => image.fileName));
    }

    if (selectedTabType === 'PDF' || selectedTabType === 'BOTH') {
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
  }, [selectedTabType]);

  useEffect(() => {
    updateSearchStatus();
  }, [charts]);

  useEffect(() => {
    setOrganizedCharts([
      { name: 'IMAGE', alias: t('NavigationAndCharts.LocalFiles.Image'), charts: charts.images },
      { name: 'PDF', alias: t('NavigationAndCharts.LocalFiles.Pdf'), charts: charts.pdfs },
      { name: 'BOTH', alias: t('NavigationAndCharts.LocalFiles.Both'), charts: [...charts.pdfs, ...charts.images] },
    ]);
  }, [charts]);

  useEffect(() => {
    dispatch(
      editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartLinks: { light: chartName.light, dark: chartName.dark } }),
    );
  }, [chartName]);

  const getLocalFileChartList = async (searchQuery: string): Promise<LocalFileCharts> => {
    const pdfs: LocalFileChart[] = [];
    const images: LocalFileChart[] = [];

    try {
      // IMAGE or BOTH
      if (selectedTabType === 'IMAGE' || selectedTabType === 'BOTH') {
        const imageNames: string[] = await Viewer.getImageList();
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
      if (selectedTabType === 'PDF' || selectedTabType === 'BOTH') {
        const pdfNames: string[] = await Viewer.getPDFList();
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
      return t('NavigationAndCharts.ShowingAllItems');
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
          <div className="shrink-0 overflow-hidden" style={{ width: '450px' }}>
            <div className="flex flex-row items-center justify-center">
              <SimpleInput
                placeholder={t('NavigationAndCharts.LocalFiles.FileName')}
                value={searchQuery}
                className={`w-full shrink uppercase ${simbriefDataLoaded && 'rounded-r-none'}`}
                onChange={handleIcaoChange}
              />

              {simbriefDataLoaded && (
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
                {organizedCharts.map((organizedChart) => (
                  <SelectItem
                    selected={organizedChart.name === selectedTabType}
                    onSelect={() =>
                      dispatch(
                        editTabProperty({ tab: NavigationTab.LOCAL_FILES, selectedTabType: organizedChart.name }),
                      )
                    }
                    key={organizedChart.name}
                    className="flex w-full justify-center uppercase"
                  >
                    {organizedChart.alias}
                  </SelectItem>
                ))}
              </SelectGroup>

              <ScrollableContainer className="mt-5" height={42.75}>
                <LocalFileChartSelector
                  selectedTab={organizedCharts[LocalChartCategoryToIndex[selectedTabType]]}
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
