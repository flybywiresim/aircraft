// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FeatureCollection, Geometry } from '@turf/turf';

export enum FeatureType {
    RunwayElement = 0,
    RunwayIntersection = 1,
    Threshold = 2,
    RunwayMarking = 3,
    Centerline = 4,
    Lahso = 5,
    ArrestGear = 6,
    RunwayShoulder = 7,
    Stopway = 8,
    RunwayDisplacedArea = 9,
    Clearway = 10,
    Fato = 11,
    Tlof = 12,
    HelipadThreshold = 13,
    Taxiway = 14,
    TaxiwayShoulder = 15,
    TaxiwayGuidanceLine = 16,
    TaxiwayIntersectionMarking = 17,
    TaxiwayHoldingPosition = 18,
    ExitLine = 19,
    FrequencyArea = 20,
    ApronElement = 21,
    StandGuidanceTaxiline = 22,
    ParkingStandLocation = 23,
    ParkingStandArea = 24,
    DeicingArea = 25,
    AerodromeReferencePoint = 26,
    VerticalPolygonObject = 27,
    VerticalPointObject = 28,
    VerticalLineObject = 29,
    ConstructionArea = 30,
    SurveyControlPoint = 31,
    Asle = 32,
    Blastpad = 33,
    ServiceRoad = 34,
    Water = 35,
    Hotspot = 36,
    RunwayCentrelinePoint = 37,
    ArrestingSystemLocation = 38,
    AsmEdge = 39,
    AsmNode = 40,
}

export enum PolygonStructureType {
    TerminalBuilding = 1,
    Hangar = 2,
    ControlTower = 3,
    NonTerminalBuilding = 4,
    Tank = 5,
    Tree = 6,
    Bush = 7,
    Forest = 8,
    EarthenWorks = 9,
    Navaid = 10,
    Sign = 11,
    FixedBaseOperator = 2,
}

export interface AmdbProperties {
    feattype: FeatureType,

    plysttyp: PolygonStructureType,

    id: number,

    idlin: string,

    idstd: string,

    termref: string,

    idrwy: string,

    ident: string,

    name: string,

    iata: string,

    'x-fbw-projection-center-lat': number,

    'x-fbw-projection-center-long': number,

    'x-fbw-projection-scale': number,
}

export type AmdbFeatureCollection = FeatureCollection<Geometry, AmdbProperties>
