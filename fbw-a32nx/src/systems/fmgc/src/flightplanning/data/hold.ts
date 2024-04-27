import { HoldData, HoldType } from '@fmgc/flightplanning/data/flightplan';
import { LegType, ProcedureLeg } from '@flybywiresim/fbw-sdk';

export class HoldUtils {
  static parseHoldFromProcedureLeg(defintion: ProcedureLeg): HoldData | undefined {
    switch (defintion.type) {
      case LegType.HA:
      case LegType.HF:
      case LegType.HM:
        return {
          inboundMagneticCourse: defintion.magneticCourse,
          turnDirection: defintion.turnDirection,
          distance: defintion.length,
          time: defintion.lengthTime,
          type: HoldType.Database,
        };
      default:
        return undefined;
    }
  }
}
