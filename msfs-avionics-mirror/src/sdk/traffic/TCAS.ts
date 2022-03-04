import { EventSubscriber } from '../data';
import { Consumer } from '../data/Consumer';
import { EventBus } from '../data/EventBus';
import { ADCEvents, ClockEvents, GNSSEvents, TrafficContact, TrafficEvents, TrafficInstrument } from '../instruments';
import { GeoPoint, GeoPointInterface, GeoPointReadOnly } from '../utils/geo/GeoPoint';
import { GeoPointSubject } from '../utils/geo/GeoPointSubject';
import { NumberUnit, NumberUnitInterface, NumberUnitReadOnly, UnitFamily, UnitType } from '../utils/math/NumberUnit';
import { NumberUnitSubject } from '../utils/math/NumberUnitSubject';
import { Vec2Math, Vec3Math } from '../utils/math/VecMath';
import { Subject } from '../utils/Subject';
import { Subscribable } from '../utils/Subscribable';

/**
 * TCAS operating modes.
 */
export enum TCASOperatingMode {
  Standby,
  TAOnly,
  TA_RA
}

/**
 * TCAS alert level.
 */
export enum TCASAlertLevel {
  None,
  ProximityAdvisory,
  TrafficAdvisory,
  ResolutionAdvisory
}

/**
 * An intruder tracked by TCAS.
 */
export interface TCASIntruder {
  /** The traffic contact associated with this intruder. */
  readonly contact: TrafficContact;

  /** A subscribable which provides the alert level assigned to this intruder. */
  readonly alertLevel: Subscribable<TCASAlertLevel>;

  /** The position of this intruder at the time of the most recent update. */
  readonly position: GeoPointReadOnly;

  /** The altitude of this intruder at the time of the most recent update. */
  readonly altitude: NumberUnitReadOnly<UnitFamily.Distance>;

  /** The true ground track of this intruder at the time of the most recent update. */
  readonly groundTrack: number;

  /** The ground speed of this intruder at the time of the most recent update. */
  readonly groundSpeed: NumberUnitReadOnly<UnitFamily.Speed>;

  /** The vertical speed of this intruder at the time of the most recent update. */
  readonly verticalSpeed: NumberUnitReadOnly<UnitFamily.Speed>;

  /**
   * The 3D position vector of this intruder at the time of the last update. Each component is expressed in units of
   * meters. The coordinate system is an Euclidean approximation of the geodetic space around the own airplane such
   * that the z-coordinate represents orthometric height and the x- and y-coordinates represent an east-
   * counterclockwise equirectangular projection of latitude and longitude, with the origin at the location of the own
   * airplane.
   */
  readonly positionVec: Float64Array;

  /**
   * The 3D velocity vector of this intruder at the time of the last update. Each component is expressed in units of
   * meters per second. The coordinate system is defined the same as for position vectors.
   */
  readonly velocityVec: Float64Array;

  /** The 3D position vector of this intruder relative to own airplane. */
  readonly relativePositionVec: Float64Array;

  /** The 3D velocity vector of this intruder relative to own airplane. */
  readonly relativeVelocityVec: Float64Array;

  /** Whether there is a valid prediction for time of closest approach between this intruder and own airplane. */
  readonly isPredictionValid: boolean;

  /** The predicted time-of-closest-approach of this intruder at the time of the most recent update. */
  readonly tca: NumberUnitReadOnly<UnitFamily.Duration>;

  /** The predicted 3D displacement vector from own airplane to this intruder at time of closest approach. */
  readonly tcaDisplacement: Float64Array;

  /**
   * The cylindrical norm of the predicted displacement vector between this intruder and own airplane at time of
   * closest approach. A value less than or equal to 1 indicates the intruder will be inside the protected zone.
   * Larger values correspond to greater separation.
   */
  readonly tcaNorm: number;

  /** The predicted horizontal separation between this intruder and own airplane at time of closest approach. */
  readonly tcaHorizontalSep: NumberUnitReadOnly<UnitFamily.Distance>;

  /** The predicted vertical separation between this intruder and own airplane at time of closest approach. */
  readonly tcaVerticalSep: NumberUnitReadOnly<UnitFamily.Distance>;

  /**
   * Calculates the predicted 3D displacement vector from own airplane to this intruder at a specified time based on
   * the most recent available data. If insufficient data is available to calculate the prediction, NaN will be written
   * to the result.
   * @param simTime The sim time at which to calculate the separation, as a UNIX timestamp.
   * @param out A Float64Array object to which to write the result.
   * @returns the predicted displacement vector from own airplane to this intruder at the specified time.
   */
  predictDisplacement(simTime: number, out: Float64Array): Float64Array;

  /**
   * Calculates the predicted separation between this intruder and own airplane at a specified time based on the most
   * recent available data and stores the results in the supplied WT_NumberUnit objects. If insufficient data is
   * available to calculate the prediction, NaN will be written to the results.
   * @param simTime The sim time at which to calculate the separation, as a UNIX timestamp.
   * @param horizontalOut A NumberUnit object to which to write the horizontal separation.
   * @param verticalOut A NumberUnit object to which to write the vertical separation.
   */
  predictSeparation(simTime: number, horizontalOut: NumberUnit<UnitFamily.Distance>, verticalOut: NumberUnit<UnitFamily.Distance>): void;
}

/**
 * Sensitivity settings for TCAS.
 */
export interface TCASSensitivity {
  /** A subscribable which provides the lookahead time for TCA. */
  readonly lookaheadTime: Subscribable<NumberUnitInterface<UnitFamily.Duration>>;

  /** A subscribable which provides the radius of the own airplane's protected zone. */
  readonly protectedRadius: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;

  /** A subscribable which provides the half-height of the own airplane's protected zone. */
  readonly protectedHeight: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;
}

/**
 * TCAS events.
 */
export interface TCASEvents {
  /** The TCAS operating mode changed. */
  tcas_operating_mode: TCASOperatingMode;

  /** A new intruder was created. */
  tcas_intruder_added: TCASIntruder;

  /** The alert level of an intruder was changed. */
  tcas_intruder_alert_changed: TCASIntruder;

  /** An intruder was removed. */
  tcas_intruder_removed: TCASIntruder;
}

/**
 * A TCAS-II-like system.
 */
export abstract class TCAS<I extends AbstractTCASIntruder = AbstractTCASIntruder, S extends TCASSensitivity = TCASSensitivity> {
  protected readonly operatingModeSub = Subject.create(TCASOperatingMode.Standby);

  protected readonly sensitivity: S;

  private readonly ownAirplane: OwnAirplane;

  protected readonly intrudersSorted: I[] = [];
  protected intrudersFiltered: I[] = [];

  private contactCreatedConsumer: Consumer<number> | undefined;
  private contactRemovedConsumer: Consumer<number> | undefined;

  private readonly contactCreatedHandler = this.onContactAdded.bind(this);
  private readonly contactRemovedHandler = this.onContactRemoved.bind(this);

  protected readonly ownAirplaneSubs = {
    position: GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0)),
    altitude: NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0)),
    groundTrack: Subject.create(0),
    groundSpeed: NumberUnitSubject.createFromNumberUnit(UnitType.KNOT.createNumber(0)),
    verticalSpeed: NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0))
  };

  protected isOwnAirplaneOnGround = false;

  protected lastUpdateSimTime = 0;
  protected lastUpdateRealTime = 0;

  private readonly alertLevelHandlers = new Map<TCASIntruder, () => void>();

  private readonly eventSubscriber = this.bus.getSubscriber<TCASEvents>();

  /**
   * Constructor.
   * @param bus The event bus.
   * @param tfcInstrument The traffic instrument which provides traffic contacts for this TCAS.
   * @param maxIntruderCount The maximum number of intruders tracked at any one time by this TCAS.
   * @param realTimeUpdateFreq The maximum update frequency (Hz) in real time.
   * @param simTimeUpdateFreq The maximum update frequency (Hz) in sim time.
   */
  constructor(
    protected readonly bus: EventBus,
    protected readonly tfcInstrument: TrafficInstrument,
    protected readonly maxIntruderCount: number,
    protected readonly realTimeUpdateFreq: number,
    protected readonly simTimeUpdateFreq: number
  ) {
    this.sensitivity = this.createSensitivity();
    this.ownAirplane = new OwnAirplane(this.ownAirplaneSubs);
  }

  /**
   * Creates a TCAS sensitivity object.
   * @returns A TCAS sensitivity object.
   */
  protected abstract createSensitivity(): S;

  /**
   * Gets this system's operating mode.
   * @returns This system's operating mode.
   */
  public getOperatingMode(): TCASOperatingMode {
    return this.operatingModeSub.get();
  }

  /**
   * Sets this system's operating mode.
   * @param mode The new operating mode.
   */
  public setOperatingMode(mode: TCASOperatingMode): void {
    this.operatingModeSub.set(mode);
  }

  /**
   * Gets an array of all currently tracked intruders. The intruders are sorted in order of decreasing threat.
   * @returns an array of all currently tracked intruders.
   */
  public getIntruders(): readonly TCASIntruder[] {
    return this.intrudersFiltered;
  }

  /**
   * Gets an event bus subscriber for TCAS events.
   * @returns an event bus subscriber for TCAS events..
   */
  public getEventSubscriber(): EventSubscriber<TCASEvents> {
    return this.eventSubscriber;
  }

  /**
   * Initializes this system.
   */
  public init(): void {
    // init contact listeners
    const sub = this.bus.getSubscriber<TrafficEvents>();
    this.contactCreatedConsumer = sub.on('traffic_contact_added');
    this.contactRemovedConsumer = sub.on('traffic_contact_removed');

    this.contactCreatedConsumer.handle(this.contactCreatedHandler);
    this.contactRemovedConsumer.handle(this.contactRemovedHandler);

    // add all existing contacts
    this.tfcInstrument.forEachContact(contact => { this.onContactAdded(contact.uid); });

    // own airplane listeners
    const gnssSub = this.bus.getSubscriber<GNSSEvents>();
    gnssSub.on('gps-position').atFrequency(this.realTimeUpdateFreq).handle(lla => { this.ownAirplaneSubs.position.set(lla.lat, lla.long); });
    gnssSub.on('track_deg_true').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(track => { this.ownAirplaneSubs.groundTrack.set(track); });
    gnssSub.on('ground_speed').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(gs => { this.ownAirplaneSubs.groundSpeed.set(gs); });

    const adcSub = this.bus.getSubscriber<ADCEvents>();
    adcSub.on('alt').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(alt => { this.ownAirplaneSubs.altitude.set(alt); });
    adcSub.on('vs').whenChanged().atFrequency(this.realTimeUpdateFreq).handle(vs => { this.ownAirplaneSubs.verticalSpeed.set(vs); });
    adcSub.on('on_ground').whenChanged().handle(isOnGround => { this.isOwnAirplaneOnGround = isOnGround; });

    // init operating mode notifier
    this.operatingModeSub.sub(mode => { this.bus.pub('tcas_operating_mode', mode, false, true); }, true);

    // init update loop
    this.bus.getSubscriber<ClockEvents>().on('simTime').whenChanged().handle(this.onSimTimeChanged.bind(this));
  }

  /**
   * Sorts two intruders.
   * @param a The first intruder.
   * @param b The second intruder.
   * @returns A negative number if `a` is to be sorted before `b`, a positive number if `b` is to be sorted before `a`,
   * and zero if the two are equal.
   */
  protected intruderComparator(a: I, b: I): number {
    // always sort intruders with valid predictions first
    if (a.isPredictionValid && !b.isPredictionValid) {
      return -1;
    } else if (!a.isPredictionValid && b.isPredictionValid) {
      return 1;
    } else if (a.isPredictionValid) {
      // always sort intruders predicted to violate protected zone first
      if (a.tcaNorm <= 1 && b.tcaNorm > 1) {
        return -1;
      } else if (a.tcaNorm > 1 && b.tcaNorm <= 1) {
        return 1;
      } else {
        // if both are predicted to violate protected zone, sort by TCA.
        // Otherwise sort by how close they approach the protected zone at TCA.
        const tcaComparison = a.tca.compare(b.tca);
        const normComparison = a.tcaNorm - b.tcaNorm;
        let firstComparison;
        let secondComparison;
        if (a.tcaNorm <= 1) {
          firstComparison = tcaComparison;
          secondComparison = normComparison;
        } else {
          firstComparison = normComparison;
          secondComparison = tcaComparison;
        }
        if (firstComparison === 0) {
          return secondComparison;
        } else {
          return firstComparison;
        }
      }
    } else {
      return 0;
    }
  }

  /**
   * Creates a TCAS intruder entry from a traffic contact.
   * @param contact A traffic contact.
   */
  protected abstract createIntruderEntry(contact: TrafficContact): I;

  /**
   * A callback which is called when a new traffic contact is added by this system's traffic instrument.
   * @param uid The ID number of the new contact.
   */
  private onContactAdded(uid: number): void {
    const contact = this.tfcInstrument.getContact(uid) as TrafficContact;
    const intruder = this.createIntruderEntry(contact);
    this.intrudersSorted.push(intruder);
  }

  /**
   * A callback which is called when a traffic contact is removed by this system's traffic instrument.
   * @param uid The ID number of the removed contact.
   */
  private onContactRemoved(uid: number): void {
    const sortedIndex = this.intrudersSorted.findIndex(intruder => intruder.contact.uid === uid);
    const culledIndex = this.intrudersFiltered.findIndex(intruder => intruder.contact.uid === uid);
    if (sortedIndex >= 0) {
      this.intrudersSorted.splice(sortedIndex, 1);
    }
    if (culledIndex >= 0) {
      const removed = this.intrudersFiltered[culledIndex];
      this.intrudersFiltered.splice(culledIndex, 1);
      this.cleanUpIntruder(removed);
    }
  }

  /**
   * A callback which is called when the sim time changes.
   * @param simTime The current sim time.
   */
  private onSimTimeChanged(simTime: number): void {
    if (this.operatingModeSub.get() === TCASOperatingMode.Standby) {
      return;
    }

    const realTime = Date.now();
    if (
      Math.abs(simTime - this.lastUpdateSimTime) < 1000 / this.simTimeUpdateFreq
      || Math.abs(realTime - this.lastUpdateRealTime) < 1000 / this.realTimeUpdateFreq) {
      return;
    }

    this.doUpdate(simTime);
    this.lastUpdateSimTime = simTime;
    this.lastUpdateRealTime = realTime;
  }

  /**
   * Executes an update.
   * @param simTime The current sim time.
   */
  protected doUpdate(simTime: number): void {
    this.updateSensitivity();
    this.updateIntruderPredictions(simTime);
    this.updateIntruderArrays();
    this.updateFilteredIntruderAlertLevels(simTime);
  }

  protected abstract updateSensitivity(): void;

  /**
   * Updates the TCA predictions for all intruders tracked by this system.
   * @param simTime The current sim time.
   */
  protected updateIntruderPredictions(simTime: number): void {
    this.ownAirplane.update(simTime);

    const lookaheadTime = this.sensitivity.lookaheadTime.get();
    const protectedRadius = this.sensitivity.protectedRadius.get();
    const protectedHeight = this.sensitivity.protectedHeight.get();

    const len = this.intrudersSorted.length;
    for (let i = 0; i < len; i++) {
      this.intrudersSorted[i].updatePrediction(simTime, this.ownAirplane, lookaheadTime, protectedRadius, protectedHeight);
    }
  }

  /**
   * Updates the arrays of intruders tracked by this system.
   */
  protected updateIntruderArrays(): void {
    this.intrudersSorted.sort(this.intruderComparator.bind(this));
    const oldCulled = this.intrudersFiltered;

    this.intrudersFiltered = [];
    const len = this.intrudersSorted.length;
    for (let i = 0; i < len; i++) {
      const intruder = this.intrudersSorted[i];
      if (i < this.maxIntruderCount && intruder.isPredictionValid) {
        this.intrudersFiltered.push(intruder);
        if (!oldCulled.includes(intruder)) {
          this.initIntruder(intruder);
        }
      } else {
        if (oldCulled.includes(intruder)) {
          this.cleanUpIntruder(intruder);
        }
      }
    }
  }

  /**
   * Updates the alert levels for all intruders tracked by this system that have not been filtered out.
   * @param simTime The current sim time.
   */
  protected updateFilteredIntruderAlertLevels(simTime: number): void {
    const len = this.intrudersFiltered.length;
    for (let i = 0; i < len; i++) {
      this.updateIntruderAlertLevel(simTime, this.intrudersFiltered[i]);
    }
  }

  /**
   * Updates an intruder's alert level.
   * @param simTime The current sim time.
   * @param intruder An intruder.
   */
  protected abstract updateIntruderAlertLevel(simTime: number, intruder: I): void;

  /**
   * Executes initialization code when an intruder is added.
   * @param intruder The newly added intruder.
   */
  private initIntruder(intruder: TCASIntruder): void {
    const handler = this.onAlertLevelChanged.bind(this, intruder);
    this.alertLevelHandlers.set(intruder, handler);
    intruder.alertLevel.sub(handler);
    this.bus.pub('tcas_intruder_added', intruder, false, false);
  }

  /**
   * Executes cleanup code when an intruder is removed.
   * @param intruder The intruder that was removed.
   */
  private cleanUpIntruder(intruder: TCASIntruder): void {
    const handler = this.alertLevelHandlers.get(intruder);
    handler && intruder.alertLevel.unsub(handler);
    this.bus.pub('tcas_intruder_removed', intruder, false, false);
  }

  /**
   * A callback which is called when an intruder's alert level changes.
   * @param intruder The intruder whose alert level changed.
   */
  private onAlertLevelChanged(intruder: TCASIntruder): void {
    this.bus.pub('tcas_intruder_alert_changed', intruder, false, false);
  }
}

/**
 * Subscribables which provide data related to the own airplane.
 */
type TrafficComputerOwnAirplaneSubs = {
  /** A subscribable which provides the own airplane's position. */
  position: Subscribable<GeoPointInterface>;

  /** A subscribable which provides the own airplane's altitude. */
  altitude: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;

  /** A subscribable which provides the own airplane's ground track. */
  groundTrack: Subscribable<number>;

  /** A subscribable which provides the own airplane's ground speed. */
  groundSpeed: Subscribable<NumberUnitInterface<UnitFamily.Speed>>;

  /** A subscribable which provides the own airplane's vertical speed. */
  verticalSpeed: Subscribable<NumberUnitInterface<UnitFamily.Speed>>;
};

/**
 * An airplane managed by TCAS.
 */
abstract class TCASAirplane {
  protected readonly _position = new GeoPoint(0, 0);
  /** The position of this airplane at the time of the most recent update. */
  public readonly position = this._position.readonly;

  /** The altitude of this airplane at the time of the most recent update. */
  protected readonly _altitude = UnitType.FOOT.createNumber(0);
  public readonly altitude = this._altitude.readonly;

  protected _groundTrack = 0;
  // eslint-disable-next-line jsdoc/require-returns
  /** The true ground track of this airplane at the time of the most recent update. */
  public get groundTrack(): number {
    return this._groundTrack;
  }

  /** The ground speed of this airplane at the time of the most recent update. */
  protected readonly _groundSpeed = UnitType.KNOT.createNumber(0);
  public readonly groundSpeed = this._groundSpeed.readonly;

  /** The vertical speed of this airplane at the time of the most recent update. */
  protected readonly _verticalSpeed = UnitType.FPM.createNumber(0);
  public readonly verticalSpeed = this._verticalSpeed.readonly;

  /**
   * The 3D position vector of this airplane at the time of the last update. Each component is expressed in units of
   * meters. The coordinate system is an Euclidean approximation of the geodetic space around the own airplane such
   * that the z-coordinate represents orthometric height and the x- and y-coordinates represent an east-
   * counterclockwise equirectangular projection of latitude and longitude, with the origin at the location of the own
   * airplane.
   */
  public readonly positionVec = new Float64Array(3);

  /**
   * The 3D velocity vector of this airplane at the time of the last update. Each component is expressed in units of
   * meters per second. The coordinate system is defined the same as for position vectors.
   */
  public readonly velocityVec = new Float64Array(3);

  protected lastUpdateTime = 0;
}

/**
 * The own airplane managed by TCAS.
 */
class OwnAirplane extends TCASAirplane {
  /**
   * Constructor.
   * @param subs Subscribables which provide data related to this airplane.
   */
  constructor(private readonly subs: TrafficComputerOwnAirplaneSubs) {
    super();
  }

  /**
   * Updates this airplane's position, altitude, ground track, ground speed, and vertical speed.
   */
  private updateParameters(): void {
    this._position.set(this.subs.position.get());
    this._altitude.set(this.subs.altitude.get());
    this._groundTrack = this.subs.groundTrack.get();
    this._groundSpeed.set(this.subs.groundSpeed.get());
    this._verticalSpeed.set(this.subs.verticalSpeed.get());
  }

  /**
   * Updates this airplane's position and velocity vectors.
   */
  private updateVectors(): void {
    Vec2Math.setFromPolar(this._groundSpeed.asUnit(UnitType.MPS), (90 - this._groundTrack) * Avionics.Utils.DEG2RAD, this.velocityVec);
    const verticalVelocity = this._verticalSpeed.asUnit(UnitType.MPS);
    this.velocityVec[2] = verticalVelocity;
  }

  /**
   * Updates this airplane's position and velocity data.
   * @param simTime The current sim time, as a UNIX millisecond timestamp.
   */
  public update(simTime: number): void {
    this.updateParameters();
    this.updateVectors();
    this.lastUpdateTime = simTime;
  }
}

/**
 * A TCA solution.
 */
type TcaSolution = {
  /** The TCA, in seconds from the present. */
  tca: number;

  /** The intruder displacement vector from own airplane at TCA. */
  displacement: Float64Array;

  /** The cylindrical norm of the TCA displacement vector. */
  norm: number;
};

/**
 * An abstract implementation of TCASIntruder.
 */
export abstract class AbstractTCASIntruder extends TCASAirplane implements TCASIntruder {
  private static readonly MIN_GROUND_SPEED = UnitType.KNOT.createNumber(30);

  private static readonly vec2Cache = [new Float64Array(2), new Float64Array(2)];
  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3)];
  private static readonly solutionCache: TcaSolution[] = [
    {
      tca: 0,
      displacement: new Float64Array(3),
      norm: 0
    },
    {
      tca: 0,
      displacement: new Float64Array(3),
      norm: 0
    }
  ]

  public readonly alertLevel = Subject.create(TCASAlertLevel.None);

  /** The 3D position vector of this intruder relative to own airplane. */
  public readonly relativePositionVec = new Float64Array(3);

  /** The 3D velocity vector of this intruder relative to own airplane. */
  public readonly relativeVelocityVec = new Float64Array(3);

  private _isPredictionValid = false;
  // eslint-disable-next-line jsdoc/require-returns
  /** Whether there is a valid prediction for time of closest approach between this intruder and own airplane. */
  public get isPredictionValid(): boolean {
    return this._isPredictionValid;
  }

  private readonly _tca = UnitType.SECOND.createNumber(NaN);
  /** Time to closest approach between this intruder and own airplane. */
  public readonly tca = this._tca.readonly;

  private _tcaNorm = NaN;
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * The cylindrical norm of the predicted displacement vector between this intruder and own airplane at time of
   * closest approach. A value less than or equal to 1 indicates the intruder will be inside the protected zone.
   * Larger values correspond to greater separation.
   */
  public get tcaNorm(): number {
    return this._tcaNorm;
  }

  /** The predicted 3D displacement vector from own airplane to this intruder at time of closest approach. */
  public readonly tcaDisplacement = new Float64Array(3);

  private readonly _tcaHorizontalSep = UnitType.NMILE.createNumber(0);
  /** The predicted horizontal separation between this intruder and own airplane at time of closest approach. */
  public readonly tcaHorizontalSep = this._tcaHorizontalSep.readonly;

  private readonly _tcaVerticalSep = UnitType.FOOT.createNumber(0);
  /** The predicted vertical separation between this intruder and own airplane at time of closest approach. */
  public readonly tcaVerticalSep = this._tcaVerticalSep.readonly;

  /**
   * Constructor.
   * @param contact The traffic contact associated with this intruder.
   */
  constructor(public readonly contact: TrafficContact) {
    super();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public predictDisplacement(simTime: number, out: Float64Array): Float64Array {
    if (!this._isPredictionValid) {
      return Vec3Math.set(NaN, NaN, NaN, out);
    }

    const dt = (simTime - this.contact.lastContactTime) / 1000;
    return Vec3Math.add(this.relativePositionVec, Vec3Math.multScalar(this.relativeVelocityVec, dt, out), out);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public predictSeparation(simTime: number, horizontalOut: NumberUnit<UnitFamily.Distance>, verticalOut: NumberUnit<UnitFamily.Distance>): void {
    if (!this._isPredictionValid) {
      horizontalOut.set(NaN);
      verticalOut.set(NaN);
      return;
    }

    const displacement = this.predictDisplacement(simTime, AbstractTCASIntruder.vec3Cache[0]);
    AbstractTCASIntruder.displacementToHorizontalSeparation(displacement, horizontalOut);
    AbstractTCASIntruder.displacementToVerticalSeparation(displacement, verticalOut);
  }

  /**
   * Updates this intruder's predicted TCA and related data.
   * @param simTime The current sim time.
   * @param ownAirplane Own airplane.
   * @param lookaheadTime The maximum lookahead time to calculate TCA.
   * @param protectedRadius The radius of the own airplane's protected zone.
   * @param protectedHeight The half-height of the own airplane's protected zone.
   */
  public updatePrediction(
    simTime: number,
    ownAirplane: OwnAirplane,
    lookaheadTime: NumberUnitInterface<UnitFamily.Duration>,
    protectedRadius: NumberUnitInterface<UnitFamily.Distance>,
    protectedHeight: NumberUnitInterface<UnitFamily.Distance>
  ): void {
    this.updateParameters(simTime, ownAirplane);

    if (this.isPredictionValid) {
      this.updateTCA(ownAirplane, lookaheadTime, protectedRadius, protectedHeight);
    } else {
      this.invalidatePrediction();
    }

    this.lastUpdateTime = simTime;
  }

  /**
   * Updates this intruder's position and velocity data.
   * @param simTime The current sim time.
   * @param ownAirplane The own airplane.
   */
  private updateParameters(simTime: number, ownAirplane: OwnAirplane): void {
    if (isNaN(this.contact.groundTrack) || this.contact.groundSpeed.compare(AbstractTCASIntruder.MIN_GROUND_SPEED) < 0) {
      this._isPredictionValid = false;
      this._position.set(NaN, NaN);
      this._altitude.set(NaN);
      this._groundTrack = NaN;
      this._groundSpeed.set(NaN);
      this._verticalSpeed.set(NaN);
      Vec3Math.set(NaN, NaN, NaN, this.positionVec);
      Vec3Math.set(NaN, NaN, NaN, this.velocityVec);
    } else {
      this.updatePosition(simTime, ownAirplane);
      this.updateVelocity();
      this._groundSpeed.set(this.contact.groundSpeed);
      this._verticalSpeed.set(this.contact.verticalSpeed);
      this._isPredictionValid = true;
    }
  }

  /**
   * Updates this intruder's position.
   * @param simTime The current sim time.
   * @param ownAirplane The own airplane.
   */
  private updatePosition(simTime: number, ownAirplane: OwnAirplane): void {
    this.contact.predict(simTime, this._position, this._altitude);
    this._groundTrack = this._position.equals(this.contact.lastPosition) ? this.contact.groundTrack : this._position.bearingFrom(this.contact.lastPosition);

    const distance = UnitType.GA_RADIAN.convertTo(this._position.distance(ownAirplane.position), UnitType.METER);
    const bearing = ownAirplane.position.bearingTo(this._position);
    Vec2Math.setFromPolar(distance, (90 - bearing) * Avionics.Utils.DEG2RAD, this.positionVec);
    const verticalPosition = this._altitude.asUnit(UnitType.METER) - ownAirplane.altitude.asUnit(UnitType.METER);
    this.positionVec[2] = verticalPosition;
  }

  /**
   * Updates this intruder's velocity.
   */
  private updateVelocity(): void {
    Vec2Math.setFromPolar(this.contact.groundSpeed.asUnit(UnitType.MPS), (90 - this.contact.groundTrack) * Avionics.Utils.DEG2RAD, this.velocityVec);
    const verticalVelocity = this.contact.verticalSpeed.asUnit(UnitType.MPS);
    this.velocityVec[2] = verticalVelocity;
  }

  /**
   * Updates the time-to-closest-approach (TCA) and related data of this intruder.
   * @param ownAirplane The own airplane.
   * @param lookaheadTime The maximum lookahead time.
   * @param protectedRadius The radius of the own airplane's protected zone.
   * @param protectedHeight The half-height of the own airplane's protected zone.
   */
  private updateTCA(
    ownAirplane: OwnAirplane,
    lookaheadTime: NumberUnitInterface<UnitFamily.Duration>,
    protectedRadius: NumberUnitInterface<UnitFamily.Distance>,
    protectedHeight: NumberUnitInterface<UnitFamily.Distance>
  ): void {
    // Source: Munoz, CA and Narkawicz, AJ. "Time of Closest Approach in Three-Dimensional Airspace." 2010.
    // https://ntrs.nasa.gov/api/citations/20100037766/downloads/20100037766.pdf
    const s = Vec3Math.sub(this.positionVec, ownAirplane.positionVec, this.relativePositionVec);
    const v = Vec3Math.sub(this.velocityVec, ownAirplane.velocityVec, this.relativeVelocityVec);
    const sHoriz = Vec2Math.set(s[0], s[1], AbstractTCASIntruder.vec2Cache[0]);
    const vHoriz = Vec2Math.set(v[0], v[1], AbstractTCASIntruder.vec2Cache[0]);
    const h = protectedHeight.asUnit(UnitType.METER);
    const r = protectedRadius.asUnit(UnitType.METER);

    const vHorizSquared = Vec2Math.dot(vHoriz, vHoriz);
    const sHorizSquared = Vec2Math.dot(sHoriz, sHoriz);
    const hSquared = h * h;
    const rSquared = r * r;
    const a = (v[2] * v[2]) / hSquared - vHorizSquared / rSquared;
    const b = 2 * s[2] * v[2] / hSquared - 2 * Vec2Math.dot(sHoriz, vHoriz) / rSquared;
    const c = (s[2] * s[2]) / hSquared - sHorizSquared / rSquared;

    const solution = AbstractTCASIntruder.calculateSolution(0, s, v, r, h, AbstractTCASIntruder.solutionCache[0]);
    if (vHorizSquared !== 0) {
      const t = -Vec2Math.dot(sHoriz, vHoriz) / vHorizSquared;
      if (t > 0) {
        AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
      }
    }
    if (v[2] !== 0) {
      const t = -s[2] / v[2];
      if (t > 0) {
        AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
      }
    }
    const discriminant = b * b - 4 * a * c;
    if (a !== 0 && discriminant >= 0) {
      const sqrt = Math.sqrt(discriminant);
      let t = (-b + sqrt) / (2 * a);
      if (t > 0) {
        AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
      }
      t = (-b - sqrt) / (2 * a);
      if (t > 0) {
        AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
      }
    } else if (a === 0 && b !== 0) {
      const t = -c / b;
      if (t > 0) {
        AbstractTCASIntruder.evaluateCandidate(t, s, v, r, h, solution, AbstractTCASIntruder.solutionCache[1]);
      }
    }

    const lookaheadTimeSeconds = lookaheadTime.asUnit(UnitType.SECOND);
    if (solution.tca > lookaheadTimeSeconds) {
      AbstractTCASIntruder.calculateSolution(lookaheadTimeSeconds, s, v, r, h, solution);
    }

    this._tca.set(solution.tca);
    this._tcaNorm = solution.norm;
    AbstractTCASIntruder.displacementToHorizontalSeparation(solution.displacement, this._tcaHorizontalSep);
    AbstractTCASIntruder.displacementToVerticalSeparation(solution.displacement, this._tcaVerticalSep);
  }

  /**
   * Invalidates this intruder's predicted TCA and related data.
   */
  private invalidatePrediction(): void {
    Vec3Math.set(NaN, NaN, NaN, this.relativePositionVec);
    Vec3Math.set(NaN, NaN, NaN, this.relativeVelocityVec);
    this._tca.set(NaN);
    this._tcaNorm = NaN;
    Vec3Math.set(NaN, NaN, NaN, this.tcaDisplacement);
    this._tcaHorizontalSep.set(NaN);
    this._tcaVerticalSep.set(NaN);
  }

  /**
   * Evaluates a TCA candidate against the best existing solution, and if the candidate produces a smaller cylindrical
   * norm, replaces the best existing solution with the candidate.
   * @param t The candidate TCA time, in seconds.
   * @param s The relative position vector of the intruder, in meters.
   * @param v The relative velocity vector of the intruder, in meters per second.
   * @param r The radius of the own airplane's protected zone, in meters.
   * @param h The half-height of the own airplane's protected zone, in meters.
   * @param best The best existing solution.
   * @param candidate A TcaSolution object to which to temporarily write the candidate solution.
   */
  private static evaluateCandidate(t: number, s: Float64Array, v: Float64Array, r: number, h: number, best: TcaSolution, candidate: TcaSolution): void {
    AbstractTCASIntruder.calculateSolution(t, s, v, r, h, candidate);
    if (candidate.norm < best.norm) {
      AbstractTCASIntruder.copySolution(candidate, best);
    }
  }

  /**
   * Calculates a TCA solution.
   * @param t The candidate TCA time, in seconds.
   * @param s The relative position vector of the intruder, in meters.
   * @param v The relative velocity vector of the intruder, in meters per second.
   * @param r The radius of the own airplane's protected zone, in meters.
   * @param h The half-height of the own airplane's protected zone, in meters.
   * @param out A TcaSolution object to which to write the result.
   * @returns A TCA solution.
   */
  private static calculateSolution(t: number, s: Float64Array, v: Float64Array, r: number, h: number, out: TcaSolution): TcaSolution {
    out.tca = t;
    AbstractTCASIntruder.calculateDisplacementVector(s, v, t, out.displacement);
    out.norm = AbstractTCASIntruder.calculateCylindricalNorm(out.displacement, r, h);
    return out;
  }

  /**
   * Copies a TCA solution.
   * @param from The solution from which to copy.
   * @param to The solution to which to copy.
   */
  private static copySolution(from: TcaSolution, to: TcaSolution): void {
    to.tca = from.tca;
    Vec3Math.copy(from.displacement, to.displacement);
    to.norm = from.norm;
  }

  /**
   * Calculates a time-offset displacement vector given an initial displacement, a velocity vector, and elapsed time.
   * @param initial The initial displacement vector.
   * @param velocity A velocity vector.
   * @param elapsedTime The elapsed time.
   * @param out A Float64Array object to which to write the result.
   * @returns The time-offset displacement vector.
   */
  private static calculateDisplacementVector(initial: Float64Array, velocity: Float64Array, elapsedTime: number, out: Float64Array): Float64Array {
    return Vec3Math.add(initial, Vec3Math.multScalar(velocity, elapsedTime, out), out);
  }

  /**
   * Calculates a cylindrical norm.
   * @param vector A displacement vector.
   * @param radius The radius of the protected zone.
   * @param halfHeight The half-height of the protected zone.
   * @returns A cylindrical norm.
   */
  private static calculateCylindricalNorm(vector: Float64Array, radius: number, halfHeight: number): number {
    const horizLength = Math.hypot(vector[0], vector[1]);
    return Math.max(Math.abs(vector[2]) / halfHeight, horizLength / radius);
  }

  /**
   * Converts a 3D displacement vector to a horizontal separation distance.
   * @param displacement A displacement vector, in meters.
   * @param out A NumberUnit object to which to write the result.
   * @returns The horizontal separation distance corresponding to the displacement vector.
   */
  private static displacementToHorizontalSeparation(displacement: Float64Array, out: NumberUnit<UnitFamily.Distance>): NumberUnit<UnitFamily.Distance> {
    return out.set(Math.hypot(displacement[0], displacement[1]), UnitType.METER);
  }

  /**
   * Converts a 3D displacement vector to a vertical separation distance.
   * @param displacement A displacement vector, in meters.
   * @param out A NumberUnit object to which to write the result.
   * @returns The vertical separation distance corresponding to the displacement vector.
   */
  private static displacementToVerticalSeparation(displacement: Float64Array, out: NumberUnit<UnitFamily.Distance>): NumberUnit<UnitFamily.Distance> {
    return out.set(Math.abs(displacement[2]), UnitType.METER);
  }
}

/**
 * An abstract implementation of TCASSensitivity.
 */
export abstract class AbstractTCASSensitivity implements TCASSensitivity {
  public readonly lookaheadTime = NumberUnitSubject.createFromNumberUnit(UnitType.SECOND.createNumber(0));
  public readonly protectedRadius = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(0));
  public readonly protectedHeight = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));
}