import { PublishPacer } from '../data';
import { EventBus, IndexedEventType } from '../data/EventBus';
import { SimVarValueType } from '../data/SimVars';
import { MagVar } from '../geo';
import { SimVarPublisher, SimVarPublisherEntry } from './BasePublishers';

/**
 * Base events related to attitude and heading of the airplane.
 */
export interface BaseAhrsEvents {
  /** The heading of the airplane, in degrees magnetic. */
  hdg_deg: number;

  /** A heading of the airplane, in degrees true. */
  hdg_deg_true: number;

  /** The pitch of the airplane, in degrees. Positive values indicate downward pitch. */
  pitch_deg: number;

  /** The roll (bank) of the airplane, in degrees. Positive values indicate leftward roll. */
  roll_deg: number;

  /** A turn coordinator ball value. */
  turn_coordinator_ball: number;

  /** The turn rate of the airplane, in degrees per second. */
  delta_heading_rate: number;
}

/**
 * Topics that are indexed by attitude indicator.
 */
type AhrsAttitudeIndexedTopics = 'pitch_deg' | 'roll_deg';

/**
 * Topics that are indexed by direction indicator.
 */
type AhrsDirectionIndexedTopics = 'hdg_deg' | 'hdg_deg_true' | 'delta_heading_rate';

/**
 * All topics related to attitude and heading of the airplane that are indexed.
 */
type AhrsIndexedTopics = AhrsAttitudeIndexedTopics | AhrsDirectionIndexedTopics;

/**
 * Indexed events related to attitude and heading of the airplane.
 */
type AhrsIndexedEvents = {
  [P in keyof Pick<BaseAhrsEvents, AhrsIndexedTopics> as IndexedEventType<P>]: BaseAhrsEvents[P];
};

/**
 * Events related to attitude and heading of the airplane.
 */
export interface AhrsEvents extends BaseAhrsEvents, AhrsIndexedEvents {
}

/**
 * A publisher for AHRS information.
 */
export class AhrsPublisher extends SimVarPublisher<AhrsEvents> {
  private magVar: number;
  private needUpdateMagVar: boolean;

  /**
   * Creates an AhrsPublisher.
   * @param bus The event bus to which to publish.
   * @param attitudeIndicatorCount The number of attitude indicators.
   * @param directionIndicatorCount The number of direction indicators.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, attitudeIndicatorCount: number, directionIndicatorCount: number, pacer?: PublishPacer<AhrsEvents>) {
    const nonIndexedSimVars: [Exclude<keyof BaseAhrsEvents, AhrsIndexedTopics>, SimVarPublisherEntry<any>][] = [
      ['turn_coordinator_ball', { name: 'TURN COORDINATOR BALL', type: SimVarValueType.Number }],
    ];

    const attitudeIndexedSimVars: [Extract<keyof BaseAhrsEvents, AhrsAttitudeIndexedTopics>, SimVarPublisherEntry<any>][] = [
      ['pitch_deg', { name: 'ATTITUDE INDICATOR PITCH DEGREES', type: SimVarValueType.Degree }],
      ['roll_deg', { name: 'ATTITUDE INDICATOR BANK DEGREES', type: SimVarValueType.Degree }],
    ];

    const directionIndexedSimVars: [Extract<keyof BaseAhrsEvents, AhrsIndexedTopics>, SimVarPublisherEntry<any>][] = [
      ['hdg_deg', { name: 'HEADING INDICATOR', type: SimVarValueType.Degree }],
      ['hdg_deg_true', { name: 'HEADING INDICATOR', type: SimVarValueType.Degree, map: (heading): number => MagVar.magneticToTrue(heading, this.magVar) }],
      ['delta_heading_rate', { name: 'DELTA HEADING RATE', type: SimVarValueType.Degree }],
    ];

    const simvars = new Map<keyof AhrsEvents, SimVarPublisherEntry<any>>(nonIndexedSimVars);

    // set un-indexed topics to pull from index 1
    for (const [topic, simvar] of [...attitudeIndexedSimVars, ...directionIndexedSimVars]) {
      simvars.set(
        `${topic}`,
        {
          name: `${simvar.name}:1`,
          type: simvar.type,
          map: simvar.map
        }
      );
    }

    // add attitude indicator indexed topics
    attitudeIndicatorCount = Math.max(attitudeIndicatorCount, 1);
    for (let i = 1; i <= attitudeIndicatorCount; i++) {
      for (const [topic, simvar] of attitudeIndexedSimVars) {
        simvars.set(
          `${topic}_${i}`,
          {
            name: `${simvar.name}:${i}`,
            type: simvar.type,
            map: simvar.map
          }
        );
      }
    }

    // add direction indicator indexed topics
    directionIndicatorCount = Math.max(directionIndicatorCount, 1);
    for (let i = 1; i <= directionIndicatorCount; i++) {
      for (const [topic, simvar] of directionIndexedSimVars) {
        simvars.set(
          `${topic}_${i}`,
          {
            name: `${simvar.name}:${i}`,
            type: simvar.type,
            map: simvar.map
          }
        );
      }
    }

    super(simvars, bus, pacer);

    this.magVar = 0;
    this.needUpdateMagVar ??= false;
  }

  /** @inheritdoc */
  protected onTopicSubscribed(topic: keyof AhrsEvents): void {
    super.onTopicSubscribed(topic);

    if (topic.startsWith('hdg_deg_true')) {
      this.needUpdateMagVar = true;
    }
  }

  /** @inheritdoc */
  public onUpdate(): void {
    if (this.needUpdateMagVar) {
      this.magVar = SimVar.GetSimVarValue('MAGVAR', SimVarValueType.Degree);
    }

    super.onUpdate();
  }
}