import { DatabaseItem, ProcedureTransition } from './Common';
import { ProcedureLeg } from './ProcedureLeg';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export interface Arrival extends DatabaseItem<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.STARs;

  enrouteTransitions: ProcedureTransition[];
  commonLegs: ProcedureLeg[];
  runwayTransitions: ProcedureTransition[];
}
