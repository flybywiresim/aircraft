import { DatabaseItem, ProcedureTransition } from './Common';
import { ProcedureLeg } from './ProcedureLeg';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export interface DepartureRunwayTransition extends ProcedureTransition {
  engineOutDeparture?: Departure;
}

export interface Departure extends DatabaseItem<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.SIDs;

  /**
   * RNP-AR departure?
   */
  authorisationRequired: boolean;

  runwayTransitions: DepartureRunwayTransition[];

  commonLegs: ProcedureLeg[];

  enrouteTransitions: ProcedureTransition[];
}
