import { EventBus } from '../data/EventBus';
import { GeoPoint, GeoPointReadOnly } from '../utils/geo/GeoPoint';
import { ExpSmoother } from '../utils/math/ExpSmoother';
import { NumberUnit, NumberUnitReadOnly, UnitFamily, UnitType } from '../utils/math/NumberUnit';
import { Wait } from '../utils/Wait';
import { Instrument } from './Backplane';
import { ClockEvents } from './Clock';

/**
 * Traffic events.
 */
export interface TrafficEvents {
  /** A traffic contact was added. The value is the uid of the new contact. */
  traffic_contact_added: number;

  /** A traffic contact was updated. The value is the uid of the updated contact. */
  traffic_contact_updated: number;

  /** A traffic contact was removed. The value is the uid of the removed contact. */
  traffic_contact_removed: number;
}

/**
 * A traffic contact.
 */
export interface TrafficContact {
  /** A unique ID number assigned to this contact. */
  readonly uid: number;

  /** The last time of contact, in sim time, as a UNIX millisecond timestamp. */
  readonly lastContactTime: number;

  /** The position of this contact at time of last contact. */
  readonly lastPosition: GeoPointReadOnly;

  /** The altitude of this contact at time of last contact. */
  readonly lastAltitude: NumberUnitReadOnly<UnitFamily.Distance>;

  /** The heading of this contact at time of last contact. */
  readonly lastHeading: number,

  /** The most recent calculated ground speed of this contact. Equal to NaN if not yet been calculated. */
  readonly groundSpeed: NumberUnitReadOnly<UnitFamily.Speed>;

  /** The most recent calculated ground track of this contact. Equal to NaN if not yet been calculated. */
  readonly groundTrack: number,

  /** The most recent calculaed vertical speed of this contact. Equal to NaN if not yet been calculated. */
  readonly verticalSpeed: NumberUnitReadOnly<UnitFamily.Speed>;

  /**
   * Calculates the predicted position and altitude of this contact at a specified time based on the most recent
   * available data and stores the results in the supplied objects. If insufficient data are available to calculate
   * the prediction, the results will be equal to NaN.
   * @param simTime The sim time for which to calculate the prediction, as a UNIX millisecond timestamp.
   * @param positionOut A GeoPoint object to which to write the predicted position.
   * @param altitudeOut A NumberUnit object to which to write the predicted altitude.
   */
  predict(simTime: number, positionOut: GeoPoint, altitudeOut: NumberUnit<UnitFamily.Distance>): void;
}

/**
 * Initialization options for TrafficInstrument.
 */
export type TrafficInstrumentOptions = {
  /** The maximum update frequency (Hz) in real time. */
  realTimeUpdateFreq: number;

  /** The maximum update frequency (Hz) in sim time. */
  simTimeUpdateFreq: number;

  /**
   * The maximum amount of sim time elapsed, in milliseconds, since last contact allowed before a contact is
   * deprecated.
   */
  contactDeprecateTime: number;
};

/**
 * Tracks aircraft traffic. Maintains a list of contacts, periodically updates their position, altitude, and reported
 * heading, and uses these data to compute ground speed, ground track, and vertical speed.
 */
export class TrafficInstrument implements Instrument {
  private readonly options: TrafficInstrumentOptions;

  private readonly tracked = new Map<number, TrafficContactClass>();

  private lastUpdateRealTime = 0;
  private lastUpdateSimTime = 0;
  private isBusy = false;

  /**
   * Constructor.
   * @param bus The event bus.
   * @param options Options with which to initialize this instrument.
   */
  constructor(private readonly bus: EventBus, options: TrafficInstrumentOptions) {
    this.options = Object.assign({}, options);
  }

  /**
   * Retrieves a traffic contact by its assigned ID number.
   * @param uid an ID number.
   * @returns the traffic contact with the assigned ID number, or undefined if no such contact exists.
   */
  public getContact(uid: number): TrafficContact | undefined {
    return this.tracked.get(uid);
  }

  /**
   * Iterates through all tracked traffic contacts with a visitor function.
   * @param visitor A visitor function.
   */
  public forEachContact(visitor: (contact: TrafficContact) => void): void {
    this.tracked.forEach(visitor);
  }

  /**
   * Initializes this instrument. Once initialized, this instrument will automatically track and update traffic
   * contacts.
   */
  public init(): void {
    this.bus.getSubscriber<ClockEvents>()
      .on('simTime')
      .whenChanged()
      .handle(this.onSimTimeChanged.bind(this));
  }

  /**
   * Updates this instrument's list of contacts.
   * @param data An array of the most recent traffic data entries.
   * @param simTime The sim time at which the traffic data was generated.
   */
  private updateContacts(data: TrafficDataEntry[], simTime: number): void {
    const len = data.length;
    for (let i = 0; i < len; i++) {
      const entry = data[i];
      const contact = this.tracked.get(entry.uId);
      if (contact) {
        this.updateContact(contact, entry, simTime);
      } else {
        this.createContact(entry, simTime);
      }
    }
  }

  /**
   * Creates a contact.
   * @param entry The traffic data entry from which to create the new contact.
   * @param simTime The sim time at which the traffic data entry was generated.
   */
  private createContact(entry: TrafficDataEntry, simTime: number): void {
    const contact = new TrafficContactClass(entry.uId, 1000 / this.options.simTimeUpdateFreq * 5);
    this.tracked.set(contact.uid, contact);

    contact.update(entry.lat, entry.lon, UnitType.METER.convertTo(entry.alt, UnitType.FOOT), entry.heading, simTime);
    this.bus.pub('traffic_contact_added', contact.uid, false, false);
  }

  /**
   * Updates a contact.
   * @param contact The contact to update.
   * @param entry The current traffic data entry for the contact.
   * @param simTime The sim time at which the traffic data entry was generated.
   */
  private updateContact(contact: TrafficContactClass, entry: TrafficDataEntry, simTime: number): void {
    contact.update(entry.lat, entry.lon, UnitType.METER.convertTo(entry.alt, UnitType.FOOT), entry.heading, simTime);
    this.bus.pub('traffic_contact_updated', contact.uid, false, false);
  }

  /**
   * Removes all contacts whose time since last contact exceeds the deprecation threshold.
   * @param simTime The current sim time.
   */
  private deprecateContacts(simTime: number): void {
    this.tracked.forEach(contact => {
      const dt = Math.abs(simTime - contact.lastContactTime);
      if (dt >= this.options.contactDeprecateTime) {
        this.tracked.delete(contact.uid);
        this.bus.pub('traffic_contact_removed', contact.uid, false, false);
      }
    });
  }

  /**
   * A callback which is called when the sim time changes.
   * @param simTime The current sim time.
   */
  private async onSimTimeChanged(simTime: number): Promise<void> {
    const realTime = Date.now();
    if (
      this.isBusy
      || Math.abs(simTime - this.lastUpdateSimTime) < 1000 / this.options.simTimeUpdateFreq
      || Math.abs(realTime - this.lastUpdateRealTime) < 1000 / this.options.realTimeUpdateFreq) {
      return;
    }

    this.isBusy = true;
    try {
      const data = await Promise.race([Coherent.call('GET_AIR_TRAFFIC'), Wait.awaitDelay(1000)]);

      if (data) {
        this.updateContacts(data, simTime);
        this.deprecateContacts(simTime);
        this.lastUpdateSimTime = simTime;
        this.lastUpdateRealTime = realTime;
      }
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        console.error(e.stack);
      }
    }

    this.isBusy = false;
  }

  /**
   * This method does nothing.
   */
  public onUpdate(): void {
    // noop
  }
}

/**
 * A traffic data entry provided by the sim.
 */
type TrafficDataEntry = {
  /** A unique ID number assigned to this entry. */
  readonly uId: number,

  /** This entry's current reported latitude. */
  readonly lat: number,

  /** This entry's current reported longitude. */
  readonly lon: number,

  /** This entry's current reported altitude. */
  readonly alt: number,

  /** This entry's current reported heading. */
  readonly heading: number
};

/**
 * An aircraft contact that is being tracked. Each contact tracks its last reported position, altitude, and heading.
 * Successively updating these values will allow ground speed, ground track, and vertical speed to be calculated based
 * on changes in the values over time. The calculated values are exponentially smoothed to reduce artifacts from
 * potentially noisy data.
 */
class TrafficContactClass implements TrafficContact {
  private static readonly GROUND_SPEED_TIME_CONSTANT = 2 / Math.LN2;
  private static readonly GROUND_TRACK_TIME_CONSTANT = 2 / Math.LN2;
  private static readonly VERTICAL_SPEED_TIME_CONSTANT = 2 / Math.LN2;

  private static readonly MAX_VALID_GROUND_SPEED = 1500; // knots
  private static readonly MAX_VALID_VERTICAL_SPEED = 10000; // fpm
  private static readonly MIN_GROUND_TRACK_DISTANCE = 10 / 1852; // nautical miles

  private static readonly tempGeoPoint = new GeoPoint(0, 0);

  // reported data

  private readonly _lastPosition = new GeoPoint(NaN, NaN);
  public readonly lastPosition = this._lastPosition.readonly;

  private readonly _lastAltitude = UnitType.FOOT.createNumber(NaN);
  public readonly lastAltitude = this._lastAltitude.readonly;

  private _lastHeading = NaN;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public get lastHeading(): number {
    return this._lastHeading;
  }

  private _lastContactTime = NaN;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public get lastContactTime(): number {
    return this._lastContactTime;
  }

  // computed data

  private readonly _groundSpeed = UnitType.KNOT.createNumber(NaN);
  public readonly groundSpeed = this._groundSpeed.readonly;

  private _groundTrack = NaN;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public get groundTrack(): number {
    return this._groundTrack;
  }

  private readonly _verticalSpeed = UnitType.FPM.createNumber(NaN);
  public readonly verticalSpeed = this._verticalSpeed.readonly;

  private readonly groundSpeedSmoother = new ExpSmoother(TrafficContactClass.GROUND_SPEED_TIME_CONSTANT, null, this.contactTimeResetThreshold / 1000);
  private readonly groundTrackSmoother = new ExpSmoother(TrafficContactClass.GROUND_TRACK_TIME_CONSTANT, null, this.contactTimeResetThreshold / 1000);
  private readonly verticalSpeedSmoother = new ExpSmoother(TrafficContactClass.VERTICAL_SPEED_TIME_CONSTANT, null, this.contactTimeResetThreshold / 1000);

  /**
   * Constructor.
   * @param uid This contact's unique ID number.
   * @param contactTimeResetThreshold The maximum allowed elapsed sim time, in milliseconds, since time of last contact
   * before this contact's computed values are reset.
   */
  constructor(public readonly uid: number, private readonly contactTimeResetThreshold: number) {
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public predict(simTime: number, positionOut: GeoPoint, altitudeOut: NumberUnit<UnitFamily.Distance>): void {
    if (this.groundSpeed.isNaN()) {
      positionOut.set(NaN, NaN);
      altitudeOut.set(NaN);
      return;
    }

    const dt = simTime - this.lastContactTime;

    const distance = UnitType.NMILE.convertTo(this._groundSpeed.number * (dt / 3600000), UnitType.GA_RADIAN);
    this._lastPosition.offset(this._groundTrack, distance, positionOut);

    const deltaAlt = this._verticalSpeed.number * (dt / 60000);
    this._lastAltitude.add(deltaAlt, UnitType.FOOT, altitudeOut);
  }

  /**
   * Updates this contact with the current reported position, altitude and heading. Also updates the computed ground
   * speed, ground track, and vertical speed if there are sufficient data to do so.
   * @param lat The current reported latitude.
   * @param lon The current reported longitude.
   * @param altitude The current reported altitude, in feet.
   * @param heading The current reported heading.
   * @param simTime The current sim time.
   */
  public update(lat: number, lon: number, altitude: number, heading: number, simTime: number): void {
    const dt = simTime - this._lastContactTime;

    if (!isNaN(dt) && (dt < 0 || dt > this.contactTimeResetThreshold)) {
      this.reset(lat, lon, altitude, heading, simTime);
      return;
    }

    if (!isNaN(dt) && dt > 0) {
      this.updateComputedValues(dt / 1000, lat, lon, altitude);
    }

    this.setReportedValues(lat, lon, altitude, heading);

    if (this.areComputedValuesValid()) {
      this._lastContactTime = simTime;
    } else {
      this.reset(lat, lon, altitude, heading, simTime);
    }
  }

  /**
   * Erases this contact's tracking history and sets the initial reported position, altitude, and heading.
   * @param lat The current reported latitude.
   * @param lon The current reported longitude.
   * @param altitude The current reported altitude, in feet.
   * @param heading The current reported heading.
   * @param simTime The current sim time.
   */
  public reset(lat: number, lon: number, altitude: number, heading: number, simTime: number): void {
    this.setReportedValues(lat, lon, altitude, heading);
    this._groundSpeed.set(NaN);
    this._groundTrack = NaN;
    this._verticalSpeed.set(NaN);
    this.groundSpeedSmoother.reset();
    this.groundTrackSmoother.reset();
    this.verticalSpeedSmoother.reset();
    this._lastContactTime = simTime;
  }

  /**
   * Sets the most recent reported values.
   * @param lat The reported latitude.
   * @param lon The reported longitude.
   * @param altitude The reported altitude, in feet.
   * @param heading The reported heading.
   */
  private setReportedValues(lat: number, lon: number, altitude: number, heading: number): void {
    this._lastPosition.set(lat, lon);
    this._lastAltitude.set(altitude);
    this._lastHeading = heading;
  }

  /**
   * Updates this contact's computed values.
   * @param dt The elapsed time, in seconds, since last contact.
   * @param lat The current reported latitude.
   * @param lon The current reported longitude.
   * @param altitude The current reported altitude, in feet.
   */
  private updateComputedValues(dt: number, lat: number, lon: number, altitude: number): void {
    const pos = TrafficContactClass.tempGeoPoint.set(lat, lon);
    const distanceNM = UnitType.GA_RADIAN.convertTo(this.lastPosition.distance(pos), UnitType.NMILE);
    const track = pos.bearingFrom(this._lastPosition);
    this.updateGroundSpeed(dt, distanceNM);
    this.updateGroundTrack(dt, track, distanceNM);
    this.updateVerticalSpeed(dt, altitude);
  }

  /**
   * Updates this contact's ground speed.
   * @param dt The elapsed time, in seconds, since last contact.
   * @param distanceNM The distance, in nautical miles, from this contact's position at last contact to this contact's
   * current reported position.
   */
  private updateGroundSpeed(dt: number, distanceNM: number): void {
    const dtHours = dt / 3600;
    const speedKnots = distanceNM / dtHours;
    this._groundSpeed.set(this.groundSpeedSmoother.next(speedKnots, dt));
  }

  /**
   * Updates this contact's ground track.
   * @param dt The elapsed time, in seconds, since last contact.
   * @param track The true ground track from this contact's position at last contact to this contact's current reported
   * position, as measured at the current reported position.
   * @param distanceNM The distance, in nautical miles, from this contact's position at last contact to this contact's
   * current reported position.
   */
  private updateGroundTrack(dt: number, track: number, distanceNM: number): void {
    const last = this.groundTrackSmoother.last();
    if (distanceNM >= TrafficContactClass.MIN_GROUND_TRACK_DISTANCE) {
      if (last !== null && !isNaN(last)) {
        // need to handle wraparounds
        let delta = track - last;
        if (delta > 180) {
          delta = delta - 360;
        } else if (delta < -180) {
          delta = delta + 360;
        }
        track = last + delta;
      }
    } else {
      // if distance between current and last position is too small, computed ground track will be unreliable
      // (and if distance = 0 the track will be meaningless), so we just copy forward the last computed track,
      // or NaN if there is no previously computed track
      track = last === null ? NaN : last;
    }
    const next = last !== null && isNaN(last) ? this.groundTrackSmoother.reset(track) : this.groundTrackSmoother.next(track, dt);
    this._groundTrack = (next + 360) % 360; // enforce range 0-359
  }

  /**
   * Updates this contact's vertical speed.
   * @param dt The elapsed time, in seconds, since last contact.
   * @param altitude The current reported altitude, in feet.
   */
  private updateVerticalSpeed(dt: number, altitude: number): void {
    const dtMin = dt / 60;
    const deltaAltFeet = altitude - this._lastAltitude.number;
    const vsFPM = deltaAltFeet / dtMin;
    this._verticalSpeed.set(this.verticalSpeedSmoother.next(vsFPM, dt));
  }

  /**
   * Checks whether this contact's calculated ground speed and vertical speeds are valid.
   * @returns whether this contact's calculated ground speed and vertical speeds are valid.
   */
  private areComputedValuesValid(): boolean {
    const isGroundSpeedValid = this._groundSpeed.isNaN() || this._groundSpeed.number <= TrafficContactClass.MAX_VALID_GROUND_SPEED;
    const isVerticalSpeedValid = this._verticalSpeed.isNaN() || this._verticalSpeed.number <= TrafficContactClass.MAX_VALID_VERTICAL_SPEED;
    return isGroundSpeedValid && isVerticalSpeedValid;
  }
}