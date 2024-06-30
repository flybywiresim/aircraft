// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RunwayDesignatorChar } from './navdata';

export class RunwayUtils {
  public static runwayString(runwayIdent: string): string {
    const regex = /\w{4}(\d{2})([LCRTABW])?/;
    const match = regex.exec(runwayIdent);

    if (!match) {
      return '';
    }

    const [, number, designator] = match;

    if (number === '00') {
      return '';
    }

    return `${number}${designator ?? ''}`;
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
