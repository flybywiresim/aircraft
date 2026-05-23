// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { BuiltInChartProvider, ChartsClient, FaaChartType, ICAO, LidoChartType } from '@microsoft/msfs-sdk';
import { MsfsChartCategory } from '../../../Store/features/navigationPage';

export interface MsfsChartPage {
  lightUrl: string;
  darkUrl?: string;
}

export type MsfsProviders = BuiltInChartProvider.Faa | BuiltInChartProvider.Lido;

export interface MsfsChartData<T extends BuiltInChartProvider.Faa | BuiltInChartProvider.Lido> {
  guid: string;
  name: string;
  type: T extends BuiltInChartProvider.Faa ? FaaChartType : T extends BuiltInChartProvider.Lido ? LidoChartType : never;
  runways: string[];
}

const faaCategoryMap: Record<string, MsfsChartCategory> = {
  [FaaChartType.Apd]: 'ARPT',
  [FaaChartType.Dau]: 'ARPT',
  [FaaChartType.Dp]: 'SID',
  [FaaChartType.Hot]: 'ARPT',
  [FaaChartType.Iap]: 'APPR',
  [FaaChartType.Lah]: 'ARPT',
  [FaaChartType.Min]: 'ARPT',
  [FaaChartType.Odp]: 'SID',
  [FaaChartType.Star]: 'STAR',
  [FaaChartType.Unknown]: 'ARPT',
};

const lidoCategoryMap: Record<string, MsfsChartCategory> = {
  [LidoChartType.Afc]: 'ARPT',
  [LidoChartType.Agc]: 'ARPT',
  [LidoChartType.Aoi]: 'ARPT',
  [LidoChartType.Apc]: 'ARPT',
  [LidoChartType.Iac]: 'APPR',
  [LidoChartType.Lvc]: 'ARPT',
  [LidoChartType.Mrc]: 'ARPT',
  [LidoChartType.ObstDep]: 'SID',
  [LidoChartType.Sid]: 'SID',
  [LidoChartType.SidInitialClimb]: 'SID',
  [LidoChartType.SidPt]: 'SID',
  [LidoChartType.Star]: 'STAR',
  [LidoChartType.Unknown]: 'ARPT',
  [LidoChartType.Vac]: 'APPR',
};

export class MsfsChartUtils {
  public static async getChartsForAirport<T extends MsfsProviders>(
    airportIcao: string,
    msfsProvider: T,
  ): Promise<Record<MsfsChartCategory, MsfsChartData<T>[]>> {
    const icao = ICAO.value('A', '', '', airportIcao);

    const chartIndex = await ChartsClient.getIndexForAirport(icao, msfsProvider);

    const charts: Record<MsfsChartCategory, MsfsChartData<T>[]> = {
      SID: [],
      STAR: [],
      APPR: [],
      ARPT: [],
    };

    const categoryMap = msfsProvider === BuiltInChartProvider.Faa ? faaCategoryMap : lidoCategoryMap;

    for (const chartCategory of chartIndex.charts) {
      for (const chart of chartCategory.charts) {
        let category = categoryMap[chart.type];
        if (!category) {
          console.warn('[MsfsChartUtils::getChartsForAirport] Encountered an unknown chart type', chart.type);
          category = 'ARPT';
        }

        charts[categoryMap[chart.type]].push({
          guid: chart.guid,
          name: chart.name,
          type: chart.type as MsfsChartData<T>['type'],
          runways: chart.runways.map((r) => `RW${r.number.padStart(2, '0')}${r.designator}`),
        });
      }
    }

    charts['SID'].sort(MsfsChartUtils.sortChart);
    charts['STAR'].sort(MsfsChartUtils.sortChart);
    charts['APPR'].sort(MsfsChartUtils.sortChart);
    charts['ARPT'].sort(MsfsChartUtils.sortChart);

    return charts;
  }

  public static async getChartPages(guid: string): Promise<MsfsChartPage[]> {
    const chartPages = await ChartsClient.getChartPages(guid);

    return chartPages.pages.map((p) => {
      const lightUrl = p.urls.find((u) => u.name === 'light_png')?.url;
      const darkUrl = p.urls.find((u) => u.name === 'dark_png')?.url;
      return {
        lightUrl: (lightUrl ?? darkUrl)!,
        darkUrl,
      } satisfies MsfsChartPage;
    });
  }

  private static chartOrder: Record<FaaChartType | LidoChartType, number> = {
    [FaaChartType.Apd]: 0,
    [FaaChartType.Dau]: 4,
    [FaaChartType.Dp]: 0,
    [FaaChartType.Hot]: 1,
    [FaaChartType.Iap]: 0,
    [FaaChartType.Lah]: 2,
    [FaaChartType.Min]: 3,
    [FaaChartType.Odp]: 1,
    [FaaChartType.Star]: 0,
    [FaaChartType.Unknown]: 9999,
    [LidoChartType.Afc]: 0,
    [LidoChartType.Agc]: 1,
    [LidoChartType.Aoi]: 2,
    [LidoChartType.Apc]: 3,
    [LidoChartType.Iac]: 0,
    [LidoChartType.Lvc]: 5,
    [LidoChartType.Mrc]: 4,
    [LidoChartType.ObstDep]: 3,
    [LidoChartType.Sid]: 0,
    [LidoChartType.SidInitialClimb]: 1,
    [LidoChartType.SidPt]: 2,
    [LidoChartType.Vac]: 1,
  };

  private static isLidoSidChart = (a: MsfsChartData<BuiltInChartProvider>): boolean => {
    return a.type === LidoChartType.Sid || a.type === LidoChartType.SidInitialClimb || a.type === LidoChartType.SidPt;
  };

  private static sortChart = (
    a: MsfsChartData<BuiltInChartProvider>,
    b: MsfsChartData<BuiltInChartProvider>,
  ): number => {
    // group SID/SIDPT
    if (MsfsChartUtils.isLidoSidChart(a) && MsfsChartUtils.isLidoSidChart(b) && a.name !== b.name) {
      return a.name.localeCompare(b.name);
    }

    const order = MsfsChartUtils.chartOrder[a.type] - MsfsChartUtils.chartOrder[b.type];
    if (order !== 0) {
      return order;
    }

    return a.name.localeCompare(b.name);
  };
}
