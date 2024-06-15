import { Chart } from 'navigraph/charts';

export enum NavigraphSubscriptionStatus {
  None,
  Unlimited,
  Unknown,
}

export type ChartCategory = 'STAR' | 'APP' | 'TAXI' | 'SID' | 'REF';

export type NavigraphAirportCharts = Record<ChartCategory, Chart[]>;
