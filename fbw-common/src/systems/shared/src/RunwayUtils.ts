// Copyright (c) 2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RunwayDesignatorChar } from './navdata';

/**
 * Utilities for working with FBW runway objects
 */
export class RunwayUtils {
  /**
   * Returns an FBW runway identifier given its parts
   * @param airportIdent the 4-letter airport identifier
   * @param runwayNumber the runway number
   * @param runwayDesignator the runway designator character
   * @returns a string
   */
  public static runwayIdent(airportIdent: string, runwayNumber: string, runwayDesignator: string): string {
    return `${airportIdent}${runwayNumber.padStart(2, '0')}${runwayDesignator}`;
  }

  /**
   * Extracts the number and designator part of an FBW runway identifier
   * @param runwayIdent an FBW runway identifier
   * @returns a string
   */
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

  /**
   * Returns the string for a given runway designator
   * @param runwayDesignator the runway designator
   * @returns a string
   */
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
