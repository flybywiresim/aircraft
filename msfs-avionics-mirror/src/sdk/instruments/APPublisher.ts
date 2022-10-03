/// <reference types="msfstypes/JS/simvar" />

import { EventBus, IndexedEventType } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { EventSubscriber } from '../data/EventSubscriber';
import { SimVarDefinition, SimVarValueType } from '../data/SimVars';
import { BasePublisher, SimVarPublisher } from './BasePublishers';

// import { HEvent } from '../data/HEventPublisher';

/** Data related to autopilot */
interface APSimVarEvents {
  /** Whether the autopilot master is active. */
  ap_master_status: boolean;

  /** Whether the yaw damper is active. */
  ap_yd_status: boolean;

  /** Whether the autopilot is in heading hold mode. */
  ap_heading_hold: boolean;

  /** Whether the autopilot is in NAV mode. */
  ap_nav_hold: boolean;

  /** Whether the autopilot is in approach mode. */
  ap_approach_hold: boolean;

  /** Whether the autopilot is in backcourse mode. */
  ap_backcourse_hold: boolean;

  /** Whether the autopilot is in bank hold mode. */
  ap_bank_hold: boolean;

  /** The autopilot max bank value ID (usually 0 for standard, 1 for half bank). */
  ap_max_bank_id: number;

  /** The current set autopilot max bank value in absolute degrees. */
  ap_max_bank_value: number;

  /** Whether the autopilot is in wings level mode. */
  ap_wing_lvl_hold: boolean;

  /** Whether the autopilot is in vertical speed hold mode. */
  ap_vs_hold: boolean;

  /** Whether the autopilot is in flight level change mode. */
  ap_flc_hold: boolean;

  /** Whether the autopilot is in altitude hold mode. */
  ap_alt_hold: boolean;

  /** Whether the autopilot is in glideslope hold mode. */
  ap_glideslope_hold: boolean;

  /** Whether the autopilot is in pitch hold mode. */
  ap_pitch_hold: boolean;

  /** The autopilot's selected pitch target, in degrees. */
  ap_pitch_selected: number;

  /** The autopilot's selected heading, in degrees. */
  ap_heading_selected: number;

  /** The autopilot's selected altitude, in feet. */
  ap_altitude_selected: number;

  /** The autopilot's selected vertical speed target, in feet per minute. */
  ap_vs_selected: number; // should eventually be APIndexedData

  /** The autopilot's selected airspeed target, in knots. */
  ap_ias_selected: number; // should eventually be APIndexedData

  /** The autopilot's selected mach target. */
  ap_mach_selected: number;

  /** Whether the autopilot's selected airspeed target is in mach. */
  ap_selected_speed_is_mach: boolean;

  /** The bank commanded by the flight director, in degrees. */
  flight_director_bank: number;

  /** The pitch commanded by the flight director, in degrees. */
  flight_director_pitch: number;

  /** Whether the flight director is active. */
  [flight_director_is_active: IndexedEventType<'flight_director_is_active'>]: boolean,

  /** Whether VNAV is active. */
  vnav_active: boolean;
}

export enum APLockType {
  Heading,
  Nav,
  Alt,
  Bank,
  WingLevel,
  Vs,
  Flc,
  Pitch,
  Approach,
  Backcourse,
  Glideslope,
  VNav
}

/** The events related to an autopilot */
export interface APEvents extends APSimVarEvents {
  /** Autopilot has been engaged. */
  ap_master_engage: true;

  /** Autopilot has been disengaged. */
  ap_master_disengage: true;

  /** Yaw damper has been engaged. */
  ap_yd_engage: true;

  /** Yaw damper has been disengaged. */
  ap_yd_disengage: true;

  /** An autopilot lock has been set. */
  ap_lock_set: APLockType;

  /** An autopilot lock has been released. */
  ap_lock_release: APLockType;
}

/** base publisher for simvars */
class APSimVarPublisher extends SimVarPublisher<APSimVarEvents> {
  private static simvars = new Map<keyof APSimVarEvents, SimVarDefinition>([
    // TODO extend the next two to handle multiple APs?
    ['ap_heading_selected', { name: 'AUTOPILOT HEADING LOCK DIR:1', type: SimVarValueType.Degree }],
    ['ap_altitude_selected', { name: 'AUTOPILOT ALTITUDE LOCK VAR:1', type: SimVarValueType.Feet }],
    ['ap_master_status', { name: 'AUTOPILOT MASTER', type: SimVarValueType.Bool }],
    ['ap_yd_status', { name: 'AUTOPILOT YAW DAMPER', type: SimVarValueType.Bool }],
    ['ap_heading_hold', { name: 'AUTOPILOT HEADING LOCK', type: SimVarValueType.Bool }],
    ['ap_nav_hold', { name: 'AUTOPILOT NAV1 LOCK', type: SimVarValueType.Bool }],
    ['ap_bank_hold', { name: 'AUTOPILOT BANK HOLD', type: SimVarValueType.Bool }],
    ['ap_max_bank_id', { name: 'AUTOPILOT MAX BANK ID', type: SimVarValueType.Number }],
    ['ap_max_bank_value', { name: 'AUTOPILOT MAX BANK', type: SimVarValueType.Degree }],
    ['ap_wing_lvl_hold', { name: 'AUTOPILOT WING LEVELER', type: SimVarValueType.Bool }],
    ['ap_approach_hold', { name: 'AUTOPILOT APPROACH HOLD', type: SimVarValueType.Bool }],
    ['ap_backcourse_hold', { name: 'AUTOPILOT BACKCOURSE HOLD', type: SimVarValueType.Bool }],
    ['ap_vs_hold', { name: 'AUTOPILOT VERTICAL HOLD', type: SimVarValueType.Bool }],
    ['ap_flc_hold', { name: 'AUTOPILOT FLIGHT LEVEL CHANGE', type: SimVarValueType.Bool }],
    ['ap_alt_hold', { name: 'AUTOPILOT ALTITUDE LOCK', type: SimVarValueType.Bool }],
    ['ap_glideslope_hold', { name: 'AUTOPILOT GLIDESLOPE HOLD', type: SimVarValueType.Bool }],
    ['ap_pitch_hold', { name: 'AUTOPILOT PITCH HOLD', type: SimVarValueType.Bool }],
    ['ap_vs_selected', { name: 'AUTOPILOT VERTICAL HOLD VAR:1', type: SimVarValueType.FPM }],
    ['ap_ias_selected', { name: 'AUTOPILOT AIRSPEED HOLD VAR', type: SimVarValueType.Knots }],
    ['ap_mach_selected', { name: 'AUTOPILOT MACH HOLD VAR', type: SimVarValueType.Number }],
    ['ap_selected_speed_is_mach', { name: 'AUTOPILOT MANAGED SPEED IN MACH', type: SimVarValueType.Bool }],
    ['flight_director_bank', { name: 'AUTOPILOT FLIGHT DIRECTOR BANK', type: SimVarValueType.Degree }],
    ['flight_director_pitch', { name: 'AUTOPILOT FLIGHT DIRECTOR PITCH', type: SimVarValueType.Degree }],
    ['flight_director_is_active_1', { name: 'AUTOPILOT FLIGHT DIRECTOR ACTIVE:1', type: SimVarValueType.Bool }],
    ['flight_director_is_active_2', { name: 'AUTOPILOT FLIGHT DIRECTOR ACTIVE:2', type: SimVarValueType.Bool }],
    ['vnav_active', { name: 'L:XMLVAR_VNAVButtonValue', type: SimVarValueType.Bool }],
    ['ap_pitch_selected', { name: 'AUTOPILOT PITCH HOLD REF', type: SimVarValueType.Degree }]
  ]);

  /**
   * Create an APSimVarPublisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the pace of publishing
   */
  public constructor(bus: EventBus, pacer: PublishPacer<APSimVarEvents> | undefined = undefined) {
    super(APSimVarPublisher.simvars, bus, pacer);
  }
}

/**
 * Publishes autopilot data
 */
class AutopilotPublisher extends BasePublisher<APEvents> {
  /**
   * Creates an AutopilotPublisher
   * @param bus The event bus to publish to.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<APEvents>) {
    super(bus, pacer);
  }

  /**
   * Publish an AP master engage event
   */
  public publishMasterEngage(): void {
    this.publish('ap_master_engage', true);
  }

  /**
   * Publish an AP master disengage event
   */
  public publishMasterDisengage(): void {
    this.publish('ap_master_disengage', true);
  }

  /**
   * Publish a YD engage event
   */
  public publishYdEngage(): void {
    this.publish('ap_yd_engage', true);
  }

  /**
   * Publish a YD disengage event
   */
  public publishYdDisengage(): void {
    this.publish('ap_yd_disengage', true);
  }

  /**
   * Publish a lock set event
   * @param lock The lock/hold set
   */
  public publishLockSet(lock: APLockType): void {
    this.publish('ap_lock_set', lock);
  }

  /**
   * Publish a lock release event
   * @param lock The lock/hold released
   */
  public publishLockRelease(lock: APLockType): void {
    this.publish('ap_lock_release', lock);
  }
}

/**
 * Manages an autopilot system
 */
export class AutopilotInstrument {
  private bus: EventBus;
  // TODO Determine if wn want to use HEvents or trigger only on simvar changes
  // private hEvents: EventSubscriber<HEvent>;
  public publisher: AutopilotPublisher;
  public simVarPublisher: APSimVarPublisher;
  private simVarSubscriber: EventSubscriber<APSimVarEvents>;

  /**
   * Create an AutopilotInstrument
   * @param bus The event bus to publish to
   */
  public constructor(bus: EventBus) {
    this.bus = bus;
    // this.hEvents = this.bus.getSubscriber<HEvent>();
    this.publisher = new AutopilotPublisher(bus);
    this.simVarPublisher = new APSimVarPublisher(bus);
    this.simVarSubscriber = new EventSubscriber<APSimVarEvents>(bus);
  }

  /**
   * Initialize the instrument
   */
  public init(): void {
    this.publisher.startPublish();
    this.simVarPublisher.startPublish();
    // console.log('initting autopilot');

    this.simVarSubscriber.on('ap_master_status').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishMasterEngage();
      } else {
        this.publisher.publishMasterDisengage();
      }
    });
    this.simVarSubscriber.on('ap_yd_status').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishYdEngage();
      } else {
        this.publisher.publishYdDisengage();
      }
    });
    this.simVarSubscriber.on('ap_alt_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Alt);
      } else {
        this.publisher.publishLockRelease(APLockType.Alt);
      }
    });
    this.simVarSubscriber.on('ap_pitch_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Pitch);
      } else {
        this.publisher.publishLockRelease(APLockType.Pitch);
      }
    });
    this.simVarSubscriber.on('ap_heading_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Heading);
      } else {
        this.publisher.publishLockRelease(APLockType.Heading);
      }
    });
    this.simVarSubscriber.on('ap_nav_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Nav);
      } else {
        this.publisher.publishLockRelease(APLockType.Nav);
      }
    });
    this.simVarSubscriber.on('ap_approach_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Approach);
      } else {
        this.publisher.publishLockRelease(APLockType.Approach);
      }
    });
    this.simVarSubscriber.on('ap_backcourse_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Backcourse);
      } else {
        this.publisher.publishLockRelease(APLockType.Backcourse);
      }
    });
    this.simVarSubscriber.on('ap_bank_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Bank);
      } else {
        this.publisher.publishLockRelease(APLockType.Bank);
      }
    });
    this.simVarSubscriber.on('ap_wing_lvl_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.WingLevel);
      } else {
        this.publisher.publishLockRelease(APLockType.WingLevel);
      }
    });
    this.simVarSubscriber.on('ap_flc_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Flc);
      } else {
        this.publisher.publishLockRelease(APLockType.Flc);
      }
    });
    this.simVarSubscriber.on('ap_vs_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Vs);
      } else {
        this.publisher.publishLockRelease(APLockType.Vs);
      }
    });
    this.simVarSubscriber.on('ap_glideslope_hold').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.Glideslope);
      } else {
        this.publisher.publishLockRelease(APLockType.Glideslope);
      }
    });

    this.simVarSubscriber.on('vnav_active').whenChangedBy(1).handle((engaged) => {
      if (engaged) {
        this.publisher.publishLockSet(APLockType.VNav);
      } else {
        this.publisher.publishLockRelease(APLockType.VNav);
      }
    });
  }

  /** update our publishers */
  public onUpdate(): void {
    this.simVarPublisher.onUpdate();
  }
}
