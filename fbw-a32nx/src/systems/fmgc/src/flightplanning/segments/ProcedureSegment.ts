// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlanSegment, SerializedFlightPlanSegment } from './FlightPlanSegment';

/**
 * A flight plan segment representing a procedure
 */
export abstract class ProcedureSegment<T extends { ident: string }> extends FlightPlanSegment {
  abstract get procedure(): T | undefined | null;

  /**
   * Sets the procedure object for this segment using an ident or `undefined`. Passing the latter should set the procedure as
   * `undefined`.
   * @param ident the identifier
   * @param skipUpdateLegs whether or not to skip updating the segment legs based on the provided identifier. Passing `true` should only be
   * used to reconstruct procedure segments from a serialised flight plan
   */
  abstract setProcedure(ident: string | undefined | null, skipUpdateLegs?: boolean): Promise<void>;

  /**
   * Sets the contents of this procedure segment using a serialized flight plan segment. **Note:** the segment may require
   * some other segment to be set before being set itself. For example, an arrival runway transition can only be set after
   * an arrival is set.
   *
   * @param serialized the serialized flight plan segment
   */
  setFromSerializedSegment(serialized: SerializedFlightPlanSegment): void {
    this.setProcedure(serialized.procedureIdent, true);
    this.allLegs = serialized.allLegs.map((it) =>
      it.isDiscontinuity === false ? FlightPlanLeg.deserialize(it, this) : it,
    );
  }

  override serialize(): SerializedFlightPlanSegment {
    return {
      allLegs: this.allLegs.map((it) => (it.isDiscontinuity === false ? it.serialize() : it)),
      procedureIdent: this.procedure?.ident ?? undefined,
    };
  }
}
