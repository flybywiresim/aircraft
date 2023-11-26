import { FeatureCollection, Geometry } from '@turf/turf';
import { LatLonInterface } from '@microsoft/msfs-sdk';

export enum AmdbProjection {
    Epsg4326 = 'EPSG:4326',
    ArpAzeq = 'NAVIGRAPH:ARP_AZEQ',
}

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

export enum FeatureTypeString {
    RunwayElement = 'runwayelement',
    RunwayIntersection = 'runwayintersection',
    Threshold = 'threshold',
    RunwayMarking = 'runwaymarking',
    Centerline = 'paintedcenterline',
    Lahso = 'lahso',
    ArrestGear = 'arrestgear',
    RunwayShoulder = 'runwayshoulder',
    Stopway = 'stopway',
    RunwayDisplacedArea = 'runwaydisplacedarea',
    Clearway = 'clearway',
    Fato = 'fato',
    Tlof = 'tlof',
    HelipadThreshold = 'helipadthreshold',
    Taxiway = 'taxiwayelement',
    TaxiwayShoulder = 'taxiwayshoulder',
    TaxiwayGuidanceLine = 'taxiwayguidanceline',
    TaxiwayIntersectionMarking = 'taxiwayintersectionmarking',
    TaxiwayHoldingPosition = 'taxiwayholdingposition',
    ExitLine = 'runwayexitline',
    FrequencyArea = 'frequencyarea',
    ApronElement = 'apronelement',
    StandGuidanceTaxiline = 'standguidanceline',
    ParkingStandLocation = 'parkingstandlocation',
    ParkingStandArea = 'parkingstandarea',
    DeicingArea = 'deicingarea',
    AerodromeReferencePoint = 'aerodromereferencepoint',
    VerticalPolygonObject = 'verticalpolygonalstructure',
    VerticalPointObject = 'verticalpointstructure',
    VerticalLineObject = 'verticallinestructure',
    ConstructionArea = 'constructionarea',
    SurveyControlPoint = 'surveycontrolpoint',
    Asle = 'asle',
    Blastpad = 'blastpad',
    ServiceRoad = 'serviceroad',
    Water = 'water',
    Hotspot = 'hotspot',
    RunwayCentrelinePoint = 'runwaycenterlinepoint',
    ArrestingSystemLocation = 'arrestingsystemlocation',
    AsmEdge = 'asmedge',
    AsmNode = 'asmnode',
}

export const AmdbFeatureTypeStrings: Record<FeatureType, FeatureTypeString> = {
    [FeatureType.RunwayElement]: FeatureTypeString.RunwayElement,
    [FeatureType.RunwayIntersection]: FeatureTypeString.RunwayIntersection,
    [FeatureType.Threshold]: FeatureTypeString.Threshold,
    [FeatureType.RunwayMarking]: FeatureTypeString.RunwayMarking,
    [FeatureType.Centerline]: FeatureTypeString.Centerline,
    [FeatureType.Lahso]: FeatureTypeString.Lahso,
    [FeatureType.ArrestGear]: FeatureTypeString.ArrestGear,
    [FeatureType.RunwayShoulder]: FeatureTypeString.RunwayShoulder,
    [FeatureType.Stopway]: FeatureTypeString.Stopway,
    [FeatureType.RunwayDisplacedArea]: FeatureTypeString.RunwayDisplacedArea,
    [FeatureType.Clearway]: FeatureTypeString.Clearway,
    [FeatureType.Fato]: FeatureTypeString.Fato,
    [FeatureType.Tlof]: FeatureTypeString.Tlof,
    [FeatureType.HelipadThreshold]: FeatureTypeString.HelipadThreshold,
    [FeatureType.Taxiway]: FeatureTypeString.Taxiway,
    [FeatureType.TaxiwayShoulder]: FeatureTypeString.TaxiwayShoulder,
    [FeatureType.TaxiwayGuidanceLine]: FeatureTypeString.TaxiwayGuidanceLine,
    [FeatureType.TaxiwayIntersectionMarking]: FeatureTypeString.TaxiwayIntersectionMarking,
    [FeatureType.TaxiwayHoldingPosition]: FeatureTypeString.TaxiwayHoldingPosition,
    [FeatureType.ExitLine]: FeatureTypeString.ExitLine,
    [FeatureType.FrequencyArea]: FeatureTypeString.FrequencyArea,
    [FeatureType.ApronElement]: FeatureTypeString.ApronElement,
    [FeatureType.StandGuidanceTaxiline]: FeatureTypeString.StandGuidanceTaxiline,
    [FeatureType.ParkingStandLocation]: FeatureTypeString.ParkingStandLocation,
    [FeatureType.ParkingStandArea]: FeatureTypeString.ParkingStandArea,
    [FeatureType.DeicingArea]: FeatureTypeString.DeicingArea,
    [FeatureType.AerodromeReferencePoint]: FeatureTypeString.AerodromeReferencePoint,
    [FeatureType.VerticalPolygonObject]: FeatureTypeString.VerticalPolygonObject,
    [FeatureType.VerticalPointObject]: FeatureTypeString.VerticalPointObject,
    [FeatureType.VerticalLineObject]: FeatureTypeString.VerticalLineObject,
    [FeatureType.ConstructionArea]: FeatureTypeString.ConstructionArea,
    [FeatureType.SurveyControlPoint]: FeatureTypeString.SurveyControlPoint,
    [FeatureType.Asle]: FeatureTypeString.Asle,
    [FeatureType.Blastpad]: FeatureTypeString.Blastpad,
    [FeatureType.ServiceRoad]: FeatureTypeString.ServiceRoad,
    [FeatureType.Water]: FeatureTypeString.Water,
    [FeatureType.Hotspot]: FeatureTypeString.Hotspot,
    [FeatureType.RunwayCentrelinePoint]: FeatureTypeString.RunwayCentrelinePoint,
    [FeatureType.ArrestingSystemLocation]: FeatureTypeString.ArrestingSystemLocation,
    [FeatureType.AsmEdge]: FeatureTypeString.AsmEdge,
    [FeatureType.AsmNode]: FeatureTypeString.AsmNode,
};

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
}

export type AmdbFeatureCollection = FeatureCollection<Geometry, AmdbProperties>

export type AmdbResponse = Partial<Record<FeatureTypeString, AmdbFeatureCollection>>

export interface AmdbAirportSearchResult {
    /** The airport's ICAO code */
    idarpt: string,

    /** The airport's IATA code */
    iata: string | null,

    /** The airport's human-readable name */
    name: string,

    /** The airport's location (ARP) */
    coordinates: LatLonInterface,

    /** The airport's elevation, in metres */
    elev: number,
}

export type AmdbAirportSearchResponse = AmdbAirportSearchResult[]
