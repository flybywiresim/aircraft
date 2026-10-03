import { Departure, WaypointConstraintType } from '@flybywiresim/fbw-sdk';
import { FlightPlanSegment } from './FlightPlanSegment';
import { FlightPlanElement, FlightPlanLeg } from '../legs/FlightPlanLeg';
import { SegmentClass } from './SegmentClass';
import { BaseFlightPlan } from '../plans/BaseFlightPlan';

export class EngineOutDepartureSegment extends FlightPlanSegment {
  /** Contains the graphical legs to be depicted on the flight plan. */
  public readonly allLegs: FlightPlanElement[] = [];

  public readonly class = SegmentClass.Departure;

  public readonly procedureIdent: string | undefined;

  public readonly version = 0;

  public setProcedure(eosid: Departure | undefined, runwayIdent: string | undefined): void {
    this.allLegs.length = 0;
    (this.procedureIdent as undefined) = undefined;
    (this.version as number)++;

    const eosidLegs = runwayIdent ? eosid?.runwayTransitions.find((it) => it.ident === runwayIdent) : undefined;
    if (eosid && eosidLegs) {
      this.allLegs.push(
        ...eosidLegs.legs.map((leg) =>
          FlightPlanLeg.fromProcedureLeg(this, leg, eosid.ident, WaypointConstraintType.CLB),
        ),
      );

      (this.procedureIdent as string) = eosid.ident;
    }
  }

  /** @inheritdoc */
  public override clone(forPlan: BaseFlightPlan, options?: number): EngineOutDepartureSegment {
    const newSegment = new EngineOutDepartureSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs.push(
      ...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment, options) : it)),
    );

    (newSegment.procedureIdent as string | undefined) = this.procedureIdent;

    return newSegment;
  }
}
