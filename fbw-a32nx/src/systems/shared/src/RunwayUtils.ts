// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RunwayDesignatorChar } from '@fmgc/types/fstypes/FSEnums';

export class RunwayUtils {
    public static runwayString(runwayNumber: number, runwayDesignator: RunwayDesignatorChar): string {
        if (runwayNumber > 0) {
            return `${runwayNumber.toFixed(0).padStart(2, '0')}${RunwayUtils.designatorString(runwayDesignator)}`;
        }
        return '';
    }

    public static designatorString(runwayDesignator: RunwayDesignatorChar): string {
        switch (runwayDesignator) {
        case RunwayDesignatorChar.A:
            return 'A';
        case RunwayDesignatorChar.B:
            return 'B';
        case RunwayDesignatorChar.C:
            return 'C';
        case RunwayDesignatorChar.L:
            return 'L';
        case RunwayDesignatorChar.R:
            return 'R';
        case RunwayDesignatorChar.W:
            return 'W';
        default:
            return '';
        }
    }
}
