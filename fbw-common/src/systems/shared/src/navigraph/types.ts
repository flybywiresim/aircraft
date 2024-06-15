import { Chart } from 'navigraph/charts';

export enum NavigraphSubscriptionStatus {
  None,
  Unlimited,
  Unknown,
}

export type ChartCategory = 'STAR' | 'APP' | 'TAXI' | 'SID' | 'REF';

export type LocalChartCategory = 'IMAGE' | 'PDF' | 'BOTH';

export type NavigraphAirportCharts = Record<ChartCategory, Chart[]>;
