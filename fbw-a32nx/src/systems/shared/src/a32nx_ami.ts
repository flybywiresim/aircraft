import {
  AirlineModifiableInformation,
  AirlineModifiableInformationDatabase,
  DefaultValuesAmiDatabaseLayer,
  LiveryAmiDatabaseLayer,
  UserSettingsAmiDatabaseLayer,
} from '@flybywiresim/fbw-sdk';
import { DefaultUserSettingManager, EventBus } from '@microsoft/msfs-sdk';

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

/** This will probably come from persistence.ts when NXDataStore is gone */
const bus = new EventBus();
const userSettings = new DefaultUserSettingManager<AirlineModifiableInformation>(
  bus,
  Object.entries(defaultAmiData).map(([key, value]) => ({ name: key, defaultValue: value })),
);

export const AmiDatabase = new AirlineModifiableInformationDatabase(
  new UserSettingsAmiDatabaseLayer(userSettings),
  new LiveryAmiDatabaseLayer(),
  new DefaultValuesAmiDatabaseLayer(defaultAmiData),
);
