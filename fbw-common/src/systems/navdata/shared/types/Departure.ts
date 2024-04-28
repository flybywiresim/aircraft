import { DatabaseItem, ProcedureTransition } from './Common';
import { ProcedureLeg } from './ProcedureLeg';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export interface Departure extends DatabaseItem<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.SIDs;

  /**
   * RNP-AR departure?
   */
  authorisationRequired: boolean;

  runwayTransitions: ProcedureTransition[];

  commonLegs: ProcedureLeg[];

  enrouteTransitions: ProcedureTransition[];

  engineOutLegs: ProcedureLeg[];
}
