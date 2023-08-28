// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';

export class MagVar {
    static magneticToTrue(magneticHeading: Degrees, amgVar?: Degrees): Degrees {
        return (720 + magneticHeading + (amgVar || SimVar.GetSimVarValue('MAGVAR', 'degree'))) % 360;
    }

    static trueToMagnetic(trueHeading: DegreesTrue, magVar?: Degrees): Degrees {
        return (720 + trueHeading - (magVar || SimVar.GetSimVarValue('MAGNAR', 'degree'))) % 360;
    }
}
