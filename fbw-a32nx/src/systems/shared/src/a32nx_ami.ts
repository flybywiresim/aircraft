import { AirlineModifiableInformation, AirlineModifiableInformationDatabase } from '@flybywiresim/fbw-sdk';

const defaultAmiData: AirlineModifiableInformation = {
  perfFactor: 0, // %
  idleFactor: 0, // %
  perfCode: 'ARM',
  taxiFuel: 200, // kg
  rteRsv: 5, // %
  rsvMin: 0, // kg
  rsvMax: 10_000, // kg
  rsvInflt: true, // YES / NO
  rsvAltn: false, // YES / NO
  finalTg: 30, // minutes
  finalTf: 30, // minutes
  finalFixf: 0, // kg
  finalAlt: 1500, // ft AGL
  finalDest: 'A', // P or A
};

export const AmiDatabase = new AirlineModifiableInformationDatabase(defaultAmiData);
