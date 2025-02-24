import { UserSettingManager } from '@microsoft/msfs-sdk';

export type AirlineModifiableInformation = {
  /**
   * %, performance factor
   */
  perfFactor: number;
  /**
   * %, idle factor
   */
  idleFactor: number;
  /**
   * modification password, three characters
   */
  perfCode: string;
  /**
   * kg, taxi fuel
   */
  taxiFuel: number;
  /**
   * % of trip fuel as route reserves
   */
  rteRsv: number;
  /**
   * kg, Minimum value of route reserves
   */
  rsvMin: number;
  /**
   * kg, Maximum value of route reserves
   */
  rsvMax: number; //
  /**
   * Reserves are computed for fuel predictions in flight
   */
  rsvInflt: boolean;
  /**
   * Reserves includes fuel for alternate trip
   */
  rsvAltn: boolean;
  /**
   * minutes, Final holding time used for fuel planning computation
   */
  finalTg: number;
  /**
   * minutes, Final holding time used for fuel prediction computation (only used if finalFixf = 0)
   */
  finalTf: number;
  /**
   * kg, Final holding fuel quantity used for fuel prediction computation
   */
  finalFixf: number;
  /**
   * ft AGL, Altitude of the holding pattern on which the final fuel computation is based
   */
  finalAlt: number;
  /**
   * P or A, Final holding pattern is flown at Primary or Alternate destination
   */
  finalDest: 'A' | 'P';
};

type AmiKey = keyof AirlineModifiableInformation;
type AmiValue<T extends AmiKey> = AirlineModifiableInformation[T];

interface OptionalAmiDatabaseLayer {
  get<T extends AmiKey>(key: T): AmiValue<T> | undefined;
}

interface AmiDatabaseLayer {
  get<T extends AmiKey>(key: T): AmiValue<T>;
}

export class AirlineModifiableInformationDatabase implements AmiDatabaseLayer {
  constructor(
    private readonly settings: AmiDatabaseLayer,
    private readonly liveryRecords: OptionalAmiDatabaseLayer,
    private readonly defaultRecods: AmiDatabaseLayer,
  ) {}

  get<T extends AmiKey>(key: T): AmiValue<T> {
    return this.settings.get(key) ?? this.liveryRecords.get(key) ?? this.defaultRecods.get(key);
  }
}

export class UserSettingsAmiDatabaseLayer implements AmiDatabaseLayer {
  constructor(private readonly userSettings: UserSettingManager<AirlineModifiableInformation>) {}

  get<T extends AmiKey>(key: T): AmiValue<T> {
    return this.userSettings.getSetting(key).value;
  }

  whenChanged(key: AmiKey) {
    return this.userSettings.whenSettingChanged(key);
  }
}

export class LiveryAmiDatabaseLayer implements OptionalAmiDatabaseLayer {
  get<T extends AmiKey>(_key: T): AmiValue<T> {
    // TODO Fetch from livery
    return undefined;
  }
}

export class DefaultValuesAmiDatabaseLayer implements OptionalAmiDatabaseLayer {
  constructor(private readonly defaultValues: AirlineModifiableInformation) {}

  get<T extends AmiKey>(key: T): AmiValue<T> {
    return this.defaultValues[key];
  }
}
