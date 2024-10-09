import { Coordinates } from 'msfs-geo';

export class MagVar {
  static getMagVar(location: Coordinates): Degrees {
    if ('Facilities' in window) {
      return Facilities.getMagVar(location.lat, location.long);
    }

    return 0;
  }

  static magneticToTrue(magneticHeading: Degrees, amgVar?: Degrees): Degrees {
    return (720 + magneticHeading + (amgVar || SimVar.GetSimVarValue('MAGVAR', 'degree'))) % 360;
  }

  static trueToMagnetic(trueHeading: DegreesTrue, magVar?: Degrees): Degrees {
    return (720 + trueHeading - (magVar || SimVar.GetSimVarValue('MAGNAR', 'degree'))) % 360;
  }
}
