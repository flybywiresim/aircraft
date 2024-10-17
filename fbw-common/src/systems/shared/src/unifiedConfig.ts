/**
 * Contains the airframe.json file's information in a structured way.
 */
export enum AirframeType {
  A320_251N = 'A320-251N',
  A380_842 = 'A380-842',
}
export interface AirframeInfo {
  developer: string;
  name: string;
  variant: string;
  icao: string;
  engines: string;
  designLimits: AirframeDesignLimits;
  dimensions: AirframeDimensions;
}

export interface AirframeDesignLimits {
  weights: AirframeDesignLimitsWeights;
  endurance: AirframeDesignLimitsEndurance;
  performanceEnvelope: AirframePerformanceEnvelope;
}

export interface AirframeDesignLimitsWeights {
  maxGw: number;
  maxZfw: number;
  minZfw: number;
  maxGwCg: number;
  maxZfwCg: number;
  maxCargo: number;
  maxFuel: number;
}

export interface AirframeDesignLimitsEndurance {
  range: number;
  mmo: string;
}

export interface AirframePerformanceEnvelope {
  mlw: number[][];
  mzfw: number[][];
  mtow: number[][];
  flight: number[][];
}

export interface AirframeDimensions {
  aircraftWheelBase: number;
  aircraftLengthMeter: number;
}

/**
 * Contains the flypad-*.json files' information in a structured way.
 */
export interface FlypadInfo {
  payload: PayloadFlypadInfo;
}
export interface PayloadFlypadInfo {
  planeCanvas: PayloadPlaneCanvas;
  chartLimits: PayloadChartLimits;
  seatDisplay: PayloadSeatDisplay[];
}
export interface PayloadPlaneCanvas {
  width: number;
  height: number;
  canvasX: number;
  canvasY: number;
}

export interface PayloadSeatDisplay {
  len: number;
  wid: number;
  padX: number;
  padY: number;
  imageX: number;
  imageY: number;
}
export interface PayloadChartLimits {
  weight: ChartLimitsWeights;
  cg: ChartLimitsCG;
  labels: ChartLimitsLabels;
}

export interface ChartLimitsWeights {
  min: number;
  max: number;
  lines: number;
  scale: number;
  values: number[];
}

export interface ChartLimitsCG {
  angleRad: number;
  min: number;
  max: number;
  overlap: number;
  highlight: number;
  lines: number;
  scale: number;
  values: number[];
}

export interface ChartLimitsLabels {
  mtow: ChartLimitsLabelsValue;
  mlw: ChartLimitsLabelsValue;
  mzfw: ChartLimitsLabelsValue;
}

export interface ChartLimitsLabelsValue {
  x1: number;
  x2: number;
  y: number;
}

export enum SeatType {
  NarrowbodyEconomy = 0,
  NarrowbodyEconomyEmergency = 1,
  WidebodyEconomy = 2,
  WidebodyEconomyEmergency = 3,
  WidebodyBusinessFlatRight = 4,
  WidebodyBusinessFlatLeft = 5,
  WidebodySuiteRight = 6,
  WidebodySuiteLeft = 7,
  WidebodyPremiumEconomy = 8,
}

export interface CabinInfo {
  defaultPaxWeight: number;
  defaultBagWeight: number;
  paxDecks: number;
  decks: number;
  minPaxWeight: number;
  maxPaxWeight: number;
  minBagWeight: number;
  maxBagWeight: number;
  seatMap: PaxStationInfo[];
  cargoMap: CargoStationInfo[];
}

export interface PaxStationInfo {
  name: string;
  capacity: number;
  rows: RowInfo[];
  simVar: string;
  stationIndex: number;
  position: number;
  deck: number;
}

export interface CargoStationInfo {
  name: string;
  weight: number;
  simVar: string;
  stationIndex: number;
  progressBarWidth: number;
  position: number;
}

export interface RowInfo {
  x?: number;
  y?: number;
  xOffset?: number;
  yOffset?: number;
  seats: SeatInfo[];
}

export interface SeatInfo {
  type: SeatType;
  x?: number;
  y?: number;
  yOffset?: number;
}
