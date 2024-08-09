import { DisplayInterface } from '@fmgc/flightplanning/interface/DisplayInterface';
import { FmcInterface } from 'instruments/src/MFD/FMC/FmcInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';

export enum FmcIndex {
  FmcA,
  FmcB,
  FmcC,
}

/*
 * Instantiates and handles each instance of FlightManagementComputers (FMC). For now, only FMC-A is instantiated to reduce computational effort.
 */
export interface FmcServiceInterface {
  /**
   * Returns interface to the FMC, which is currently operating as master. For now, will always be FMC-A.
   */
  get master(): FmcInterface | null;

  /**
   * Returns interface to the FMC, which is currently operating as slave. For now, will always be undefined.
   */
  get slave(): FmcInterface | null;

  /**
   * Returns interface to the FMC, which is currently operating as slave. No computations are being done while in standby. For now, will always be undefined.
   */
  get standby(): FmcInterface | null;

  /**
   * Instantiate FMCs. Currently, only FMC-A is instantiated.
   */
  createFmc(mfdReference: DisplayInterface & MfdDisplayInterface): void;

  /**
   * Check whether given FMC is instantiated
   */
  has(forFmcIndex: FmcIndex): boolean;

  /**
   * Return given FMC
   */
  get(forFmcIndex: FmcIndex): FmcInterface;

  /**
   * Sets mfd reference for given FMC, used for navigating to pages and opening prompts
   */
  setMfdReference(forFmcIndex: FmcIndex, mfd: DisplayInterface & MfdDisplayInterface): void;
}
