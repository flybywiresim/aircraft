//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes } from '../AtsuStatusCodes';

export class InputValidationFansA {
    public static validateScratchpadAltitude(value: string): AtsuStatusCodes {
        if (!/^[0-9]{1,5}(FT|M)*$/.test(value)) {
            return AtsuStatusCodes.FormatError;
        }

        const feet = !value.endsWith('M');
        const altitude = parseInt(value.match(/([0-9]+)/)[0]);

        if (feet) {
            if (altitude >= 0 && altitude <= 1000 && !value.endsWith('FT')) {
                return AtsuStatusCodes.FormatError;
            }

            if (altitude >= 0 && altitude <= 25000) {
                return AtsuStatusCodes.Ok;
            }

            return AtsuStatusCodes.EntryOutOfRange;
        }

        if (altitude >= 0 && altitude <= 12500) {
            return AtsuStatusCodes.Ok;
        }
        return AtsuStatusCodes.EntryOutOfRange;
    }

    public static validateScratchpadSpeed(value: string): AtsuStatusCodes {
        if (/^((M*)\.[0-9]{1,2})$/.test(value)) {
            // MACH number
            let mach = parseInt(value.match(/([0-9]+)/)[0]);
            if (mach < 10) mach *= 10;

            if (mach >= 61 && mach <= 92) {
                return AtsuStatusCodes.Ok;
            }
            return AtsuStatusCodes.EntryOutOfRange;
        } if (/^([0-9]{1,3}(KT)*)$/.test(value)) {
            // knots
            const knots = parseInt(value.match(/([0-9]+)/)[0]);
            if (knots >= 70 && knots <= 350) {
                return AtsuStatusCodes.Ok;
            }
            return AtsuStatusCodes.EntryOutOfRange;
        }

        return AtsuStatusCodes.FormatError;
    }
}
