// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FeatureCollection, Geometry } from '@turf/turf';
import { LatLonInterface } from '@microsoft/msfs-sdk';

export enum AmdbProjection {
  Epsg4326 = 'EPSG:4326',
  ArpAzeq = 'NAVIGRAPH:ARP_AZEQ',
}

export enum FeatureType {
  RunwayElement = 0,
  RunwayIntersection = 1,
  RunwayThreshold = 2,
  RunwayMarking = 3,
  PaintedCenterline = 4,
  LandAndHoldShortOperationLocation = 5,
  ArrestingGearLocation = 6,
  RunwayShoulder = 7,
  Stopway = 8,
  RunwayDisplacedArea = 9,
  /** Not provided */
  // Clearway = 10,
  FinalApproachAndTakeoffArea = 11,
  TouchDownLiftOfArea = 12,
  HelipadThreshold = 13,
  TaxiwayElement = 14,
  TaxiwayShoulder = 15,
  TaxiwayGuidanceLine = 16,
  TaxiwayIntersectionMarking = 17,
  TaxiwayHoldingPosition = 18,
  RunwayExitLine = 19,
  FrequencyArea = 20,
  ApronElement = 21,
  StandGuidanceLine = 22,
  ParkingStandLocation = 23,
  ParkingStandArea = 24,
  DeicingArea = 25,
  AerodromeReferencePoint = 26,
  VerticalPolygonalStructure = 27,
  VerticalPointStructure = 28,
  VerticalLineStructure = 29,
  ConstructionArea = 30,
  /** Not provided */
  // SurveyControlPoint = 31,
  /** Not provided */
  // Asle = 32,
  BlastPad = 33,
  ServiceRoad = 34,
  Water = 35,
  Hotspot = 37, // Our data has 37 as the feattype for hotspot, although the ER-009 spec says it should be 36
  /** Not provided */
  // RunwayCenterlinePoint = 37,
  /** Not provided */
  // ArrestingSystemLocation = 38,
  /** Not provided yet */
  // AsrnEdge = 39
  /** Not provided yet */
  // AsrnNode = 40
}

export enum FeatureTypeString {
  RunwayElement = 'runwayelement',
  RunwayIntersection = 'runwayintersection',
  RunwayThreshold = 'runwaythreshold',
  RunwayMarking = 'runwaymarking',
  PaintedCenterline = 'paintedcenterline',
  LandAndHoldShortOperationLocation = 'landandholdshortoperationlocation',
  ArrestingGearLocation = 'arrestinggearlocation',
  RunwayShoulder = 'runwayshoulder',
  Stopway = 'stopway',
  RunwayDisplacedArea = 'runwaydisplacedarea',
  FinalApproachAndTakeoffArea = 'finalapproachandtakeoffarea',
  TouchDownLiftOfArea = 'touchdownliftofarea',
  HelipadThreshold = 'helipadthreshold',
  TaxiwayElement = 'taxiwayelement',
  TaxiwayShoulder = 'taxiwayshoulder',
  TaxiwayGuidanceLine = 'taxiwayguidanceline',
  TaxiwayIntersectionMarking = 'taxiwayintersectionmarking',
  TaxiwayHoldingPosition = 'taxiwayholdingposition',
  RunwayExitLine = 'runwayexitline',
  FrequencyArea = 'frequencyarea',
  ApronElement = 'apronelement',
  StandGuidanceLine = 'standguidanceline',
  ParkingStandLocation = 'parkingstandlocation',
  ParkingStandArea = 'parkingstandarea',
  DeicingArea = 'deicingarea',
  AerodromeReferencePoint = 'aerodromereferencepoint',
  VerticalPolygonalStructure = 'verticalpolygonalstructure',
  VerticalPointStructure = 'verticalpointstructure',
  VerticalLineStructure = 'verticallinestructure',
  ConstructionArea = 'constructionarea',
  BlastPad = 'blastpad',
  ServiceRoad = 'serviceroad',
  Water = 'water',
  Hotspot = 'hotspot',
}

export const AmdbFeatureTypeStrings: Record<FeatureType, FeatureTypeString> = {
  [FeatureType.RunwayElement]: FeatureTypeString.RunwayElement,
  [FeatureType.RunwayIntersection]: FeatureTypeString.RunwayIntersection,
  [FeatureType.RunwayThreshold]: FeatureTypeString.RunwayThreshold,
  [FeatureType.RunwayMarking]: FeatureTypeString.RunwayMarking,
  [FeatureType.PaintedCenterline]: FeatureTypeString.PaintedCenterline,
  [FeatureType.LandAndHoldShortOperationLocation]: FeatureTypeString.LandAndHoldShortOperationLocation,
  [FeatureType.ArrestingGearLocation]: FeatureTypeString.ArrestingGearLocation,
  [FeatureType.RunwayShoulder]: FeatureTypeString.RunwayShoulder,
  [FeatureType.Stopway]: FeatureTypeString.Stopway,
  [FeatureType.RunwayDisplacedArea]: FeatureTypeString.RunwayDisplacedArea,
  [FeatureType.FinalApproachAndTakeoffArea]: FeatureTypeString.FinalApproachAndTakeoffArea,
  [FeatureType.TouchDownLiftOfArea]: FeatureTypeString.TouchDownLiftOfArea,
  [FeatureType.HelipadThreshold]: FeatureTypeString.HelipadThreshold,
  [FeatureType.TaxiwayElement]: FeatureTypeString.TaxiwayElement,
  [FeatureType.TaxiwayShoulder]: FeatureTypeString.TaxiwayShoulder,
  [FeatureType.TaxiwayGuidanceLine]: FeatureTypeString.TaxiwayGuidanceLine,
  [FeatureType.TaxiwayIntersectionMarking]: FeatureTypeString.TaxiwayIntersectionMarking,
  [FeatureType.TaxiwayHoldingPosition]: FeatureTypeString.TaxiwayHoldingPosition,
  [FeatureType.RunwayExitLine]: FeatureTypeString.RunwayExitLine,
  [FeatureType.FrequencyArea]: FeatureTypeString.FrequencyArea,
  [FeatureType.ApronElement]: FeatureTypeString.ApronElement,
  [FeatureType.StandGuidanceLine]: FeatureTypeString.StandGuidanceLine,
  [FeatureType.ParkingStandLocation]: FeatureTypeString.ParkingStandLocation,
  [FeatureType.ParkingStandArea]: FeatureTypeString.ParkingStandArea,
  [FeatureType.DeicingArea]: FeatureTypeString.DeicingArea,
  [FeatureType.AerodromeReferencePoint]: FeatureTypeString.AerodromeReferencePoint,
  [FeatureType.VerticalPolygonalStructure]: FeatureTypeString.VerticalPolygonalStructure,
  [FeatureType.VerticalPointStructure]: FeatureTypeString.VerticalPointStructure,
  [FeatureType.VerticalLineStructure]: FeatureTypeString.VerticalLineStructure,
  [FeatureType.ConstructionArea]: FeatureTypeString.ConstructionArea,
  [FeatureType.BlastPad]: FeatureTypeString.BlastPad,
  [FeatureType.ServiceRoad]: FeatureTypeString.ServiceRoad,
  [FeatureType.Water]: FeatureTypeString.Water,
  [FeatureType.Hotspot]: FeatureTypeString.Hotspot,
};

export enum PolygonalStructureType {
  TerminalBuilding = 1,
  Hangar,
  ControlTower,
  NonTerminalBuilding,
  Tank,
  Tree,
  Bush,
  Forest,
  EarthenWorks,
  Navaid,
  Sign,
  Unknown = -32767,
}

export interface AmdbProperties {
  feattype: FeatureType;

  plysttyp?: PolygonalStructureType;

  id: number;

  idlin?: string;

  idstd?: string;

  termref?: string;

  idrwy?: string;

  idthr?: string;

  ident?: string;

  name?: string;

  iata?: string;

  lda?: number;

  asda?: number;

  toda?: number;

  tora?: number;

  brngmag?: number;

  brngtrue?: number;
}

export type AmdbFeatureCollection = FeatureCollection<Geometry, AmdbProperties>;

export type AmdbResponse = Partial<Record<FeatureTypeString, AmdbFeatureCollection>>;

export interface AmdbAirportSearchResult {
  /** The airport's ICAO code */
  idarpt: string;

  /** The airport's IATA code */
  iata: string | null;

  /** The airport's human-readable name */
  name: string;

  /** The airport's location (ARP) */
  coordinates: LatLonInterface;

  /** The airport's elevation, in metres */
  elev: number;
}

export type AmdbAirportSearchResponse = AmdbAirportSearchResult[];
