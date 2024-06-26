export enum SectionCode {
  Mora,
  Navaid,
  Enroute,
  Heliport,
  Airport,
  CompanyRoutes,
  Tables,
  Airspace,
}

export enum MoraSubsectionCode {
  GridMora,
}

export enum NavaidSubsectionCode {
  VhfNavaid,
  NdbNavaid,
  TacanNavaid,
}

export enum EnrouteSubsectionCode {
  Waypoints,
  AirwayMarkers,
  HoldingPatterns,
  AirwaysAndRoutes,
  SpecialActivityAreas,
  PreferredRoutes,
  AirwayRestrictions,
  Communications,
}

export enum HeliportSubsectionCode {
  Pads,
  TerminalWaypoints,
  Sids,
  Stars,
  ApproachProcedures,
  Taa,
  Msa,
  SBASPathPoint,
  Communications,
}

export enum AirportSubsectionCode {
  ReferencePoints,
  Gates,
  TerminalWaypoints,
  SIDs,
  STARs,
  ApproachProcedures,
  Runways,
  LocalizerGlideSlope,
  Taa,
  Mls,
  LocalizerMarker,
  TerminalNdb,
  SbasPathPoint,
  GbasPathPoint,
  FltPlanningArrDep,
  Msa,
  GlsStation,
  Communications,
}

export enum CompanyRoutesSubsectionCode {
  CompanyRoutes,
  AlternateRecords,
  HelicopterOperationRoutes,
}

export enum TablesSubsectionCode {
  CruisingTables,
  GeographicalReference,
  RnavNameTable,
  CommunicationType,
}

export enum AirspaceSubsectionCode {
  ControlledAirspace,
  FirUir,
  RestrictiveAirspace,
}

export type SubSectionEnumMap = {
  [SectionCode.Mora]: MoraSubsectionCode;
  [SectionCode.Navaid]: NavaidSubsectionCode;
  [SectionCode.Enroute]: EnrouteSubsectionCode;
  [SectionCode.Heliport]: HeliportSubsectionCode;
  [SectionCode.Airport]: AirportSubsectionCode;
  [SectionCode.CompanyRoutes]: CompanyRoutesSubsectionCode;
  [SectionCode.Tables]: TablesSubsectionCode;
  [SectionCode.Airspace]: AirspaceSubsectionCode;
};
