import { GeoPoint, GeoPointSubject, NumberUnitSubject, Subject, UnitType } from '../../..';
import { Consumer, EventBus } from '../../../data';
import { ADCEvents, GNSSEvents } from '../../../instruments';

/**
 * A module describing the state of the own airplane.
 */
export class MapOwnAirplanePropsModule {
  /** The airplane's position. */
  public readonly position = GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0));

  /** The airplane's true heading, in degrees. */
  public readonly hdgTrue = Subject.create(0);

  /** The airplane's turn rate, in degrees per second. */
  public readonly turnRate = Subject.create(0);

  /** The airplane's indicated altitude. */
  public readonly altitude = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));

  /** The airplane's vertical speed. */
  public readonly verticalSpeed = NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0));

  /** The airplane's true ground track, in degrees. */
  public readonly trackTrue = Subject.create(0);

  /** The airplane's ground speed. */
  public readonly groundSpeed = NumberUnitSubject.createFromNumberUnit(UnitType.KNOT.createNumber(0));

  /** Whether the airplane is on the ground. */
  public readonly isOnGround = Subject.create(true);

  /** The magnetic variation at the airplane's position. */
  public readonly magVar = Subject.create(0);

  private readonly positionHandler = (pos: LatLongAlt): void => {
    this.position.set(pos.lat, pos.long);
  };
  private readonly headingHandler = (heading: number): void => {
    this.hdgTrue.set(heading);
  };
  private readonly turnRateHandler = (turnRate: number): void => {
    this.turnRate.set(turnRate);
  };
  private readonly altitudeHandler = (alt: number): void => {
    this.altitude.set(alt);
  };
  private readonly verticalSpeedHandler = (vs: number): void => {
    this.verticalSpeed.set(vs);
  };
  private readonly trackHandler = (track: number): void => {
    this.trackTrue.set(track);
  };
  private readonly groundSpeedHandler = (gs: number): void => {
    this.groundSpeed.set(gs);
  };
  private readonly onGroundHandler = (isOnGround: boolean): void => {
    this.isOnGround.set(isOnGround);
  };
  private readonly magVarHandler = (magVar: number): void => {
    this.magVar.set(magVar);
  };

  private isSyncing = false;

  private positionConsumer: Consumer<LatLongAlt> | null = null;
  private headingConsumer: Consumer<number> | null = null;
  private turnRateConsumer: Consumer<number> | null = null;
  private altitudeConsumer: Consumer<number> | null = null;
  private verticalSpeedConsumer: Consumer<number> | null = null;
  private trackConsumer: Consumer<number> | null = null;
  private groundSpeedConsumer: Consumer<number> | null = null;
  private onGroundConsumer: Consumer<boolean> | null = null;
  private magVarConsumer: Consumer<number> | null = null;

  /**
   * Begins syncing this module with the event bus. While syncing is active, this module's properties will be
   * automatically updated with the latest information provided by the event bus.
   * @param bus The event bus.
   * @param updateFreq The frequency at which to sync with the event bus.
   */
  public beginSync(bus: EventBus, updateFreq: number): void {
    this.stopSync();

    const subscriber = bus.getSubscriber<GNSSEvents & ADCEvents>();

    this.positionConsumer = subscriber.on('gps-position').atFrequency(updateFreq);
    this.positionConsumer.handle(this.positionHandler);

    this.headingConsumer = subscriber.on('hdg_deg_true').atFrequency(updateFreq);
    this.headingConsumer.handle(this.headingHandler);

    this.turnRateConsumer = subscriber.on('delta_heading_rate').atFrequency(updateFreq);
    this.turnRateConsumer.handle(this.turnRateHandler);

    this.altitudeConsumer = subscriber.on('alt').atFrequency(updateFreq);
    this.altitudeConsumer.handle(this.altitudeHandler);

    this.verticalSpeedConsumer = subscriber.on('vs').atFrequency(updateFreq);
    this.verticalSpeedConsumer.handle(this.verticalSpeedHandler);

    this.trackConsumer = subscriber.on('track_deg_true').atFrequency(updateFreq);
    this.trackConsumer.handle(this.trackHandler);

    this.groundSpeedConsumer = subscriber.on('ground_speed').atFrequency(updateFreq);
    this.groundSpeedConsumer.handle(this.groundSpeedHandler);

    this.onGroundConsumer = subscriber.on('on_ground').atFrequency(updateFreq);
    this.onGroundConsumer.handle(this.onGroundHandler);

    this.magVarConsumer = subscriber.on('magvar').atFrequency(updateFreq);
    this.magVarConsumer.handle(this.magVarHandler);

    this.isSyncing = true;
  }

  /**
   * Stops syncing this module with the event bus.
   */
  public stopSync(): void {
    if (!this.isSyncing) {
      return;
    }

    this.positionConsumer?.off(this.positionHandler);
    this.headingConsumer?.off(this.headingHandler);
    this.turnRateConsumer?.off(this.turnRateHandler);
    this.altitudeConsumer?.off(this.altitudeHandler);
    this.verticalSpeedConsumer?.off(this.verticalSpeedHandler);
    this.trackConsumer?.off(this.trackHandler);
    this.groundSpeedConsumer?.off(this.groundSpeedHandler);
    this.onGroundConsumer?.off(this.onGroundHandler);
    this.magVarConsumer?.off(this.magVarHandler);

    this.isSyncing = false;
  }
}