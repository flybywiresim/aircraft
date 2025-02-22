import { EventBus, ObjectSubject, ObjectSubjectHandler, Subscription } from '@microsoft/msfs-sdk';

export interface AirlineModifiableInformation {
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
}

type AmiKey = keyof AirlineModifiableInformation;
type AmiValue<T extends AmiKey> = AirlineModifiableInformation[T];

interface AmiReadAccess {
  get<T extends AmiKey>(key: T): AmiValue<T>;
  getAll(): Readonly<AirlineModifiableInformation>;
  sub(
    handler: ObjectSubjectHandler<AirlineModifiableInformation>,
    initialNotify?: boolean,
    paused?: boolean,
  ): Subscription;
}

interface AmiReadWriteAccess extends AmiReadAccess {
  set<T extends AmiKey>(key: T, value: AmiValue<T>): void;
}

/**
 * Represents the AMI database for an aircraft. Values can be fetched from the database directly, or subscribed to.
 * Values can only be set from the livery, or through the EFB. In this case, the access has to be provided by the DB.
 *
 * @example
 * // Create a new database
 * const defaultAmiData: AirlineModifiableInformation = {
 *   perfFactor: 0,
 *   // ... more properties
 * };
 * const db = new AirlineModifiableInformationDatabase(defaultAmiData);
 *
 * // Fetch a value
 * db.get('perfFactor');
 *
 * // Connect to an event bus within an instrument
 * const bus = new EventBus()
 * db.pubToBus(bus);
 *
 * const sub = bus.getSubscriber<AirlineModifiableInformation>();
 * sub.on('perfCode').handle((value) => console.log('Received new perfCode:', value));
 *
 * // Setting values
 *
 * // Pass this to the EFB
 * const efbAmi = db.getEfbAccess();
 * efbAmi.set('perfFactor', 0.5);
 *
 * // Create a hook for the EFB
 * const efbAmi = db.getEfbAccess();
 *
 * const useAmiValue = <T extends AmiKey>(key: T) => {
 *   return [
 *     efbAmi.get(key),
 *     (value: AmiValue<T>) => efbAmi.set(key, value),
 *   ] as const;
 *
 * const [perfFactor, setPerfFactor] = useAmiValue('perfFactor');
 */
export class AirlineModifiableInformationDatabase implements AmiReadAccess {
  private readonly liveryRecords: AmiReadWriteAccess;

  private readonly userRecords: AmiReadWriteAccess;

  constructor(defaultRecords: AirlineModifiableInformation) {
    const defaultDb = new AmiDatabaseDefaultValues(defaultRecords);

    this.liveryRecords = new BaseAmiDatabaseReadWriteAccess(defaultDb);
    this.userRecords = new BaseAmiDatabaseReadWriteAccess(this.liveryRecords);
  }

  get<T extends AmiKey>(key: T): AmiValue<T> {
    return this.userRecords.get(key);
  }

  getAll() {
    return this.userRecords.getAll();
  }

  sub(handler: ObjectSubjectHandler<AirlineModifiableInformation>, initialNotify?: boolean, paused?: boolean) {
    return this.userRecords.sub(handler, initialNotify, paused);
  }

  pubToBus(bus: EventBus) {
    const pub = bus.getPublisher<AirlineModifiableInformation>();
    return this.userRecords.sub((_, key, value) => pub.pub(key, value));
  }

  getLiveryAccess(): AmiReadWriteAccess {
    return this.liveryRecords;
  }

  getEfbAccess(): AmiReadWriteAccess {
    return this.userRecords;
  }
}

class AmiDatabaseDefaultValues implements AmiReadAccess {
  private readonly records: ObjectSubject<AirlineModifiableInformation>;

  constructor(private readonly defaultData: AirlineModifiableInformation) {
    this.records = ObjectSubject.create(defaultData);
  }

  sub(handler: ObjectSubjectHandler<AirlineModifiableInformation>, initialNotify?: boolean, paused?: boolean) {
    return this.records.sub(handler, initialNotify, paused);
  }

  get<T extends AmiKey>(key: T): AmiValue<T> {
    return this.defaultData[key];
  }

  getAll(): Readonly<AirlineModifiableInformation> {
    return this.defaultData;
  }
}

class BaseAmiDatabaseReadWriteAccess implements AmiReadWriteAccess {
  private readonly records = ObjectSubject.create<Partial<AirlineModifiableInformation>>({});

  private readonly output: ObjectSubject<AirlineModifiableInformation>;

  private onRecordChanged: ObjectSubjectHandler<AirlineModifiableInformation> = (_, key) =>
    this.output.set(key, this.records.get()[key] ?? this.fallback.get(key));

  constructor(private readonly fallback: AmiReadAccess) {
    this.output = ObjectSubject.create<AirlineModifiableInformation>({ ...fallback.getAll() });

    this.records.sub(this.onRecordChanged);
    this.fallback.sub(this.onRecordChanged);
  }

  get<T extends AmiKey>(key: T): AmiValue<T> {
    return this.output.get()[key];
  }

  getAll() {
    return this.output.get();
  }

  set<T extends AmiKey>(key: T, value: AmiValue<T>) {
    this.records.set(key, value);
  }

  sub(handler: ObjectSubjectHandler<AirlineModifiableInformation>, initialNotify?: boolean, paused?: boolean) {
    return this.output.sub(handler, initialNotify, paused);
  }
}
