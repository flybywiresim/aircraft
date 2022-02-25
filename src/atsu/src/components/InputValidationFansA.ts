//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes } from '../AtsuStatusCodes';

export class InputValidationFansA {
    public static validateScratchpadAltitude(value: string): AtsuStatusCodes {
        const feet = !value.endsWith('M');

        const altitudeStr = value.replace('FT', '').replace('M', '');

        // contains not only digits
        if (/(?!^\d+$)^.+$/.test(altitudeStr)) {
            return AtsuStatusCodes.FormatError;
        }
        const altitude = parseInt(altitudeStr);

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

            const machStr = value.split('.')[1];
            // contains not only digits
            if (/(?!^\d+$)^.+$/.test(machStr)) {
                return AtsuStatusCodes.FormatError;
            }
            let mach = parseInt(machStr);
            if (mach < 10) mach *= 10;

            if (mach >= 61 && mach <= 92) {
                return AtsuStatusCodes.Ok;
            }
            return AtsuStatusCodes.EntryOutOfRange;
        } if (/^([0-9]{1,3}(KT)*)$/.test(value)) {
            // knots

            const knotsStr = value.replace('KT', '');
            // contains not only digits
            if (/(?!^\d+$)^.+$/.test(knotsStr)) {
                return AtsuStatusCodes.FormatError;
            }
            const knots = parseInt(knotsStr);

            if (knots >= 70 && knots <= 350) {
                return AtsuStatusCodes.Ok;
            }
            return AtsuStatusCodes.EntryOutOfRange;
        }

        return AtsuStatusCodes.FormatError;
    }
}
