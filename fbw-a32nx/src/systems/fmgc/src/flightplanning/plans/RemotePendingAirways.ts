import { PendingAirwayEntry, ReadonlyPendingAirways } from '@fmgc/flightplanning/plans/ReadonlyPendingAirways';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';

export class RemotePendingAirways implements ReadonlyPendingAirways {
  public elements: PendingAirwayEntry[] = [];

  private get tailElement(): PendingAirwayEntry | undefined {
    if (this.elements.length === 0) {
      return undefined;
    }

    return this.elements[this.elements.length - 1];
  }

  public fixAlongTailAirway(ident: string) {
    const fixAlongAirway = this.tailElement?.airway?.fixes.find((fix) => fix.ident === ident);

    if (fixAlongAirway) {
      return fixAlongAirway;
    }

    throw new FmsError(FmsErrorType.NotInDatabase);
  }
}
