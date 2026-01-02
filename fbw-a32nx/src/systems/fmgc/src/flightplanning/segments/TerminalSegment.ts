import { FlightPlanSegment, SerializedFlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { Airport, Runway } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

/**
 * A flight plan segment that represents a terminal (origin or destination) airport
 */
export abstract class TerminalSegment extends FlightPlanSegment {
  protected airport: Airport | undefined;

  protected runway: Runway | undefined;

  /**
   * Sets the airport of this terminal segment
   *
   * @param icao the 4-letter ICAO of the airport
   * @param skipUpdateLegs whether to skip updating the legs (in case of this being called by sync)
   */
  public abstract setAirport(icao: string, skipUpdateLegs?: boolean): Promise<void>;

  /**
   * Sets the runway of this terminal segment
   * @param runwayIdent the ident of the runway
   * @param setByApproach whether this call was made for modifying the approach
   * @param skipUpdateLegs whether to skip updating legs
   */
  public abstract setRunway(
    runwayIdent: string | undefined,
    setByApproach?: boolean, // TODO refactor this out
    skipUpdateLegs?: boolean,
  ): Promise<void>;

  /** @inheritDoc */
  public serialize(): SerializedFlightPlanSegment {
    return { ...super.serialize(), facilityIdent: this.airport?.ident, runwayIdent: this.runway?.ident };
  }

  /**
   * Sets the contents of this segment using a serialized flight plan segment.
   *
   * @param serialized the serialized flight plan segment
   */
  async setFromSerializedSegment(serialized: SerializedFlightPlanSegment): Promise<void> {
    this.allLegs = serialized.allLegs.map((it) =>
      it.isDiscontinuity === false ? FlightPlanLeg.deserialize(it, this) : it,
    );
    if (serialized.facilityIdent !== undefined) {
      await this.setAirport(serialized.facilityIdent, true);
      await this.setRunway(serialized.runwayIdent, false, true);
    }
  }
}
